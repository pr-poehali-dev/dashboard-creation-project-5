import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import type { ColumnDef } from "@/config/dashboards";

const MONTHS_ORDER_CHART = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

interface TPayload { color: string; name: string; value: number; }
interface TTooltip { active?: boolean; payload?: TPayload[]; label?: string; }
const CustomTooltip = ({ active, payload, label }: TTooltip) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 140 }}>
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-semibold text-white ml-auto pl-2">{p.value?.toLocaleString("ru-RU")}</span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  selectedCity: string | null;
  selectedMonth: string | null;
  hasMonths: boolean;
  loading: boolean;
  isLight: boolean;
  axisColor: string;
  gradId: string;
  columns: ColumnDef[];
  aggregatedByMonthRows: Array<Record<string, number | string>>;
  cityBarData: Array<{ name: string; total: number }>;
  colTotals: Array<ColumnDef & { total: number; color: string }>;
  sorted: Array<ColumnDef & { total: number; color: string }>;
  grandTotal: number;
  monthlyTrendData: Array<{ month: string; total: number }>;
  reasonsByMonth: Array<Record<string, number | string>>;
  aggregatedByCityRows: Row[];
  rowTotal: (row: Row) => number;
  showAllCities: boolean;
  onShowAllCitiesToggle: () => void;
  PIE_COLORS: string[];
  anomaliesSlot?: React.ReactNode;
}

