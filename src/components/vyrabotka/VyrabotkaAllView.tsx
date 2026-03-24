import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import {
  type CityData,
  MONTH_LABELS,
  PIE_COLORS,
  fmtMoney,
  fmtShort,
  pctColor,
  getCityTotals,
  CustomTooltip,
  PieTooltip,
} from "./VyrabotkaUtils";

interface MonthlyDataItem {
  name: string;
  shortName: string;
  plan: number;
  fact: number;
  pct: number;
}

interface BarDataItem {
  name: string;
  plan: number;
  fact: number;
  pct: number;
}

interface DeviationItem {
  name: string;
  value: number;
  pct: number;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface Props {
  DATA: CityData[];
  activeMonths: string[];
  selectedMonth: string | null;
  monthlyData: MonthlyDataItem[];
  barData: BarDataItem[];
  pieDataFact: PieDataItem[];
  deviationData: DeviationItem[];
  cityRanking: (CityData & { plan: number; fact: number; diff: number; pct: number })[];
  isLight: boolean;
  axisColor: string;
  setSelectedCity: (city: string | null) => void;
}

export default function VyrabotkaAllView({
  DATA, activeMonths, selectedMonth, monthlyData, barData, pieDataFact,
  deviationData, cityRanking, isLight, axisColor, setSelectedCity,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">Динамика по месяцам</h3>
            <p className="text-white/40 text-xs mt-0.5">План vs Факт · 2026</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData.filter(d => d.plan > 0 || d.fact > 0)} margin={{ top: 20, right: 5, left: 10, bottom: 0 }} barCategoryGap="8%" barGap={2}>
              <defs>
                <linearGradient id="gradAllPlan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9B7FFF" stopOpacity={1} />
                  <stop offset="100%" stopColor="#5A3ADB" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradAllFact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00FFE0" stopOpacity={1} />
                  <stop offset="100%" stopColor="#00B8A3" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => fmtShort(v)} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)", radius: 8 }} />
              <Bar dataKey="plan" name="План" radius={[6, 6, 0, 0]}
                label={({ x, y, width: w, value }: { x: number; y: number; width: number; value: number }) =>
                  value > 0 ? (
                    <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10}>
                      {fmtShort(value)}
                    </text>
                  ) : null
                }
              >
                {monthlyData.filter(d => d.plan > 0 || d.fact > 0).map((d) => (
                  <Cell key={d.shortName} fill="url(#gradAllPlan)" opacity={!selectedMonth || d.shortName === selectedMonth ? 1 : 0.15} />
                ))}
              </Bar>
              <Bar dataKey="fact" name="Факт" radius={[6, 6, 0, 0]}
                label={({ x, y, width: w, value }: { x: number; y: number; width: number; value: number }) =>
                  value > 0 ? (
                    <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="rgba(0,229,204,0.6)" fontSize={10} fontWeight={600}>
                      {fmtShort(value)}
                    </text>
                  ) : null
                }
              >
                {monthlyData.filter(d => d.plan > 0 || d.fact > 0).map((d) => (
                  <Cell key={d.shortName} fill="url(#gradAllFact)" opacity={!selectedMonth || d.shortName === selectedMonth ? 1 : 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-4">
            <h3 className="font-display font-bold text-white text-lg">Рейтинг городов</h3>
            <p className="text-white/40 text-xs mt-0.5">По % выполнения плана</p>
          </div>
          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
            {cityRanking.map((c, i) => (
              <div key={c.city}
                className="flex items-center gap-3 cursor-pointer rounded-xl p-2 transition-colors hover:bg-white/5"
                onClick={() => setSelectedCity(c.city)}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? "bg-emerald-500/20 text-emerald-400" :
                  i === cityRanking.length - 1 ? "bg-red-500/20 text-red-400" :
                  "bg-white/10 text-white/50"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.city}</p>
                  <div className="w-full h-1.5 rounded-full bg-white/10 mt-1">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      c.pct >= 100 ? "bg-emerald-500" : c.pct >= 80 ? "bg-amber-500" : "bg-red-500"
                    }`} style={{ width: `${Math.min(c.pct, 120) / 1.2}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ${pctColor(c.pct)}`}>
                  {c.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">Доля городов в выработке</h3>
            <p className="text-white/40 text-xs mt-0.5">Фактическая выработка</p>
          </div>
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="relative w-full lg:w-auto lg:flex-shrink-0">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="pieShadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.5)" />
                    </filter>
                  </defs>
                  <Pie data={pieDataFact} cx="50%" cy="50%" outerRadius={110}
                    dataKey="value" nameKey="name" paddingAngle={1.5}
                    stroke="rgba(0,0,0,0.3)" strokeWidth={1}
                    animationBegin={0} animationDuration={800}
                    style={{ filter: "url(#pieShadow)" }}
                    label={({ cx, cy, midAngle, outerRadius: oR, percent }: {
                      cx: number; cy: number; midAngle: number; outerRadius: number; percent: number;
                    }) => {
                      if (percent < 0.04) return null;
                      const rad = (midAngle * Math.PI) / 180;
                      const r = oR * 0.7;
                      const x = cx + r * Math.cos(rad);
                      const y = cy - r * Math.sin(rad);
                      return (
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                          fill="white" fontSize={11} fontWeight={700}
                          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                          {(percent * 100).toFixed(0)}%
                        </text>
                      );
                    }}
                    labelLine={false}>
                    {pieDataFact.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 text-xs w-full lg:w-auto">
              {pieDataFact.map((d) => {
                const total = pieDataFact.reduce((s, p) => s + p.value, 0);
                const share = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-[2px] shrink-0" style={{ background: d.color }} />
                    <span className="text-white/70 truncate">{d.name}</span>
                    <span className="font-bold text-white/90 shrink-0 ml-auto">{share}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">Отклонение от плана</h3>
            <p className="text-white/40 text-xs mt-0.5">% выполнения по городам</p>
          </div>
          <div className="space-y-2">
            {deviationData.map((entry) => {
              const isPositive = entry.value >= 0;
              const pct = entry.pct;
              const barWidth = Math.min(pct, 130);
              return (
                <div key={entry.name} className="flex items-center gap-3">
                  <span className="text-xs text-white/60 w-[110px] shrink-0 truncate text-right">{entry.name}</span>
                  <div className="flex-1 h-6 rounded-md bg-white/5 relative overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-700"
                      style={{
                        width: `${(barWidth / 130) * 100}%`,
                        background: isPositive
                          ? `linear-gradient(90deg, #00E064, #00C853)`
                          : pct >= 80
                            ? `linear-gradient(90deg, #FF9800, #FFB74D)`
                            : pct >= 60
                              ? `linear-gradient(90deg, #E53935, #FF1744)`
                              : `linear-gradient(90deg, #7B1FA2, #B71C1C)`,
                      }}
                    />
                    {pct >= 100 && (
                      <div className="absolute left-0 top-0 h-full border-r-2 border-white/30" style={{ width: `${(100 / 130) * 100}%` }} />
                    )}
                  </div>
                  <span className={`text-xs font-bold w-[52px] shrink-0 text-right ${
                    isPositive ? "text-emerald-400" : pct >= 80 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-6">
          <h3 className="font-display font-bold text-white text-lg">% выполнения по месяцам</h3>
          <p className="text-white/40 text-xs mt-0.5">Динамика процента выполнения плана</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData.filter(d => d.fact > 0)} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPct" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => `${v}%`} domain={[0, 'auto']} />
            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Выполнение"]}
              contentStyle={{ background: "rgba(15,10,30,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              itemStyle={{ color: "#fff" }} />
            <Area type="monotone" dataKey="pct" stroke="#7C5CFF" strokeWidth={3}
              fill="url(#gradPct)" dot={{ fill: "#7C5CFF", r: 5 }} activeDot={{ r: 7 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-white text-lg">План vs Факт по городам</h3>
            <p className="text-white/40 text-xs mt-0.5">{selectedMonth ? MONTH_LABELS[selectedMonth] : "Суммарно за период"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(167,139,250,0.4)", border: "1px dashed #A78BFA" }} />
              <span className="text-xs text-white/40">План</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: "#00FFCC" }} />
              <span className="text-xs text-white/40">Факт</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {barData.map((d, idx) => {
            const maxVal = Math.max(...barData.map(b => Math.max(b.plan, b.fact)));
            const planW = maxVal > 0 ? (d.plan / maxVal) * 100 : 0;
            const factW = maxVal > 0 ? (d.fact / maxVal) * 100 : 0;
            const pct = d.pct;
            const factColor = pct >= 100
              ? "linear-gradient(90deg, #00FF7F, #00FF50)"
              : pct >= 80
                ? "linear-gradient(90deg, #FFD600, #FFAB00)"
                : "linear-gradient(90deg, #FF1744, #FF0033)";
            const factShadow = pct >= 100
              ? "0 0 20px rgba(0,255,127,0.5), 0 0 40px rgba(0,255,80,0.2)"
              : pct >= 80
                ? "0 0 20px rgba(255,214,0,0.5), 0 0 40px rgba(255,171,0,0.2)"
                : "0 0 20px rgba(255,23,68,0.5), 0 0 40px rgba(255,0,51,0.2)";
            return (
              <div key={d.name} className="group cursor-pointer" onClick={() => setSelectedCity(d.name)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-emerald-500/20 text-emerald-400" :
                      idx === barData.length - 1 ? "bg-red-500/20 text-red-400" :
                      "bg-white/10 text-white/40"
                    }`}>{idx + 1}</span>
                    <span className="text-sm text-white/80 font-medium group-hover:text-white transition-colors">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/30">{fmtMoney(d.fact)} / {fmtMoney(d.plan)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      pct >= 100 ? "bg-emerald-500/15 text-emerald-400" :
                      pct >= 80 ? "bg-amber-500/15 text-amber-400" :
                      "bg-red-500/15 text-red-400"
                    }`}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-7 rounded-lg bg-white/[0.03] overflow-hidden group-hover:bg-white/[0.06] transition-colors">
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                    style={{ width: `${planW}%`, background: "rgba(167,139,250,0.15)", borderRight: "2px dashed rgba(167,139,250,0.5)" }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                    style={{ width: `${factW}%`, background: factColor, boxShadow: factShadow }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}