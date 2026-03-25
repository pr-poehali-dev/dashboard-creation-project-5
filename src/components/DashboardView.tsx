import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import { DASHBOARD_DATA_URL } from "@/config/dashboards";
import type { ColumnDef } from "@/config/dashboards";

const PIE_COLORS = [
  "#8B5CF6", "#00BFFF", "#FF6B8A", "#FFB800",
  "#00CC44", "#3B82F6", "#F59E0B", "#EC4899",
  "#A855F7", "#06B6D4", "#EF4444", "#10B981",
];

const MONTHS_ORDER = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

function AnimatedNumber({ value, animKey }: { value: string | number; animKey?: string }) {
  const [displayed, setDisplayed] = useState("0");
  const strVal = String(value);
  useEffect(() => {
    const numeric = parseFloat(strVal.replace(/\s/g, "").replace(",", "."));
    if (isNaN(numeric)) { setDisplayed(strVal); return; }
    const steps = 40;
    const step = numeric / steps;
    let cur = 0, count = 0;
    const iv = setInterval(() => {
      cur += step; count++;
      if (count >= steps) { setDisplayed(strVal); clearInterval(iv); return; }
      setDisplayed(Math.floor(cur).toLocaleString("ru-RU"));
    }, 1200 / steps);
    return () => clearInterval(iv);
  }, [strVal, animKey]);
  return <span>{displayed}</span>;
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
  apiUrl: string;
  columns: ColumnDef[];
  title: string;
  dashboardId?: number;
  readonly?: boolean;
}

