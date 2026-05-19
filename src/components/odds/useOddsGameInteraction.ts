import { useCallback, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react';
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

export type SidePickSource = 'user' | 'recommendation';

export type SidePick = {
  book: Sportsbook;
  odds: number;
  team: string;
  source: SidePickSource;
};

export type GameSidePick = {
  away: SidePick | null;
  home: SidePick | null;
};

export function emptyGameSidePick(): GameSidePick {
  return { away: null, home: null };
}

export function getOddsCellHighlightClass(
  odds: number,
  isBest: boolean,
  sidePick: SidePick | null | undefined,
  book: Sportsbook
): string {
  const isHighlighted = sidePick?.book === book;
  const classes = [
    'odds-cell',
    odds > 0 ? 'odds-positive' : 'odds-negative',
  ];

  if (isHighlighted) {
    if (sidePick.source === 'recommendation') {
      classes.push('odds-cell-best');
    } else {
      classes.push('bg-neutral-700/40', 'ring-1', 'ring-neutral-500/50');
    }
  } else if (isBest) {
    classes.push('odds-cell-best');
  }

  return classes.join(' ');
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
  pick: GameSidePick,
  onPickChange: (update: (prev: GameSidePick) => GameSidePick) => void,
  onOddsClick: (data: OddsClickPayload) => void
) {
  const marketOdds = game.odds[marketType];
  const pickRef = useRef(pick);
  pickRef.current = pick;
  const lastPointerActivationRef = useRef(0);

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

  const resolveNavigatePayload = (): OddsClickPayload | null => {
    if (!bestLines) return null;

    const currentPick = pickRef.current;
    const awaySide = currentPick.away
      ?? (bestLines.away
        ? { team: game.awayTeam, odds: bestLines.away.odds, book: bestLines.away.book }
        : null);
    const homeSide = currentPick.home
      ?? (bestLines.home
        ? { team: game.homeTeam, odds: bestLines.home.odds, book: bestLines.home.book }
        : null);

    if (!awaySide || !homeSide) return null;

    return {
      teamA: awaySide.team,
      teamB: homeSide.team,
      oddsA: awaySide.odds,
      oddsB: homeSide.odds,
      bookA: awaySide.book,
      bookB: homeSide.book,
    };
  };

  const navigateToArbitrage = useCallback(() => {
    const payload = resolveNavigatePayload();
    if (!payload) return;

    pickRef.current = emptyGameSidePick();
    onPickChange(() => emptyGameSidePick());
    onOddsClick(payload);
  }, [bestLines, game.awayTeam, game.homeTeam, onOddsClick, onPickChange]);

  const activateOddsCell = useCallback(
    (isHome: boolean, cell: OddsCellActivation) => {
      if (!bestLines) return;

      const side: SideRow = isHome ? 'home' : 'away';
      const sideKey = isHome ? 'home' : 'away';
      const currentPick = pickRef.current[sideKey];
      const isHighlighted = currentPick?.book === cell.book;
      const isBestLine = isHome
        ? bestLines.home?.book === cell.book
        : bestLines.away?.book === cell.book;

      if (isHighlighted) {
        navigateToArbitrage();
        return;
      }

      const next: GameSidePick = {
        ...pickRef.current,
        [sideKey]: {
          book: cell.book,
          odds: cell.odds,
          team: cell.team,
          source: isBestLine ? 'recommendation' : 'user',
        },
      };
      pickRef.current = next;
      onPickChange(() => next);
    },
    [bestLines, navigateToArbitrage, onPickChange]
  );

  const bindOddsCell = useCallback(
    (isHome: boolean, cell: OddsCellActivation) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (!e.isPrimary) return;
        e.stopPropagation();
      },
      onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => {
        if (!e.isPrimary) return;
        e.preventDefault();
        e.stopPropagation();
        lastPointerActivationRef.current = Date.now();
        activateOddsCell(isHome, cell);
      },
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        if (Date.now() - lastPointerActivationRef.current < 400) {
          e.preventDefault();
          return;
        }
        activateOddsCell(isHome, cell);
      },
    }),
    [activateOddsCell]
  );

  const sideRowBoxClass = () =>
    'rounded-lg p-1 md:p-1.5 transition-colors touch-manipulation';

  const handleRowClick = () => {
    if (bestPercent) {
      pickRef.current = emptyGameSidePick();
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

  return {
    marketOdds,
    bestLines,
    pick,
    bindOddsCell,
    sideRowBoxClass,
    handleRowClick,
    formatGameTime,
    getOddsCellHighlightClass,
  };
}
