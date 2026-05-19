import { GameOdds } from '../../data/mockOdds';
import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  GameSidePick,
  getMarketSpreadLabel,
  getOddsCellHighlightClass,
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

const bookCellClass =
  'py-1.5 px-1 md:px-2 text-center align-middle min-w-[60px] md:min-w-[80px]';

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
    pick: gamePick,
    bindOddsCell,
    handleRowClick,
    formatGameTime,
  } = useOddsGameInteraction(game, marketType, selectedBooks, bestPercent, pick, onPickChange, onOddsClick);

  if (!marketOdds) return null;

  const spreadLabel = getMarketSpreadLabel(marketType, marketOdds);

  const renderBookCell = (isHome: boolean, book: Sportsbook) => {
    const odds = isHome ? marketOdds.home[book] : marketOdds.away[book];
    const isBest = isHome ? bestLines?.home?.book === book : bestLines?.away?.book === book;
    const sidePick = isHome ? gamePick.home : gamePick.away;
    const team = isHome ? game.homeTeam : game.awayTeam;

    return (
      <td key={book} className={bookCellClass}>
        {odds !== undefined ? (
          <button
            type="button"
            {...bindOddsCell(isHome, { team, odds, book })}
            className={`w-full min-w-[52px] text-xs md:text-sm px-1 md:px-3 py-1.5 md:py-2 pointer-coarse:min-h-[44px] pointer-coarse:py-2 pointer-coarse:md:py-2.5 ${getOddsCellHighlightClass(odds, isBest, sidePick, book)}`}
          >
            {formatOdds(odds)}
          </button>
        ) : (
          <span className="inline-flex w-full min-w-[52px] min-h-[44px] items-center justify-center text-neutral-700 text-xs md:text-sm">
            -
          </span>
        )}
      </td>
    );
  };

  const renderBestCell = (isHome: boolean) => {
    const line = isHome ? bestLines?.home : bestLines?.away;
    const sidePick = isHome ? gamePick.home : gamePick.away;
    const team = isHome ? game.homeTeam : game.awayTeam;
    const isInBookColumns = line ? selectedBooks.includes(line.book) : false;

    return (
      <td className={`${bookCellClass} min-w-[52px]`}>
        {line ? (
          isInBookColumns ? (
            <span className="inline-flex w-full min-h-[44px] items-center justify-center text-xs md:text-sm font-mono font-medium text-lime-400">
              {formatOdds(line.odds)}
            </span>
          ) : (
            <button
              type="button"
              {...bindOddsCell(isHome, { team, odds: line.odds, book: line.book })}
              className={`w-full min-h-[44px] text-xs md:text-sm font-mono font-medium ${getOddsCellHighlightClass(line.odds, true, sidePick, line.book)}`}
            >
              {formatOdds(line.odds)}
            </button>
          )
        ) : (
          <span className="inline-flex w-full min-h-[44px] items-center justify-center text-neutral-700 text-xs md:text-sm">
            -
          </span>
        )}
      </td>
    );
  };

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
        {selectedBooks.map((book) => renderBookCell(false, book))}
        {renderBestCell(false)}
      </tr>
      <tr className="border-b border-neutral-800">
        <td className="pt-1.5 md:pt-2 pb-2 pl-5 pr-2 md:px-4 sticky left-0 z-10 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] align-top min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]">
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">H</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.homeTeam}</span>
          </div>
        </td>
        {selectedBooks.map((book) => renderBookCell(true, book))}
        {renderBestCell(true)}
      </tr>
    </>
  );
}
