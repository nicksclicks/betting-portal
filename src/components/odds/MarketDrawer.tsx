import { useEffect } from 'react';
import { X } from 'lucide-react';
import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { GameOdds } from '../../types/odds';
import { formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';
import {
  GameSidePick,
  getMarketSpreadLabel,
  OddsClickPayload,
} from './useOddsGameInteraction';
import { MarketBookGrid } from './MarketBookGrid';

interface MarketDrawerProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: OddsClickPayload) => void;
  pick: GameSidePick;
  onPickChange: (update: (prev: GameSidePick) => GameSidePick) => void;
  onClose: () => void;
}

/** Bottom sheet showing every book's line for one game + market (mobile). */
export function MarketDrawer({
  game,
  marketType,
  selectedBooks,
  bestPercent,
  onOddsClick,
  pick,
  onPickChange,
  onClose,
}: MarketDrawerProps) {
  // Lock body scroll while the sheet is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const marketOdds = game.odds[marketType];
  const lineLabel = marketOdds ? getMarketSpreadLabel(marketType, marketOdds) : null;

  const openArbitrage = () => {
    if (!bestPercent) return;
    onOddsClick({
      teamA: game.awayTeam,
      teamB: game.homeTeam,
      oddsA: bestPercent.awayOdds,
      oddsB: bestPercent.homeOdds,
      bookA: bestPercent.awayBook,
      bookB: bestPercent.homeBook,
    });
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${marketType} odds`}>
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-x border-neutral-800 bg-neutral-950 p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto w-10 h-1 rounded-full bg-neutral-800 mb-3" />
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="text-sm text-white font-medium">
              {marketType}
              {lineLabel && <span className="text-neutral-500 text-xs ml-1.5">{lineLabel}</span>}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {game.awayTeam} @ {game.homeTeam}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {bestPercent && (
              <button
                type="button"
                onClick={openArbitrage}
                className={`touch-manipulation inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg font-mono text-sm font-semibold transition-colors active:opacity-75 ${getBestPercentColorClass(bestPercent.color)}`}
              >
                {formatPercent(bestPercent.percent)}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="touch-manipulation inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-neutral-500 active:text-white active:bg-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-neutral-600 mb-3">
          Tap an odd to highlight it; tap again to open Arbitrage.
        </p>
        <MarketBookGrid
          game={game}
          marketType={marketType}
          selectedBooks={selectedBooks}
          bestPercent={bestPercent}
          onOddsClick={onOddsClick}
          pick={pick}
          onPickChange={onPickChange}
          layout="compact"
        />
      </div>
    </div>
  );
}
