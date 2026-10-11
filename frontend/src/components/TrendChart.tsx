import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { TrendPoint, TrendRange } from '../lib/stats';
import { cn } from '../lib/utils';

const RANGES: { id: TrendRange; label: string }[] = [
  { id: 'week', label: '7 days' },
  { id: 'month', label: '30 days' },
  { id: 'year', label: '12 months' },
];

const VIEW_W = 720;
const VIEW_H = 200;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;

/**
 * Productivity percentage over time. Rendered as a plain SVG area chart —
 * no chart library, so it inherits the theme tokens directly and adds nothing
 * to the bundle.
 */
export function TrendChart({
  points,
  range,
  onRangeChange,
}: {
  points: TrendPoint[];
  range: TrendRange;
  onRangeChange: (range: TrendRange) => void;
}) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const { linePath, areaPath, coords } = useMemo(() => {
    const n = points.length;
    const innerW = VIEW_W - PAD_X * 2;
    const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
    const stepX = n > 1 ? innerW / (n - 1) : 0;

    const pts = points.map((p, i) => ({
      x: PAD_X + i * stepX,
      y: PAD_TOP + innerH * (1 - p.rate / 100),
      point: p,
    }));

    if (pts.length === 0) return { linePath: '', areaPath: '', coords: [] };

    // Monotone-ish smoothing: horizontal control points keep the curve from
    // overshooting past 0% or 100%.
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i += 1) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const baseline = PAD_TOP + innerH;
    const area = `${d} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z`;

    return { linePath: d, areaPath: area, coords: pts };
  }, [points]);

  const average = points.length
    ? Math.round(points.reduce((s, p) => s + p.rate, 0) / points.length)
    : 0;
  const totalScheduled = points.reduce((s, p) => s + p.total, 0);
  const active = hover !== null ? points[hover] : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ds-eyebrow">Productivity</p>
          <p className="ds-numeric mt-2 text-[28px] font-semibold leading-none text-ink">
            {active ? `${active.rate}%` : `${average}%`}
          </p>
          <p className="mt-1.5 text-[12px] text-faint">
            {active
              ? `${active.fullLabel} — ${active.completed}/${active.total} completed`
              : `Average across ${totalScheduled} scheduled task${
                  totalScheduled === 1 ? '' : 's'
                }`}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Trend range"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-line bg-surface-2 p-1"
        >
          {RANGES.map((r) => {
            const isActive = range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => {
                  setHover(null);
                  onRangeChange(r.id);
                }}
                className={cn(
                  'relative rounded-md px-2.5 py-1.5 text-[11.5px] font-medium',
                  'cursor-pointer transition-colors duration-200',
                  isActive ? 'text-accent-ink' : 'text-muted hover:text-ink',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="trend-range-pill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    className="absolute inset-0 rounded-md bg-accent"
                  />
                )}
                <span className="relative">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="h-48 w-full overflow-visible"
          role="img"
          aria-label={`Productivity trend, average ${average} percent`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Reference gridlines at 0 / 50 / 100% */}
          {[0, 50, 100].map((pct) => {
            const y = PAD_TOP + (VIEW_H - PAD_TOP - PAD_BOTTOM) * (1 - pct / 100);
            return (
              <line
                key={pct}
                x1={PAD_X}
                x2={VIEW_W - PAD_X}
                y1={y}
                y2={y}
                stroke="var(--ds-line)"
                strokeWidth="1"
                strokeDasharray={pct === 0 ? undefined : '3 4'}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--ds-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />

          {hover !== null && coords[hover] && (
            <>
              <line
                x1={coords[hover].x}
                x2={coords[hover].x}
                y1={PAD_TOP}
                y2={VIEW_H - PAD_BOTTOM}
                stroke="var(--ds-line-strong)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={coords[hover].x}
                cy={coords[hover].y}
                r="4"
                fill="var(--ds-accent)"
                stroke="var(--ds-surface)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}

          {/* Invisible hit areas — one per point. */}
          {coords.map((c, i) => (
            <rect
              key={c.point.key}
              x={c.x - (VIEW_W - PAD_X * 2) / (coords.length * 2)}
              y={0}
              width={(VIEW_W - PAD_X * 2) / coords.length}
              height={VIEW_H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {/* X labels live outside the SVG so they never stretch with the viewBox. */}
        <div className="mt-1 flex justify-between px-1">
          {points.map((p, i) => {
            // 30-day view would crowd; show roughly every fifth tick.
            const show =
              points.length <= 12 || i === 0 || i === points.length - 1 || i % 5 === 0;
            return (
              <span
                key={p.key}
                className={cn(
                  'ds-numeric flex-1 text-center text-[10px] font-medium',
                  hover === i ? 'text-ink' : 'text-faint',
                  !show && 'invisible',
                )}
              >
                {p.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
