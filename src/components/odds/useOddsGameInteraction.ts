import { useMemo, useState } from 'react';
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

interface SelectedCell {
  book: Sportsbook;
  isHome: boolean;
}

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
  onOddsClick: (data: OddsClickPayload) => void
) {
  const marketOdds = game.odds[marketType];
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

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

  const handleOddsClick = (
    team: string,
    odds: number,
    book: Sportsbook,
    isHome: boolean
  ) => {
    if (!bestLines) return;

    const isBestLine = isHome
      ? bestLines.home?.book === book
      : bestLines.away?.book === book;

    const isCurrentlySelected =
      selectedCell?.book === book && selectedCell?.isHome === isHome;

    if (isBestLine || isCurrentlySelected) {
      const oppositeOdds = isHome ? bestLines.away?.odds : bestLines.home?.odds;
      const oppositeBook = isHome ? bestLines.away?.book : bestLines.home?.book;

      if (oppositeOdds !== undefined && oppositeBook) {
        setSelectedCell(null);
        onOddsClick({
          teamA: team,
          teamB: isHome ? game.awayTeam : game.homeTeam,
          oddsA: odds,
          oddsB: oppositeOdds,
          bookA: book,
          bookB: oppositeBook,
        });
      }
    } else {
      setSelectedCell({ book, isHome });
    }
  };

  const handleRowClick = () => {
    if (bestPercent) {
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

  return {
    marketOdds,
    bestLines,
    selectedCell,
    handleOddsClick,
    handleRowClick,
    formatGameTime,
  };
}
