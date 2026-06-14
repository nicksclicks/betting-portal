import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { GameOdds } from '../../types/odds';
import { formatOdds } from '../../utils/odds';
import { BestPercentResult } from '../../utils/bestPercent';
import {
  GameSidePick,
  getOddsCellHighlightClass,
  OddsClickPayload,
  useOddsGameInteraction,
} from './useOddsGameInteraction';

interface MarketBookGridProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: OddsClickPayload) => void;
  pick: GameSidePick;
  onPickChange: (update: (prev: GameSidePick) => GameSidePick) => void;
  /** 'compact' for the mobile drawer, 'wide' for the desktop drill-in. */
  layout?: 'compact' | 'wide';
}

/**
 * Per-book odds grid for one game + market. Shared by the desktop
 * all-markets drill-in row and the mobile market drawer.
 */
export function MarketBookGrid({
  game,
  marketType,
  selectedBooks,
  bestPercent,
  onOddsClick,
  pick,
  onPickChange,
  layout = 'compact',
}: MarketBookGridProps) {
  const {
    marketOdds,
    bestLines,
    pick: gamePick,
    bindOddsCell,
  } = useOddsGameInteraction(game, marketType, selectedBooks, bestPercent, pick, onPickChange, onOddsClick);

  if (!marketOdds) {
    return <p className="text-sm text-neutral-500">No lines available for this market.</p>;
  }

  const booksWithLines = selectedBooks.filter(
    (book) => marketOdds.home[book] !== undefined || marketOdds.away[book] !== undefined
  );

  if (booksWithLines.length === 0) {
    return <p className="text-sm text-neutral-500">No lines from your selected books for this market.</p>;
  }

  const gridClass =
    layout === 'wide'
      ? 'grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6'
      : 'grid grid-cols-2 gap-2 sm:grid-cols-3';

  const renderSide = (isHome: boolean) => {
    const team = isHome ? game.homeTeam : game.awayTeam;
    const sideLabel = isHome ? 'H' : 'A';
    const sidePick = isHome ? gamePick.home : gamePick.away;
    const bestLine = isHome ? bestLines?.home : bestLines?.away;

    return (
      <div className="rounded-lg p-1 md:p-1.5">
        <p className="text-sm text-white font-medium mb-2">
          <span className="text-neutral-500 text-xs mr-1.5">{sideLabel}</span>
          {team}
        </p>
        <div className={gridClass}>
          {booksWithLines.map((book) => {
            const odds = isHome ? marketOdds.home[book] : marketOdds.away[book];
            const isBest = bestLine?.book === book;

            return (
              <div key={book} className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] text-neutral-500 truncate" title={book}>
                  {book}
                </span>
                {odds !== undefined ? (
                  <button
                    type="button"
                    {...bindOddsCell(isHome, { team, odds, book })}
                    className={`min-h-[44px] text-sm font-mono font-medium ${getOddsCellHighlightClass(odds, isBest, sidePick, book)}`}
                  >
                    {formatOdds(odds)}
                  </button>
                ) : (
                  <span className="min-h-[44px] flex items-center justify-center rounded-lg bg-neutral-900/40 text-neutral-600 text-sm">
                    —
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {bestLine && (
          <p className="mt-2 text-xs text-neutral-500">
            Best{' '}
            <span className="font-mono text-lime-400 font-medium">{formatOdds(bestLine.odds)}</span>{' '}
            <span className="text-neutral-600">({bestLine.book})</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={layout === 'wide' ? 'grid gap-4 lg:grid-cols-2' : 'space-y-3'}>
      {renderSide(false)}
      {renderSide(true)}
    </div>
  );
}
