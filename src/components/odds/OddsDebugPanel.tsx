import type { OddsApiGame } from '../../lib/oddsFromSupabase';
import {
  countBookEntries,
  type OddsDebugInfo,
  type OddsFilterStage,
  type OddsLoadStatus,
} from '../../lib/oddsDebug';

/** Tailwind tone + glyph per outcome, for the panel's headline. */
const STATUS_TONE: Record<OddsLoadStatus, { label: string; className: string }> = {
  success: { label: '✓ success', className: 'text-emerald-400' },
  failed: { label: '✕ failed', className: 'text-red-400' },
  aborted: { label: 'aborted', className: 'text-neutral-400' },
  'rate-limited': { label: '⏳ rate-limited (live API skipped)', className: 'text-yellow-400' },
};

/**
 * Analysis-only panel that surfaces the raw odds payloads under the table.
 * Rendered solely when ODDS_DEBUG is on — safe to delete wholesale later.
 */

interface OddsDebugPanelProps {
  info: OddsDebugInfo;
  /** Loaded → rendered filter funnel, to show where games were dropped. */
  funnel: OddsFilterStage[];
  /** Games actually rendered in the table after all filters. */
  renderedCount: number;
}

function gamesSummary(games: OddsApiGame[] | null): string {
  if (games === null) return 'none';
  return `${games.length} games, ${countBookEntries(games)} book entries`;
}

function RawGames({ label, games }: { label: string; games: OddsApiGame[] | null }) {
  if (games === null) return null;
  return (
    <details className="rounded-lg border border-neutral-800 bg-neutral-950">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-neutral-300">
        {label} — {gamesSummary(games)}
      </summary>
      <pre className="max-h-96 overflow-auto px-3 pb-3 text-[11px] leading-relaxed text-neutral-400">
        {JSON.stringify(games, null, 2)}
      </pre>
    </details>
  );
}

export function OddsDebugPanel({ info, funnel, renderedCount }: OddsDebugPanelProps) {
  const tone = STATUS_TONE[info.status];
  const loadedCount = funnel[0]?.remaining ?? 0;
  const meta: { label: string; value: string }[] = [
    { label: 'Source', value: info.source ?? '—' },
    { label: 'Edge invoked', value: String(info.edgeInvoked) },
    { label: 'forceLiveSync', value: String(info.forceLiveSync) },
    { label: 'dbOnly', value: String(info.dbOnly) },
    { label: 'silent', value: String(info.silent) },
    { label: 'API payload', value: gamesSummary(info.apiGames) },
    { label: 'DB payload', value: gamesSummary(info.dbGames) },
    { label: 'Applied', value: gamesSummary(info.appliedGames) },
  ];

  return (
    <details className="card mt-4 border-amber-500/30 bg-amber-500/[0.03] p-0">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-amber-400">
        🛠 API data (analysis only) — last load{' '}
        <span className={tone.className}>{tone.label}</span> at{' '}
        {new Date(info.loadedAt).toLocaleTimeString()}
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <p className="text-xs text-neutral-500">
          Latest load attempt. Disable with <code>VITE_ODDS_DEBUG=false</code> in .env.
        </p>
        <div className={`text-sm font-medium ${tone.className}`}>
          {tone.label}
          {info.source ? ` via ${info.source}` : ''} —{' '}
          {new Date(info.loadedAt).toLocaleString()}
        </div>
        {info.error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">
            <span className="font-medium">Error:</span>{' '}
            <span className="font-mono break-words">{info.error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          {meta.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-neutral-500">{label}</span>
              <span className="font-mono text-neutral-300 break-words">{value}</span>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
          <div className="mb-2 text-xs font-medium text-neutral-300">
            Filter funnel — {loadedCount} loaded → {renderedCount} shown
            {loadedCount > 0 && renderedCount === 0 && (
              <span className="ml-2 text-yellow-400">all games filtered out</span>
            )}
          </div>
          <div className="space-y-1">
            {funnel.map((stage, i) => (
              <div
                key={stage.label}
                className="flex items-center justify-between gap-3 text-xs font-mono"
              >
                <span className="text-neutral-400">
                  {i === 0 ? stage.label : `↳ ${stage.label}`}
                </span>
                <span className="flex items-center gap-2">
                  {stage.dropped > 0 && (
                    <span className="text-red-400">−{stage.dropped}</span>
                  )}
                  <span className="text-neutral-300">{stage.remaining}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <RawGames label="Applied games (loaded, pre-filter)" games={info.appliedGames} />
          <RawGames label="Raw API payload" games={info.apiGames} />
          <RawGames label="Raw DB payload" games={info.dbGames} />
        </div>
      </div>
    </details>
  );
}
