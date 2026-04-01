import { GameOdds } from '../data/mockOdds';
import { MarketType, Sportsbook } from '../constants/sportsbooks';
import { calculateBestPercent, getBestPercentColor, BestPercentColor } from './odds';

export interface BestPercentResult {
  percent: number;
  color: BestPercentColor;
  homeOdds: number;
  awayOdds: number;
  homeBook: Sportsbook;
  awayBook: Sportsbook;
}

export function calculateGameBestPercent(
  game: GameOdds,
  marketType: MarketType,
  selectedBooks: Sportsbook[]
): BestPercentResult | null {
  const marketOdds = game.odds[marketType];
  if (!marketOdds) return null;

  let bestHome = { odds: -Infinity, book: '' as Sportsbook };
  let bestAway = { odds: -Infinity, book: '' as Sportsbook };

  selectedBooks.forEach((book) => {
    const homeOdds = marketOdds.home[book];
    const awayOdds = marketOdds.away[book];

    if (homeOdds !== undefined && homeOdds > bestHome.odds) {
      bestHome = { odds: homeOdds, book };
    }
    if (awayOdds !== undefined && awayOdds > bestAway.odds) {
      bestAway = { odds: awayOdds, book };
    }
  });

  if (bestHome.odds === -Infinity || bestAway.odds === -Infinity) {
    return null;
  }

  const percent = calculateBestPercent(bestHome.odds, bestAway.odds);
  const color = getBestPercentColor(percent);

  return {
    percent,
    color,
    homeOdds: bestHome.odds,
    awayOdds: bestAway.odds,
    homeBook: bestHome.book,
    awayBook: bestAway.book,
  };
}

export function getBestPercentColorClass(color: BestPercentColor): string {
  switch (color) {
    case 'green':
      return 'text-emerald-400 bg-emerald-500/10';
    case 'light-green':
      return 'text-lime-400 bg-lime-500/10';
    case 'yellow':
      return 'text-yellow-400 bg-yellow-500/10';
    case 'orange':
      return 'text-orange-400 bg-orange-500/10';
    case 'red':
      return 'text-red-400 bg-red-500/10';
  }
}
