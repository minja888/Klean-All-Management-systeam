"use client";

// ---------------------------------------------------------------------------
// Small SVG charts — no chart library needed, brand-colored, print-friendly.
// ---------------------------------------------------------------------------
import { formatTZS } from "@/lib/money";

const GREEN = "#16a34a";
const YELLOW = "#eab308";
const DARK = "#0b2e1a";
const RED = "#dc2626";

function short(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(Math.round(n));
}

export interface MonthPoint { month: string; revenue: number; costs: number; net: number }

/** Grouped bars: revenue vs costs, with the net figure labelled per month. */
export function TrendChart({ data, labels }: { data: MonthPoint[]; labels: { revenue: string; costs: string; net: string } }) {
  const W = 680, H = 240, padL = 46, padB = 40, padT = 16;
  const plotW = W - padL - 12, plotH = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => Math.max(d.revenue, d.costs)));
  const groupW = plotW / Math.max(1, data.length);
  const barW = Math.min(26, groupW / 3);
  const y = (v: number) => padT + plotH - (v / max) * plotH;

  // horizontal gridlines at 0 / 50% / 100%
  const grid = [0, 0.5, 1].map((f) => ({ v: max * f, y: y(max * f) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
      {grid.map((g, i) => (
        <g key={i}>
          <line x1={padL} x2={W - 8} y1={g.y} y2={g.y} stroke="#e2e8e4" strokeWidth={1} />
          <text x={padL - 6} y={g.y + 3} textAnchor="end" fontSize={9} fill="#94a3a0">{short(g.v)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const netY = y(Math.max(0, d.net));
        return (
          <g key={i}>
            <rect x={cx - barW - 2} y={y(d.revenue)} width={barW} height={padT + plotH - y(d.revenue)} rx={3} fill={GREEN} />
            <rect x={cx + 2} y={y(d.costs)} width={barW} height={padT + plotH - y(d.costs)} rx={3} fill={YELLOW} />
            {/* net marker */}
            <circle cx={cx} cy={d.net >= 0 ? netY : padT + plotH} r={4} fill={d.net >= 0 ? DARK : RED} />
            <text x={cx} y={(d.net >= 0 ? netY : padT + plotH) - 8} textAnchor="middle" fontSize={9} fontWeight={700}
              fill={d.net >= 0 ? DARK : RED}>{short(d.net)}</text>
            <text x={cx} y={H - padB + 16} textAnchor="middle" fontSize={10} fill="#475569">{d.month}</text>
          </g>
        );
      })}
      {/* legend */}
      <g transform={`translate(${padL}, ${H - 12})`} fontSize={9.5} fill="#475569">
        <rect x={0} y={-8} width={10} height={10} rx={2} fill={GREEN} /><text x={14} y={1}>{labels.revenue}</text>
        <rect x={90} y={-8} width={10} height={10} rx={2} fill={YELLOW} /><text x={104} y={1}>{labels.costs}</text>
        <circle cx={195} cy={-3} r={5} fill={DARK} /><text x={204} y={1}>{labels.net}</text>
      </g>
    </svg>
  );
}

/** Horizontal bars for expense categories. */
export function CategoryChart({ data }: { data: { name: string; amount: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-28 shrink-0 truncate text-slate-600" title={d.name}>{d.name}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(2, (d.amount / max) * 100)}%`,
                background: `linear-gradient(90deg, ${GREEN} 60%, ${YELLOW})`,
              }}
            />
          </div>
          <div className="w-24 text-right tabular text-slate-700">{formatTZS(d.amount)}</div>
        </div>
      ))}
    </div>
  );
}
