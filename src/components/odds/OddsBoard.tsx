import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Activity, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import {
  SPORTS,
  MARKET_TYPES,
  MARKET_TYPE_SHORT_LABELS,
  ALL_SPORTSBOOKS,
  API_SPORTSBOOKS,
  Sport,
  MarketType,
  Sportsbook,
} from '../../constants/sportsbooks';
import type { GameOdds } from '../../types/odds';
import {
  fetchOddsRows,
  mergeOddsApiGames,
  oddsRowsToApiGames,
  refreshOddsViaEdgeFunction,
  type OddsApiGame,
} from '../../lib/oddsFromSupabase';
import { canInvokeOddsEdgeSync, readLastOddsEdgeSync, writeLastOddsEdgeSync } from '../../lib/oddsEdgeSync';
import { readSessionFilter, writeSessionFilter } from '../../lib/sessionFilters';
import {
  hasPulledOddsThisSession,
  markOddsPulledThisSession,
  readCachedGames,
  writeCachedGames,
} from '../../lib/oddsCache';
import { supabase } from '../../lib/supabase';
import { OddsGameCard } from './OddsGameCard';
import { OddsRow } from './OddsRow';
import { AllMarketsGameCard } from './AllMarketsGameCard';
import { AllMarketsRow } from './AllMarketsRow';
import { MarketDrawer } from './MarketDrawer';
import { calculateGameBestPercent, type BestPercentResult } from '../../utils/bestPercent';
import { gameHasSelectedMarketLines } from '../../utils/marketOdds';
import { emptyGameSidePick, type GameSidePick } from './useOddsGameInteraction';
import { SyncedHorizontalScroll } from '../shared/SyncedHorizontalScroll';
import {
  ODDS_DEBUG,
  buildOddsDebugInfo,
  type OddsDebugInfo,
  type OddsFilterStage,
} from '../../lib/oddsDebug';
import { OddsDebugPanel } from './OddsDebugPanel';

/** 'All' switches the board to the all-markets summary view. */
type MarketFilterValue = MarketType | 'All';
type OddsSortKey = 'time' | 'bestPercent' | MarketType;

/** Date window for narrowing the board to games starting within a given range. */
type DateFilter = 'all' | 'today' | '24h' | '7d' | 'custom';

