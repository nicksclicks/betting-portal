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

/** Six books used in mock grids — fixed American odds per side. */
type MockBook = 'Bookmaker' | 'Bovada' | 'BetOnline' | 'FanDuel' | 'DraftKings' | 'BetMGM';

function bk(o: Record<MockBook, number>): Record<Sportsbook, number> {
  return o as Record<Sportsbook, number>;
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
        home: bk({
          Bookmaker: -142,
          Bovada: -145,
          BetOnline: -143,
          FanDuel: -148,
          DraftKings: -146,
          BetMGM: -145,
        }),
        away: bk({
          Bookmaker: 122,
          Bovada: 125,
          BetOnline: 123,
          FanDuel: 128,
          DraftKings: 126,
          BetMGM: 125,
        }),
      },
      'Point Spread': {
        home: bk({
          Bookmaker: -112,
          Bovada: -110,
          BetOnline: -111,
          FanDuel: -115,
          DraftKings: -110,
          BetMGM: -110,
        }),
        away: bk({
          Bookmaker: -108,
          Bovada: -110,
          BetOnline: -109,
          FanDuel: -105,
          DraftKings: -110,
          BetMGM: -110,
        }),
        spread: -3.5,
      },
      Totals: {
        home: bk({
          Bookmaker: -115,
          Bovada: -110,
          BetOnline: -112,
          FanDuel: -118,
          DraftKings: -110,
          BetMGM: -111,
        }),
        away: bk({
          Bookmaker: -105,
          Bovada: -110,
          BetOnline: -108,
          FanDuel: -104,
          DraftKings: -110,
          BetMGM: -109,
        }),
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
        home: bk({
          Bookmaker: -175,
          Bovada: -180,
          BetOnline: -178,
          FanDuel: -185,
          DraftKings: -182,
          BetMGM: -180,
        }),
        away: bk({
          Bookmaker: 148,
          Bovada: 155,
          BetOnline: 152,
          FanDuel: 158,
          DraftKings: 156,
          BetMGM: 155,
        }),
      },
      'Point Spread': {
        home: bk({
          Bookmaker: -113,
          Bovada: -110,
          BetOnline: -111,
          FanDuel: -114,
          DraftKings: -110,
          BetMGM: -110,
        }),
        away: bk({
          Bookmaker: -107,
          Bovada: -110,
          BetOnline: -109,
          FanDuel: -106,
          DraftKings: -110,
          BetMGM: -110,
        }),
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
        home: bk({
          Bookmaker: -132,
          Bovada: -135,
          BetOnline: -133,
          FanDuel: -138,
          DraftKings: -136,
          BetMGM: -135,
        }),
        away: bk({
          Bookmaker: 112,
          Bovada: 115,
          BetOnline: 113,
          FanDuel: 118,
          DraftKings: 116,
          BetMGM: 115,
        }),
      },
      'Point Spread': {
        home: bk({
          Bookmaker: -111,
          Bovada: -110,
          BetOnline: -110,
          FanDuel: -112,
          DraftKings: -108,
          BetMGM: -110,
        }),
        away: bk({
          Bookmaker: -109,
          Bovada: -110,
          BetOnline: -110,
          FanDuel: -108,
          DraftKings: -112,
          BetMGM: -110,
        }),
        spread: -2.5,
      },
      Totals: {
        home: bk({
          Bookmaker: -112,
          Bovada: -110,
          BetOnline: -111,
          FanDuel: -115,
          DraftKings: -109,
          BetMGM: -110,
        }),
        away: bk({
          Bookmaker: -108,
          Bovada: -110,
          BetOnline: -109,
          FanDuel: -105,
          DraftKings: -111,
          BetMGM: -110,
        }),
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
        home: bk({
          Bookmaker: 108,
          Bovada: 105,
          BetOnline: 106,
          FanDuel: 102,
          DraftKings: 104,
          BetMGM: 105,
        }),
        away: bk({
          Bookmaker: -128,
          Bovada: -125,
          BetOnline: -126,
          FanDuel: -122,
          DraftKings: -124,
          BetMGM: -125,
        }),
      },
      'Point Spread': {
        home: bk({
          Bookmaker: -110,
          Bovada: -110,
          BetOnline: -109,
          FanDuel: -112,
          DraftKings: -108,
          BetMGM: -110,
        }),
        away: bk({
          Bookmaker: -110,
          Bovada: -110,
          BetOnline: -111,
          FanDuel: -108,
          DraftKings: -112,
          BetMGM: -110,
        }),
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
        home: bk({
          Bookmaker: -128,
          Bovada: -130,
          BetOnline: -129,
          FanDuel: -134,
          DraftKings: -131,
          BetMGM: -130,
        }),
        away: bk({
          Bookmaker: 108,
          Bovada: 110,
          BetOnline: 109,
          FanDuel: 114,
          DraftKings: 111,
          BetMGM: 110,
        }),
      },
      Totals: {
        home: bk({
          Bookmaker: -114,
          Bovada: -110,
          BetOnline: -112,
          FanDuel: -116,
          DraftKings: -110,
          BetMGM: -111,
        }),
        away: bk({
          Bookmaker: -106,
          Bovada: -110,
          BetOnline: -108,
          FanDuel: -104,
          DraftKings: -110,
          BetMGM: -109,
        }),
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
        home: bk({
          Bookmaker: -112,
          Bovada: -115,
          BetOnline: -114,
          FanDuel: -118,
          DraftKings: -116,
          BetMGM: -115,
        }),
        away: bk({
          Bookmaker: -102,
          Bovada: -105,
          BetOnline: -104,
          FanDuel: -100,
          DraftKings: -102,
          BetMGM: -105,
        }),
      },
      Totals: {
        home: bk({
          Bookmaker: -113,
          Bovada: -110,
          BetOnline: -111,
          FanDuel: -114,
          DraftKings: -109,
          BetMGM: -110,
        }),
        away: bk({
          Bookmaker: -107,
          Bovada: -110,
          BetOnline: -109,
          FanDuel: -106,
          DraftKings: -111,
          BetMGM: -110,
        }),
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
        home: bk({
          Bookmaker: -122,
          Bovada: -125,
          BetOnline: -124,
          FanDuel: -128,
          DraftKings: -126,
          BetMGM: -125,
        }),
        away: bk({
          Bookmaker: 340,
          Bovada: 350,
          BetOnline: 345,
          FanDuel: 360,
          DraftKings: 355,
          BetMGM: 350,
        }),
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
        home: bk({
          Bookmaker: 128,
          Bovada: 130,
          BetOnline: 129,
          FanDuel: 125,
          DraftKings: 127,
          BetMGM: 130,
        }),
        away: bk({
          Bookmaker: -152,
          Bovada: -150,
          BetOnline: -151,
          FanDuel: -148,
          DraftKings: -150,
          BetMGM: -150,
        }),
      },
    },
  },
];

