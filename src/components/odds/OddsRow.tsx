import { GameOdds } from '../../data/mockOdds';
import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  GameSidePick,
  getMarketSpreadLabel,
  OddsClickPayload,
  useOddsGameInteraction,
} from './useOddsGameInteraction';

interface OddsRowProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: OddsClickPayload) => void;
  pick: GameSidePick;
  onPickChange: (update: (prev: GameSidePick) => GameSidePick) => void;
}

export function OddsRow({
  game,
  marketType,
  selectedBooks,
  bestPercent,
  onOddsClick,
  pick,
  onPickChange,
}: OddsRowProps) {
  const {
    marketOdds,
    bestLines,
    selectedAwayBook,
    selectedHomeBook,
    handleSideInteraction,
    sideRowBoxClass,
    handleRowClick,
    formatGameTime,
  } = useOddsGameInteraction(game, marketType, selectedBooks, bestPercent, pick, onPickChange, onOddsClick);

  if (!marketOdds) return null;

  const spreadLabel = getMarketSpreadLabel(marketType, marketOdds);
  const oddsColSpan = selectedBooks.length + 1;

  const renderOddsButtons = (isHome: boolean) =>
    selectedBooks.map((book) => {
      const odds = isHome ? marketOdds.home[book] : marketOdds.away[book];
      const isBest = isHome ? bestLines?.home?.book === book : bestLines?.away?.book === book;
      const isSelected = isHome ? selectedHomeBook === book : selectedAwayBook === book;
      const team = isHome ? game.homeTeam : game.awayTeam;

      return odds !== undefined ? (
        <button
          key={book}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSideInteraction(isHome, { team, odds, book });
          }}
          className={`odds-cell flex-1 min-w-[52px] text-xs md:text-sm px-1 md:px-3 py-1.5 md:py-2 pointer-coarse:min-h-[44px] pointer-coarse:py-2 pointer-coarse:md:py-2.5 ${
            odds > 0 ? 'odds-positive' : 'odds-negative'
          } ${isBest ? 'odds-cell-best' : ''} ${
            isSelected && !isBest ? 'bg-neutral-700/40 ring-1 ring-neutral-500/50' : ''
          }`}
        >
          {formatOdds(odds)}
        </button>
      ) : (
        <span
          key={book}
          className="flex-1 min-w-[52px] flex items-center justify-center text-neutral-700 text-xs md:text-sm min-h-[44px]"
        >
          -
        </span>
      );
    });

  return (
    <>
      <tr className="border-b border-neutral-800/50">
        <td className="pt-2 md:pt-3 pb-0 pl-5 pr-2 md:px-4 sticky left-0 z-10 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] align-top min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]">
          <div className="text-[10px] md:text-xs text-neutral-500 mb-2 md:mb-2.5">{game.sport}</div>
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">A</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.awayTeam}</span>
          </div>
        </td>
        <td className="py-1 px-2 md:px-4 text-[10px] md:text-xs text-neutral-500 align-middle" rowSpan={2}>
          <div className="flex flex-col justify-center">
            <span>{formatGameTime(game.gameTime)}</span>
            {spreadLabel && (
              <span className="text-xs text-neutral-600 mt-0.5">{spreadLabel}</span>
            )}
          </div>
        </td>
        <td className="py-1 px-2 md:px-4 text-center align-middle" rowSpan={2}>
          {bestPercent && (
            <div className="flex flex-col items-center justify-center">
              <button
                type="button"
                onClick={handleRowClick}
                className={`touch-manipulation pointer-coarse:min-h-[44px] pointer-coarse:min-w-[44px] pointer-coarse:inline-flex pointer-coarse:items-center pointer-coarse:justify-center px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-mono text-xs md:text-sm font-semibold transition-colors hover:opacity-80 active:opacity-70 ${getBestPercentColorClass(bestPercent.color)}`}
              >
                {formatPercent(bestPercent.percent)}
              </button>
              <div className="text-[10px] md:text-xs text-neutral-600 mt-1 hidden md:block">
                {bestPercent.awayBook} / {bestPercent.homeBook}
              </div>
            </div>
          )}
        </td>
        <td colSpan={oddsColSpan} className="py-1.5 px-1 md:px-2 align-top">
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSideInteraction(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSideInteraction(false);
              }
            }}
            className={sideRowBoxClass()}
          >
            <div className="flex items-stretch gap-1 md:gap-1.5">
              {renderOddsButtons(false)}
              <div className="flex items-center justify-center min-w-[52px] px-1 md:px-2 shrink-0">
                {bestLines?.away && (
                  <span className="text-xs md:text-sm font-mono font-medium text-lime-400">
                    {formatOdds(bestLines.away.odds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
      <tr className="border-b border-neutral-800">
        <td className="pt-1.5 md:pt-2 pb-0 pl-5 pr-2 md:px-4 sticky left-0 z-10 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] align-top min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]">
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">H</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.homeTeam}</span>
          </div>
        </td>
        <td colSpan={oddsColSpan} className="py-1.5 px-1 md:px-2 align-top">
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSideInteraction(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSideInteraction(true);
              }
            }}
            className={sideRowBoxClass()}
          >
            <div className="flex items-stretch gap-1 md:gap-1.5">
              {renderOddsButtons(true)}
              <div className="flex items-center justify-center min-w-[52px] px-1 md:px-2 shrink-0">
                {bestLines?.home && (
                  <span className="text-xs md:text-sm font-mono font-medium text-lime-400">
                    {formatOdds(bestLines.home.odds)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

