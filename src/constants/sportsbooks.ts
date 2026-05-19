/** Offshore-style books available from The Odds API (us region). */
export const OFFSHORE_SPORTSBOOKS = ['Bovada', 'BetOnline', 'MyBookie'] as const;

/** US books from The Odds API (us, us2, and us_ex regions). */
export const US_SPORTSBOOKS = [
  'NoVig',
  'Fliff',
  'FanDuel',
  'DraftKings',
  'BetMGM',
  'Caesars',
  'BetRivers',
  'ESPN BET',
  'Rebet',
] as const;

export const ALL_SPORTSBOOKS = [...OFFSHORE_SPORTSBOOKS, ...US_SPORTSBOOKS] as const;

export type Sportsbook = (typeof ALL_SPORTSBOOKS)[number];

export const SPORTS = [
  'Football',
  'Basketball',
  'Baseball',
  'Hockey',
  'Soccer',
  'Tennis',
] as const;

export type Sport = (typeof SPORTS)[number];

export const MARKET_TYPES = [
  'Money Line',
  'Point Spread',
  'Totals',
  'First Half',
] as const;

export type MarketType = (typeof MARKET_TYPES)[number];

export const DEPOSIT_STATUSES = ['active', 'completed', 'withdrawn'] as const;

export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];