export default function DashboardView({ apiUrl, columns, title, dashboardId, readonly = false }: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)";
  const gradId = `gradViolet-${apiUrl.slice(-8)}`;

  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [newCity, setNewCity] = useState("");

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const isUniversalApi = apiUrl === DASHBOARD_DATA_URL || apiUrl.startsWith(DASHBOARD_DATA_URL);
  const fetchUrl = isUniversalApi && dashboardId ? `${DASHBOARD_DATA_URL}?dashboard_id=${dashboardId}` : apiUrl;

  useEffect(() => {
    setAllRows([]);
    setLoading(true);
    setDirty(false);
    setSaved(false);
    setSelectedCity(null);
    setSelectedMonth(null);
    fetch(fetchUrl)
      .then(r => r.json())
      .then(data => {
        const parsed: Row[] = typeof data === "string" ? JSON.parse(data) : data;
        setAllRows(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchUrl]);

  const hasMonths = allRows.some(r => r.month && r.month.length > 0);

  const cities = [...new Set(allRows.map(r => r.city as string))];
  const activeMonths = hasMonths
    ? MONTHS_ORDER.filter(m =>
        allRows.some(r => r.month === m && columns.some(c => (Number(r[c.key]) || 0) > 0))
      )
    : [];
  const allMonths = hasMonths
    ? MONTHS_ORDER.filter(m => allRows.some(r => r.month === m))
    : [];

  const filteredRows = allRows.filter(r => {
    if (selectedCity && r.city !== selectedCity) return false;
    if (hasMonths && selectedMonth && r.month !== selectedMonth) return false;
    return true;
  });

  const rowTotal = (row: Row) => columns.reduce((s, c) => s + (Number(row[c.key]) || 0), 0);
  const colTotal = (key: string) => filteredRows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const grandTotal = filteredRows.reduce((s, r) => s + rowTotal(r), 0);

  const aggregatedByCityRows = (() => {
    const map: Record<string, Row> = {};
    filteredRows.forEach(r => {
      const city = r.city as string;
      if (!map[city]) {
        map[city] = { id: r.id, city };
        columns.forEach(c => { map[city][c.key] = 0; });
      }
      columns.forEach(c => {
        (map[city][c.key] as number) += Number(r[c.key]) || 0;
      });
    });
    return Object.values(map);
  })();

  const aggregatedByMonthRows = (() => {
    if (!hasMonths) return [];
    const map: Record<string, Record<string, number>> = {};
    filteredRows.forEach(r => {
      const m = r.month || "—";
      if (!map[m]) {
        map[m] = {};
        columns.forEach(c => { map[m][c.key] = 0; });
      }
      columns.forEach(c => {
        map[m][c.key] += Number(r[c.key]) || 0;
      });
    });
    return allMonths
      .filter(m => map[m])
      .map(m => ({ month: m, ...map[m], total: columns.reduce((s, c) => s + (map[m][c.key] || 0), 0) }));
  })();

  const colTotals = columns.map((c, i) => ({ ...c, total: colTotal(c.key), color: PIE_COLORS[i % PIE_COLORS.length] }));
  const sorted = [...colTotals].sort((a, b) => b.total - a.total);
  const top1 = sorted[0];
  const top2 = sorted[1];

  const cityBarData = aggregatedByCityRows.map(r => ({ name: r.city as string, total: rowTotal(r) })).sort((a, b) => b.total - a.total);

  const allRowsTotal = allRows.reduce((s, r) => s + columns.reduce((ss, c) => ss + (Number(r[c.key]) || 0), 0), 0);
  const cityShare = selectedCity && allRowsTotal > 0
    ? (grandTotal / allRowsTotal * 100)
    : 0;

  const allCitiesAggregated = (() => {
    const map: Record<string, number> = {};
    allRows.forEach(r => {
      const city = r.city as string;
      if (!map[city]) map[city] = 0;
      map[city] += columns.reduce((s, c) => s + (Number(r[c.key]) || 0), 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  })();
  const cityRank = selectedCity
    ? allCitiesAggregated.findIndex(([c]) => c === selectedCity) + 1
    : 0;
  const totalCities = allCitiesAggregated.length;

  const monthOverMonth = (() => {
    if (!hasMonths || !selectedMonth) return null;
    const currentIdx = MONTHS_ORDER.indexOf(selectedMonth);
    if (currentIdx <= 0) return null;
    const prevMonth = MONTHS_ORDER[currentIdx - 1];

    const currentTotal = allRows
      .filter(r => (!selectedCity || r.city === selectedCity) && r.month === selectedMonth)
      .reduce((s, r) => s + columns.reduce((ss, c) => ss + (Number(r[c.key]) || 0), 0), 0);
    const prevTotal = allRows
      .filter(r => (!selectedCity || r.city === selectedCity) && r.month === prevMonth)
      .reduce((s, r) => s + columns.reduce((ss, c) => ss + (Number(r[c.key]) || 0), 0), 0);

    if (prevTotal === 0) return null;
    const change = ((currentTotal - prevTotal) / prevTotal) * 100;
    return { prevMonth, prevTotal, currentTotal, change };
  })();

  const monthlyTrendData = (() => {
    if (!hasMonths) return [];
    return allMonths.map(m => {
      const monthRows = allRows.filter(r =>
        (!selectedCity || r.city === selectedCity) && r.month === m
      );
      const total = monthRows.reduce((s, r) => s + columns.reduce((ss, c) => ss + (Number(r[c.key]) || 0), 0), 0);
      return { month: m, total };
    }).filter(d => d.total > 0);
  })();

  const top3Reasons = sorted.slice(0, 3).map(item => ({
    ...item,
    pct: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
  }));

  const reasonsByMonth = (() => {
    if (!hasMonths) return [];
    return allMonths.map(m => {
      const monthRows = allRows.filter(r =>
        (!selectedCity || r.city === selectedCity) && r.month === m
      );
      const entry: Record<string, number | string> = { month: m };
      columns.forEach(c => {
        entry[c.key] = monthRows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0);
      });
      return entry;
    }).filter(d => columns.some(c => (d[c.key] as number) > 0));
  })();

  const top3Total = top3Reasons.reduce((s, r) => s + r.total, 0);
  const concentrationPct = grandTotal > 0 ? (top3Total / grandTotal) * 100 : 0;

  const anomalies = (() => {
    if (!hasMonths || allMonths.length < 2) return [];
    const results: { city: string; reason: string; month: string; prev: number; cur: number; pctChange: number; color: string }[] = [];
    const citiesToCheck = selectedCity ? [selectedCity] : cities;
    citiesToCheck.forEach(city => {
      columns.forEach((col, ci) => {
        const monthVals = allMonths.map(m => {
          const rows = allRows.filter(r => r.city === city && r.month === m);
          return rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
        });
        for (let i = 1; i < monthVals.length; i++) {
          const prev = monthVals[i - 1];
          const cur = monthVals[i];
          if (prev === 0 && cur === 0) continue;
          const pctChange = prev > 0 ? ((cur - prev) / prev) * 100 : cur > 5 ? 999 : 0;
          if (Math.abs(pctChange) >= 80 && Math.abs(cur - prev) >= 3) {
            results.push({
              city, reason: col.label, month: allMonths[i],
              prev, cur, pctChange,
              color: PIE_COLORS[ci % PIE_COLORS.length],
            });
          }
        }
      });
    });
    return results.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange)).slice(0, 8);
  })();

  const cityProfileData = (() => {
    if (!selectedCity) return [];
    const cityAgg: Record<string, number> = {};
    const avgAgg: Record<string, number> = {};
    columns.forEach(c => { cityAgg[c.key] = 0; avgAgg[c.key] = 0; });
    allRows.forEach(r => {
      columns.forEach(c => {
        const v = Number(r[c.key]) || 0;
        avgAgg[c.key] += v;
        if (r.city === selectedCity) cityAgg[c.key] += v;
      });
    });
    const numCities = cities.length || 1;
    return columns.map((c, i) => {
      const avg = avgAgg[c.key] / numCities;
      const maxVal = Math.max(cityAgg[c.key], avg, 1);
      return {
        reason: c.label.length > 18 ? c.label.slice(0, 16) + "…" : c.label,
        fullLabel: c.label,
        city: Math.round((cityAgg[c.key] / maxVal) * 100),
        avg: Math.round((avg / maxVal) * 100),
        cityRaw: cityAgg[c.key],
        avgRaw: Math.round(avg),
        color: PIE_COLORS[i % PIE_COLORS.length],
      };
    });
  })();

  const handleChange = (id: number, col: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    setAllRows(prev => prev.map(r => r.id === id ? { ...r, [col]: num } : r));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = isUniversalApi
        ? allRows.map(r => ({ ...r, id: r.id < 0 ? undefined : r.id }))
        : allRows;
      await fetch(fetchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      if (isUniversalApi) {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        setAllRows(typeof data === "string" ? JSON.parse(data) : data);
      }
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const kpiKey = `${selectedCity || "all"}-${selectedMonth || "all"}`;

  const kpiCards = [
    {
      label: selectedCity ? `Всего · ${selectedCity}` : `Всего · ${title}`,
      value: grandTotal.toLocaleString("ru-RU"),
      icon: "BarChart2",
      gradient: "gradient-violet",
      textGradient: "text-gradient-violet",
      glow: "rgba(124,92,255,0.35)",
      sub: monthOverMonth
        ? `${monthOverMonth.change > 0 ? "\u2191" : "\u2193"} ${Math.abs(Math.round(monthOverMonth.change))}% к ${monthOverMonth.prevMonth.toLowerCase()}`
        : selectedMonth || `${aggregatedByCityRows.length} городов`,
      changeType: monthOverMonth ? (monthOverMonth.change > 0 ? "up" : "down") as string | null : null,
    },
    {
      label: "Главная причина",
      value: top1?.label ?? "\u2014",
      icon: "AlertTriangle",
      gradient: "gradient-pink",
      textGradient: "text-gradient-pink",
      glow: "rgba(255,60,172,0.35)",
      sub: top1 ? `${top1.total.toLocaleString("ru-RU")} случаев` : "",
      changeType: null as string | null,
    },
    {
      label: "2-я по частоте",
      value: top2?.label ?? "\u2014",
      icon: "AlertCircle",
      gradient: "gradient-cyan",
      textGradient: "text-gradient-cyan",
      glow: "rgba(0,229,204,0.35)",
      sub: top2 ? `${top2.total.toLocaleString("ru-RU")} случаев` : "",
      changeType: null as string | null,
    },
    ...(selectedCity && cityRank > 0 ? [{
      label: "Рейтинг города",
      value: `${cityRank}-е место`,
      icon: "Trophy",
      gradient: "gradient-green",
      textGradient: "text-gradient-green",
      glow: "rgba(0,212,106,0.35)",
      sub: `из ${totalCities} городов`,
      changeType: null as string | null,
    }] : [{
      label: "Городов с данными",
      value: aggregatedByCityRows.filter(r => rowTotal(r) > 0).length.toLocaleString("ru-RU"),
      icon: "MapPin",
      gradient: "gradient-green",
      textGradient: "text-gradient-green",
      glow: "rgba(0,212,106,0.35)",
      sub: `из ${cities.length}`,
      changeType: null as string | null,
    }]),
    ...(selectedCity && cityShare > 0 ? [{
      label: "Доля от общего",
      value: `${cityShare.toFixed(1)}%`,
      icon: "PieChart",
      gradient: "gradient-violet",
      textGradient: "text-gradient-violet",
      glow: "rgba(99,102,241,0.35)",
      sub: `${grandTotal.toLocaleString("ru-RU")} из ${allRowsTotal.toLocaleString("ru-RU")}`,
      changeType: null as string | null,
    }] : []),
  ];

  const displayRows = hasMonths && !selectedMonth
    ? aggregatedByCityRows
    : filteredRows;

  return (
    <div className="space-y-4">
      {hasMonths && (
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
              {cities.map(city => (
                <button key={city}
                  onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                    selectedCity === city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                  }`}>
                  {city}
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
              {allMonths.map(m => (
                <button key={m}
                  onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                    selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${kpiCards.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
        {kpiCards.map((card, i) => (
          <div key={card.label} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
                style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
                <Icon name={card.icon} size={18} className="text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                card.changeType === 'up' ? 'bg-red-500/15 text-red-400' :
                card.changeType === 'down' ? 'bg-emerald-500/15 text-emerald-400' :
                'bg-white/8 text-white/40'
              }`}>{card.sub}</span>
            </div>
            <p className="text-white/50 text-xs mb-1">{card.label}</p>
            {loading ? (
              <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
                <AnimatedNumber value={card.value} animKey={kpiKey} />
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <ResponsiveContainer width="100%" height={340}>
              <AreaChart data={cityBarData} margin={{ top: 5, right: 5, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} height={60} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Итого"
                  stroke="#8B5CF6" strokeWidth={2.5} fill={`url(#${gradId})`}
                  dot={false} activeDot={{ r: 5, fill: "#8B5CF6", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-4">
            <h3 className="font-display font-bold text-white text-lg">Распределение</h3>
            <p className="text-white/40 text-xs mt-0.5">По типам причин</p>
          </div>
          {loading ? (
            <div className="h-[180px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={colTotals.filter(c => c.total > 0)}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="total" nameKey="label" strokeWidth={0}>
                    {colTotals.filter(c => c.total > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12 }}
                    itemStyle={{ color: isLight ? "rgba(20,10,40,0.7)" : "rgba(255,255,255,0.7)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-1.5 mt-1 max-h-[120px] overflow-y-auto">
                {sorted.filter(c => c.total > 0).map(item => (
                  <div key={item.key} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <span className="text-white/50 text-xs truncate flex-1">{item.label}</span>
                    <span className="text-white text-xs font-bold ml-auto">{item.total.toLocaleString("ru-RU")}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {hasMonths && monthlyTrendData.length > 1 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">Тренд по месяцам</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {selectedCity ? selectedCity : "Все города"} · линия тренда
            </p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" name="Итого" stroke="#8B5CF6" strokeWidth={3}
                dot={{ r: 5, fill: "#8B5CF6", stroke: "white", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: "#8B5CF6", stroke: "white", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && grandTotal > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-5">
            <h3 className="font-display font-bold text-white text-lg">Топ причины</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {selectedCity ? selectedCity : "Все города"}
              {selectedMonth ? ` · ${selectedMonth}` : ""} · доля от общего
            </p>
          </div>
          <div className="space-y-4">
            {top3Reasons.map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                      style={{ background: item.color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.total.toLocaleString("ru-RU")}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${item.color}20`, color: item.color }}>
                      {item.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(20,10,40,0.06)" : "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}CC)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && grandTotal > 0 && (
        <div className="glass rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-cyan flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,191,255,0.25)" }}>
              <Icon name="Target" size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Концентрация причин</p>
              <p className="font-display text-xl font-bold text-gradient-cyan">
                Топ-3 = {concentrationPct.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3 h-4 rounded-full overflow-hidden flex" style={{ background: isLight ? "rgba(20,10,40,0.06)" : "rgba(255,255,255,0.06)" }}>
            {top3Reasons.map((item, i) => (
              <div key={item.key} className="h-full transition-all duration-700"
                title={`${item.label}: ${item.pct.toFixed(1)}%`}
                style={{ width: `${item.pct}%`, background: item.color }} />
            ))}
            {concentrationPct < 100 && (
              <div className="h-full" style={{ width: `${100 - concentrationPct}%`, background: isLight ? "rgba(20,10,40,0.04)" : "rgba(255,255,255,0.04)" }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {top3Reasons.map(item => (
              <span key={item.key} className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                {item.label}: {item.pct.toFixed(1)}%
              </span>
            ))}
            <span className="text-xs text-white/30">
              Остальные: {(100 - concentrationPct).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {hasMonths && reasonsByMonth.length > 1 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-6">
            <h3 className="font-display font-bold text-white text-lg">Динамика причин</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {selectedCity ? selectedCity : "Все города"} · каждая причина отдельно
            </p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={reasonsByMonth} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={50} />
              <Tooltip content={<CustomTooltip />} />
              {columns.map((col, i) => (
                <Line key={col.key} type="monotone" dataKey={col.key} name={col.label}
                  stroke={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={2}
                  dot={{ r: 3, fill: PIE_COLORS[i % PIE_COLORS.length], stroke: "white", strokeWidth: 1 }}
                  activeDot={{ r: 5 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {columns.map((c, i) => (
              <span key={c.key} className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="w-3 h-0.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {anomalies.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(255,60,172,0.25)" }}>
              <Icon name="Zap" size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Аномалии</h3>
              <p className="text-white/40 text-xs mt-0.5">Резкие скачки причин (±80% к предыдущему месяцу)</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {anomalies.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: isLight ? "rgba(20,10,40,0.03)" : "rgba(255,255,255,0.03)" }}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.pctChange > 0 ? "bg-red-500/15" : "bg-emerald-500/15"}`}>
                  <Icon name={a.pctChange > 0 ? "TrendingUp" : "TrendingDown"} size={16}
                    className={a.pctChange > 0 ? "text-red-400" : "text-emerald-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {a.city}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${a.color}20`, color: a.color }}>
                      {a.reason}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">{a.month}: {a.prev} → {a.cur}</span>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ${a.pctChange > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {a.pctChange > 0 ? "+" : ""}{a.pctChange > 500 ? "новая" : `${Math.round(a.pctChange)}%`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCity && cityProfileData.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,212,106,0.25)" }}>
              <Icon name="Radar" size={18} className="text-white" fallback="CircleAlert" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Профиль города</h3>
              <p className="text-white/40 text-xs mt-0.5">{selectedCity} vs средние по всем городам</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={cityProfileData}>
                <PolarGrid stroke={isLight ? "rgba(20,10,40,0.1)" : "rgba(255,255,255,0.1)"} />
                <PolarAngleAxis dataKey="reason" tick={{ fill: axisColor, fontSize: 9 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name={selectedCity} dataKey="city" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                <Radar name="Среднее" dataKey="avg" stroke="#00BFFF" fill="#00BFFF" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                <Tooltip contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12 }}
                  formatter={(value: number, name: string, props: { payload: { fullLabel: string; cityRaw: number; avgRaw: number } }) => {
                    const d = props.payload;
                    return name === selectedCity ? `${d.cityRaw}` : `${d.avgRaw}`;
                  }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex flex-col justify-center">
              {cityProfileData.map((d, i) => {
                const diff = d.cityRaw - d.avgRaw;
                const pct = d.avgRaw > 0 ? ((diff / d.avgRaw) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-xs text-white/60 flex-1 truncate" title={d.fullLabel}>{d.fullLabel}</span>
                    <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{d.cityRaw}</span>
                    <span className="text-xs text-white/30">/ {d.avgRaw} ср.</span>
                    {diff !== 0 && (
                      <span className={`text-xs font-semibold ${diff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {diff > 0 ? "+" : ""}{Math.round(pct)}%
                      </span>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/8">
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <span className="w-3 h-1 rounded-full bg-violet-500" /> {selectedCity}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <span className="w-3 h-1 rounded-full bg-cyan-400 opacity-50" style={{ borderBottom: "1px dashed" }} /> Среднее
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <h3 className="font-display font-bold text-white text-lg mb-1">Причины — сравнение</h3>
          <p className="text-white/40 text-xs mb-6">
            {selectedCity ? `${selectedCity}` : "Суммарно по всем городам"}
            {selectedMonth ? ` · ${selectedMonth}` : ""}
          </p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={sorted.map(c => ({ name: c.label, value: c.total, color: c.color }))}
                margin={{ top: 5, right: 5, left: 10, bottom: 70 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false} tickLine={false} angle={-40} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Кол-во" radius={[8, 8, 0, 0]}>
                  {sorted.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {hasMonths ? (
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <h3 className="font-display font-bold text-white text-lg mb-1">Динамика по месяцам</h3>
            <p className="text-white/40 text-xs mb-6">
              {selectedCity ? selectedCity : "Все города"}
              {selectedMonth ? ` · ${selectedMonth}` : " · все месяцы"}
            </p>
            {loading ? (
              <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={aggregatedByMonthRows.filter(d => d.total > 0)}
                  margin={{ top: 5, right: 5, left: 10, bottom: 5 }} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => Number(v).toLocaleString("ru-RU")} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Итого" fill="#8B5CF6" radius={[6, 6, 0, 0]}>
                    {aggregatedByMonthRows.filter(d => d.total > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-white text-lg">
                  {showAllCities ? "Все города" : "Топ-5 городов"}
                </h3>
                <p className="text-white/40 text-xs mt-0.5">1 полоса = 1 город · цвета = причины</p>
              </div>
              {!loading && aggregatedByCityRows.length > 5 && (
                <button onClick={() => setShowAllCities(v => !v)}
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

      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              {title}
              {selectedCity ? ` · ${selectedCity}` : ""}
              {selectedMonth ? ` · ${selectedMonth}` : ""}
            </h3>
            {!readonly && <p className="text-white/40 text-xs mt-0.5">Кликните на ячейку для редактирования</p>}
          </div>
          {!readonly && (
            <button onClick={handleSave} disabled={saving || !dirty}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                ${dirty ? "gradient-violet text-white shadow-lg cursor-pointer hover:opacity-90" : "bg-white/5 text-white/30 cursor-not-allowed"}`}
              style={dirty ? { boxShadow: "0 4px 20px rgba(124,92,255,0.4)" } : {}}>
              {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                : saved ? <Icon name="Check" size={16} /> : <Icon name="Save" size={16} />}
              {saving ? "Сохранение..." : saved ? "Сохранено" : "Сохранить"}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                  style={{ background: "var(--sticky-cell-bg)", minWidth: 140 }}>
                  {hasMonths && !selectedMonth ? "Город" : hasMonths ? "Город" : "Город / Причина"}
                </th>
                {hasMonths && !selectedMonth && (
                  <th className="text-left px-3 py-3 text-white/50 font-medium text-xs whitespace-nowrap">
                    Месяц
                  </th>
                )}
                {columns.map(col => (
                  <th key={col.key} className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                    style={{ minWidth: 90, maxWidth: 120 }}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap">ИТОГО</th>
              </tr>
            </thead>
            <tbody>
              {hasMonths && !selectedMonth ? (
                aggregatedByCityRows.map((row, ri) => (
                  <tr key={row.city} className="border-b border-white/5 transition-colors hover:bg-white/3">
                    <td className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                      style={{ background: "var(--sticky-cell-bg)" }}>
                      {row.city}
                    </td>
                    <td className="px-3 py-2.5 text-white/40 text-xs">Все</td>
                    {columns.map(col => (
                      <td key={col.key} className="px-2 py-1.5 text-center">
                        <span className={`text-xs ${Number(row[col.key]) > 0 ? "text-white/80" : "text-white/25"}`}>
                          {(Number(row[col.key]) || 0).toLocaleString("ru-RU")}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rowTotal(row) > 0 ? "text-gradient-violet" : "text-white/30"}`}>
                        {rowTotal(row).toLocaleString("ru-RU")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                filteredRows.map((row, ri) => (
                  <tr key={row.id} className="border-b border-white/5 transition-colors hover:bg-white/3"
                    style={{ animationDelay: `${ri * 0.03}s` }}>
                    <td className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                      style={{ background: "var(--sticky-cell-bg)" }}>
                      {row.city}
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-2 py-1.5 text-center">
                        {readonly ? (
                          <span className={`text-xs ${Number(row[col.key]) > 0 ? "text-white/80" : "text-white/25"}`}>
                            {(Number(row[col.key]) || 0).toLocaleString("ru-RU")}
                          </span>
                        ) : (
                          <input type="number" min={0}
                            value={row[col.key] === 0 ? "" : String(row[col.key])}
                            placeholder="0"
                            onChange={e => handleChange(row.id, col.key, e.target.value)}
                            className="w-full text-center text-white/80 text-xs rounded-lg py-1.5 px-1 outline-none transition-all duration-150
                              bg-transparent border border-transparent hover:border-white/15 focus:border-violet-500/60 focus:bg-violet-500/8
                              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            style={{ minWidth: 52 }} />
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rowTotal(row) > 0 ? "text-gradient-violet" : "text-white/30"}`}>
                        {rowTotal(row).toLocaleString("ru-RU")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-white/10">
                <td className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-10"
                  style={{ background: "var(--sticky-cell-bg)" }}>ИТОГО</td>
                {hasMonths && !selectedMonth && <td></td>}
                {columns.map(col => (
                  <td key={col.key} className="px-2 py-3 text-center">
                    <span className={`text-xs font-bold ${colTotal(col.key) > 0 ? "text-gradient-cyan" : "text-white/30"}`}>
                      {colTotal(col.key).toLocaleString("ru-RU")}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-black text-gradient-pink">{grandTotal.toLocaleString("ru-RU")}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}