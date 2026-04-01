export function americanToDecimal(american: number): number {
  if (american > 0) {
    return (american / 100) + 1;
  }
  return (100 / Math.abs(american)) + 1;
}

export function decimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

export function calculateImpliedProbability(american: number): number {
  if (american > 0) {
    return 100 / (american + 100);
  }
  return Math.abs(american) / (Math.abs(american) + 100);
}

export interface ArbitrageResult {
  betA: number;
  betB: number;
  profit: number;
  profitPercent: number;
  totalStake: number;
}

export function calculateArbitrage(
  totalStake: number,
  oddsA: number,
  oddsB: number
): ArbitrageResult {
  const decimalA = americanToDecimal(oddsA);
  const decimalB = americanToDecimal(oddsB);

  const impliedSum = (1 / decimalA) + (1 / decimalB);

  const betA = (totalStake / decimalA) / impliedSum;
  const betB = (totalStake / decimalB) / impliedSum;

  const payoutA = betA * decimalA;
  const payoutB = betB * decimalB;

  const guaranteedPayout = Math.min(payoutA, payoutB);
  const profit = guaranteedPayout - totalStake;
  const profitPercent = (profit / totalStake) * 100;

  return {
    betA: Math.round(betA * 100) / 100,
    betB: Math.round(betB * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitPercent: Math.round(profitPercent * 100) / 100,
    totalStake,
  };
}

export interface PromoConversionResult {
  hedgeBet: number;
  profit: number;
  conversionPercent: number;
}

export function calculatePromoConversion(
  freePlayAmount: number,
  freePlayOdds: number,
  hedgeOdds: number
): PromoConversionResult {
  const freePlayDecimal = americanToDecimal(freePlayOdds);
  const hedgeDecimal = americanToDecimal(hedgeOdds);

  const freePlayWinnings = freePlayAmount * (freePlayDecimal - 1);

  const hedgeBet = freePlayWinnings / hedgeDecimal;

  const hedgeWinnings = hedgeBet * hedgeDecimal;

  const profitIfFreePlayWins = freePlayWinnings - hedgeBet;
  const profitIfHedgeWins = hedgeWinnings - hedgeBet - 0;

  const guaranteedProfit = Math.min(profitIfFreePlayWins, profitIfHedgeWins);
  const conversionPercent = (guaranteedProfit / freePlayAmount) * 100;

  return {
    hedgeBet: Math.round(hedgeBet * 100) / 100,
    profit: Math.round(guaranteedProfit * 100) / 100,
    conversionPercent: Math.round(conversionPercent * 100) / 100,
  };
}

export interface RolloverProgress {
  totalRequired: number;
  remaining: number;
  percentComplete: number;
}

export function calculateRollover(
  depositAmount: number,
  bonusAmount: number,
  rolloverMultiplier: number,
  amountWagered: number
): RolloverProgress {
  const totalRequired = (depositAmount + bonusAmount) * rolloverMultiplier;
  const remaining = Math.max(0, totalRequired - amountWagered);
  const percentComplete = Math.min(100, (amountWagered / totalRequired) * 100);

  return {
    totalRequired: Math.round(totalRequired * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    percentComplete: Math.round(percentComplete * 100) / 100,
  };
}

export function formatOdds(odds: number): string {
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function calculateBestPercent(oddsA: number, oddsB: number): number {
  const decimalA = americanToDecimal(oddsA);
  const decimalB = americanToDecimal(oddsB);
  const profitPercent = (1 - (1 / decimalA + 1 / decimalB)) * 100;
  return Math.round(profitPercent * 100) / 100;
}

export type BestPercentColor = 'green' | 'light-green' | 'yellow' | 'orange' | 'red';

export function getBestPercentColor(percent: number): BestPercentColor {
  if (percent > 0) return 'green';
  if (percent >= -1) return 'light-green';
  if (percent >= -2) return 'yellow';
  if (percent >= -4) return 'orange';
  return 'red';
}
