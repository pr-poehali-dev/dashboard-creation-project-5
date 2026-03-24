import {
  BarChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
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

function SpeedometerGauge({ value, label, scoreLabel, color }: { value: number; label: string; scoreLabel: string; color: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const totalTicks = 40;
  const startAngle = -210;
  const endAngle = 30;
  const angleRange = endAngle - startAngle;
  const needleAngle = startAngle + (clamped / 100) * angleRange;
  const cx = 150, cy = 140, r = 110;
  const filledTicks = Math.round((clamped / 100) * totalTicks);

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const angle = startAngle + (i / (totalTicks - 1)) * angleRange;
    const rad = (angle * Math.PI) / 180;
    const innerR = r - 14;
    const outerR = r;
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
      filled: i < filledTicks,
    };
  });

  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = r - 30;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-white mb-2">{clamped.toFixed(0)}%</p>
      <svg viewBox="0 0 300 175" className="w-full max-w-[280px]">
        <defs>
          <linearGradient id="tickGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.filled ? "url(#tickGrad)" : "rgba(255,255,255,0.1)"}
            strokeWidth={3} strokeLinecap="round"
            style={{ transition: `stroke 0.05s ease ${i * 20}ms` }} />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={color} strokeWidth={3} strokeLinecap="round"
          filter="url(#needleGlow)"
          style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <circle cx={cx} cy={cy} r={6} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        <circle cx={cx} cy={cy} r={3} fill="#0f0a1e" />
        <text x={40} y={170} fill="rgba(255,255,255,0.35)" fontSize="12" textAnchor="middle">0</text>
        <text x={260} y={170} fill="rgba(255,255,255,0.35)" fontSize="12" textAnchor="middle">100%</text>
      </svg>
      <span className="text-sm font-bold px-4 py-1.5 rounded-full -mt-2" style={{ background: `${color}20`, color }}>
        {scoreLabel}
      </span>
    </div>
  );
}

function MetricBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-28 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
          }} />
      </div>
      <span className="text-sm font-semibold text-white/80 w-12 text-right">{value.toFixed(0)}%</span>
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

  const overallScore = Math.min((planExecution * 0.4 + stability * 0.2 + growthTrend * 0.15 + rankScore * 0.15 + Math.min(shareOfTotal * 5, 100) * 0.1), 100);
  const scoreColor = overallScore >= 80 ? "#00E064" : overallScore >= 60 ? "#FF9800" : "#FF2244";
  const scoreLabel = overallScore >= 80 ? "Отлично" : overallScore >= 60 ? "Хорошо" : overallScore >= 40 ? "Средне" : "Критично";

  const efficiencyMetrics = [
    { label: "Выполнение плана", value: Math.min(planExecution, 100), color: "#7C5CFF" },
    { label: "Стабильность", value: stability, color: "#00E5CC" },
    { label: "Динамика роста", value: growthTrend, color: "#FF9800" },
    { label: "Позиция в рейтинге", value: rankScore, color: "#00E064" },
    { label: "Доля рынка", value: Math.min(shareOfTotal * 5, 100), color: "#FF3CAC" },
  ];

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
        <div className="flex flex-col items-center">
          <SpeedometerGauge value={overallScore} label="Общий балл" scoreLabel={scoreLabel} color={scoreColor} />
          <div className="w-full max-w-lg mt-6 flex flex-col gap-3">
            {efficiencyMetrics.map((m) => (
              <MetricBar key={m.label} label={m.label} value={m.value} color={m.color} />
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-white text-lg">Динамика по месяцам</h3>
            <p className="text-white/40 text-xs mt-0.5">План vs Факт · 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#7C5CFF" }} />
              <span className="text-xs text-white/50">План</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#00E5CC" }} />
              <span className="text-xs text-white/50">Факт</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData.filter(d => d.plan > 0 || d.fact > 0)} margin={{ top: 20, right: 5, left: 10, bottom: 0 }} barCategoryGap="8%" barGap={2}>
            <defs>
              <linearGradient id="gradBarPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B7FFF" stopOpacity={1} />
                <stop offset="100%" stopColor="#5A3ADB" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradBarFact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00FFE0" stopOpacity={1} />
                <stop offset="100%" stopColor="#00B8A3" stopOpacity={0.8} />
              </linearGradient>
              <filter id="barGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v: number) => fmtMoney(v)} width={70} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)", radius: 8 }} />
            <Bar dataKey="plan" name="План" fill="url(#gradBarPlan)" radius={[6, 6, 0, 0]}
              label={({ x, y, width: w, value }: { x: number; y: number; width: number; value: number }) =>
                value > 0 ? (
                  <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={10}>
                    {fmtMoney(value)}
                  </text>
                ) : null
              }
            />
            <Bar dataKey="fact" name="Факт" radius={[6, 6, 0, 0]}
              label={({ x, y, width: w, value }: { x: number; y: number; width: number; value: number }) =>
                value > 0 ? (
                  <text x={x + w / 2} y={y - 6} textAnchor="middle" fill="rgba(0,229,204,0.6)" fontSize={10} fontWeight={600}>
                    {fmtMoney(value)}
                  </text>
                ) : null
              }
            >
              {monthlyData.map((entry, index) => (
                <Cell key={`fact-${index}`}
                  fill={entry.plan > 0 && entry.fact >= entry.plan ? "url(#gradBarFact)" : entry.fact > 0 ? "#00C4AB" : "transparent"}
                />
              ))}
            </Bar>
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
              <Area type="natural" dataKey="cumPlan" name="План (нараст.)" stroke="#7C5CFF" strokeWidth={2}
                fill="url(#gradCumPlan)" dot={{ fill: "#7C5CFF", r: 3, strokeWidth: 0 }} />
              <Area type="natural" dataKey="cumFact" name="Факт (нараст.)" stroke="#00E5CC" strokeWidth={2}
                fill="url(#gradCumFact)" dot={{ fill: "#00E5CC", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">% выполнения плана</h3>
            <p className="text-white/40 text-xs mt-0.5">Динамика по месяцам</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyData.filter(d => d.fact > 0)} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPctAbove" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5CC" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00E5CC" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradPctBelow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0.02} />
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
              <ReferenceLine y={100} stroke={isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)"} strokeDasharray="6 4" strokeWidth={1.5}
                label={{ value: "100%", position: "right", fill: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.35)", fontSize: 11 }} />
              <Area type="natural" dataKey="pct" stroke="url(#)" strokeWidth={0} fill="url(#gradPctBelow)" />
              <Area type="natural" dataKey="pct" name="Выполнение"
                stroke={(() => { const filtered = monthlyData.filter(d => d.fact > 0); const last = filtered[filtered.length - 1]; return last && last.pct >= 100 ? "#00E5CC" : "#7C5CFF"; })()}
                strokeWidth={2.5}
                fill="none"
                dot={({ cx, cy, payload }: { cx: number; cy: number; payload?: { name?: string; pct?: number } }) => (
                  <circle key={`dot-${payload?.name}`} cx={cx} cy={cy} r={4}
                    fill={payload?.pct >= 100 ? "#00E5CC" : "#7C5CFF"}
                    stroke={isLight ? "#fff" : "#1a1030"} strokeWidth={2} />
                )}
                activeDot={{ r: 6, strokeWidth: 2, stroke: isLight ? "#fff" : "#1a1030" }} />
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