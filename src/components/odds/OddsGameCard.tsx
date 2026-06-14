import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { GameOdds } from '../../types/odds';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  GameSidePick,
  getMarketSpreadLabel,
  getOddsCellHighlightClass,
  OddsClickPayload,
  useOddsGameInteraction,
} from './useOddsGameInteraction';

interface OddsGameCardProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: OddsClickPayload) => void;
  pick: GameSidePick;
  onPickChange: (update: (prev: GameSidePick) => GameSidePick) => void;
}

export function OddsGameCard({
  game,
  marketType,
  selectedBooks,
  bestPercent,
  onOddsClick,
  pick,
  onPickChange,
}: OddsGameCardProps) {
  const {
    marketOdds,
    bestLines,
    pick: gamePick,
    bindOddsCell,
    handleRowClick,
    formatGameTime,
  } = useOddsGameInteraction(game, marketType, selectedBooks, bestPercent, pick, onPickChange, onOddsClick);

  if (!marketOdds) return null;

  const spreadLabel = getMarketSpreadLabel(marketType, marketOdds);

  const renderSideRow = (isHome: boolean) => {
    const team = isHome ? game.homeTeam : game.awayTeam;
    const sideLabel = isHome ? 'H' : 'A';
    const sidePick = isHome ? gamePick.home : gamePick.away;

    return (
      <div className="rounded-lg p-1 md:p-1.5">
        <p className="text-sm text-white font-medium mb-2">
          <span className="text-neutral-500 text-xs mr-1.5">{sideLabel}</span>
          {team}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {selectedBooks.map((book) => {
            const odds = isHome ? marketOdds.home[book] : marketOdds.away[book];
            const isBest = isHome ? bestLines?.home?.book === book : bestLines?.away?.book === book;

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
        {(isHome ? bestLines?.home : bestLines?.away) && (
          <p className="mt-2 text-xs text-neutral-500">
            Best{' '}
            <span className="font-mono text-lime-400 font-medium">
              {formatOdds((isHome ? bestLines!.home! : bestLines!.away!).odds)}
            </span>
          </p>
        )}
      </div>
    );
  };

  return (
    <article className="p-4 bg-neutral-950 border-b border-neutral-800 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-1">
            <span className="text-neutral-400 font-medium">{game.sport}</span>
            {spreadLabel && <span className="text-neutral-600">{spreadLabel}</span>}
          </div>
        </div>
        {bestPercent && (
          <button
            type="button"
            onClick={handleRowClick}
            className={`shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg font-mono text-sm font-semibold transition-colors touch-manipulation hover:opacity-90 active:opacity-75 ${getBestPercentColorClass(bestPercent.color)}`}
          >
            {formatPercent(bestPercent.percent)}
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-500 mb-3">{formatGameTime(game.gameTime)}</p>

      <div className="space-y-3">
        {renderSideRow(false)}
        {renderSideRow(true)}
      </div>
    </article>
  );
}
