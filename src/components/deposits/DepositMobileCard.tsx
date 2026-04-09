import { Deposit } from '../../types/database';
import { DepositStatus } from '../../constants/sportsbooks';
import { formatCurrency } from '../../utils/odds';

interface DepositMobileCardProps {
  deposit: Deposit;
  formatDate: (dateStr: string) => string;
  getStatusClass: (status: DepositStatus) => string;
  onEdit: (deposit: Deposit) => void;
  onDelete: (id: string) => void;
}

export function DepositMobileCard({
  deposit,
  formatDate,
  getStatusClass,
  onEdit,
  onDelete,
}: DepositMobileCardProps) {
  return (
    <article className="p-4 bg-neutral-950 border-b border-neutral-800 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">{deposit.sportsbook}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{formatDate(deposit.deposit_date)}</p>
        </div>
        <span className={`shrink-0 text-[10px] capitalize ${getStatusClass(deposit.status)}`}>
          {deposit.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-3">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Deposit</dt>
          <dd className="font-mono text-white">{formatCurrency(deposit.deposit_amount)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Bonus</dt>
          <dd className="font-mono text-lime-400">
            {deposit.bonus_received > 0 ? formatCurrency(deposit.bonus_received) : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Rollover</dt>
          <dd className="text-neutral-300">{deposit.rollover_multiplier}x</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-neutral-500">Balance</dt>
          <dd className="font-mono text-blue-400">{formatCurrency(deposit.current_balance)}</dd>
        </div>
      </dl>

      {deposit.notes && (
        <p className="text-xs text-neutral-500 mb-3 line-clamp-3">{deposit.notes}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(deposit)}
          className="min-h-[44px] flex-1 px-3 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 rounded-lg transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(deposit.id)}
          className="min-h-[44px] flex-1 px-3 text-sm text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-500/40 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
