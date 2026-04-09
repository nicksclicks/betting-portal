import { useState, useEffect } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BetInsert } from '../../types/database';
import { ALL_SPORTSBOOKS } from '../../constants/sportsbooks';

interface BetEntry {
  id: string;
  betName: string;
  sportsbook: string;
  odds: string;
  amountStaked: string;
  isBonusBet: boolean;
  isOddsBoost: boolean;
}

interface AddBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialBets?: { betName: string; sportsbook: string; odds: string; amountStaked: string }[];
}

const createEmptyBet = (): BetEntry => ({
  id: crypto.randomUUID(),
  betName: '',
  sportsbook: '',
  odds: '',
  amountStaked: '',
  isBonusBet: false,
  isOddsBoost: false,
});

export function AddBetModal({ isOpen, onClose, onSuccess, initialBets }: AddBetModalProps) {
  const [bets, setBets] = useState<BetEntry[]>([createEmptyBet(), createEmptyBet()]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialBets && initialBets.length > 0) {
      setBets(
        initialBets.map((b) => ({
          ...createEmptyBet(),
          betName: b.betName,
          sportsbook: b.sportsbook,
          odds: b.odds,
          amountStaked: b.amountStaked,
        }))
      );
    }
  }, [isOpen, initialBets]);

  const updateBet = (id: string, field: keyof BetEntry, value: string | boolean) => {
    setBets((prev) =>
      prev.map((bet) => (bet.id === id ? { ...bet, [field]: value } : bet))
    );
  };

  const addBetRow = () => {
    setBets((prev) => [...prev, createEmptyBet()]);
  };

  const removeBetRow = (id: string) => {
    if (bets.length > 1) {
      setBets((prev) => prev.filter((bet) => bet.id !== id));
    }
  };

  const handleSubmit = async () => {
    const validBets = bets.filter(
      (bet) => bet.betName && bet.sportsbook && bet.odds && bet.amountStaked
    );

    if (validBets.length === 0) return;

    setIsSubmitting(true);
    const groupId = validBets.length > 1 ? crypto.randomUUID() : null;

    const betsToInsert: BetInsert[] = validBets.map((bet) => ({
      bet_name: bet.betName,
      sportsbook: bet.sportsbook,
      odds: parseInt(bet.odds, 10),
      amount_staked: parseFloat(bet.amountStaked),
      is_bonus_bet: bet.isBonusBet,
      is_odds_boost: bet.isOddsBoost,
      group_id: groupId,
    }));

    const { error } = await supabase.from('bets').insert(betsToInsert);

    setIsSubmitting(false);

    if (!error) {
      onSuccess?.();
      onClose();
      setBets([createEmptyBet(), createEmptyBet()]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl max-h-[min(92dvh,900px)] sm:mx-4 bg-neutral-950 border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800 shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-white pr-2">Add to Bet Tracker</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {bets.map((bet, index) => (
            <div key={bet.id} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Bet Name</label>
                  <input
                    type="text"
                    value={bet.betName}
                    onChange={(e) => updateBet(bet.id, 'betName', e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="Team or event name"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm text-neutral-400 mb-2">Sportsbook</label>
                  <div className="relative">
                    <select
                      value={bet.sportsbook}
                      onChange={(e) => updateBet(bet.id, 'sportsbook', e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white appearance-none focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="">Select</option>
                      {ALL_SPORTSBOOKS.map((book) => (
                        <option key={book} value={book}>
                          {book}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Odd Price</label>
                  <input
                    type="text"
                    value={bet.odds}
                    onChange={(e) => updateBet(bet.id, 'odds', e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                    placeholder="+150 or -110"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Amount Staked</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                    <input
                      type="number"
                      value={bet.amountStaked}
                      onChange={(e) => updateBet(bet.id, 'amountStaked', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                      bet.isBonusBet
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-neutral-600 group-hover:border-neutral-500'
                    }`}
                    onClick={() => updateBet(bet.id, 'isBonusBet', !bet.isBonusBet)}
                  >
                    {bet.isBonusBet && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-neutral-300">Bonus Bet</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                      bet.isOddsBoost
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-neutral-600 group-hover:border-neutral-500'
                    }`}
                    onClick={() => updateBet(bet.id, 'isOddsBoost', !bet.isOddsBoost)}
                  >
                    {bet.isOddsBoost && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-neutral-300">Odds Boost</span>
                </label>

                {bets.length > 1 && (
                  <button
                    onClick={() => removeBetRow(bet.id)}
                    className="ml-auto text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {index < bets.length - 1 && <hr className="border-neutral-800" />}
            </div>
          ))}

          <button
            onClick={addBetRow}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add another bet
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-neutral-800 shrink-0 safe-area-bottom">
          <button
            type="button"
            onClick={onClose}
            className="sm:hidden px-4 py-3 text-neutral-400 hover:text-white font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-neutral-200 disabled:bg-white/50 text-black font-semibold rounded-xl transition-colors"
          >
            {isSubmitting ? 'Tracking...' : 'Track'}
          </button>
        </div>
      </div>
    </div>
  );
}