export default function DashboardCharts({
  selectedCity, selectedMonth, hasMonths, loading, isLight, axisColor, gradId,
  columns, aggregatedByMonthRows, cityBarData, colTotals, sorted, grandTotal,
  monthlyTrendData, reasonsByMonth, aggregatedByCityRows, rowTotal,
  showAllCities, onShowAllCitiesToggle, PIE_COLORS, anomaliesSlot,
}: Props) {
  return (
    <>
      {selectedCity && hasMonths && !selectedMonth && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Динамика по месяцам</h3>
              <p className="text-white/40 text-xs mt-0.5">{selectedCity} · суммарное количество обращений</p>
            </div>
          </div>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
          ) : aggregatedByMonthRows.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <AreaChart data={aggregatedByMonthRows} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D46A" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00D46A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
                <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false} tickLine={false} interval={0} height={40} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Итого"
                  stroke="#00D46A" strokeWidth={2.5} fill={`url(#${gradId})`}
                  dot={{ r: 4, fill: "#00D46A", stroke: "white", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#00D46A", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Нет данных по месяцам</div>
          )}
        </div>
      )}

      {anomaliesSlot}

      <div className={`grid grid-cols-1 ${selectedCity ? "" : "lg:grid-cols-3"} gap-4`}>
        {!selectedCity && (
          <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">По городам</h3>
                <p className="text-white/40 text-xs mt-0.5">Суммарное количество по каждому городу</p>
              </div>
            </div>
            {loading ? (
              <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={cityBarData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }}
                    axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} height={50} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Итого"
                    stroke="#8B5CF6" strokeWidth={2.5} fill={`url(#${gradId})`}
                    dot={false} activeDot={{ r: 5, fill: "#8B5CF6", stroke: "white", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-5">
            <h3 className="font-display font-bold text-white text-lg">Распределение</h3>
            <p className="text-white/40 text-xs mt-0.5">По типам причин{grandTotal > 0 ? ` · всего ${grandTotal.toLocaleString("ru-RU")}` : ""}</p>
          </div>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
          ) : (() => {
            const topItem = sorted.find(c => c.total > 0);
            const topPct = topItem && grandTotal > 0 ? ((topItem.total / grandTotal) * 100).toFixed(1) : "0";
            const chartSize = 220;
            const innerR = 75;
            const outerR = 105;
            return (
              <div className={`flex ${selectedCity ? "flex-row items-start gap-8" : "flex-col items-center"}`}>
                <div className="relative flex-shrink-0" style={{ width: chartSize, height: chartSize }}>
                  <ResponsiveContainer width={chartSize} height={chartSize}>
                    <PieChart>
                      <Pie data={colTotals.filter(c => c.total > 0)}
                        cx="50%" cy="50%"
                        innerRadius={innerR} outerRadius={outerR}
                        paddingAngle={2} dataKey="total" nameKey="label" strokeWidth={0}
                        cornerRadius={6}
                        startAngle={90} endAngle={-270}>
                        {colTotals.filter(c => c.total > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12 }}
                        itemStyle={{ color: isLight ? "rgba(20,10,40,0.7)" : "rgba(255,255,255,0.7)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    {topItem && (
                      <>
                        <span className="text-[11px] font-medium mb-1 text-center leading-tight text-white">{topItem.label}</span>
                        <span className="text-[32px] font-bold font-mono leading-none" style={{ color: isLight ? "#1a1a2e" : "#fff" }}>
                          {topPct}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col gap-0 ${selectedCity ? "flex-1 mt-0" : "w-full mt-4"}`}>
                  {sorted.filter(c => c.total > 0).map((item) => {
                    const itemPct = grandTotal > 0 ? ((item.total / grandTotal) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.key} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${isLight ? "rgba(20,10,40,0.08)" : "rgba(255,255,255,0.08)"}` }}>
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-sm flex-1 min-w-0 truncate" style={{ color: isLight ? "rgba(20,10,40,0.8)" : "rgba(255,255,255,0.7)" }}>{item.label}</span>
                        <span className="text-sm font-bold font-mono flex-shrink-0 tabular-nums ml-3" style={{ color: isLight ? "#1a1a2e" : "#fff" }}>
                          {item.total.toLocaleString("ru-RU")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {!selectedCity && hasMonths && reasonsByMonth.length > 1 && (() => {
        const globalMax = Math.max(
          ...columns.map(col => Math.max(...reasonsByMonth.map(r => Number(r[col.key]) || 0))),
          1
        );
        const curMonthIdx = new Date().getMonth();
        const curMonthName = MONTHS_ORDER_CHART[curMonthIdx];
        const prevMonthName = curMonthIdx > 0 ? MONTHS_ORDER_CHART[curMonthIdx - 1] : MONTHS_ORDER_CHART[11];
        const findVal = (arr: Array<{ month: string; value: number }>, m: string) => {
          const e = arr.find(d => d.month === m);
          return e ? e.value : 0;
        };
        return (
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="mb-5">
              <h3 className="font-display font-bold text-white text-lg">Динамика причин</h3>
              <p className="text-white/40 text-xs mt-0.5">Все города · {prevMonthName} → {curMonthName}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {columns.map((col, ci) => {
                const color = PIE_COLORS[ci % PIE_COLORS.length];
                const data = reasonsByMonth.map(r => ({ month: r.month as string, value: Number(r[col.key]) || 0 }));
                const total = data.reduce((s, d) => s + d.value, 0);
                const gradientId = `smGrad-all-${col.key}`;
                const cur = findVal(data, curMonthName);
                const prev = findVal(data, prevMonthName);
                const diff = prev > 0 ? ((cur - prev) / prev) * 100 : (cur > 0 ? 100 : 0);
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
                      {!trendFlat && (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: trendUp ? "#22c55e" : "#ef4444" }}>
                          <Icon name={trendUp ? "TrendingUp" : "TrendingDown"} size={13} />
                          {Math.abs(diff).toFixed(0)}%
                        </span>
                      )}
                      {trendFlat && prev === 0 && cur === 0 && (
                        <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                          нет данных
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
                          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5}
                            fill={`url(#${gradientId})`}
                            dot={{ r: 3, fill: color, stroke: "rgba(15,10,30,0.6)", strokeWidth: 1.5 }}
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
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!hasMonths && (
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  {showAllCities ? "Все города" : "Топ-5 городов"}
                </h3>
                <p className="text-white/40 text-xs mt-0.5">1 полоса = 1 город · цвета = причины</p>
              </div>
              {!loading && aggregatedByCityRows.length > 5 && (
                <button onClick={onShowAllCitiesToggle}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: showAllCities ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.06)",
                    color: showAllCities ? "#8B5CF6" : "rgba(255,255,255,0.5)",
                    border: showAllCities ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                  <Icon name={showAllCities ? "ChevronUp" : "ChevronDown"} size={14} />
                  {showAllCities ? "Свернуть" : `Показать все (${aggregatedByCityRows.length})`}
                </button>
              )}
            </div>
            {loading ? (
              <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : aggregatedByCityRows.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="BarChart2" size={28} />
                <p className="text-xs">Нет данных</p>
              </div>
            ) : (() => {
              const sortedR = [...aggregatedByCityRows].sort((a, b) => rowTotal(b) - rowTotal(a));
              const displayed = showAllCities ? sortedR : sortedR.slice(0, 5);
              const maxVal = Math.max(...displayed.map(r => rowTotal(r)), 1);
              return (
                <>
                  <div className="space-y-3">
                    {displayed.map(row => {
                      const total = rowTotal(row);
                      return (
                        <div key={row.city}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{row.city}</span>
                            <span style={{ color: "var(--text-secondary)" }}>{total.toLocaleString("ru-RU")}</span>
                          </div>
                          <div className="h-5 rounded-lg bg-white/5 overflow-hidden flex" style={{ width: "100%" }}>
                            {columns.map((col, ci) => {
                              const val = Number(row[col.key]) || 0;
                              const pct = total > 0 ? (val / maxVal) * 100 : 0;
                              if (pct === 0) return null;
                              return (
                                <div key={col.key} title={`${col.label}: ${val}`}
                                  className="h-full transition-all duration-500"
                                  style={{ width: `${pct}%`, background: PIE_COLORS[ci % PIE_COLORS.length] }} />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/6">
                    {columns.map((c, i) => (
                      <span key={c.key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {c.label}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
}