import { ChevronDown } from 'lucide-react';
import {
  MarketType,
  MARKET_TYPE_SHORT_LABELS,
  Sportsbook,
} from '../../constants/sportsbooks';
import { GameOdds } from '../../types/odds';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  emptyGameSidePick,
  formatGameTime,
  GameSidePick,
  getMarketSpreadLabel,
  OddsClickPayload,
} from './useOddsGameInteraction';
import { MarketBookGrid } from './MarketBookGrid';

interface AllMarketsRowProps {
  game: GameOdds;
  markets: MarketType[];
  selectedBooks: Sportsbook[];
  marketBests: Record<MarketType, BestPercentResult | null>;
  expandedMarket: MarketType | null;
  onToggleExpand: (market: MarketType) => void;
  onOddsClick: (data: OddsClickPayload) => void;
  getPick: (market: MarketType) => GameSidePick;
  onPickChange: (market: MarketType, update: (prev: GameSidePick) => GameSidePick) => void;
}

const stickyGameCellClass =
  'pl-5 pr-2 md:px-4 sticky left-0 z-10 bg-neutral-950 border-r border-neutral-800 shadow-[6px_0_12px_-4px_rgba(0,0,0,0.65)] align-top min-w-[13rem] max-w-[15rem] sm:min-w-[14rem] sm:max-w-[17rem] md:min-w-[16rem] md:max-w-[22rem] lg:max-w-[26rem]';

export function AllMarketsRow({
  game,
  markets,
  selectedBooks,
  marketBests,
  expandedMarket,
  onToggleExpand,
  onOddsClick,
  getPick,
  onPickChange,
}: AllMarketsRowProps) {
  const openArbitrage = (market: MarketType, best: BestPercentResult) => {
    onPickChange(market, () => emptyGameSidePick());
    onOddsClick({
      teamA: game.awayTeam,
      teamB: game.homeTeam,
      oddsA: best.awayOdds,
      oddsB: best.homeOdds,
      bookA: best.awayBook,
      bookB: best.homeBook,
    });
  };

  const renderMarketCell = (market: MarketType) => {
    const marketOdds = game.odds[market];
    const best = marketBests[market];

    if (!marketOdds || !best) {
      return (
        <td key={market} className="py-2 px-2 text-center align-middle min-w-[120px]">
          <span className="text-neutral-700 text-xs md:text-sm">—</span>
        </td>
      );
    }

    const lineLabel = getMarketSpreadLabel(market, marketOdds);
    const isExpanded = expandedMarket === market;

    return (
      <td key={market} className="py-2 px-1.5 md:px-2 align-middle min-w-[120px]">
        <div
          className={`flex flex-col items-center gap-1 rounded-lg p-1 transition-colors ${
            isExpanded ? 'bg-neutral-900 ring-1 ring-lime-500/30' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => onToggleExpand(market)}
            aria-expanded={isExpanded}
            className="touch-manipulation w-full rounded-md py-1 px-1 hover:bg-neutral-900 active:bg-neutral-800 transition-colors pointer-coarse:min-h-[44px]"
          >
            <span className="font-mono text-xs md:text-sm text-white whitespace-nowrap">
              {formatOdds(best.awayOdds)} <span className="text-neutral-600">/</span>{' '}
              {formatOdds(best.homeOdds)}
            </span>
            <span className="flex items-center justify-center gap-1 text-[10px] text-neutral-600">
              {lineLabel ?? ''}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </span>
          </button>
          <button
            type="button"
            onClick={() => openArbitrage(market, best)}
            className={`touch-manipulation pointer-coarse:min-h-[44px] px-2 py-0.5 rounded-lg font-mono text-[11px] md:text-xs font-semibold transition-colors hover:opacity-80 active:opacity-70 ${getBestPercentColorClass(best.color)}`}
          >
            {formatPercent(best.percent)}
          </button>
        </div>
      </td>
    );
  };

  const expandedOdds = expandedMarket ? game.odds[expandedMarket] : undefined;
  const expandedBest = expandedMarket ? marketBests[expandedMarket] : null;

  return (
    <>
      <tr className={expandedMarket ? 'border-b border-neutral-800/30' : 'border-b border-neutral-800'}>
        <td className={`py-2.5 md:py-3 ${stickyGameCellClass}`}>
          <div className="text-[10px] md:text-xs text-neutral-500 mb-2">{game.sport}</div>
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0 mb-1">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">A</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.awayTeam}</span>
          </div>
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2 min-w-0">
            <span className="text-neutral-500 text-[10px] md:text-xs shrink-0">H</span>
            <span className="text-neutral-700 shrink-0">|</span>
            <span className="truncate min-w-0 flex-1">{game.homeTeam}</span>
          </div>
        </td>
        <td className="py-1 px-2 md:px-4 text-[10px] md:text-xs text-neutral-500 align-middle">
          {formatGameTime(game.gameTime)}
        </td>
        {markets.map(renderMarketCell)}
      </tr>
      {expandedMarket && expandedOdds && (
        <tr className="border-b border-neutral-800 bg-neutral-900/30">
          <td colSpan={2 + markets.length} className="px-5 md:px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-white font-medium">
                {expandedMarket}
                {getMarketSpreadLabel(expandedMarket, expandedOdds) && (
                  <span className="text-neutral-500 text-xs">
                    {getMarketSpreadLabel(expandedMarket, expandedOdds)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onToggleExpand(expandedMarket)}
                className="touch-manipulation text-xs text-neutral-500 hover:text-white active:text-white pointer-coarse:min-h-[44px] pointer-coarse:px-2"
              >
                Collapse {MARKET_TYPE_SHORT_LABELS[expandedMarket]}
              </button>
            </div>
            <MarketBookGrid
              game={game}
              marketType={expandedMarket}
              selectedBooks={selectedBooks}
              bestPercent={expandedBest}
              onOddsClick={onOddsClick}
              pick={getPick(expandedMarket)}
              onPickChange={(update) => onPickChange(expandedMarket, update)}
              layout="wide"
            />
          </td>
        </tr>
      )}
    </>
  );
}
