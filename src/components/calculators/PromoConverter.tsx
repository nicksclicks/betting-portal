import { useState, useMemo, useCallback } from 'react';
import { Gift, ArrowRightLeft, Percent, Search, Loader2 } from 'lucide-react';
import { SportsbookSelect } from '../shared/SportsbookSelect';
import { OddsInput } from '../shared/OddsInput';
import { calculatePromoConversion, formatCurrency, formatOdds } from '../../utils/odds';
import { ALL_SPORTSBOOKS, Sportsbook } from '../../constants/sportsbooks';
import { getMockOddsApiPayload } from '../../data/mockOdds';
import { isLocalMockMode } from '../../lib/supabase';

interface PromoOpportunity {
  gameId: string;
  gameName: string;
  freePlayOdds: number;
  freePlayBook: Sportsbook;
  hedgeOdds: number;
  hedgeBook: Sportsbook;
  hedgeAmount: number;
  profit: number;
  conversionPercent: number;
  team: 'home' | 'away';
}

interface ApiGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  odds: Record<string, Record<string, { home: number | null; away: number | null }>>;
}

export function PromoConverter() {
  const [freePlayAmount, setFreePlayAmount] = useState('');
  const [freePlayOdds, setFreePlayOdds] = useState('');
  const [freePlayBook, setFreePlayBook] = useState('');
  const [hedgeOdds, setHedgeOdds] = useState('');
  const [hedgeBook, setHedgeBook] = useState('');

  const [scanSportsbook, setScanSportsbook] = useState<string>('');
  const [scanAmount, setScanAmount] = useState('');
  const [scanning, setScanning] = useState(false);
  const [opportunities, setOpportunities] = useState<PromoOpportunity[]>([]);

  const result = useMemo(() => {
    const amount = parseFloat(freePlayAmount);
    const fpOdds = parseFloat(freePlayOdds);
    const hOdds = parseFloat(hedgeOdds);

    if (isNaN(amount) || isNaN(fpOdds) || isNaN(hOdds) || amount <= 0) {
      return null;
    }

    return calculatePromoConversion(amount, fpOdds, hOdds);
  }, [freePlayAmount, freePlayOdds, hedgeOdds]);

  const getConversionColor = () => {
    if (!result) return 'text-neutral-400';
    if (result.conversionPercent >= 70) return 'text-lime-400';
    if (result.conversionPercent >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleTryExample = () => {
    setFreePlayAmount('100');
    setFreePlayOdds('+250');
    setFreePlayBook('FanDuel');
    setHedgeOdds('-280');
    setHedgeBook('Bovada');
  };

  const handleClear = () => {
    setFreePlayAmount('');
    setFreePlayOdds('');
    setFreePlayBook('');
    setHedgeOdds('');
    setHedgeBook('');
  };

  const scanForOpportunities = useCallback(async () => {
    if (!scanSportsbook || !scanAmount) return;

    setScanning(true);
    setOpportunities([]);

    try {
      let games: ApiGame[];

      if (isLocalMockMode) {
        games = getMockOddsApiPayload().games as ApiGame[];
      } else {
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
        games = data.games || [];
      }
      const amount = parseFloat(scanAmount);
      const results: PromoOpportunity[] = [];

      for (const game of games) {
        const moneyLine = game.odds['Money Line'];
        if (!moneyLine) continue;

        const bookOdds = moneyLine[scanSportsbook];
        if (!bookOdds) continue;

        const sides: { team: 'home' | 'away'; odds: number | null }[] = [
          { team: 'home', odds: bookOdds.home },
          { team: 'away', odds: bookOdds.away },
        ];

        for (const { team, odds: freePlayOddsValue } of sides) {
          if (freePlayOddsValue === null || freePlayOddsValue < 200) continue;

          const oppositeTeam = team === 'home' ? 'away' : 'home';
          let bestHedgeOdds: number | null = null;
          let bestHedgeBook: Sportsbook | null = null;

          for (const [book, odds] of Object.entries(moneyLine)) {
            if (book === scanSportsbook) continue;
            const hedgeOddsValue = odds[oppositeTeam];
            if (hedgeOddsValue === null) continue;

            if (bestHedgeOdds === null || hedgeOddsValue > bestHedgeOdds) {
              bestHedgeOdds = hedgeOddsValue;
              bestHedgeBook = book as Sportsbook;
            }
          }

          if (bestHedgeOdds === null || bestHedgeBook === null) continue;

          const conversion = calculatePromoConversion(amount, freePlayOddsValue, bestHedgeOdds);

          if (conversion.conversionPercent >= 50) {
            results.push({
              gameId: game.id,
              gameName: team === 'home'
                ? `${game.awayTeam} @ ${game.homeTeam}`
                : `${game.awayTeam} @ ${game.homeTeam}`,
              freePlayOdds: freePlayOddsValue,
              freePlayBook: scanSportsbook as Sportsbook,
              hedgeOdds: bestHedgeOdds,
              hedgeBook: bestHedgeBook,
              hedgeAmount: conversion.hedgeBet,
              profit: conversion.profit,
              conversionPercent: conversion.conversionPercent,
              team,
            });
          }
        }
      }

      results.sort((a, b) => b.profit - a.profit);
      setOpportunities(results);
    } catch (error) {
      console.error('Error scanning for opportunities:', error);
    } finally {
      setScanning(false);
    }
  }, [scanSportsbook, scanAmount]);

  const handleOpportunityClick = (opp: PromoOpportunity) => {
    setFreePlayAmount(scanAmount);
    setFreePlayOdds(formatOdds(opp.freePlayOdds));
    setFreePlayBook(opp.freePlayBook);
    setHedgeOdds(formatOdds(opp.hedgeOdds));
    setHedgeBook(opp.hedgeBook);
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Promo Converter</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Convert free bets and promotional credits into guaranteed cash.
          Maximize the value of sportsbook bonuses.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Gift className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Free Bet Conversion</h3>
          <p className="text-neutral-500 text-sm">Turn promos into real money</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Optimal Hedging</h3>
          <p className="text-neutral-500 text-sm">Calculate exact hedge amounts</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Percent className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">High Conversion</h3>
          <p className="text-neutral-500 text-sm">Target 70%+ conversion rates</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="card mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="feature-icon">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-semibold text-white">Find Opportunities</h2>
              <p className="text-neutral-500 text-xs md:text-sm">Scan for the best free bet conversions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end mb-4 md:mb-6">
            <div>
              <label className="label">Sportsbook</label>
              <select
                value={scanSportsbook}
                onChange={(e) => setScanSportsbook(e.target.value)}
                className="select-field text-sm md:text-base"
              >
                <option value="">Select sportsbook...</option>
                {ALL_SPORTSBOOKS.map((book) => (
                  <option key={book} value={book}>{book}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Free Play Amount</label>
              <input
                type="number"
                value={scanAmount}
                onChange={(e) => setScanAmount(e.target.value)}
                className="input-field font-mono text-sm md:text-base"
                placeholder="100"
              />
            </div>
            <div>
              <button
                onClick={scanForOpportunities}
                disabled={scanning || !scanSportsbook || !scanAmount}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Scan
                  </>
                )}
              </button>
            </div>
          </div>

          {opportunities.length > 0 && (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-2 md:py-3 px-2 md:px-3 text-[10px] md:text-xs font-medium text-neutral-500">Game</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-3 text-[10px] md:text-xs font-medium text-neutral-500">FP Odds</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-3 text-[10px] md:text-xs font-medium text-neutral-500">Hedge</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-3 text-[10px] md:text-xs font-medium text-neutral-500">Amt</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-3 text-[10px] md:text-xs font-medium text-neutral-500">Profit</th>
                    <th className="text-right py-2 md:py-3 px-2 md:px-3 text-[10px] md:text-xs font-medium text-neutral-500">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp, idx) => (
                    <tr
                      key={`${opp.gameId}-${opp.team}-${idx}`}
                      onClick={() => handleOpportunityClick(opp)}
                      className="border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors cursor-pointer"
                    >
                      <td className="py-2 md:py-3 px-2 md:px-3 text-xs md:text-sm text-white truncate max-w-[120px] md:max-w-none">{opp.gameName}</td>
                      <td className="py-2 md:py-3 px-2 md:px-3 text-xs md:text-sm text-right font-mono text-lime-400">
                        {formatOdds(opp.freePlayOdds)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-3 text-xs md:text-sm text-right font-mono text-amber-400">
                        {formatOdds(opp.hedgeOdds)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-3 text-xs md:text-sm text-right font-mono text-white">
                        {formatCurrency(opp.hedgeAmount)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-3 text-xs md:text-sm text-right font-mono text-lime-400">
                        {formatCurrency(opp.profit)}
                      </td>
                      <td className="py-2 md:py-3 px-2 md:px-3 text-xs md:text-sm text-right font-mono">
                        <span className={opp.conversionPercent >= 70 ? 'text-lime-400' : 'text-amber-400'}>
                          {opp.conversionPercent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] md:text-xs text-neutral-500 mt-2 md:mt-3 px-2 md:px-0">
                Tap a row to auto-fill the calculator below
              </p>
            </div>
          )}

          {!scanning && opportunities.length === 0 && scanSportsbook && scanAmount && (
            <div className="text-center py-8 text-neutral-500">
              No opportunities found with 50%+ conversion. Try a different sportsbook or check back later.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white">Enter Bet Details</h2>
          <div className="flex gap-2">
            <button onClick={handleTryExample} className="btn-secondary text-xs md:text-sm">
              Example
            </button>
            <button onClick={handleClear} className="btn-secondary text-xs md:text-sm">
              Clear
            </button>
          </div>
        </div>

        <div className="card">
          <div className="mb-4 md:mb-6">
            <label className="label">Free Play Amount</label>
            <input
              type="number"
              value={freePlayAmount}
              onChange={(e) => setFreePlayAmount(e.target.value)}
              className="input-field font-mono text-sm md:text-base"
              placeholder="100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3 md:space-y-4 p-4 md:p-5 bg-lime-500/5 border border-lime-500/20 rounded-xl">
              <h3 className="font-medium text-lime-400 text-sm md:text-base">Free Play (Underdog)</h3>
              <OddsInput
                label="Free Play Odds"
                value={freePlayOdds}
                onChange={setFreePlayOdds}
                placeholder="+200 or higher"
                id="freePlayOdds"
              />
              <SportsbookSelect
                label="Sportsbook"
                value={freePlayBook}
                onChange={setFreePlayBook}
                id="freePlayBook"
              />
            </div>

            <div className="space-y-3 md:space-y-4 p-4 md:p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <h3 className="font-medium text-amber-400 text-sm md:text-base">Hedge (Favorite)</h3>
              <OddsInput
                label="Hedge Odds"
                value={hedgeOdds}
                onChange={setHedgeOdds}
                placeholder="-200 or similar"
                id="hedgeOdds"
              />
              <SportsbookSelect
                label="Sportsbook"
                value={hedgeBook}
                onChange={setHedgeBook}
                id="hedgeBook"
              />
            </div>
          </div>
        </div>

        {result && (
          <div className="card mt-4 md:mt-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Results</h3>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">Hedge Bet</p>
                <p className="text-white text-lg md:text-xl font-semibold font-mono">{formatCurrency(result.hedgeBet)}</p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">Profit</p>
                <p className={`text-lg md:text-xl font-semibold font-mono ${getConversionColor()}`}>
                  {formatCurrency(result.profit)}
                </p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">Conv %</p>
                <p className={`text-lg md:text-xl font-semibold font-mono ${getConversionColor()}`}>
                  {result.conversionPercent.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl text-center">
              <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-lime-400"></div>
                  <span className="text-neutral-400">70%+ = Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-400"></div>
                  <span className="text-neutral-400">50-70% = Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-400"></div>
                  <span className="text-neutral-400">&lt;50% = Low</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        <div className="p-4 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <div className="text-xs md:text-sm text-neutral-300">
            <p className="font-medium mb-1 md:mb-2">How Free Bets Work</p>
            <p className="text-neutral-500">
              With free bets, only the <span className="text-lime-400">winnings</span> are paid out -
              the stake is NOT returned. Use free plays on <span className="text-lime-400">underdogs (+200 or higher)</span> and
              hedge on the <span className="text-amber-400">favorite</span> at a different book.
            </p>
          </div>
        </div>

        <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Pro Tips</h4>
          <ul className="text-sm text-neutral-500 space-y-2">
            <li>Use free play on UNDERDOGS (+200 or higher) for better conversion</li>
            <li>Hedge on the FAVORITE at a different sportsbook</li>
            <li>Look for games with tight lines to maximize conversion</li>
            <li>Tennis and hockey often have good conversion opportunities</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