/** Same shape as the fetch-odds edge function JSON (for local mock mode). */
export interface MockOddsApiGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  odds: Record<
    string,
    Record<string, { home: number | null; away: number | null; spread?: number; total?: number }>
  >;
}

/**
 * Edge function uses per-book objects: odds["Money Line"]["Bovada"] = { home, away }.
 * MOCK_GAMES uses UI shape: odds["Money Line"].home["Bovada"]. Convert here so
 * OddsBoard's transformApiGames matches the real API.
 */
function gameOddsToApiShape(game: GameOdds): MockOddsApiGame['odds'] {
  const out: MockOddsApiGame['odds'] = {};

  for (const [marketKey, marketData] of Object.entries(game.odds)) {
    if (!marketData) continue;
    const { home: homeByBook, away: awayByBook, spread, total } = marketData;
    const bookNames = new Set([
      ...Object.keys(homeByBook ?? {}),
      ...Object.keys(awayByBook ?? {}),
    ]);

    const byBook: Record<
      string,
      { home: number | null; away: number | null; spread?: number; total?: number }
    > = {};
    for (const book of bookNames) {
      const h = homeByBook?.[book as Sportsbook];
      const a = awayByBook?.[book as Sportsbook];
      byBook[book] = {
        home: h !== undefined ? h : null,
        away: a !== undefined ? a : null,
        ...(spread !== undefined ? { spread } : {}),
        ...(total !== undefined ? { total } : {}),
      };
    }
    out[marketKey] = byBook;
  }

  return out;
}

export function getMockOddsApiPayload(): { games: MockOddsApiGame[]; updated: string } {
  return {
    games: MOCK_GAMES.map((g) => ({
      id: g.id,
      sport: g.sport,
      homeTeam: g.homeTeam,
      awayTeam: g.awayTeam,
      gameTime: g.gameTime.toISOString(),
      odds: gameOddsToApiShape(g),
    })),
    updated: new Date().toISOString(),
  };
}
