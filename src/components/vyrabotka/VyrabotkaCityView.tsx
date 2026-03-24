import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import Icon from "@/components/ui/icon";
import {
  type CityData,
  MONTHS,
  MONTH_LABELS,
  AnimatedNumber,
  fmtMoney,
  fmtFull,
  pctBg,
  getCityTotals,
  CustomTooltip,
} from "./VyrabotkaUtils";

interface MonthlyDataItem {
  name: string;
  shortName: string;
  plan: number;
  fact: number;
  pct: number;
}

interface Props {
  selectedCity: string;
  DATA: CityData[];
  activeMonths: string[];
  monthlyData: MonthlyDataItem[];
  totalPlan: number;
  totalFact: number;
  totalDiff: number;
  totalPct: number;
  kpiKey: string;
  isLight: boolean;
  axisColor: string;
  cityRanking: (CityData & { plan: number; fact: number; diff: number; pct: number })[];
}

function EfficiencyGauge({ value, label, color, max = 100 }: { value: number; label: string; color: string; max?: number }) {
  const pct = Math.min(value / max, 1);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct * 0.75);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
            strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 6px ${color}40)` }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{value.toFixed(0)}</span>
        </div>
      </div>
      <span className="text-[10px] text-white/50 mt-1 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function VyrabotkaCityView({
  selectedCity, DATA, activeMonths, monthlyData,
  totalPlan, totalFact, totalDiff, totalPct,
  kpiKey, isLight, axisColor, cityRanking,
}: Props) {
  const cd = DATA.find(d => d.city === selectedCity)!;
  if (!cd) return null;

  const monthsWithFact = activeMonths.filter(m => cd.months[m]?.fact > 0);
  const monthsData = monthsWithFact.map(m => ({ m, ...cd.months[m] }));

  const bestMonth = monthsData.length > 0
    ? monthsData.reduce((a, b) => (b.plan > 0 && (b.fact / b.plan) > (a.plan > 0 ? a.fact / a.plan : 0)) ? b : a)
    : null;

  const avgMonthlyFact = monthsWithFact.length > 0
    ? monthsData.reduce((s, d) => s + d.fact, 0) / monthsWithFact.length
    : 0;
  const yearForecast = avgMonthlyFact * 12;
  const yearPlan = activeMonths.reduce((s, m) => s + (cd.months[m]?.plan || 0), 0);

  let cumPlan = 0, cumFact = 0;
  const cumulativeData = activeMonths.map(m => {
    const md = cd.months[m];
    if (md) { cumPlan += md.plan; cumFact += md.fact; }
    return { name: MONTH_LABELS[m], cumPlan, cumFact };
  });

  const allCitiesFactTotal = DATA.reduce((s, d) => {
    activeMonths.forEach(m => { s += d.months[m]?.fact || 0; });
    return s;
  }, 0);
  const cityFactTotal = monthsData.reduce((s, d) => s + d.fact, 0);
  const shareOfTotal = allCitiesFactTotal > 0 ? (cityFactTotal / allCitiesFactTotal) * 100 : 0;

  const cityTotals = getCityTotals(cd, activeMonths);
  const planExecution = cityTotals.pct;
  const stability = monthsData.length > 1
    ? (() => {
        const pcts = monthsData.map(d => d.plan > 0 ? (d.fact / d.plan) * 100 : 0);
        const avg = pcts.reduce((s, p) => s + p, 0) / pcts.length;
        const variance = pcts.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / pcts.length;
        const cv = avg > 0 ? (Math.sqrt(variance) / avg) * 100 : 100;
        return Math.max(0, Math.min(100, 100 - cv));
      })()
    : 50;
  const growthTrend = monthsData.length >= 2
    ? (() => {
        const last = monthsData[monthsData.length - 1];
        const prev = monthsData[monthsData.length - 2];
        const lastPct = last.plan > 0 ? (last.fact / last.plan) * 100 : 0;
        const prevPct = prev.plan > 0 ? (prev.fact / prev.plan) * 100 : 0;
        return Math.max(0, Math.min(100, 50 + (lastPct - prevPct)));
      })()
    : 50;
  const rank = cityRanking.findIndex(c => c.city === selectedCity) + 1;
  const rankScore = cityRanking.length > 1
    ? ((cityRanking.length - rank) / (cityRanking.length - 1)) * 100
    : 50;

  const radarData = [
    { metric: "Выполнение", value: Math.min(planExecution, 120), fullMark: 120 },
    { metric: "Стабильность", value: stability, fullMark: 100 },
    { metric: "Динамика", value: growthTrend, fullMark: 100 },
    { metric: "Рейтинг", value: rankScore, fullMark: 100 },
    { metric: "Доля рынка", value: Math.min(shareOfTotal * 5, 100), fullMark: 100 },
  ];

  const overallScore = (planExecution * 0.4 + stability * 0.2 + growthTrend * 0.15 + rankScore * 0.15 + Math.min(shareOfTotal * 5, 100) * 0.1);
  const scoreColor = overallScore >= 80 ? "#00E064" : overallScore >= 60 ? "#FF9800" : "#FF2244";
  const scoreLabel = overallScore >= 80 ? "Отлично" : overallScore >= 60 ? "Хорошо" : overallScore >= 40 ? "Средне" : "Критично";

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(124,92,255,0.35)" }}>
              <Icon name="Percent" size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">от компании</span>
          </div>
          <p className="text-white/50 text-xs mb-1">Доля в общей выработке</p>
          <p className="font-display text-2xl font-bold text-gradient-violet">
            <AnimatedNumber value={`${shareOfTotal.toFixed(1)}%`} key2={kpiKey + "share"} />
          </p>
        </div>

        <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl gradient-cyan flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,229,204,0.35)" }}>
              <Icon name="Calculator" size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">среднее</span>
          </div>
          <p className="text-white/50 text-xs mb-1">Средний факт / мес</p>
          <p className="font-display text-2xl font-bold text-gradient-cyan">
            <AnimatedNumber value={fmtMoney(avgMonthlyFact)} key2={kpiKey + "avg"} />
          </p>
        </div>

        <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${yearForecast >= yearPlan ? "gradient-green" : "gradient-pink"} flex items-center justify-center`}
              style={{ boxShadow: yearForecast >= yearPlan ? "0 8px 24px rgba(0,212,106,0.35)" : "0 8px 24px rgba(255,60,172,0.35)" }}>
              <Icon name="Rocket" size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">прогноз</span>
          </div>
          <p className="text-white/50 text-xs mb-1">Прогноз на год</p>
          <p className={`font-display text-2xl font-bold ${yearForecast >= yearPlan ? "text-gradient-green" : "text-gradient-pink"}`}>
            <AnimatedNumber value={fmtMoney(yearForecast)} key2={kpiKey + "forecast"} />
          </p>
        </div>

        <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,212,106,0.35)" }}>
              <Icon name="Trophy" size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">лучший мес.</span>
          </div>
          <p className="text-white/50 text-xs mb-1">Лучший месяц</p>
          <p className="font-display text-2xl font-bold text-gradient-green">
            {bestMonth ? MONTH_LABELS[bestMonth.m] : "—"}
          </p>
        </div>
      </div>

      {/* Эффективность клиники */}
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-6">
          <h3 className="font-display font-bold text-white text-lg">
            <Icon name="Activity" size={20} className="inline mr-2 text-violet-400" />
            Эффективность клиники
          </h3>
          <p className="text-white/40 text-xs mt-0.5">Комплексная оценка по 5 метрикам</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-4">
              <EfficiencyGauge value={overallScore} label="" color={scoreColor} max={100} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${scoreColor}20`, color: scoreColor }}>
                  {scoreLabel}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-4 w-full max-w-md">
              <EfficiencyGauge value={planExecution} label="Выполнение плана" color="#7C5CFF" max={120} />
              <EfficiencyGauge value={stability} label="Стабильность" color="#00E5CC" />
              <EfficiencyGauge value={growthTrend} label="Динамика роста" color="#FF9800" />
              <EfficiencyGauge value={rankScore} label="Позиция в рейтинге" color="#00E064" />
              <EfficiencyGauge value={Math.min(shareOfTotal * 5, 100)} label="Доля рынка" color="#FF3CAC" />
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 120]} />
                <Radar name={selectedCity} dataKey="value" stroke={scoreColor} fill={scoreColor} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-6">
          <h3 className="font-display font-bold text-white text-lg">{selectedCity} · План vs Факт</h3>
          <p className="text-white/40 text-xs mt-0.5">По месяцам · 2026</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => fmtMoney(v)} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="plan" name="План" fill="#7C5CFF" radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="fact" name="Факт" fill="#00E5CC" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">Нарастающий итог</h3>
            <p className="text-white/40 text-xs mt-0.5">Накопительный план vs факт</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cumulativeData} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCumPlan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C5CFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCumFact" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5CC" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E5CC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
              <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => fmtMoney(v)} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cumPlan" name="План (нараст.)" stroke="#7C5CFF" strokeWidth={2}
                fill="url(#gradCumPlan)" dot={{ fill: "#7C5CFF", r: 4 }} />
              <Area type="monotone" dataKey="cumFact" name="Факт (нараст.)" stroke="#00E5CC" strokeWidth={2}
                fill="url(#gradCumFact)" dot={{ fill: "#00E5CC", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">% выполнения плана</h3>
            <p className="text-white/40 text-xs mt-0.5">Динамика по месяцам</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData.filter(d => d.fact > 0)} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPctCity" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#gradPctCity)" dot={{ fill: "#7C5CFF", r: 5 }} activeDot={{ r: 7 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-6">
          <h3 className="font-display font-bold text-white text-lg">Отклонение по месяцам</h3>
          <p className="text-white/40 text-xs mt-0.5">Перевыполнение / недовыполнение</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyData.filter(d => d.fact > 0).map(d => ({ ...d, deviation: d.fact - d.plan }))} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => fmtMoney(v)} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="deviation" name="Отклонение" radius={[4, 4, 0, 0]} barSize={32}>
              {monthlyData.filter(d => d.fact > 0).map((d, i) => (
                <Cell key={i} fill={d.fact - d.plan >= 0 ? "#00E064" : "#FF2244"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-6">
          <h3 className="font-display font-bold text-white text-lg">{selectedCity} · Помесячная детализация</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/50 font-medium py-3 px-3">Месяц</th>
                <th className="text-right text-white/50 font-medium py-3 px-3">План</th>
                <th className="text-right text-white/50 font-medium py-3 px-3">Факт</th>
                <th className="text-right text-white/50 font-medium py-3 px-3">Отклонение</th>
                <th className="text-right text-white/50 font-medium py-3 px-3">%</th>
              </tr>
            </thead>
            <tbody>
              {activeMonths.map(m => {
                const md = cd.months[m];
                if (!md) return null;
                const diff = md.fact - md.plan;
                const pct = md.plan > 0 ? (md.fact / md.plan) * 100 : 0;
                return (
                  <tr key={m} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 text-white font-medium">{MONTH_LABELS[m]}</td>
                    <td className="py-3 px-3 text-right text-white/70">{fmtFull(md.plan)}</td>
                    <td className="py-3 px-3 text-right text-white">{md.fact > 0 ? fmtFull(md.fact) : "—"}</td>
                    <td className={`py-3 px-3 text-right font-semibold ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {md.fact > 0 ? ((diff >= 0 ? "+" : "") + fmtFull(diff)) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {md.fact > 0 ? (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctBg(pct)}`}>
                          {pct.toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/20">
                <td className="py-3 px-3 text-white font-bold">Итого</td>
                <td className="py-3 px-3 text-right text-white font-bold">{fmtFull(totalPlan)}</td>
                <td className="py-3 px-3 text-right text-white font-bold">{fmtFull(totalFact)}</td>
                <td className={`py-3 px-3 text-right font-bold ${totalDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(totalDiff >= 0 ? "+" : "") + fmtFull(totalDiff)}
                </td>
                <td className="py-3 px-3 text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctBg(totalPct)}`}>
                    {totalPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
