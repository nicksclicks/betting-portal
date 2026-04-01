import { useState, useMemo } from 'react';
import { RotateCcw, Target, CheckCircle } from 'lucide-react';
import { calculateRollover, formatCurrency } from '../../utils/odds';

export function RolloverCalculator() {
  const [depositAmount, setDepositAmount] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [rolloverMultiplier, setRolloverMultiplier] = useState('');
  const [amountWagered, setAmountWagered] = useState('');

  const result = useMemo(() => {
    const deposit = parseFloat(depositAmount);
    const bonus = parseFloat(bonusAmount);
    const multiplier = parseFloat(rolloverMultiplier);
    const wagered = parseFloat(amountWagered) || 0;

    if (isNaN(deposit) || isNaN(bonus) || isNaN(multiplier)) {
      return null;
    }

    return calculateRollover(deposit, bonus, multiplier, wagered);
  }, [depositAmount, bonusAmount, rolloverMultiplier, amountWagered]);

  const handleTryExample = () => {
    setDepositAmount('100');
    setBonusAmount('100');
    setRolloverMultiplier('10');
    setAmountWagered('500');
  };

  const handleClear = () => {
    setDepositAmount('');
    setBonusAmount('');
    setRolloverMultiplier('');
    setAmountWagered('');
  };

  const getProgressColor = () => {
    if (!result) return 'bg-neutral-700';
    if (result.percentComplete >= 100) return 'bg-lime-400';
    if (result.percentComplete >= 75) return 'bg-lime-400';
    if (result.percentComplete >= 50) return 'bg-amber-400';
    return 'bg-neutral-500';
  };

  return (
    <div className="space-y-8 md:space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Rollover Calculator</h1>
        <p className="text-neutral-400 text-sm md:text-base">
          Track your bonus wagering requirements and see how close you are to withdrawal.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-8 max-w-3xl mx-auto">
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <RotateCcw className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Track Progress</h3>
          <p className="text-neutral-500 text-sm">Monitor wagering requirements</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Clear Goals</h3>
          <p className="text-neutral-500 text-sm">Know exactly what you need</p>
        </div>
        <div className="text-center">
          <div className="feature-icon mx-auto mb-4">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-white font-medium mb-1">Withdrawal Ready</h3>
          <p className="text-neutral-500 text-sm">Know when you can cash out</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white">Enter Bonus Details</h2>
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
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <div>
              <label className="label">Deposit Amount</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="input-field font-mono text-sm md:text-base"
                placeholder="100"
              />
            </div>
            <div>
              <label className="label">Bonus Amount</label>
              <input
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                className="input-field font-mono text-sm md:text-base"
                placeholder="100"
              />
            </div>
            <div>
              <label className="label">Rollover Multiplier</label>
              <input
                type="number"
                value={rolloverMultiplier}
                onChange={(e) => setRolloverMultiplier(e.target.value)}
                className="input-field font-mono text-sm md:text-base"
                placeholder="10"
              />
              <p className="text-[10px] md:text-xs text-neutral-500 mt-1 md:mt-2">e.g., 5x, 10x, 15x</p>
            </div>
            <div>
              <label className="label">Amount Wagered</label>
              <input
                type="number"
                value={amountWagered}
                onChange={(e) => setAmountWagered(e.target.value)}
                className="input-field font-mono text-sm md:text-base"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {result && (
          <div className="card mt-4 md:mt-6">
            <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">Progress</h3>

            <div className="relative h-6 md:h-8 bg-neutral-800 rounded-full overflow-hidden mb-4 md:mb-6">
              <div
                className={`absolute inset-y-0 left-0 ${getProgressColor()} transition-all duration-500`}
                style={{ width: `${Math.min(result.percentComplete, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-medium text-white">
                {result.percentComplete.toFixed(1)}% Complete
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">Required</p>
                <p className="text-white text-lg md:text-xl font-semibold font-mono">{formatCurrency(result.totalRequired)}</p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">Remaining</p>
                <p className={`text-lg md:text-xl font-semibold font-mono ${result.remaining === 0 ? 'text-lime-400' : 'text-white'}`}>
                  {formatCurrency(result.remaining)}
                </p>
              </div>
              <div className="p-3 md:p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-neutral-500 text-xs md:text-sm mb-1">Progress</p>
                <p className={`text-lg md:text-xl font-semibold font-mono ${result.percentComplete >= 75 ? 'text-lime-400' : result.percentComplete >= 50 ? 'text-amber-400' : 'text-white'}`}>
                  {result.percentComplete.toFixed(1)}%
                </p>
              </div>
            </div>

            {result.remaining === 0 && (
              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl text-center">
                <span className="text-lime-400 font-medium text-sm md:text-base">
                  Rollover Complete! You can now withdraw.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="p-4 md:p-5 bg-neutral-950 border border-neutral-800 rounded-xl">
          <h4 className="text-xs md:text-sm font-medium text-neutral-300 mb-2 md:mb-3">How Rollover Works</h4>
          <p className="text-xs md:text-sm text-neutral-500">
            Example: You deposit $100 and receive a $100 bonus with 10x rollover.
            Total rollover = ($100 + $100) x 10 = $2,000 in wagers required before withdrawal.
          </p>
        </div>
      </div>
    </div>
  );
}
