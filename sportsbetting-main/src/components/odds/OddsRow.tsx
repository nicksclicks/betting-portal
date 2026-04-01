import { useMemo, useState } from 'react';
import { GameOdds } from '../../data/mockOdds';
import { MarketType, Sportsbook } from '../../constants/sportsbooks';
import { formatOdds, formatPercent } from '../../utils/odds';
import { BestPercentResult, getBestPercentColorClass } from '../../utils/bestPercent';

interface SelectedCell {
  book: Sportsbook;
  isHome: boolean;
}

interface OddsRowProps {
  game: GameOdds;
  marketType: MarketType;
  selectedBooks: Sportsbook[];
  bestPercent: BestPercentResult | null;
  onOddsClick: (data: {
    teamA: string;
    teamB: string;
    oddsA: number;
    oddsB: number;
    bookA: Sportsbook;
    bookB: Sportsbook;
  }) => void;
}

export function OddsRow({ game, marketType, selectedBooks, bestPercent, onOddsClick }: OddsRowProps) {
  const marketOdds = game.odds[marketType];
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

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

  if (!marketOdds) return null;

  const handleOddsClick = (
    team: string,
    odds: number,
    book: Sportsbook,
    isHome: boolean
  ) => {
    const isBestLine = isHome
      ? bestLines?.home?.book === book
      : bestLines?.away?.book === book;

    const isCurrentlySelected =
      selectedCell?.book === book && selectedCell?.isHome === isHome;

    if (isBestLine || isCurrentlySelected) {
      const oppositeOdds = isHome
        ? bestLines?.away?.odds
        : bestLines?.home?.odds;
      const oppositeBook = isHome
        ? bestLines?.away?.book
        : bestLines?.home?.book;

      if (oppositeOdds && oppositeBook) {
        setSelectedCell(null);
        onOddsClick({
          teamA: team,
          teamB: isHome ? game.awayTeam : game.homeTeam,
          oddsA: odds,
          oddsB: oppositeOdds,
          bookA: book,
          bookB: oppositeBook,
        });
      }
    } else {
      setSelectedCell({ book, isHome });
    }
  };

  const handleRowClick = () => {
    if (bestPercent) {
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

  const getSpreadDisplay = () => {
    if (marketType === 'Point Spread' && marketOdds.spread !== undefined) {
      return (
        <span className="text-xs text-neutral-600 ml-1">
          ({marketOdds.spread > 0 ? '+' : ''}{marketOdds.spread})
        </span>
      );
    }
    if (marketType === 'Totals' && marketOdds.total !== undefined) {
      return (
        <span className="text-xs text-neutral-600 ml-1">
          (O/U {marketOdds.total})
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <tr className="border-b border-neutral-800/50 hover:bg-neutral-900/50 transition-colors">
        <td className="py-2 md:py-3 px-3 md:px-4 sticky left-0 bg-neutral-950 z-10">
          <div className="text-[10px] md:text-xs text-neutral-500 mb-0.5 md:mb-1">{game.sport}</div>
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2">
            <span className="text-neutral-500 text-[10px] md:text-xs">A</span>
            <span className="text-neutral-700">|</span>
            <span className="truncate max-w-[100px] md:max-w-none">{game.awayTeam}</span>
          </div>
        </td>
        <td className="py-1 px-2 md:px-4 text-[10px] md:text-xs text-neutral-500" rowSpan={2}>
          {formatGameTime(game.gameTime)}
          {getSpreadDisplay()}
        </td>
        <td className="py-1 px-2 md:px-4 text-center" rowSpan={2}>
          {bestPercent && (
            <button
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
        <td className="py-2 md:py-3 px-3 md:px-4 sticky left-0 bg-neutral-950 z-10">
          <div className="text-xs md:text-sm font-medium text-white flex items-center gap-1 md:gap-2">
            <span className="text-neutral-500 text-[10px] md:text-xs">H</span>
            <span className="text-neutral-700">|</span>
            <span className="truncate max-w-[100px] md:max-w-none">{game.homeTeam}</span>
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