const DATE_FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: '24h', label: 'Next 24 hours' },
  { value: '7d', label: 'Next 7 days' },
  { value: 'custom', label: 'Custom' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Picks in the all-markets drill-ins are tracked per game *and* market. */
function marketPickKey(gameId: string, market: MarketType): string {
  return `${gameId}::${market}`;
}

interface OddsBoardProps {
  onOddsClick: (data: {
    teamA: string;
    teamB: string;
    oddsA: number;
    oddsB: number;
    bookA: Sportsbook;
    bookB: Sportsbook;
  }) => void;
}

function transformApiGames(apiGames: OddsApiGame[]): GameOdds[] {
  return apiGames.map((game) => {
    const oddsData: GameOdds['odds'] = {};

    for (const [marketType, books] of Object.entries(game.odds)) {
      const homeOdds: Partial<Record<Sportsbook, number>> = {};
      const awayOdds: Partial<Record<Sportsbook, number>> = {};
      let spread: number | undefined;
      let total: number | undefined;

      for (const [book, odds] of Object.entries(books)) {
        if (odds.home !== null) homeOdds[book as Sportsbook] = odds.home;
        if (odds.away !== null) awayOdds[book as Sportsbook] = odds.away;
        if (odds.spread !== undefined) spread = odds.spread;
        if (odds.total !== undefined) total = odds.total;
      }

      oddsData[marketType as MarketType] = {
        home: homeOdds as Record<Sportsbook, number>,
        away: awayOdds as Record<Sportsbook, number>,
        spread,
        total,
      };
    }

    return {
      id: game.id,
      sport: game.sport as Sport,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      gameTime: new Date(game.gameTime),
      odds: oddsData,
    };
  });
}

export function OddsBoard({ onOddsClick }: OddsBoardProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSports, setSelectedSports] = useState<Sport[]>(() =>
    readSessionFilter<Sport[]>('selectedSports', [...SPORTS])
  );
  const [marketFilter, setMarketFilter] = useState<MarketFilterValue>(() =>
    readSessionFilter<MarketFilterValue>('marketFilter', 'Money Line')
  );
  const [selectedBooks, setSelectedBooks] = useState<Sportsbook[]>(() =>
    readSessionFilter<Sportsbook[]>('selectedBooks', API_SPORTSBOOKS.slice(0, 5))
  );
  // Odds-quality filter defaults. 0 in any of these means "no limit" (see passesOddsFilters).
  const DEFAULT_MAX_FAVORITE = 0;
  const DEFAULT_MAX_UNDERDOG = 0;
  const DEFAULT_MAX_LOSS_PERCENT = 0;
  const [maxFavorite, setMaxFavorite] = useState(() => readSessionFilter('maxFavorite', DEFAULT_MAX_FAVORITE));
  const [maxUnderdog, setMaxUnderdog] = useState(() => readSessionFilter('maxUnderdog', DEFAULT_MAX_UNDERDOG));
  const [maxLossPercent, setMaxLossPercent] = useState(() => readSessionFilter('maxLossPercent', DEFAULT_MAX_LOSS_PERCENT));
  // Display-only: drop sportsbook columns that have no odds for any visible game.
  const [hideEmptyBooks, setHideEmptyBooks] = useState(() => readSessionFilter('hideEmptyBooks', true));
  const [dateFilter, setDateFilter] = useState<DateFilter>(() =>
    readSessionFilter<DateFilter>('dateFilter', '7d')
  );
  const [customStart, setCustomStart] = useState(() => readSessionFilter('customStart', ''));
  const [customEnd, setCustomEnd] = useState(() => readSessionFilter('customEnd', ''));
  // Live team search: a pure client-side trim of already-loaded games. Deliberately kept out
  // of currentFilterKey and session persistence so it never marks filters dirty / prompts a
  // Refresh, and clears on reload.
  const [teamSearch, setTeamSearch] = useState('');
  const [games, setGames] = useState<GameOdds[]>(() => readCachedGames() ?? []);
  // Only show the spinner when we have nothing cached to show.
  const [loading, setLoading] = useState(() => readCachedGames() === null);
  const [lastLiveSync, setLastLiveSync] = useState<Date | null>(() => readLastOddsEdgeSync());
  const [sortKey, setSortKey] = useState<OddsSortKey>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [gamePicks, setGamePicks] = useState<Record<string, GameSidePick>>({});
  // All-markets view: which market is expanded inline per game (desktop)…
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, MarketType | null>>({});
  // …and which game+market the bottom sheet shows (mobile).
  const [openSheet, setOpenSheet] = useState<{ gameId: string; market: MarketType } | null>(null);
  const [syncedFilterKey, setSyncedFilterKey] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // Analysis-only: snapshot of the most recent odds load (see lib/oddsDebug.ts).
  const [debugInfo, setDebugInfo] = useState<OddsDebugInfo | null>(null);
  const filterKeyRef = useRef('');

  // Tick every 30s so games drop off the list as soon as their start time passes.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const currentFilterKey = useMemo(
    () =>
      JSON.stringify({
        selectedSports,
        marketFilter,
        selectedBooks,
        maxFavorite,
        maxUnderdog,
        maxLossPercent,
        dateFilter,
        customStart,
        customEnd,
      }),
    [
      selectedSports,
      marketFilter,
      selectedBooks,
      maxFavorite,
      maxUnderdog,
      maxLossPercent,
      dateFilter,
      customStart,
      customEnd,
    ]
  );
  filterKeyRef.current = currentFilterKey;

  // Persist filters for the session so they survive reloads/navigation within the tab.
  useEffect(() => {
    writeSessionFilter('selectedSports', selectedSports);
    writeSessionFilter('marketFilter', marketFilter);
    writeSessionFilter('selectedBooks', selectedBooks);
    writeSessionFilter('maxFavorite', maxFavorite);
    writeSessionFilter('maxUnderdog', maxUnderdog);
    writeSessionFilter('maxLossPercent', maxLossPercent);
    writeSessionFilter('hideEmptyBooks', hideEmptyBooks);
    writeSessionFilter('dateFilter', dateFilter);
    writeSessionFilter('customStart', customStart);
    writeSessionFilter('customEnd', customEnd);
  }, [
    selectedSports,
    marketFilter,
    selectedBooks,
    maxFavorite,
    maxUnderdog,
    maxLossPercent,
    hideEmptyBooks,
    dateFilter,
    customStart,
    customEnd,
  ]);

  const filtersDirty = syncedFilterKey !== null && currentFilterKey !== syncedFilterKey;

  const getGamePick = useCallback(
    (gameId: string) => gamePicks[gameId] ?? emptyGameSidePick(),
    [gamePicks]
  );

  const setGamePick = useCallback(
    (gameId: string, update: (prev: GameSidePick) => GameSidePick) => {
      setGamePicks((prev) => ({
        ...prev,
        [gameId]: update(prev[gameId] ?? emptyGameSidePick()),
      }));
    },
    []
  );

  const performOddsLoad = useCallback(
    async (options?: {
      signal?: AbortSignal;
      forceLiveSync?: boolean;
      dbOnly?: boolean;
      silent?: boolean;
    }) => {
      const signal = options?.signal;
      const forceLiveSync = options?.forceLiveSync ?? false;
      const dbOnly = options?.dbOnly ?? false;
      const silent = options?.silent ?? false;
      const gone = () => signal?.aborted ?? false;
      const applyGames = (next: GameOdds[]) => {
        setGames(next);
        writeCachedGames(next);
      };

      // Debug accumulator — written once in `finally` so every exit (success,
      // fallback, failure, abort, rate-limited) records exactly one snapshot.
      const dbg: Omit<OddsDebugInfo, 'loadedAt'> = {
        status: 'aborted',
        source: null,
        forceLiveSync,
        dbOnly,
        silent,
        edgeInvoked: false,
        error: null,
        apiGames: null,
        dbGames: null,
        appliedGames: [],
      };

      if (!silent) setLoading(true);
      let loadSucceeded = false;
      try {
        const loadFromDatabase = async () => {
          const rows = await fetchOddsRows(supabase);
          if (gone()) return null;
          return oddsRowsToApiGames(rows);
        };

        const limiterAllows = canInvokeOddsEdgeSync();
        const shouldInvokeEdge = !dbOnly && (forceLiveSync || limiterAllows);

        if (shouldInvokeEdge) {
          try {
            dbg.edgeInvoked = true;
            const { games: apiGames, updated } = await refreshOddsViaEdgeFunction();
            dbg.apiGames = apiGames;
            if (gone()) return;
            const syncTime = new Date(updated);
            writeLastOddsEdgeSync(syncTime);
            setLastLiveSync(syncTime);
            const dbGames = await loadFromDatabase();
            if (gone() || dbGames === null) return;
            dbg.dbGames = dbGames;
            const merged = mergeOddsApiGames(apiGames, dbGames);
            applyGames(transformApiGames(merged));
            dbg.source = 'api+db-merge';
            dbg.appliedGames = merged;
            dbg.status = 'success';
            loadSucceeded = true;
          } catch (error) {
            console.error('Error refreshing odds:', error);
            dbg.error = error instanceof Error ? error.message : String(error);
            const dbGames = await loadFromDatabase();
            if (gone() || dbGames === null) return;
            dbg.dbGames = dbGames;
            applyGames(transformApiGames(dbGames));
            dbg.source = 'db-fallback';
            dbg.appliedGames = dbGames;
            dbg.status = 'success';
            loadSucceeded = true;
          }
        } else {
          const dbGames = await loadFromDatabase();
          if (gone() || dbGames === null) return;
          dbg.dbGames = dbGames;
          applyGames(transformApiGames(dbGames));
          dbg.source = 'db-only';
          dbg.appliedGames = dbGames;
          // Foreground load that wanted fresh odds but the limiter skipped the live API.
          dbg.status = !dbOnly && !forceLiveSync && !limiterAllows ? 'rate-limited' : 'success';
          loadSucceeded = true;
        }
      } catch (error) {
        console.error('Error loading odds from database:', error);
        dbg.error = error instanceof Error ? error.message : String(error);
        dbg.status = 'failed';
      } finally {
        if (!gone() && loadSucceeded) {
          setSyncedFilterKey(filterKeyRef.current);
        }
        setLoading(false);
        if (ODDS_DEBUG) setDebugInfo(buildOddsDebugInfo(dbg));
      }
    },
    []
  );

  useEffect(() => {
    const ac = new AbortController();
    if (hasPulledOddsThisSession()) {
      // Return visit: show the cached snapshot, then quietly refresh from the DB.
      // No live API pull and no spinner — that only happens via the Refresh button.
      void performOddsLoad({ signal: ac.signal, dbOnly: true, silent: true });
    } else {
      // First load this session: do the one live pull.
      markOddsPulledThisSession();
      void performOddsLoad({ signal: ac.signal });
    }
    return () => ac.abort();
  }, [performOddsLoad]);

  const gamesWithMarketBests = useMemo(() => {
    return games.map((game) => ({
      game,
      marketBests: Object.fromEntries(
        MARKET_TYPES.map((market) => [market, calculateGameBestPercent(game, market, selectedBooks)])
      ) as Record<MarketType, BestPercentResult | null>,
    }));
  }, [games, selectedBooks]);

  // Upper/lower bounds (ms epoch) for the selected date filter; null means no date limit.
  const dateWindow = useMemo<{ start: number; end: number } | null>(() => {
    switch (dateFilter) {
      case '24h':
        return { start: now, end: now + DAY_MS };
      case '7d':
        return { start: now, end: now + 7 * DAY_MS };
      case 'today': {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { start: now, end: end.getTime() };
      }
      case 'custom': {
        if (!customStart && !customEnd) return null;
        const start = customStart ? new Date(`${customStart}T00:00:00`).getTime() : now;
        const end = customEnd ? new Date(`${customEnd}T23:59:59.999`).getTime() : Infinity;
        return { start, end };
      }
      default:
        return null;
    }
  }, [dateFilter, now, customStart, customEnd]);

  const { list: filteredGames, funnel: filterFunnel } = useMemo(() => {
    let filtered = gamesWithMarketBests;

    // Record each filter stage so the debug panel can show where games were dropped.
    const funnel: OddsFilterStage[] = [
      { label: 'Loaded', remaining: filtered.length, dropped: 0 },
    ];
    let prevCount = filtered.length;
    const step = (label: string, next: typeof filtered) => {
      funnel.push({ label, remaining: next.length, dropped: prevCount - next.length });
      prevCount = next.length;
      return next;
    };

    // Drop games whose start time has already passed.
    filtered = step('Start time', filtered.filter((g) => g.game.gameTime.getTime() > now));

    if (dateWindow) {
      filtered = step(
        'Date window',
        filtered.filter((g) => {
          const t = g.game.gameTime.getTime();
          return t >= dateWindow.start && t <= dateWindow.end;
        })
      );
    }

    if (selectedSports.length > 0) {
      filtered = step('Sport', filtered.filter((g) => selectedSports.includes(g.game.sport)));
    }

    const teamQuery = teamSearch.trim().toLowerCase();
    if (teamQuery) {
      filtered = step(
        'Team search',
        filtered.filter(
          (g) =>
            g.game.homeTeam.toLowerCase().includes(teamQuery) ||
            g.game.awayTeam.toLowerCase().includes(teamQuery)
        )
      );
    }

    filtered = step(
      'Market lines',
      filtered.filter((g) =>
        marketFilter === 'All'
          ? MARKET_TYPES.some((market) => gameHasSelectedMarketLines(g.game, market, selectedBooks))
          : gameHasSelectedMarketLines(g.game, marketFilter, selectedBooks)
      )
    );

    // Odds-quality filters: every displayed best line must sit between Max Favorite and
    // Max Underdog, and the best % (hold) must not be worse than Max Loss %. A value of 0 in
    // any field disables that bound ("no limit") — 0 is never a meaningful odds/hold limit.
    // Games with no complete two-sided line can't be judged, so they pass through untouched.
    const passesOddsFilters = (best: BestPercentResult | null): boolean => {
      if (!best) return true;
      const inPriceRange = (odds: number) =>
        (maxFavorite === 0 || odds >= maxFavorite) &&
        (maxUnderdog === 0 || odds <= maxUnderdog);
      return (
        inPriceRange(best.homeOdds) &&
        inPriceRange(best.awayOdds) &&
        (maxLossPercent === 0 || best.percent >= -maxLossPercent)
      );
    };

    filtered = step(
      'Max fav/dog/loss',
      filtered.filter((g) => {
        if (marketFilter === 'All') {
          // Keep the game if any market with a complete line meets the criteria.
          const results = MARKET_TYPES.map((market) => g.marketBests[market]).filter(
            (best): best is BestPercentResult => best !== null
          );
          return results.length === 0 || results.some(passesOddsFilters);
        }
        return passesOddsFilters(g.marketBests[marketFilter]);
      })
    );

    // 'bestPercent' sorts the single-market view; market-type keys sort the all-markets view.
    const percentMarket =
      sortKey === 'bestPercent'
        ? marketFilter === 'All'
          ? null
          : marketFilter
        : sortKey !== 'time'
          ? sortKey
          : null;

    const list = [...filtered].sort((a, b) => {
      const cmp = percentMarket
        ? (a.marketBests[percentMarket]?.percent ?? -Infinity) -
          (b.marketBests[percentMarket]?.percent ?? -Infinity)
        : a.game.gameTime.getTime() - b.game.gameTime.getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return { list, funnel };
  }, [
    gamesWithMarketBests,
    selectedSports,
    teamSearch,
    marketFilter,
    sortKey,
    sortDir,
    selectedBooks,
    now,
    dateWindow,
    maxFavorite,
    maxUnderdog,
    maxLossPercent,
  ]);

  // Hide market columns with no data anywhere (e.g. First Half until the API syncs it).
  const visibleMarkets = useMemo(
    () => MARKET_TYPES.filter((market) => filteredGames.some((g) => g.game.odds[market] !== undefined)),
    [filteredGames]
  );

  // In single-market view, order book columns so books with the most populated lines (across the
  // visible games) sit leftmost; sparse/empty books fall to the right. Recomputed whenever the data
  // refreshes or filters change. Order is irrelevant in the All-markets view (columns are markets,
  // not books), so selectedBooks is left untouched there.
  const orderedBooks = useMemo(() => {
    if (marketFilter === 'All') return selectedBooks;
    const populatedCount = (book: Sportsbook) =>
      filteredGames.reduce((total, { game }) => {
        const market = game.odds[marketFilter];
        if (!market) return total;
        return (
          total +
          (market.home[book] !== undefined ? 1 : 0) +
          (market.away[book] !== undefined ? 1 : 0)
        );
      }, 0);
    const ranked = selectedBooks
      .map((book, index) => ({ book, index, count: populatedCount(book) }))
      .sort((a, b) => b.count - a.count || a.index - b.index);
    return (hideEmptyBooks ? ranked.filter((entry) => entry.count > 0) : ranked).map(
      (entry) => entry.book
    );
  }, [marketFilter, selectedBooks, filteredGames, hideEmptyBooks]);

  const tableMinWidth = useMemo(() => {
    if (marketFilter === 'All') {
      return 380 + visibleMarkets.length * 140;
    }
    return 520 + orderedBooks.length * 80;
  }, [marketFilter, visibleMarkets.length, orderedBooks.length]);

  // Clicking the active column flips direction; clicking a new column resets to its default.
  const handleSort = (key: OddsSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'time' ? 'asc' : 'desc');
    }
  };

  const sortIcon = (key: OddsSortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  const handleMarketFilterChange = (value: MarketFilterValue) => {
    if (value === marketFilter) return;
    const modeChanged = (value === 'All') !== (marketFilter === 'All');
    setMarketFilter(value);
    // Sort keys and expansions from one view don't apply to the other.
    if (modeChanged) {
      setSortKey('time');
      setSortDir('asc');
      setExpandedMarkets({});
      setOpenSheet(null);
    }
  };

  const toggleExpandedMarket = useCallback((gameId: string, market: MarketType) => {
    setExpandedMarkets((prev) => ({
      ...prev,
      [gameId]: prev[gameId] === market ? null : market,
    }));
  }, []);

  const sortOptions: { key: OddsSortKey; label: string }[] =
    marketFilter === 'All'
      ? [
          { key: 'time', label: 'Time' },
          ...visibleMarkets.map((market) => ({
            key: market as OddsSortKey,
            label: `${MARKET_TYPE_SHORT_LABELS[market]} %`,
          })),
        ]
      : [
          { key: 'time', label: 'Time' },
          { key: 'bestPercent', label: 'Best %' },
        ];

  const toggleBook = (book: Sportsbook) => {
    setSelectedBooks((prev) =>
      prev.includes(book) ? prev.filter((b) => b !== book) : [...prev, book]
    );
  };

  const toggleAllSportsbooks = () => {
    if (selectedBooks.length === ALL_SPORTSBOOKS.length) {
      setSelectedBooks([]);
    } else {
      setSelectedBooks([...ALL_SPORTSBOOKS]);
    }
  };

  const toggleSport = (sport: Sport) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const toggleAllSports = () => {
    if (selectedSports.length === SPORTS.length) {
      setSelectedSports([]);
    } else {
      setSelectedSports([...SPORTS]);
    }
  };

  const allSportsSelected = selectedSports.length === SPORTS.length;
  const allSportsbooksSelected = selectedBooks.length === ALL_SPORTSBOOKS.length;

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Low Hold</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Compare odds across sportsbooks with live lines from The Odds API. Offshore books without API coverage
          (e.g. Betwhale, Heritage) appear in deposits/bets only. Refresh syncs upstream at most once per minute.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-2 gap-8 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Multiple books</h3>
          <p className="text-neutral-500 text-sm">Compare lines in one view</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Custom filters</h3>
          <p className="text-neutral-500 text-sm">Focus on what matters</p>
        </div>
      </div>

      <div>
        <div className="flex flex-col items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`touch-manipulation btn-secondary text-sm ${showFilters ? 'border-lime-500/50 text-lime-400' : ''}`}
            >
              Filters
            </button>
            <button
              type="button"
              onClick={() => void performOddsLoad({ forceLiveSync: filtersDirty })}
              disabled={loading}
              className={`touch-manipulation btn-secondary text-sm ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${filtersDirty ? 'border-lime-500/50 text-lime-400 bg-lime-500/5' : ''}`}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search teams…"
              aria-label="Search teams"
              className="input-field text-sm md:text-base pl-9 pr-9"
            />
            {teamSearch && (
              <button
                type="button"
                onClick={() => setTeamSearch('')}
                aria-label="Clear team search"
                className="touch-manipulation absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-500 hover:text-neutral-300 active:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs md:text-sm text-neutral-500 text-center px-2 space-y-0.5">
            <p>
              {lastLiveSync ? `Last live sync: ${lastLiveSync.toLocaleString()}` : 'Last live sync: —'}
            </p>
            {filtersDirty && (
              <p className="text-lime-400/80">Filters changed — Refresh will pull fresh odds from the API</p>
            )}
            <p>
              {marketFilter === 'All'
                ? 'Tap a market to expand every book; tap the % to open Arbitrage with the best lines.'
                : 'Tap an odd to highlight it; tap again to open Arbitrage. Unselected rows use the green best line.'}
            </p>
          </div>
        </div>

        {showFilters && (
          <div className="card mb-6">
            <div className="mb-6">
              <label className="label">Sport</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleAllSports}
                  className={`touch-manipulation inline-flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-full text-xs font-medium transition-colors border ${
                    allSportsSelected
                      ? 'bg-lime-500/10 border-lime-500/30 text-lime-400 active:opacity-90'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 active:bg-neutral-800 active:border-neutral-600'
                  }`}
                >
                  All Sports
                </button>
                {SPORTS.map((sport) => (
                  <button
                    type="button"
                    key={sport}
                    onClick={() => toggleSport(sport)}
                    className={`touch-manipulation inline-flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedSports.includes(sport)
                        ? 'bg-lime-500/10 border-lime-500/30 text-lime-400 active:opacity-90'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 active:bg-neutral-800 active:border-neutral-600'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="label">Sportsbooks</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleAllSportsbooks}
                  className={`touch-manipulation inline-flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-full text-xs font-medium transition-colors border ${
                    allSportsbooksSelected
                      ? 'bg-lime-500/10 border-lime-500/30 text-lime-400 active:opacity-90'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 active:bg-neutral-800 active:border-neutral-600'
                  }`}
                >
                  All Sportsbooks
                </button>
                {ALL_SPORTSBOOKS.map((book) => (
                  <button
                    type="button"
                    key={book}
                    onClick={() => toggleBook(book)}
                    className={`touch-manipulation inline-flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedBooks.includes(book)
                        ? 'bg-lime-500/10 border-lime-500/30 text-lime-400 active:opacity-90'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 active:bg-neutral-800 active:border-neutral-600'
                    }`}
                  >
                    {book}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="label">Date</label>
              <div className="flex flex-wrap gap-2">
                {DATE_FILTER_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`touch-manipulation inline-flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-full text-xs font-medium transition-colors border ${
                      dateFilter === option.value
                        ? 'bg-lime-500/10 border-lime-500/30 text-lime-400 active:opacity-90'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 active:bg-neutral-800 active:border-neutral-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {dateFilter === 'custom' && (
                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 max-w-md">
                  <div>
                    <label className="label">From</label>
                    <input
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="input-field text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="label">To</label>
                    <input
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="input-field text-sm md:text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="label">Market Type</label>
                <select
                  value={marketFilter}
                  onChange={(e) => handleMarketFilterChange(e.target.value as MarketFilterValue)}
                  className="select-field text-sm md:text-base"
                >
                  <option value="All">All Markets</option>
                  {MARKET_TYPES.map((market) => (
                    <option key={market} value={market}>
                      {market}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Max Favorite</label>
                <input
                  type="number"
                  value={maxFavorite}
                  onChange={(e) => setMaxFavorite(Number(e.target.value))}
                  className="input-field text-sm md:text-base"
                  placeholder="-300"
                />
              </div>

              <div>
                <label className="label">Max Underdog</label>
                <input
                  type="number"
                  value={maxUnderdog}
                  onChange={(e) => setMaxUnderdog(Number(e.target.value))}
                  className="input-field text-sm md:text-base"
                  placeholder="+300"
                />
              </div>

              <div>
                <label className="label">Max Loss %</label>
                <input
                  type="number"
                  value={maxLossPercent}
                  onChange={(e) => setMaxLossPercent(Number(e.target.value))}
                  className="input-field text-sm md:text-base"
                  step="0.5"
                />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 cursor-pointer select-none w-fit">
              <input
                type="checkbox"
                checked={hideEmptyBooks}
                onChange={(e) => setHideEmptyBooks(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 accent-lime-500 focus:ring-1 focus:ring-lime-500/40"
              />
              <span className="text-xs md:text-sm text-neutral-400">
                Hide sportsbook columns with no odds
              </span>
            </label>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-neutral-600">Set a field to 0 to disable that limit.</span>
              <button
                type="button"
                onClick={() => {
                  setMaxFavorite(DEFAULT_MAX_FAVORITE);
                  setMaxUnderdog(DEFAULT_MAX_UNDERDOG);
                  setMaxLossPercent(DEFAULT_MAX_LOSS_PERCENT);
                }}
                className="text-xs text-neutral-500 hover:text-lime-400 transition-colors"
              >
                Reset to defaults
              </button>
            </div>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          {!loading && filteredGames.length > 0 && (
            <div className="md:hidden flex items-center justify-center gap-2 flex-wrap px-4 py-3 border-b border-neutral-800 bg-neutral-950">
              <span className="text-xs text-neutral-500">Sort</span>
              {sortOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSort(key)}
                  className={`touch-manipulation text-xs min-h-[44px] px-3 py-2.5 rounded-lg border transition-colors inline-flex items-center justify-center gap-1 ${
                    sortKey === key
                      ? 'border-lime-500/40 text-lime-400 bg-lime-500/5 active:opacity-90'
                      : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 active:bg-neutral-900 active:border-neutral-600'
                  }`}
                >
                  {label}
                  {sortIcon(key)}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-neutral-500">Loading odds data...</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-16 text-neutral-500">
              No games found matching your filters
            </div>
          ) : (
            <>
              <div className="md:hidden">
                {filteredGames.map(({ game, marketBests }) =>
                  marketFilter === 'All' ? (
                    <AllMarketsGameCard
                      key={game.id}
                      game={game}
                      markets={visibleMarkets}
                      selectedBooks={selectedBooks}
                      marketBests={marketBests}
                      onOpenMarket={(market) => setOpenSheet({ gameId: game.id, market })}
                      onOddsClick={onOddsClick}
                    />
                  ) : (
                    <OddsGameCard
                      key={game.id}
                      game={game}
                      marketType={marketFilter}
                      selectedBooks={orderedBooks}
                      bestPercent={marketBests[marketFilter]}
                      onOddsClick={onOddsClick}
                      pick={getGamePick(game.id)}
                      onPickChange={(pick) => setGamePick(game.id, pick)}
                    />
                  )
                )}
              </div>
              <SyncedHorizontalScroll className="hidden md:block">
                <table className="w-full" style={{ minWidth: tableMinWidth }}>
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th
                        scope="col"
                        className="text-left py-3 md:py-4 pl-5 pr-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500 sticky left-0 z-20 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]"
                      >
                        Game
                      </th>
                      <th className="text-left py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                        <button
                          type="button"
                          onClick={() => handleSort('time')}
                          className={`touch-manipulation inline-flex items-center gap-1 rounded-md hover:text-white active:text-white transition-colors pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:justify-center pointer-coarse:px-2 ${
                            sortKey === 'time' ? 'text-lime-400' : ''
                          }`}
                        >
                          Time
                          {sortIcon('time')}
                        </button>
                      </th>
                      {marketFilter === 'All' ? (
                        visibleMarkets.map((market) => (
                          <th
                            key={market}
                            className="text-center py-3 md:py-4 px-2 text-xs md:text-sm font-medium text-neutral-500 min-w-[120px]"
                          >
                            <button
                              type="button"
                              onClick={() => handleSort(market)}
                              className={`touch-manipulation inline-flex items-center gap-1 rounded-md hover:text-white active:text-white transition-colors pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:justify-center pointer-coarse:px-2 ${
                                sortKey === market ? 'text-lime-400' : ''
                              }`}
                            >
                              {MARKET_TYPE_SHORT_LABELS[market]}
                              {sortIcon(market)}
                            </button>
                          </th>
                        ))
                      ) : (
                        <>
                          <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                            <button
                              type="button"
                              onClick={() => handleSort('bestPercent')}
                              className={`touch-manipulation inline-flex items-center gap-1 rounded-md hover:text-white active:text-white transition-colors pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:justify-center pointer-coarse:px-2 ${
                                sortKey === 'bestPercent' ? 'text-lime-400' : ''
                              }`}
                            >
                              Best %
                              {sortIcon('bestPercent')}
                            </button>
                          </th>
                          {orderedBooks.map((book) => (
                            <th
                              key={book}
                              className="text-center py-3 md:py-4 px-1 md:px-2 text-xs md:text-sm font-medium text-neutral-500 min-w-[60px] md:min-w-[80px]"
                            >
                              {book}
                            </th>
                          ))}
                          <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                            Best
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.map(({ game, marketBests }) =>
                      marketFilter === 'All' ? (
                        <AllMarketsRow
                          key={game.id}
                          game={game}
                          markets={visibleMarkets}
                          selectedBooks={selectedBooks}
                          marketBests={marketBests}
                          expandedMarket={expandedMarkets[game.id] ?? null}
                          onToggleExpand={(market) => toggleExpandedMarket(game.id, market)}
                          onOddsClick={onOddsClick}
                          getPick={(market) => getGamePick(marketPickKey(game.id, market))}
                          onPickChange={(market, update) =>
                            setGamePick(marketPickKey(game.id, market), update)
                          }
                        />
                      ) : (
                        <OddsRow
                          key={game.id}
                          game={game}
                          marketType={marketFilter}
                          selectedBooks={orderedBooks}
                          bestPercent={marketBests[marketFilter]}
                          onOddsClick={onOddsClick}
                          pick={getGamePick(game.id)}
                          onPickChange={(pick) => setGamePick(game.id, pick)}
                        />
                      )
                    )}
                  </tbody>
                </table>
              </SyncedHorizontalScroll>
            </>
          )}
        </div>

        {ODDS_DEBUG && debugInfo && (
          <OddsDebugPanel info={debugInfo} funnel={filterFunnel} renderedCount={filteredGames.length} />
        )}
      </div>

      {openSheet &&
        (() => {
          const entry = filteredGames.find((g) => g.game.id === openSheet.gameId);
          if (!entry) return null;
          const pickKey = marketPickKey(openSheet.gameId, openSheet.market);
          return (
            <MarketDrawer
              game={entry.game}
              marketType={openSheet.market}
              selectedBooks={selectedBooks}
              bestPercent={entry.marketBests[openSheet.market]}
              onOddsClick={(payload) => {
                setOpenSheet(null);
                onOddsClick(payload);
              }}
              pick={getGamePick(pickKey)}
              onPickChange={(update) => setGamePick(pickKey, update)}
              onClose={() => setOpenSheet(null)}
            />
          );
        })()}
    </div>
  );
}
