import { Bet } from '../types/database';
import { americanToDecimal } from './odds';

/**
 * Net realized profit for a single settled bet, in dollars.
 *
 * - won (regular): +stake * (decimal - 1)   (winnings; stake is returned, so net = winnings)
 * - won (bonus):   +stake * (decimal - 1)   (free bet pays winnings only — same net)
 * - lost (regular): -stake                  (stake is lost)
 * - lost (bonus):    0                       (no real money at risk)
 * - pending / void:  0                       (not yet realized)
 */
export function betProfit(bet: Bet): number {
  switch (bet.status) {
    case 'won':
      return bet.amount_staked * (americanToDecimal(bet.odds) - 1);
    case 'lost':
      return bet.is_bonus_bet ? 0 : -bet.amount_staked;
    default:
      return 0;
  }
}

/**
 * The date a bet's profit is attributed to on the calendar — the bet's own date
 * (`created_at`), which the Add modal lets you set so retroactive bets land on the
 * correct day regardless of when they're later graded won/lost.
 */
export function betProfitDate(bet: Bet): Date {
  return new Date(bet.created_at);
}

/** Local-time day key, e.g. "2026-06-09". Used to bucket bets per calendar day. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
