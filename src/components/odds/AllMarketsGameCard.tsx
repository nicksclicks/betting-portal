import { ChevronRight } from 'lucide-react';
import {
  MarketType,
  MARKET_TYPE_SHORT_LABELS,
  Sportsbook,
} from '../../constants/sportsbooks';
import { GameOdds } from '../../types/odds';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  formatGameTime,
  getMarketSpreadLabel,
  OddsClickPayload,
} from './useOddsGameInteraction';

interface AllMarketsGameCardProps {
  game: GameOdds;
  markets: MarketType[];
  selectedBooks: Sportsbook[];
  marketBests: Record<MarketType, BestPercentResult | null>;
  onOpenMarket: (market: MarketType) => void;
  onOddsClick: (data: OddsClickPayload) => void;
}

export function AllMarketsGameCard({
  game,
  markets,
  marketBests,
  onOpenMarket,
  onOddsClick,
}: AllMarketsGameCardProps) {
  const marketsWithLines = markets.filter((market) => marketBests[market] !== null);

  const openArbitrage = (best: BestPercentResult) => {
    onOddsClick({
      teamA: game.awayTeam,
      teamB: game.homeTeam,
      oddsA: best.awayOdds,
      oddsB: best.homeOdds,
      bookA: best.awayBook,
      bookB: best.homeBook,
    });
  };

  return (
    <article className="p-4 bg-neutral-950 border-b border-neutral-800 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-1">
        <span className="text-neutral-400 font-medium">{game.sport}</span>
        <span>{formatGameTime(game.gameTime)}</span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-white font-medium">
          <span className="text-neutral-500 text-xs mr-1.5">A</span>
          {game.awayTeam}
        </p>
        <p className="text-sm text-white font-medium">
          <span className="text-neutral-500 text-xs mr-1.5">H</span>
          {game.homeTeam}
        </p>
      </div>

      {marketsWithLines.length === 0 ? (
        <p className="text-xs text-neutral-600">No lines from your selected books.</p>
      ) : (
        <div className="space-y-2">
          {marketsWithLines.map((market) => {
            const best = marketBests[market]!;
            const marketOdds = game.odds[market]!;
            const lineLabel = getMarketSpreadLabel(market, marketOdds);

            return (
              <div key={market} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => onOpenMarket(market)}
                  className="touch-manipulation flex-1 min-h-[44px] min-w-0 flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 transition-colors active:bg-neutral-800 active:border-neutral-600"
                >
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    {MARKET_TYPE_SHORT_LABELS[market]}
                    {lineLabel && <span className="text-neutral-600 ml-1">{lineLabel}</span>}
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-sm text-white truncate">
                      {formatOdds(best.awayOdds)} <span className="text-neutral-600">/</span>{' '}
                      {formatOdds(best.homeOdds)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600 shrink-0" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openArbitrage(best)}
                  className={`touch-manipulation shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[72px] px-2 rounded-lg font-mono text-xs font-semibold transition-colors hover:opacity-90 active:opacity-75 ${getBestPercentColorClass(best.color)}`}
                >
                  {formatPercent(best.percent)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
