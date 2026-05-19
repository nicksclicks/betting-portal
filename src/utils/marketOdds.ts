import { GameOdds } from '../data/mockOdds';
import { MarketType, Sportsbook } from '../constants/sportsbooks';

export function bookHasCompleteMarketLine(
  game: GameOdds,
  marketType: MarketType,
  book: Sportsbook
): boolean {
  const market = game.odds[marketType];
  if (!market) return false;
  return market.home[book] !== undefined && market.away[book] !== undefined;
}

export function gameHasSelectedMarketLines(
  game: GameOdds,
  marketType: MarketType,
  selectedBooks: Sportsbook[]
): boolean {
  return selectedBooks.some((book) => bookHasCompleteMarketLine(game, marketType, book));
}
