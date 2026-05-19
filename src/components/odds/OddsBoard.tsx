import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Activity, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { SPORTS, MARKET_TYPES, ALL_SPORTSBOOKS, Sport, MarketType, Sportsbook } from '../../constants/sportsbooks';
import { GameOdds, getMockOddsApiPayload } from '../../data/mockOdds';
import {
  fetchOddsRows,
  oddsRowsToApiGames,
  refreshOddsViaEdgeFunction,
  type OddsApiGame,
} from '../../lib/oddsFromSupabase';
import { canInvokeOddsEdgeSync, readLastOddsEdgeSync, writeLastOddsEdgeSync } from '../../lib/oddsEdgeSync';
import { isLocalMockMode, supabase } from '../../lib/supabase';
import { OddsGameCard } from './OddsGameCard';
import { OddsRow } from './OddsRow';
import { calculateGameBestPercent } from '../../utils/bestPercent';
import { gameHasSelectedMarketLines } from '../../utils/marketOdds';
import { emptyGameSidePick, type GameSidePick } from './useOddsGameInteraction';
import { SyncedHorizontalScroll } from '../shared/SyncedHorizontalScroll';

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
  const [selectedSports, setSelectedSports] = useState<Sport[]>([]);
  const [marketFilter, setMarketFilter] = useState<MarketType>('Money Line');
  const [selectedBooks, setSelectedBooks] = useState<Sportsbook[]>([
    'Bovada',
    'FanDuel',
    'DraftKings',
    'BetMGM',
  ]);
  const [maxFavorite, setMaxFavorite] = useState(-300);
  const [maxUnderdog, setMaxUnderdog] = useState(300);
  const [maxLossPercent, setMaxLossPercent] = useState(4);
  const [games, setGames] = useState<GameOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLiveSync, setLastLiveSync] = useState<Date | null>(() => readLastOddsEdgeSync());
  const [sortByBestPercent, setSortByBestPercent] = useState(false);
  const [gamePicks, setGamePicks] = useState<Record<string, GameSidePick>>({});
  const [syncedFilterKey, setSyncedFilterKey] = useState<string | null>(null);
  const filterKeyRef = useRef('');

  const currentFilterKey = useMemo(
    () =>
      JSON.stringify({
        selectedSports,
        marketFilter,
        selectedBooks,
        maxFavorite,
        maxUnderdog,
        maxLossPercent,
      }),
    [selectedSports, marketFilter, selectedBooks, maxFavorite, maxUnderdog, maxLossPercent]
  );
  filterKeyRef.current = currentFilterKey;

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
    async (options?: { signal?: AbortSignal; forceLiveSync?: boolean }) => {
      const signal = options?.signal;
      const forceLiveSync = options?.forceLiveSync ?? false;
      const gone = () => signal?.aborted ?? false;

      setLoading(true);
      let loadSucceeded = false;
      try {
        if (isLocalMockMode) {
          const data = getMockOddsApiPayload();
          if (gone()) return;
          setGames(transformApiGames(data.games as OddsApiGame[]));
          setLastLiveSync(new Date(data.updated));
          loadSucceeded = true;
          return;
        }

        if (forceLiveSync || canInvokeOddsEdgeSync()) {
          try {
            const { games: apiGames, updated } = await refreshOddsViaEdgeFunction();
            if (gone()) return;
            const syncTime = new Date(updated);
            writeLastOddsEdgeSync(syncTime);
            setLastLiveSync(syncTime);
            if (apiGames.length > 0) {
              setGames(transformApiGames(apiGames));
            } else {
              const rows = await fetchOddsRows(supabase);
              if (gone()) return;
              setGames(transformApiGames(oddsRowsToApiGames(rows)));
            }
            loadSucceeded = true;
          } catch (error) {
            console.error('Error refreshing odds:', error);
            const rows = await fetchOddsRows(supabase);
            if (gone()) return;
            setGames(transformApiGames(oddsRowsToApiGames(rows)));
            loadSucceeded = true;
          }
        } else {
          const rows = await fetchOddsRows(supabase);
          if (gone()) return;
          setGames(transformApiGames(oddsRowsToApiGames(rows)));
          loadSucceeded = true;
        }
      } catch (error) {
        console.error('Error loading odds from database:', error);
      } finally {
        if (!gone() && loadSucceeded) {
          setSyncedFilterKey(filterKeyRef.current);
        }
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const ac = new AbortController();
    void performOddsLoad({ signal: ac.signal });
    return () => ac.abort();
  }, [performOddsLoad]);

  const gamesWithBestPercent = useMemo(() => {
    return games.map((game) => ({
      game,
      bestPercent: calculateGameBestPercent(game, marketFilter, selectedBooks),
    }));
  }, [games, marketFilter, selectedBooks]);

  const filteredGames = useMemo(() => {
    let filtered = gamesWithBestPercent;

    if (selectedSports.length > 0) {
      filtered = filtered.filter((g) => selectedSports.includes(g.game.sport));
    }

    filtered = filtered.filter((g) =>
      gameHasSelectedMarketLines(g.game, marketFilter, selectedBooks)
    );

    if (sortByBestPercent) {
      filtered = [...filtered].sort((a, b) => {
        const aPercent = a.bestPercent?.percent ?? -Infinity;
        const bPercent = b.bestPercent?.percent ?? -Infinity;
        return bPercent - aPercent;
      });
    } else {
      filtered = [...filtered].sort((a, b) =>
        a.game.gameTime.getTime() - b.game.gameTime.getTime()
      );
    }

    return filtered;
  }, [gamesWithBestPercent, selectedSports, marketFilter, sortByBestPercent, selectedBooks]);

  const tableMinWidth = useMemo(() => {
    return 520 + selectedBooks.length * 80;
  }, [selectedBooks.length]);

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
          Compare odds across sportsbooks. Refresh reloads from the database; a live upstream sync runs at most once
          per minute, or immediately after you change filters and press Refresh.
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
          <div className="text-xs md:text-sm text-neutral-500 text-center px-2 space-y-0.5">
            <p>
              {lastLiveSync ? `Last live sync: ${lastLiveSync.toLocaleString()}` : 'Last live sync: —'}
            </p>
            {filtersDirty && (
              <p className="text-lime-400/80">Filters changed — Refresh will pull fresh odds from the API</p>
            )}
            <p>Tap an odd to highlight it; tap again to open Arbitrage. Unselected rows use the green best line.</p>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div>
                <label className="label">Market Type</label>
                <select
                  value={marketFilter}
                  onChange={(e) => setMarketFilter(e.target.value as MarketType)}
                  className="select-field text-sm md:text-base"
                >
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
          </div>
        )}

        <div className="card overflow-hidden p-0">
          {!loading && filteredGames.length > 0 && (
            <div className="md:hidden flex items-center justify-center gap-2 flex-wrap px-4 py-3 border-b border-neutral-800 bg-neutral-950">
              <span className="text-xs text-neutral-500">Sort</span>
              <button
                type="button"
                onClick={() => setSortByBestPercent(false)}
                className={`touch-manipulation text-xs min-h-[44px] px-3 py-2.5 rounded-lg border transition-colors inline-flex items-center justify-center ${
                  !sortByBestPercent
                    ? 'border-lime-500/40 text-lime-400 bg-lime-500/5 active:opacity-90'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 active:bg-neutral-900 active:border-neutral-600'
                }`}
              >
                Time
              </button>
              <button
                type="button"
                onClick={() => setSortByBestPercent(true)}
                className={`touch-manipulation text-xs min-h-[44px] px-3 py-2.5 rounded-lg border transition-colors inline-flex items-center justify-center ${
                  sortByBestPercent
                    ? 'border-lime-500/40 text-lime-400 bg-lime-500/5 active:opacity-90'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700 active:bg-neutral-900 active:border-neutral-600'
                }`}
              >
                Best %
              </button>
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
                {filteredGames.map(({ game, bestPercent }) => (
                  <OddsGameCard
                    key={game.id}
                    game={game}
                    marketType={marketFilter}
                    selectedBooks={selectedBooks}
                    bestPercent={bestPercent}
                    onOddsClick={onOddsClick}
                    pick={getGamePick(game.id)}
                    onPickChange={(pick) => setGamePick(game.id, pick)}
                  />
                ))}
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
                          onClick={() => setSortByBestPercent(false)}
                          className={`touch-manipulation inline-flex items-center gap-1 rounded-md hover:text-white active:text-white transition-colors pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:justify-center pointer-coarse:px-2 ${
                            !sortByBestPercent ? 'text-lime-400' : ''
                          }`}
                        >
                          Time
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                        <button
                          type="button"
                          onClick={() => setSortByBestPercent(true)}
                          className={`touch-manipulation inline-flex items-center gap-1 rounded-md hover:text-white active:text-white transition-colors pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:justify-center pointer-coarse:px-2 ${
                            sortByBestPercent ? 'text-lime-400' : ''
                          }`}
                        >
                          Best %
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </th>
                      {selectedBooks.map((book) => (
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
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.map(({ game, bestPercent }) => (
                      <OddsRow
                        key={game.id}
                        game={game}
                        marketType={marketFilter}
                        selectedBooks={selectedBooks}
                        bestPercent={bestPercent}
                        onOddsClick={onOddsClick}
                        pick={getGamePick(game.id)}
                        onPickChange={(pick) => setGamePick(game.id, pick)}
                      />
                    ))}
                  </tbody>
                </table>
              </SyncedHorizontalScroll>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
