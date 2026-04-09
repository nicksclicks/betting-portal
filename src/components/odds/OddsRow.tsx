import { GameOdds } from '../../data/mockOdds';
import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import { getMarketSpreadLabel, OddsClickPayload, useOddsGameInteraction } from './useOddsGameInteraction';

interface OddsRowProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: OddsClickPayload) => void;
}

export function OddsRow({ game, marketType, selectedBooks, bestPercent, onOddsClick }: OddsRowProps) {
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

  return (
    <>
      <tr className="border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors">
        <td className="py-2 md:py-3 pl-5 pr-2 md:px-4 sticky left-0 z-10 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] align-top min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]">
          <div className="text-[10px] md:text-xs text-neutral-500 mb-0.5 md:mb-1">{game.sport}</div>
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">A</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.awayTeam}</span>
          </div>
        </td>
        <td className="py-1 px-2 md:px-4 text-[10px] md:text-xs text-neutral-500" rowSpan={2}>
          {formatGameTime(game.gameTime)}
          {spreadLabel && (
            <span className="text-xs text-neutral-600 ml-1">{spreadLabel}</span>
          )}
        </td>
        <td className="py-1 px-2 md:px-4 text-center" rowSpan={2}>
          {bestPercent && (
            <button
              type="button"
              onClick={handleRowClick}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-mono text-xs md:text-sm font-semibold transition-colors hover:opacity-80 ${getBestPercentColorClass(bestPercent.color)}`}
            >
              {formatPercent(bestPercent.percent)}
            </button>
          )}
          {bestPercent && (
            <div className="text-[10px] md:text-xs text-neutral-600 mt-1 hidden md:block">
              {bestPercent.awayBook} / {bestPercent.homeBook}
            </div>
          )}
        </td>
        {selectedBooks.map((book) => {
          const odds = marketOdds.away[book];
          const isBest = bestLines?.away?.book === book;
          const isSelected = selectedCell?.book === book && !selectedCell?.isHome;
          return (
            <td key={book} className="py-1 px-1 md:px-2">
              {odds !== undefined ? (
                <button
                  type="button"
                  onClick={() => handleOddsClick(game.awayTeam, odds, book, false)}
                  className={`odds-cell w-full text-xs md:text-sm px-1 md:px-3 py-1.5 md:py-2 ${
                    odds > 0 ? 'odds-positive' : 'odds-negative'
                  } ${isBest ? 'bg-lime-500/10 ring-1 ring-lime-500/30' : ''} ${
                    isSelected && !isBest ? 'bg-neutral-700/30 ring-1 ring-neutral-500/40' : ''
                  }`}
                >
                  {formatOdds(odds)}
                </button>
              ) : (
                <span className="text-neutral-700 text-xs md:text-sm">-</span>
              )}
            </td>
          );
        })}
        <td className="py-1 px-2 md:px-4 text-center">
          {bestLines?.away && (
            <div className="text-xs md:text-sm font-mono font-medium text-lime-400">
              {formatOdds(bestLines.away.odds)}
            </div>
          )}
        </td>
      </tr>
      <tr className="border-b border-neutral-800 hover:bg-neutral-900/50 transition-colors">
        <td className="py-2 md:py-3 pl-5 pr-2 md:px-4 sticky left-0 z-10 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] align-top min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]">
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">H</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.homeTeam}</span>
          </div>
        </td>
        {selectedBooks.map((book) => {
          const odds = marketOdds.home[book];
          const isBest = bestLines?.home?.book === book;
          const isSelected = selectedCell?.book === book && selectedCell?.isHome;
          return (
            <td key={book} className="py-1 px-1 md:px-2">
              {odds !== undefined ? (
                <button
                  type="button"
                  onClick={() => handleOddsClick(game.homeTeam, odds, book, true)}
                  className={`odds-cell w-full text-xs md:text-sm px-1 md:px-3 py-1.5 md:py-2 ${
                    odds > 0 ? 'odds-positive' : 'odds-negative'
                  } ${isBest ? 'bg-lime-500/10 ring-1 ring-lime-500/30' : ''} ${
                    isSelected && !isBest ? 'bg-neutral-700/30 ring-1 ring-neutral-500/40' : ''
                  }`}
                >
                  {formatOdds(odds)}
                </button>
              ) : (
                <span className="text-neutral-700 text-xs md:text-sm">-</span>
              )}
            </td>
          );
        })}
        <td className="py-1 px-2 md:px-4 text-center">
          {bestLines?.home && (
            <div className="text-xs md:text-sm font-mono font-medium text-lime-400">
              {formatOdds(bestLines.home.odds)}
            </div>
          )}
        </td>
      </tr>
    </>
  );
}
