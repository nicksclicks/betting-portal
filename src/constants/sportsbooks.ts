/** Offshore books — manual tracking; live odds where noted in ODDS_API_BOOKMAKER_MAP. */
export const OFFSHORE_SPORTSBOOKS = [
  'Bet105',
  'BetAnything',
  'Betmania',
  'BetNow',
  'BetOnline',
  'Betphoenix',
  'BetUS',
  'Betwhale',
  'Bookmaker',
  'Bovada',
  'BTL',
  'BUSR',
  'Everygame',
  'Heritage',
  'JustBet',
  'KBC Sportsbook',
  'LuckRebel',
  'MyBookie',
  'PureWage',
  'Skybook',
  'Sportsbetting',
  'Thunderpick',
  'Wager Attack',
  'XBet',
  'YouWager',
] as const;

/** US regulated, social, and exchange books. */
export const US_SPORTSBOOKS = [
  'BetMGM',
  'BetRivers',
  'Caesars',
  'DraftKings',
  'ESPN BET',
  'FanDuel',
  'Fliff',
  'Novig',
  'ProphetX',
  'Rebet',
] as const;

export const ALL_SPORTSBOOKS = [...OFFSHORE_SPORTSBOOKS, ...US_SPORTSBOOKS] as const;

export type Sportsbook = (typeof ALL_SPORTSBOOKS)[number];

/**
 * Odds API bookmaker keys → display names. Keep in sync with supabase/functions/fetch-odds.
 * Books not listed here are tracked manually (deposits/bets) without live odds sync.
 */
export const ODDS_API_BOOKMAKER_MAP: Record<string, Sportsbook> = {
  betonlineag: 'BetOnline',
  bovada: 'Bovada',
  mybookieag: 'MyBookie',
  betus: 'BetUS',
  everygame: 'Everygame',
  betanysports: 'BetAnything',
  fanduel: 'FanDuel',
  draftkings: 'DraftKings',
  betmgm: 'BetMGM',
  caesars: 'Caesars',
  betrivers: 'BetRivers',
  williamhill_us: 'Caesars',
  barstool: 'ESPN BET',
  espnbet: 'ESPN BET',
  fliff: 'Fliff',
  rebet: 'Rebet',
  novig: 'Novig',
  prophetx: 'ProphetX',
};

export const API_SPORTSBOOKS = [
  ...new Set(Object.values(ODDS_API_BOOKMAKER_MAP)),
] as Sportsbook[];

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
