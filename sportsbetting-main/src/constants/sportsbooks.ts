export const OFFSHORE_SPORTSBOOKS = [
  'Bookmaker',
  'Bovada',
  'BetOnline',
  'Jazz Sports',
  'BetDSI',
  'BetNow',
  'MyBookie',
  'BetWhale',
  'EveryGame',
  'Rebet',
] as const;

export const US_SPORTSBOOKS = [
  'NoVig',
  'Fliff',
  'FanDuel',
  'DraftKings',
  'BetMGM',
  'Caesars',
  'BetRivers',
  'bet365',
  'ESPN BET',
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
