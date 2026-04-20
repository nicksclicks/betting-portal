import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { GameOdds } from '../../data/mockOdds';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  getMarketSpreadLabel,
  OddsClickPayload,
  useOddsGameInteraction,
} from './useOddsGameInteraction';

interface OddsGameCardProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: OddsClickPayload) => void;
}

export function OddsGameCard({
  game,
  marketType,
  selectedBooks,
  bestPercent,
  onOddsClick,
}: OddsGameCardProps) {
  const {
    marketOdds,
    bestLines,
    selectedCell,
    handleOddsClick,
    handleRowClick,
    formatGameTime,
  } = useOddsGameInteraction(game, marketType, selectedBooks, bestPercent, onOddsClick);

  if (!marketOdds) return null;

  const spreadLabel = getMarketSpreadLabel(marketType, marketOdds);

  const oddsBtnClass = (
    odds: number,
    isBest: boolean,
    isSelected: boolean
  ) =>
    [
      'min-h-[44px] flex-1 rounded-lg text-sm font-mono font-medium transition-colors touch-manipulation',
      odds > 0 ? 'text-lime-400' : 'text-amber-400',
      isBest ? 'bg-lime-500/10 ring-1 ring-lime-500/30' : 'bg-neutral-900/80',
      isSelected && !isBest ? 'bg-neutral-700/40 ring-1 ring-neutral-500/50' : '',
      !isBest && !isSelected ? 'active:bg-neutral-800' : '',
    ].join(' ');

  return (
    <article className="p-4 bg-neutral-950 border-b border-neutral-800 last:border-b-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-1">
            <span className="text-neutral-400 font-medium">{game.sport}</span>
            {spreadLabel && (
              <span className="text-neutral-600">{spreadLabel}</span>
            )}
          </div>
          <p className="text-sm text-white font-medium leading-snug">
            <span className="text-neutral-500 text-xs mr-1.5">A</span>
            {game.awayTeam}
          </p>
          <p className="text-sm text-white font-medium leading-snug mt-1">
            <span className="text-neutral-500 text-xs mr-1.5">H</span>
            {game.homeTeam}
          </p>
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

      <div className="space-y-2">
        <p className="text-xs text-neutral-500">
          {formatGameTime(game.gameTime)}
        </p>
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
          <span className="w-[5.5rem] shrink-0" aria-hidden />
          <span className="flex-1 text-center">Away</span>
          <span className="flex-1 text-center">Home</span>
        </div>
        {selectedBooks.map((book) => {
          const awayOdds = marketOdds.away[book];
          const homeOdds = marketOdds.home[book];
          const awayBest = bestLines?.away?.book === book;
          const homeBest = bestLines?.home?.book === book;
          const awaySel = selectedCell?.book === book && !selectedCell?.isHome;
          const homeSel = selectedCell?.book === book && selectedCell?.isHome;

          return (
            <div
              key={book}
              className="flex items-center gap-2 py-1.5 border-t border-neutral-800/60 first:border-t-0 first:pt-0"
            >
              <span className="w-[5.5rem] shrink-0 text-xs text-neutral-400 truncate" title={book}>
                {book}
              </span>
              <div className="flex flex-1 gap-2 min-w-0">
                {awayOdds !== undefined ? (
                  <button
                    type="button"
                    onClick={() => handleOddsClick(game.awayTeam, awayOdds, book, false)}
                    className={oddsBtnClass(awayOdds, awayBest, awaySel)}
                  >
                    {formatOdds(awayOdds)}
                  </button>
                ) : (
                  <span className="min-h-[44px] flex-1 flex items-center justify-center rounded-lg bg-neutral-900/40 text-neutral-600 text-sm">
                    —
                  </span>
                )}
                {homeOdds !== undefined ? (
                  <button
                    type="button"
                    onClick={() => handleOddsClick(game.homeTeam, homeOdds, book, true)}
                    className={oddsBtnClass(homeOdds, homeBest, homeSel)}
                  >
                    {formatOdds(homeOdds)}
                  </button>
                ) : (
                  <span className="min-h-[44px] flex-1 flex items-center justify-center rounded-lg bg-neutral-900/40 text-neutral-600 text-sm">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(bestLines?.away || bestLines?.home) && (
        <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-xs">
          <span className="w-[5.5rem] shrink-0" aria-hidden />
          <div className="flex flex-1 gap-2 min-w-0">
            <div className="flex-1 text-center">
              <span className="text-neutral-600">Best away </span>
              <span className="font-mono text-lime-400 font-medium">
                {bestLines.away ? formatOdds(bestLines.away.odds) : '—'}
              </span>
            </div>
            <div className="flex-1 text-center">
              <span className="text-neutral-600">Best home </span>
              <span className="font-mono text-lime-400 font-medium">
                {bestLines.home ? formatOdds(bestLines.home.odds) : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
