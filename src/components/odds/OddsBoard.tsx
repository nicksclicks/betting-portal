import { useState, useMemo, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { SPORTS, MARKET_TYPES, ALL_SPORTSBOOKS, Sport, MarketType, Sportsbook } from '../../constants/sportsbooks';
import { GameOdds } from '../../data/mockOdds';
import { OddsRow } from './OddsRow';
import { calculateGameBestPercent, BestPercentResult } from '../../utils/bestPercent';

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

interface ApiGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  odds: Record<string, Record<string, { home: number | null; away: number | null; spread?: number; total?: number }>>;
}

function transformApiGames(apiGames: ApiGame[]): GameOdds[] {
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sortByBestPercent, setSortByBestPercent] = useState(false);

  const fetchOdds = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-odds`;
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch odds');
      }

      const data = await response.json();

      if (data.games && data.games.length > 0) {
        const transformedGames = transformApiGames(data.games);
        setGames(transformedGames);
        setLastUpdated(new Date(data.updated));
      }
    } catch (error) {
      console.error('Error fetching odds:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

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

    filtered = filtered.filter((g) => g.game.odds[marketFilter]);

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
  }, [gamesWithBestPercent, selectedSports, marketFilter, sortByBestPercent]);

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
          Compare odds across multiple sportsbooks in real-time.
          Click any line to auto-fill the arbitrage calculator.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Real-Time Updates</h3>
          <p className="text-neutral-500 text-sm">Live odds from multiple books</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <RefreshCw className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Auto-Refresh</h3>
          <p className="text-neutral-500 text-sm">Always current pricing</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Custom Filters</h3>
          <p className="text-neutral-500 text-sm">Focus on what matters</p>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-sm ${showFilters ? 'border-lime-500/50 text-lime-400' : ''}`}
          >
            Filters
          </button>
          <button
            onClick={fetchOdds}
            disabled={loading}
            className={`btn-secondary text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <p className="text-xs md:text-sm text-neutral-500 w-full md:w-auto mt-1 md:mt-0">
            {lastUpdated
              ? `Updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Tap odds to fill calculator'}
          </p>
        </div>

        {showFilters && (
          <div className="card mb-6">
            <div className="mb-6">
              <label className="label">Sport</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleAllSports}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    allSportsSelected
                      ? 'bg-lime-500/10 border-lime-500/30 text-lime-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  All Sports
                </button>
                {SPORTS.map((sport) => (
                  <button
                    key={sport}
                    onClick={() => toggleSport(sport)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedSports.includes(sport)
                        ? 'bg-lime-500/10 border-lime-500/30 text-lime-400'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
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
                  onClick={toggleAllSportsbooks}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    allSportsbooksSelected
                      ? 'bg-lime-500/10 border-lime-500/30 text-lime-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                  }`}
                >
                  All Sportsbooks
                </button>
                {ALL_SPORTSBOOKS.map((book) => (
                  <button
                    key={book}
                    onClick={() => toggleBook(book)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      selectedBooks.includes(book)
                        ? 'bg-lime-500/10 border-lime-500/30 text-lime-400'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'
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
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 md:py-4 px-3 md:px-4 text-xs md:text-sm font-medium text-neutral-500 sticky left-0 bg-neutral-950 z-10">Game</th>
                  <th className="text-left py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    <button
                      onClick={() => setSortByBestPercent(false)}
                      className={`inline-flex items-center gap-1 hover:text-white transition-colors ${
                        !sortByBestPercent ? 'text-lime-400' : ''
                      }`}
                    >
                      Time
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">
                    <button
                      onClick={() => setSortByBestPercent(true)}
                      className={`inline-flex items-center gap-1 hover:text-white transition-colors ${
                        sortByBestPercent ? 'text-lime-400' : ''
                      }`}
                    >
                      Best %
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  {selectedBooks.map((book) => (
                    <th key={book} className="text-center py-3 md:py-4 px-1 md:px-2 text-xs md:text-sm font-medium text-neutral-500 min-w-[60px] md:min-w-[80px]">
                      {book}
                    </th>
                  ))}
                  <th className="text-center py-3 md:py-4 px-2 md:px-4 text-xs md:text-sm font-medium text-neutral-500">Best</th>
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
                  />
                ))}
              </tbody>
            </table>
          </div>

          {filteredGames.length === 0 && !loading && (
            <div className="text-center py-16 text-neutral-500">
              No games found matching your filters
            </div>
          )}

          {loading && (
            <div className="text-center py-16 text-neutral-500">
              Loading odds data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
