import { Sport, MarketType, Sportsbook } from '../constants/sportsbooks';

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

function randomOdds(base: number, variance: number): number {
  const adjustment = Math.floor(Math.random() * variance * 2) - variance;
  const result = base + adjustment;
  if (result >= -100 && result <= 100) {
    return result > 0 ? 101 : -101;
  }
  return result;
}

function generateSpreadOdds(): { favorite: number; underdog: number } {
  const juice = Math.random() > 0.5 ? 5 : 0;
  return {
    favorite: -110 - juice,
    underdog: -110 + juice,
  };
}

function generateTotalsOdds(): { over: number; under: number } {
  const juice = Math.random() > 0.5 ? 5 : 0;
  return {
    over: -110 - juice,
    under: -110 + juice,
  };
}

const SPORTSBOOKS_FOR_ODDS: Sportsbook[] = [
  'Bookmaker',
  'Bovada',
  'BetOnline',
  'FanDuel',
  'DraftKings',
  'BetMGM',
];

function generateOddsForBooks(base: number, variance: number = 15): Record<Sportsbook, number> {
  const result: Partial<Record<Sportsbook, number>> = {};
  SPORTSBOOKS_FOR_ODDS.forEach((book) => {
    result[book] = randomOdds(base, variance);
  });
  return result as Record<Sportsbook, number>;
}

export const MOCK_GAMES: GameOdds[] = [
  {
    id: '1',
    sport: 'Football',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    gameTime: new Date(Date.now() + 86400000 * 2),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(-145),
        away: generateOddsForBooks(125),
      },
      'Point Spread': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        spread: -3.5,
      },
      'Totals': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        total: 51.5,
      },
    },
  },
  {
    id: '2',
    sport: 'Football',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Dallas Cowboys',
    gameTime: new Date(Date.now() + 86400000 * 3),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(-180),
        away: generateOddsForBooks(155),
      },
      'Point Spread': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        spread: -4.5,
      },
    },
  },
  {
    id: '3',
    sport: 'Basketball',
    homeTeam: 'Boston Celtics',
    awayTeam: 'Milwaukee Bucks',
    gameTime: new Date(Date.now() + 86400000),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(-135),
        away: generateOddsForBooks(115),
      },
      'Point Spread': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        spread: -2.5,
      },
      'Totals': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        total: 228.5,
      },
    },
  },
  {
    id: '4',
    sport: 'Basketball',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Golden State Warriors',
    gameTime: new Date(Date.now() + 86400000 * 2),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(105),
        away: generateOddsForBooks(-125),
      },
      'Point Spread': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        spread: 2.5,
      },
    },
  },
  {
    id: '5',
    sport: 'Baseball',
    homeTeam: 'New York Yankees',
    awayTeam: 'Los Angeles Dodgers',
    gameTime: new Date(Date.now() + 86400000 * 4),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(-130),
        away: generateOddsForBooks(110),
      },
      'Totals': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        total: 8.5,
      },
    },
  },
  {
    id: '6',
    sport: 'Hockey',
    homeTeam: 'Edmonton Oilers',
    awayTeam: 'Florida Panthers',
    gameTime: new Date(Date.now() + 86400000),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(-115),
        away: generateOddsForBooks(-105),
      },
      'Totals': {
        home: generateOddsForBooks(-110, 5),
        away: generateOddsForBooks(-110, 5),
        total: 6.5,
      },
    },
  },
  {
    id: '7',
    sport: 'Soccer',
    homeTeam: 'Manchester City',
    awayTeam: 'Arsenal',
    gameTime: new Date(Date.now() + 86400000 * 5),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(-125),
        away: generateOddsForBooks(350),
      },
    },
  },
  {
    id: '8',
    sport: 'Tennis',
    homeTeam: 'Novak Djokovic',
    awayTeam: 'Carlos Alcaraz',
    gameTime: new Date(Date.now() + 86400000 * 3),
    odds: {
      'Money Line': {
        home: generateOddsForBooks(130),
        away: generateOddsForBooks(-150),
      },
    },
  },
];
