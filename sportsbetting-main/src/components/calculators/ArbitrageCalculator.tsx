import { useState, useEffect, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign, Target } from 'lucide-react';
import { SportsbookSelect } from '../shared/SportsbookSelect';
import { OddsInput } from '../shared/OddsInput';
import { AddBetModal } from '../bets/AddBetModal';
import { calculateArbitrage, formatCurrency, formatPercent } from '../../utils/odds';
import { Sportsbook } from '../../constants/sportsbooks';

interface ArbitrageCalculatorProps {
  prefillData?: {
    teamA: string;
    teamB: string;
    oddsA: number;
    oddsB: number;
    bookA: Sportsbook;
    bookB: Sportsbook;
  } | null;
}

export function ArbitrageCalculator({ prefillData }: ArbitrageCalculatorProps) {
  const [totalStake, setTotalStake] = useState('1000');
  const [teamA, setTeamA] = useState('');
  const [oddsA, setOddsA] = useState('');
  const [bookA, setBookA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [oddsB, setOddsB] = useState('');
  const [bookB, setBookB] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (prefillData) {
      setTeamA(prefillData.teamA);
      setTeamB(prefillData.teamB);
      setOddsA(prefillData.oddsA.toString());
      setOddsB(prefillData.oddsB.toString());
      setBookA(prefillData.bookA);
      setBookB(prefillData.bookB);
    }
  }, [prefillData]);

  const result = useMemo(() => {
    const stake = parseFloat(totalStake);
    const oA = parseFloat(oddsA);
    const oB = parseFloat(oddsB);

    if (isNaN(stake) || isNaN(oA) || isNaN(oB) || stake <= 0) {
      return null;
    }

    return calculateArbitrage(stake, oA, oB);
  }, [totalStake, oddsA, oddsB]);

  const getProfitColor = () => {
    if (!result) return 'text-neutral-400';
    if (result.profitPercent >= 0) return 'text-lime-400';
    if (result.profitPercent >= -2) return 'text-lime-400';
    if (result.profitPercent >= -4) return 'text-amber-400';
    return 'text-red-400';
  };

  const handleTryExample = () => {
    setTotalStake('1000');
    setTeamA('Kansas City Chiefs');
    setOddsA('-145');
    setBookA('Bookmaker');
    setTeamB('Buffalo Bills');
    setOddsB('+155');
    setBookB('DraftKings');
  };

  const handleClear = () => {
    setTotalStake('1000');
    setTeamA('');
    setOddsA('');
    setBookA('');
    setTeamB('');
    setOddsB('');
    setBookB('');
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Arbitrage Calculator</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Calculate optimal bet sizes for both sides of a wager.
          Find guaranteed profit or minimize loss on promotional bets.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Precise Calculations</h3>
          <p className="text-neutral-500 text-sm">Exact bet amounts for any odds combination</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Maximize Returns</h3>
          <p className="text-neutral-500 text-sm">Find profitable arbitrage opportunities</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Risk-Free Betting</h3>
          <p className="text-neutral-500 text-sm">Guaranteed outcomes regardless of result</p>
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
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="label">Total Stake</label>
              <input
                type="number"
                value={totalStake}
                onChange={(e) => setTotalStake(e.target.value)}
                className="input-field font-mono text-base md:text-lg"
                placeholder="1000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3 md:space-y-4 p-4 md:p-5 bg-lime-500/5 border border-lime-500/20 rounded-xl">
                <h3 className="font-medium text-lime-400 text-sm md:text-base">Side A</h3>
                <div>
                  <label className="label">Team / Player</label>
                  <input
                    type="text"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    className="input-field text-sm md:text-base"
                    placeholder="Kansas City Chiefs"
                  />
                </div>
                <OddsInput
                  label="Odds"
                  value={oddsA}
                  onChange={setOddsA}
                  id="oddsA"
                />
                <SportsbookSelect
                  label="Sportsbook"
                  value={bookA}
                  onChange={setBookA}
                  id="bookA"
                />
              </div>

              <div className="space-y-3 md:space-y-4 p-4 md:p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <h3 className="font-medium text-amber-400 text-sm md:text-base">Side B</h3>
                <div>
                  <label className="label">Team / Player</label>
                  <input
                    type="text"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    className="input-field text-sm md:text-base"
                    placeholder="Buffalo Bills"
                  />
                </div>
                <OddsInput
                  label="Odds"
                  value={oddsB}
                  onChange={setOddsB}
                  id="oddsB"
                />
                <SportsbookSelect
                  label="Sportsbook"
                  value={bookB}
                  onChange={setBookB}
                  id="bookB"
                />
              </div>
            </div>
          </div>
        </div>

        {result && (
          <div className="card mt-4 md:mt-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1 truncate">{teamA || 'Side A Bet'}</p>
                <p className="text-white text-lg md:text-xl font-semibold font-mono">{formatCurrency(result.betA)}</p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1 truncate">{teamB || 'Side B Bet'}</p>
                <p className="text-white text-lg md:text-xl font-semibold font-mono">{formatCurrency(result.betB)}</p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">P/L</p>
                <p className={`text-lg md:text-xl font-semibold font-mono ${getProfitColor()}`}>
                  {formatCurrency(result.profit)}
                </p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">P/L %</p>
                <p className={`text-lg md:text-xl font-semibold font-mono ${getProfitColor()}`}>
                  {formatPercent(result.profitPercent)}
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
              <h4 className="text-xs md:text-sm font-medium text-neutral-400 mb-2 md:mb-3">Loss % Guide</h4>
              <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-lime-400"></div>
                  <span className="text-neutral-400">0-2% = Superior</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-400"></div>
                  <span className="text-neutral-400">2-4% = Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-400"></div>
                  <span className="text-neutral-400">4%+ = Below Avg</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 md:mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl transition-colors text-sm md:text-base"
            >
              <Target className="w-4 h-4 md:w-5 md:h-5" />
              Track This Bet
            </button>
          </div>
        )}
      </div>

      <AddBetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialBets={
          result && teamA && teamB && bookA && bookB
            ? [
                {
                  betName: teamA,
                  sportsbook: bookA,
                  odds: oddsA,
                  amountStaked: result.betA.toFixed(2),
                },
                {
                  betName: teamB,
                  sportsbook: bookB,
                  odds: oddsB,
                  amountStaked: result.betB.toFixed(2),
                },
              ]
            : undefined
        }
      />
    </div>
  );
}
