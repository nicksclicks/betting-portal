import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Share2, Copy, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Bet } from '../../types/database';
import { betProfit, betProfitDate, dayKey } from '../../utils/betProfit';
import { formatCurrency } from '../../utils/odds';

interface ProfitCalendarProps {
  bets: Bet[];
  /** Called when a day with bets is clicked — used to jump to the list view. */
  onSelectDay?: (dayKey: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayStats {
  profit: number;
  count: number;
}

export function ProfitCalendar({ bets, onSelectDay }: ProfitCalendarProps) {
  // Anchor controls which month is shown; starts on the current month.
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Aggregate settled-bet profit per local day.
  const byDay = useMemo(() => {
    const map = new Map<string, DayStats>();
    for (const bet of bets) {
      if (bet.status !== 'won' && bet.status !== 'lost') continue;
      const key = dayKey(betProfitDate(bet));
      const entry = map.get(key) ?? { profit: 0, count: 0 };
      entry.profit += betProfit(bet);
      entry.count += 1;
      map.set(key, entry);
    }
    return map;
  }, [bets]);

  const year = anchor.getFullYear();
  const month = anchor.getMonth();

  const { cells, monthTotal } = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ day: number; key: string; stats: DayStats | undefined } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);

    let monthTotal = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = dayKey(new Date(year, month, day));
      const stats = byDay.get(key);
      if (stats) monthTotal += stats.profit;
      cells.push({ day, key, stats });
    }
    return { cells, monthTotal };
  }, [year, month, byDay]);

  const todayKey = dayKey(new Date());
  const monthLabel = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToMonth = (delta: number) => setAnchor(new Date(year, month + delta, 1));
  const goToToday = () => {
    const now = new Date();
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Render the calendar (with nav controls hidden) to a PNG and return its parts.
  const captureImage = async (): Promise<{ dataUrl: string; blob: Blob; fileName: string } | null> => {
    if (!captureRef.current) return null;
    setSharing(true);
    try {
      // Let React re-render and hide the nav controls before capturing.
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      );
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0a0a0a',
      });
      const fileName = `profit-${monthLabel.replace(' ', '-').toLowerCase()}.png`;
      const blob = await (await fetch(dataUrl)).blob();
      return { dataUrl, blob, fileName };
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    setMenuOpen(false);
    try {
      const result = await captureImage();
      if (!result) return;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': result.blob }),
      ]);
    } catch (error) {
      console.error('Failed to copy calendar image:', error);
    }
  };

  const handleDownload = async () => {
    setMenuOpen(false);
    try {
      const result = await captureImage();
      if (!result) return;
      const a = document.createElement('a');
      a.href = result.dataUrl;
      a.download = result.fileName;
      a.click();
    } catch (error) {
      console.error('Failed to download calendar image:', error);
    }
  };

  return (
    <div className="relative">
      <div ref={captureRef} className="card p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3">
            {!sharing && (
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="touch-manipulation inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 active:bg-neutral-800 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-base md:text-lg font-semibold text-white min-w-[9rem] text-center">{monthLabel}</h3>
            {!sharing && (
              <>
                <button
                  type="button"
                  onClick={() => goToMonth(1)}
                  className="touch-manipulation inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 active:bg-neutral-800 transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="touch-manipulation btn-secondary text-xs px-2.5 py-1.5 ml-1"
                >
                  Today
                </button>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] md:text-xs text-neutral-500">Month net</p>
            <p
              className={`text-base md:text-xl font-bold font-mono ${
                monthTotal > 0 ? 'text-lime-400' : monthTotal < 0 ? 'text-red-400' : 'text-neutral-300'
              }`}
            >
              {monthTotal >= 0 ? '+' : ''}
              {formatCurrency(monthTotal)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="text-center text-[10px] md:text-xs font-medium text-neutral-500 pb-1">
              {wd}
            </div>
          ))}
          {cells.map((cell, idx) => {
            if (!cell) return <div key={`empty-${idx}`} />;
            const { day, key, stats } = cell;
            const profit = stats?.profit ?? 0;
            const isToday = key === todayKey;
            const hasProfit = stats !== undefined;
            const positive = profit > 0;
            const negative = profit < 0;

            const clickable = hasProfit && !!onSelectDay;

            return (
              <div
                key={key}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onSelectDay(key) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectDay(key);
                        }
                      }
                    : undefined
                }
                className={`relative rounded-lg border border-white/25 p-1.5 md:p-2 min-h-[56px] md:min-h-[72px] flex items-center justify-center transition-colors ${
                  positive ? 'bg-lime-500/10' : negative ? 'bg-red-500/10' : 'bg-neutral-950'
                } ${isToday ? 'ring-1 ring-white' : ''} ${
                  clickable
                    ? `cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/60 ${
                        positive
                          ? 'hover:bg-lime-500/20 active:bg-lime-500/25'
                          : negative
                            ? 'hover:bg-red-500/20 active:bg-red-500/25'
                            : 'hover:bg-neutral-900 active:bg-neutral-800'
                      }`
                    : ''
                }`}
              >
                <span className="absolute top-1 left-1.5 text-[10px] md:text-xs font-medium text-white">
                  {day}
                </span>
                {hasProfit && (
                  <span
                    className={`text-center text-xs md:text-base font-bold font-mono leading-tight ${
                      positive ? 'text-lime-400' : negative ? 'text-red-400' : 'text-neutral-300'
                    }`}
                  >
                    {profit >= 0 ? '+' : ''}
                    {formatCurrency(profit)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-5 mt-3">
          <img
            src="/lgm-tracker-logo.png?v=2"
            alt="LGM Tracker"
            className="h-14 md:h-20 w-auto object-contain"
          />
        </div>
      </div>

      <div className="absolute bottom-4 right-4">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={sharing}
          className="touch-manipulation btn-secondary text-xs md:text-sm flex items-center gap-2 disabled:opacity-50"
          title="Share calendar"
        >
          <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          {sharing ? 'Working…' : 'Share'}
        </button>

        {menuOpen && !sharing && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-full right-0 mb-2 z-20 w-64 rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
              <button
                type="button"
                onClick={handleCopy}
                className="touch-manipulation w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4 shrink-0" />
                Copy image to clipboard
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="touch-manipulation w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors border-t border-neutral-800"
              >
                <Download className="w-4 h-4 shrink-0" />
                Download image
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
