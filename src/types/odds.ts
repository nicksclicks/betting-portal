import { Sport, MarketType, Sportsbook } from '../constants/sportsbooks';

/** Normalized odds for a single game, keyed by market then by side then by book. */
export interface GameOdds {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  gameTime: Date;
  odds: {
    [key in MarketType]?: {
      home: { [key in Sportsbook]?: number };
      away: { [key in Sportsbook]?: number };
      spread?: number;
      total?: number;
    };
  };
}
