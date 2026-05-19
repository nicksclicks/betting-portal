import { useMemo } from 'react';
import { GameOdds } from '../../data/mockOdds';
import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { BestPercentResult } from '../../utils/bestPercent';

export type OddsClickPayload = {
  teamA: string;
  teamB: string;
  oddsA: number;
  oddsB: number;
  bookA: Sportsbook;
  bookB: Sportsbook;
};

export type SidePick = {
  book: Sportsbook;
  odds: number;
  team: string;
};

export type GameSidePick = {
  away: SidePick | null;
  home: SidePick | null;
  armedRow: 'away' | 'home' | null;
};

export function emptyGameSidePick(): GameSidePick {
  return { away: null, home: null, armedRow: null };
}

type SideRow = 'away' | 'home';

export function getMarketSpreadLabel(
  marketType: MarketType,
  marketOdds: NonNullable<GameOdds['odds'][MarketType]>
): string | null {
  if (marketType === 'Point Spread' && marketOdds.spread !== undefined) {
    return `(${marketOdds.spread > 0 ? '+' : ''}${marketOdds.spread})`;
  }
  if (marketType === 'Totals' && marketOdds.total !== undefined) {
    return `(O/U ${marketOdds.total})`;
  }
  return null;
}

export function useOddsGameInteraction(
  game: GameOdds,
  marketType: MarketType,
  selectedBooks: Sportsbook[],
  bestPercent: BestPercentResult | null,
  pick: GameSidePick,
  onPickChange: (update: (prev: GameSidePick) => GameSidePick) => void,
  onOddsClick: (data: OddsClickPayload) => void
) {
  const marketOdds = game.odds[marketType];

  const bestLines = useMemo(() => {
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

    return {
      home: bestHome.odds !== -Infinity ? bestHome : null,
      away: bestAway.odds !== -Infinity ? bestAway : null,
    };
  }, [marketOdds, selectedBooks]);

  type NavigateTrigger = {
    isHome: boolean;
    team: string;
    odds: number;
    book: Sportsbook;
  };

  const resolveNavigatePayload = (trigger?: NavigateTrigger): OddsClickPayload | null => {
    if (!bestLines) return null;

    const { away: awayPick, home: homePick } = pick;

    if (awayPick && homePick) {
      return {
        teamA: awayPick.team,
        teamB: homePick.team,
        oddsA: awayPick.odds,
        oddsB: homePick.odds,
        bookA: awayPick.book,
        bookB: homePick.book,
      };
    }

    const awayFromBest = bestLines.away
      ? { team: game.awayTeam, odds: bestLines.away.odds, book: bestLines.away.book }
      : null;
    const homeFromBest = bestLines.home
      ? { team: game.homeTeam, odds: bestLines.home.odds, book: bestLines.home.book }
      : null;

    if (trigger) {
      if (trigger.isHome) {
        const homeSide = homePick ?? {
          team: trigger.team,
          odds: trigger.odds,
          book: trigger.book,
        };
        const awaySide = awayPick ?? awayFromBest;
        if (!awaySide) return null;
        return {
          teamA: awaySide.team,
          teamB: homeSide.team,
          oddsA: awaySide.odds,
          oddsB: homeSide.odds,
          bookA: awaySide.book,
          bookB: homeSide.book,
        };
      }

      const awaySide = awayPick ?? {
        team: trigger.team,
        odds: trigger.odds,
        book: trigger.book,
      };
      const homeSide = homePick ?? homeFromBest;
      if (!homeSide) return null;
      return {
        teamA: awaySide.team,
        teamB: homeSide.team,
        oddsA: awaySide.odds,
        oddsB: homeSide.odds,
        bookA: awaySide.book,
        bookB: homeSide.book,
      };
    }

    return null;
  };

  const navigateToArbitrage = (trigger?: NavigateTrigger) => {
    const payload = resolveNavigatePayload(trigger);
    if (!payload) return;

    onPickChange(() => emptyGameSidePick());
    onOddsClick(payload);
  };

  const navigateFromSide = (isHome: boolean) => {
    if (!bestLines) return;

    if (pick.away && pick.home) {
      navigateToArbitrage();
      return;
    }

    const sidePick = isHome ? pick.home : pick.away;
    if (sidePick) {
      navigateToArbitrage({
        isHome,
        team: sidePick.team,
        odds: sidePick.odds,
        book: sidePick.book,
      });
      return;
    }

    const best = isHome ? bestLines.home : bestLines.away;
    if (best) {
      navigateToArbitrage({
        isHome,
        team: isHome ? game.homeTeam : game.awayTeam,
        odds: best.odds,
        book: best.book,
      });
    }
  };

  const handleSideInteraction = (
    isHome: boolean,
    cell?: { team: string; odds: number; book: Sportsbook }
  ) => {
    if (!bestLines) return;

    const side: SideRow = isHome ? 'home' : 'away';
    const sideKey = isHome ? 'home' : 'away';

    if (cell) {
      const isBestLine = isHome
        ? bestLines.home?.book === cell.book
        : bestLines.away?.book === cell.book;

      if (isBestLine) {
        navigateToArbitrage({ isHome, team: cell.team, odds: cell.odds, book: cell.book });
        return;
      }

      if (pick.armedRow === side) {
        const currentPick = pick[sideKey];
        const isSameCell = currentPick?.book === cell.book;

        if (isSameCell) {
          navigateToArbitrage({ isHome, team: cell.team, odds: cell.odds, book: cell.book });
          return;
        }

        onPickChange((prev) => ({
          ...prev,
          [sideKey]: { book: cell.book, odds: cell.odds, team: cell.team },
        }));
        return;
      }

      onPickChange((prev) => ({
        ...prev,
        [sideKey]: { book: cell.book, odds: cell.odds, team: cell.team },
        armedRow: side,
      }));
      return;
    }

    if (pick.armedRow === side) {
      navigateFromSide(isHome);
      return;
    }

    onPickChange((prev) => ({ ...prev, armedRow: side }));
  };

  const sideRowBoxClass = () =>
    'rounded-lg p-1 md:p-1.5 transition-colors touch-manipulation cursor-pointer';

  const handleRowClick = () => {
    if (bestPercent) {
      onPickChange(() => emptyGameSidePick());
      onOddsClick({
        teamA: game.awayTeam,
        teamB: game.homeTeam,
        oddsA: bestPercent.awayOdds,
        oddsB: bestPercent.homeOdds,
        bookA: bestPercent.awayBook,
        bookB: bestPercent.homeBook,
      });
    }
  };

  const formatGameTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  const selectedAwayBook = pick.away?.book ?? null;
  const selectedHomeBook = pick.home?.book ?? null;

  return {
    marketOdds,
    bestLines,
    selectedAwayBook,
    selectedHomeBook,
    handleSideInteraction,
    sideRowBoxClass,
    handleRowClick,
    formatGameTime,
  };
}
