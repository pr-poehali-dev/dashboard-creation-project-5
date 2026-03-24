import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import funcUrls from "../../backend/func2url.json";

interface CityMonthData {
  plan: number;
  fact: number;
}

interface CityData {
  city: string;
  months: Record<string, CityMonthData>;
}

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTH_LABELS: Record<string, string> = {
  "Январь": "Январь", "Февраль": "Февраль", "Март": "Март", "Апрель": "Апрель",
  "Май": "Май", "Июнь": "Июнь", "Июль": "Июль", "Август": "Август",
  "Сентябрь": "Сентябрь", "Октябрь": "Октябрь", "Ноябрь": "Ноябрь", "Декабрь": "Декабрь",
};

const PIE_COLORS = [
  "#6C3FFF", "#00FFDD", "#FF007A", "#FF6B00",
  "#00E064", "#0077FF", "#FFD000", "#FF2244",
  "#CC00FF", "#FF6EC7", "#00C2FF", "#FFB800",
  "#7C5CFF", "#00E5CC", "#FF3CAC", "#FF9500",
];

const DASHBOARD_ID = 6;

function AnimatedNumber({ value, key2 }: { value: string | number; key2?: string }) {
  const [displayed, setDisplayed] = useState("0");
  const strVal = String(value);
  useEffect(() => {
    const numeric = parseFloat(strVal.replace(/\s/g, "").replace(",", "."));
    if (isNaN(numeric)) { setDisplayed(strVal); return; }
    const steps = 30;
    const step = numeric / steps;
    let cur = 0, count = 0;
    const iv = setInterval(() => {
      cur += step; count++;
      if (count >= steps) { setDisplayed(strVal); clearInterval(iv); return; }
      setDisplayed(Math.floor(cur).toLocaleString("ru-RU"));
    }, 800 / steps);
    return () => clearInterval(iv);
  }, [strVal, key2]);
  return <span>{displayed}</span>;
}

function fmtMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} тыс`;
  return v.toFixed(0);
}

function fmtFull(v: number): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

function pctColor(pct: number): string {
  if (pct >= 100) return "text-emerald-400";
  if (pct >= 80) return "text-amber-400";
  return "text-red-400";
}

function pctBg(pct: number): string {
  if (pct >= 100) return "bg-emerald-500/20 text-emerald-400";
  if (pct >= 80) return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

interface TPayload { color: string; name: string; value: number; }
interface TTooltip { active?: boolean; payload?: TPayload[]; label?: string; }
const CustomTooltip = ({ active, payload, label }: TTooltip) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 180 }}>
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="font-semibold text-white ml-auto pl-2">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: TTooltip) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 140 }}>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
        <span className="text-white/70">{p.name}</span>
      </div>
      <p className="text-white font-semibold mt-1">{fmtFull(p.value)}</p>
    </div>
  );
};

export default function VyrabotkaView() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)";

  const [DATA, setDATA] = useState<CityData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    const url = `${funcUrls["dashboard-data"]}?dashboard_id=${DASHBOARD_ID}`;
    fetch(url)
      .then(r => r.json())
      .then((rows: Array<{ id: number; city: string; plan: number; fact: number }>) => {
        const cityMap: Record<string, Record<string, CityMonthData>> = {};
        rows.forEach(r => {
          const sep = r.city.lastIndexOf(" — ");
          if (sep === -1) return;
          const cityName = r.city.substring(0, sep);
          const month = r.city.substring(sep + 3);
          if (!cityMap[cityName]) cityMap[cityName] = {};
          cityMap[cityName][month] = { plan: r.plan, fact: r.fact };
        });
        const mapped: CityData[] = Object.entries(cityMap).map(([city, months]) => ({ city, months }));
        setDATA(mapped);
      })
      .catch(e => console.error("Failed to load vyrabotka data", e))
      .finally(() => setDataLoading(false));
  }, []);

  const activeMonths = MONTHS;

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
          Загрузка данных...
        </div>
      </div>
    );
  }

  const getCityTotals = (city: CityData, month?: string | null) => {
    let plan = 0, fact = 0;
    const ms = month ? [month] : activeMonths;
    ms.forEach(m => {
      const md = city.months[m];
      if (md) { plan += md.plan; fact += md.fact; }
    });
    return { plan, fact, diff: fact - plan, pct: plan > 0 ? (fact / plan) * 100 : 0 };
  };

  const filteredData = selectedCity ? DATA.filter(d => d.city === selectedCity) : DATA;

  let totalPlan = 0, totalFact = 0;
  filteredData.forEach(d => {
    const t = getCityTotals(d, selectedMonth);
    totalPlan += t.plan;
    totalFact += t.fact;
  });
  const totalDiff = totalFact - totalPlan;
  const totalPct = totalPlan > 0 ? (totalFact / totalPlan) * 100 : 0;

  const cityRanking = DATA.map(d => {
    const t = getCityTotals(d, selectedMonth);
    return { ...d, ...t };
  }).filter(c => c.plan > 0).sort((a, b) => b.pct - a.pct);

  const bestCity = cityRanking[0];
  const worstCity = cityRanking[cityRanking.length - 1];

  const monthlyData = activeMonths.map(m => {
    let plan = 0, fact = 0;
    filteredData.forEach(d => {
      const md = d.months[m];
      if (md) { plan += md.plan; fact += md.fact; }
    });
    return { name: MONTH_LABELS[m] || m, shortName: m, plan, fact, pct: plan > 0 ? ((fact / plan) * 100) : 0 };
  });

  const barData = DATA.map(d => {
    const t = getCityTotals(d, selectedMonth);
    return { name: d.city, plan: t.plan, fact: t.fact, pct: t.pct };
  }).sort((a, b) => b.plan - a.plan);

  const pieDataFact = DATA.map((d, i) => {
    const t = getCityTotals(d, selectedMonth);
    return { name: d.city, value: t.fact, color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const deviationData = DATA.map(d => {
    const t = getCityTotals(d, selectedMonth);
    return { name: d.city, value: t.diff, pct: t.pct };
  }).filter(d => d.value !== 0).sort((a, b) => b.value - a.value);

  const kpiKey = `${selectedCity || "all"}-${selectedMonth || "all"}`;

  const kpiCards = selectedCity
    ? (() => {
        const ct = getCityTotals(DATA.find(d => d.city === selectedCity)!, selectedMonth);
        const rank = cityRanking.findIndex(c => c.city === selectedCity) + 1;
        return [
          {
            label: `План · ${selectedCity}`,
            value: fmtMoney(ct.plan),
            icon: "Target",
            gradient: "gradient-violet",
            textGradient: "text-gradient-violet",
            glow: "rgba(124,92,255,0.35)",
            sub: selectedMonth ? MONTH_LABELS[selectedMonth] : "За период",
          },
          {
            label: `Факт · ${selectedCity}`,
            value: fmtMoney(ct.fact),
            icon: "TrendingUp",
            gradient: "gradient-cyan",
            textGradient: "text-gradient-cyan",
            glow: "rgba(0,229,204,0.35)",
            sub: `${ct.pct.toFixed(1)}% от плана`,
          },
          {
            label: "Отклонение",
            value: (ct.diff >= 0 ? "+" : "") + fmtMoney(ct.diff),
            icon: ct.diff >= 0 ? "ArrowUpRight" : "ArrowDownRight",
            gradient: ct.diff >= 0 ? "gradient-green" : "gradient-pink",
            textGradient: ct.diff >= 0 ? "text-gradient-green" : "text-gradient-pink",
            glow: ct.diff >= 0 ? "rgba(0,212,106,0.35)" : "rgba(255,60,172,0.35)",
            sub: fmtFull(Math.abs(ct.diff)),
          },
          {
            label: "Место в рейтинге",
            value: `${rank} из ${cityRanking.length}`,
            icon: "Award",
            gradient: rank <= 3 ? "gradient-green" : rank <= 10 ? "gradient-violet" : "gradient-pink",
            textGradient: rank <= 3 ? "text-gradient-green" : rank <= 10 ? "text-gradient-violet" : "text-gradient-pink",
            glow: rank <= 3 ? "rgba(0,212,106,0.35)" : "rgba(124,92,255,0.35)",
            sub: `${ct.pct.toFixed(1)}% выполнения`,
          },
        ];
      })()
    : [
        {
          label: "Общий план",
          value: fmtMoney(totalPlan),
          icon: "Target",
          gradient: "gradient-violet",
          textGradient: "text-gradient-violet",
          glow: "rgba(124,92,255,0.35)",
          sub: `${DATA.length} городов`,
        },
        {
          label: "Общий факт",
          value: fmtMoney(totalFact),
          icon: "TrendingUp",
          gradient: "gradient-cyan",
          textGradient: "text-gradient-cyan",
          glow: "rgba(0,229,204,0.35)",
          sub: `${totalPct.toFixed(1)}% от плана`,
        },
        {
          label: "Отклонение",
          value: (totalDiff >= 0 ? "+" : "") + fmtMoney(totalDiff),
          icon: totalDiff >= 0 ? "ArrowUpRight" : "ArrowDownRight",
          gradient: totalDiff >= 0 ? "gradient-green" : "gradient-pink",
          textGradient: totalDiff >= 0 ? "text-gradient-green" : "text-gradient-pink",
          glow: totalDiff >= 0 ? "rgba(0,212,106,0.35)" : "rgba(255,60,172,0.35)",
          sub: selectedMonth ? MONTH_LABELS[selectedMonth] : "За период",
        },
        {
          label: "Лучший город",
          value: bestCity?.city ?? "—",
          icon: "Award",
          gradient: "gradient-green",
          textGradient: "text-gradient-green",
          glow: "rgba(0,212,106,0.35)",
          sub: bestCity ? `${bestCity.pct.toFixed(1)}%` : "",
        },
      ];

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="MapPin" size={14} className="text-violet-400" />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Город</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCity(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                !selectedCity ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
              }`}>
              Все города
            </button>
            {DATA.map(d => (
              <button key={d.city}
                onClick={() => setSelectedCity(selectedCity === d.city ? null : d.city)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  selectedCity === d.city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                }`}>
                {d.city}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/8" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Calendar" size={14} className="text-cyan-400" />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Месяц</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedMonth(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                !selectedMonth ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
              }`}>
              Все месяцы
            </button>
            {activeMonths.map(m => (
              <button key={m}
                onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                }`}>
                {MONTH_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={card.label + kpiKey} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
                style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
                <Icon name={card.icon} size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">{card.sub}</span>
            </div>
            <p className="text-white/50 text-xs mb-1">{card.label}</p>
            <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
              <AnimatedNumber value={card.value} key2={kpiKey} />
            </p>
          </div>
        ))}
      </div>

      {selectedCity ? (
        (() => {
          const cd = DATA.find(d => d.city === selectedCity)!;
          const monthsWithFact = activeMonths.filter(m => cd.months[m]?.fact > 0);
          const monthsData = monthsWithFact.map(m => ({ m, ...cd.months[m] }));

          const bestMonth = monthsData.length > 0
            ? monthsData.reduce((a, b) => (b.plan > 0 && (b.fact / b.plan) > (a.plan > 0 ? a.fact / a.plan : 0)) ? b : a)
            : null;
          const worstMonthItem = monthsData.length > 0
            ? monthsData.reduce((a, b) => (b.plan > 0 && (b.fact / b.plan) < (a.plan > 0 ? a.fact / a.plan : 999)) ? b : a)
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

          return (
            <>
              {/* CITY: Extra insight cards */}
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

              {/* CITY: Monthly dynamics */}
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

              {/* CITY: Cumulative + % выполнения */}
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

              {/* CITY: Deviation bar */}
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

              {/* CITY: Detail table */}
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
        })()
      ) : (
        <>
          {/* ALL CITIES VIEW: Monthly dynamics + Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up">
              <div className="mb-6">
                <h3 className="font-display font-bold text-white text-lg">Динамика по месяцам</h3>
                <p className="text-white/40 text-xs mt-0.5">План vs Факт · 2026</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => fmtMoney(v)} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="plan" name="План" fill="#7C5CFF" radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="fact" name="Факт" fill="#00E5CC" radius={[4, 4, 0, 0]} barSize={28} />
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

          {/* ALL CITIES VIEW: Pie + Deviation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 animate-fade-in-up">
              <div className="mb-6">
                <h3 className="font-display font-bold text-white text-lg">Доля городов в выработке</h3>
                <p className="text-white/40 text-xs mt-0.5">Фактическая выработка</p>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieDataFact} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                      dataKey="value" nameKey="name" paddingAngle={2}>
                      {pieDataFact.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full lg:w-auto">
                  {pieDataFact.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-white/60 truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 animate-fade-in-up">
              <div className="mb-6">
                <h3 className="font-display font-bold text-white text-lg">Отклонение от плана</h3>
                <p className="text-white/40 text-xs mt-0.5">Перевыполнение / недовыполнение</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deviationData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
                  <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => fmtMoney(v)} />
                  <YAxis dataKey="name" type="category" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false}
                    tickLine={false} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Отклонение" radius={[0, 4, 4, 0]} barSize={16}>
                    {deviationData.map((entry, i) => (
                      <Cell key={i} fill={entry.value >= 0 ? "#00E064" : "#FF2244"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ALL CITIES VIEW: % выполнения */}
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

          {/* ALL CITIES VIEW: Horizontal bar */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="mb-6">
              <h3 className="font-display font-bold text-white text-lg">План vs Факт по городам</h3>
              <p className="text-white/40 text-xs mt-0.5">{selectedMonth ? MONTH_LABELS[selectedMonth] : "Суммарно за период"}</p>
            </div>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} />
                <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => fmtMoney(v)} />
                <YAxis dataKey="name" type="category" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false}
                  tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="plan" name="План" fill="#7C5CFF" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="fact" name="Факт" fill="#00E5CC" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ALL CITIES VIEW: Summary table */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="mb-6">
              <h3 className="font-display font-bold text-white text-lg">Сводная таблица</h3>
              <p className="text-white/40 text-xs mt-0.5">Все города · {selectedMonth ? MONTH_LABELS[selectedMonth] : "Суммарно"}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/50 font-medium py-3 px-3">#</th>
                    <th className="text-left text-white/50 font-medium py-3 px-3">Город</th>
                    <th className="text-right text-white/50 font-medium py-3 px-3">План</th>
                    <th className="text-right text-white/50 font-medium py-3 px-3">Факт</th>
                    <th className="text-right text-white/50 font-medium py-3 px-3">Отклонение</th>
                    <th className="text-right text-white/50 font-medium py-3 px-3">%</th>
                  </tr>
                </thead>
                <tbody>
                  {cityRanking.map((d, i) => (
                    <tr key={d.city}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedCity(d.city)}>
                      <td className="py-3 px-3 text-white/40 text-xs">{i + 1}</td>
                      <td className="py-3 px-3 text-white font-medium">{d.city}</td>
                      <td className="py-3 px-3 text-right text-white/70">{fmtFull(d.plan)}</td>
                      <td className="py-3 px-3 text-right text-white">{d.fact > 0 ? fmtFull(d.fact) : "—"}</td>
                      <td className={`py-3 px-3 text-right font-semibold ${d.diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {d.fact > 0 ? ((d.diff >= 0 ? "+" : "") + fmtFull(d.diff)) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {d.fact > 0 ? (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctBg(d.pct)}`}>
                            {d.pct.toFixed(1)}%
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20">
                    <td className="py-3 px-3"></td>
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
      )}
    </div>
  );
}