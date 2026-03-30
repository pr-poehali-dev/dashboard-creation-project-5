import {
  AreaChart, Area, YAxis, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import type { ColumnDef } from "@/config/dashboards";

interface Props {
  selectedCity: string | null;
  hasMonths: boolean;
  columns: ColumnDef[];
  reasonsByMonth: Array<Record<string, number | string>>;
  PIE_COLORS: string[];
}

export default function DashboardReasonsTrend({
  selectedCity, hasMonths, columns, reasonsByMonth, PIE_COLORS,
}: Props) {
  if (!selectedCity || !hasMonths || reasonsByMonth.length <= 1) return null;

  const globalMax = Math.max(
    ...columns.map(col => Math.max(...reasonsByMonth.map(r => Number(r[col.key]) || 0))),
    1
  );

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      <div className="mb-5">
        <h3 className="font-display font-bold text-white text-lg">Динамика причин</h3>
        <p className="text-white/40 text-xs mt-0.5">{selectedCity} · каждая причина отдельно</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {columns.map((col, ci) => {
          const color = PIE_COLORS[ci % PIE_COLORS.length];
          const data = reasonsByMonth.map(r => ({ month: r.month as string, value: Number(r[col.key]) || 0 }));
          const total = data.reduce((s, d) => s + d.value, 0);
          const gradientId = `smGrad-city-${col.key}`;
          const last = data.length >= 2 ? data[data.length - 1].value : 0;
          const prev = data.length >= 2 ? data[data.length - 2].value : 0;
          const diff = prev > 0 ? ((last - prev) / prev) * 100 : (last > 0 ? 100 : 0);
          const trendUp = diff > 0;
          const trendFlat = diff === 0;
          return (
            <div key={col.key} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{col.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono" style={{ color }}>{total.toLocaleString("ru-RU")}</span>
                {data.length >= 2 && !trendFlat && (
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: trendUp ? "#22c55e" : "#ef4444" }}>
                    <Icon name={trendUp ? "TrendingUp" : "TrendingDown"} size={13} />
                    {Math.abs(diff).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="mt-2" style={{ height: 60 }}>
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                      fill={`url(#${gradientId})`} dot={false}
                      baseValue={0} />
                    <YAxis domain={[0, globalMax]} hide />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{data[0]?.month}</span>
                <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{data[data.length - 1]?.month}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}