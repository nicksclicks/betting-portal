import { CheckCircle, Trash2, XCircle } from 'lucide-react';
import { Bet } from '../../types/database';
import { formatCurrency } from '../../utils/odds';

interface BetMobileCardProps {
  bet: Bet;
  isGrouped: boolean;
  isFirstInGroup: boolean;
  formatOdds: (odds: number) => string;
  formatDate: (dateStr: string) => string;
  getStatusClass: (status: Bet['status']) => string;
  onMarkWon: (id: string) => void;
  onMarkLost: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BetMobileCard({
  bet,
  isGrouped,
  isFirstInGroup,
  formatOdds,
  formatDate,
  getStatusClass,
  onMarkWon,
  onMarkLost,
  onDelete,
}: BetMobileCardProps) {
  const groupAccent =
    isGrouped && isFirstInGroup
      ? 'border-l-4 border-l-cyan-500'
      : isGrouped && !isFirstInGroup
        ? 'border-l-4 border-l-cyan-500/40'
        : '';

  return (
    <article className={`pl-4 pr-4 py-4 bg-neutral-950 border-b border-neutral-800 last:border-b-0 ${groupAccent}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-white leading-snug">{bet.bet_name}</h3>
            {bet.is_bonus_bet && (
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded shrink-0">
                Bonus
              </span>
            )}
            {bet.is_odds_boost && (
              <span className="px-1.5 py-0.5 text-[10px] bg-lime-500/20 text-lime-400 rounded shrink-0">
                Boost
              </span>
            )}
          </div>
          {isGrouped && isFirstInGroup && (
            <p className="text-[10px] text-cyan-400 mt-1">Grouped bet</p>
          )}
        </div>
        <span className={`shrink-0 text-[10px] capitalize ${getStatusClass(bet.status)}`}>{bet.status}</span>
      </div>

      <p className="text-xs text-neutral-400 mb-3">{bet.sportsbook}</p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-4">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Odds</dt>
          <dd className="font-mono text-white">{formatOdds(bet.odds)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Staked</dt>
          <dd className="font-mono text-white">{formatCurrency(bet.amount_staked)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Date</dt>
          <dd className="text-neutral-400 text-xs">{formatDate(bet.created_at)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-end gap-1">
        {bet.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => onMarkWon(bet.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-lime-400 hover:bg-lime-500/10 rounded-lg transition-colors"
              title="Mark as won"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onMarkLost(bet.id)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Mark as lost"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete(bet.id)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </article>
  );
}
