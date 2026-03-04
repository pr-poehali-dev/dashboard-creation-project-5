import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from "recharts";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";

const API_URL = "https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0";

const COLUMNS: { key: string; label: string; short: string }[] = [
  { key: "deadline_violations",   label: "Нарушены сроки выполнения работы", short: "Сроки" },
  { key: "poor_quality_service",  label: "Некачественно оказанные услуги",   short: "Качество" },
  { key: "patient_no_contact",    label: "Пациент не выходит на связь",       short: "Нет связи" },
  { key: "patient_died",          label: "Пациент умер",                       short: "Умер" },
  { key: "reregistration",        label: "Переоформление",                     short: "Переоформл." },
  { key: "complaint",             label: "Претензия",                          short: "Претензия" },
  { key: "procedures_not_needed", label: "Процедуры не понадобились",          short: "Не нужны" },
  { key: "financial_difficulties",label: "Финансовые трудности",               short: "Финансы" },
  { key: "refund_completed",      label: "Возврат за пройденные",              short: "Возврат" },
];

const PIE_COLORS = [
  "#7C5CFF", "#00E5CC", "#FF3CAC", "#FF7A00",
  "#00D46A", "#0096FF", "#FFD600", "#FF4C61", "#B16CEA",
];

interface Row {
  id: number;
  city: string;
  [key: string]: number | string;
}

function AnimatedNumber({ value }: { value: string | number }) {
  const [displayed, setDisplayed] = useState("0");
  const done = useRef(false);
  const strVal = String(value);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
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
  }, [strVal]);

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{city: string; col: string; val: number} | null>(null);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        const parsed: Row[] = typeof data === "string" ? JSON.parse(data) : data;
        setRows(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const rowTotal = (row: Row) => COLUMNS.reduce((s, c) => s + (Number(row[c.key]) || 0), 0);
  const colTotal = (key: string) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0);

  const colTotals = COLUMNS.map((c, i) => ({ ...c, total: colTotal(c.key), color: PIE_COLORS[i] }));
  const sorted = [...colTotals].sort((a, b) => b.total - a.total);
  const top1 = sorted[0];
  const top2 = sorted[1];

  const topCities = [...rows].sort((a, b) => rowTotal(b) - rowTotal(a)).slice(0, 5);

  const cityBarData = rows.map(r => ({ name: r.city as string, total: rowTotal(r) }));

  const radarData = COLUMNS.map(c => {
    const obj: Record<string, string | number> = { subject: c.short };
    topCities.forEach(r => { obj[r.city as string] = Number(r[c.key]) || 0; });
    return obj;
  });

  const refundTotal = colTotal("refund_completed");

  const kpiCards = [
    {
      label: "Всего расторжений",
      value: grandTotal.toLocaleString("ru-RU"),
      suffix: "",
      icon: "FileX",
      gradient: "gradient-violet",
      textGradient: "text-gradient-violet",
      glow: "rgba(124,92,255,0.35)",
      sub: `${rows.length} городов`,
    },
    {
      label: "Главная причина",
      value: top1?.label ?? "—",
      suffix: "",
      icon: "AlertTriangle",
      gradient: "gradient-pink",
      textGradient: "text-gradient-pink",
      glow: "rgba(255,60,172,0.35)",
      sub: top1 ? `${top1.total} случаев` : "",
    },
    {
      label: "2-я по частоте",
      value: top2?.label ?? "—",
      suffix: "",
      icon: "AlertCircle",
      gradient: "gradient-cyan",
      textGradient: "text-gradient-cyan",
      glow: "rgba(0,229,204,0.35)",
      sub: top2 ? `${top2.total} случаев` : "",
    },
    {
      label: "Возврат за пройденные",
      value: refundTotal.toLocaleString("ru-RU"),
      suffix: "",
      icon: "RotateCcw",
      gradient: "gradient-green",
      textGradient: "text-gradient-green",
      glow: "rgba(0,212,106,0.35)",
      sub: "случаев",
    },
  ];

  const axisColor = isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)";

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
        <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full animate-float delay-200"
          style={{ background: "radial-gradient(circle, #00E5CC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-3)" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              Аналитика расторжений
            </h1>
            <p className="text-white/40 text-sm">Данные из таблицы причин расторжений</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {loading ? "Загрузка..." : "Данные актуальны"}
            </div>
            <button onClick={toggle}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title={isLight ? "Тёмная тема" : "Светлая тема"}>
              <Icon name={isLight ? "Moon" : "Sun"} size={18} />
            </button>
            <button className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Bell" size={18} />
            </button>
            <button onClick={() => navigate("/settings")}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((card, i) => (
            <div key={card.label}
              className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
              style={{ animationDelay: `${(i + 2) * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
                  style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
                  <Icon name={card.icon} size={18} className="text-white" />
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">
                  {card.sub}
                </span>
              </div>
              <p className="text-white/50 text-xs mb-1">{card.label}</p>
              {loading ? (
                <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
              ) : (
                <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
                  <AnimatedNumber value={card.value} />
                  {card.suffix && <span className="text-lg ml-0.5">{card.suffix}</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Charts Row 1: Area + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Area: расторжения по городам (топ-12) */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Расторжения по городам</h3>
                <p className="text-white/40 text-xs mt-0.5">Суммарное количество по каждому городу</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#7C5CFF" }} />
                расторжений
              </span>
            </div>
            {loading ? (
              <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={cityBarData.slice(0, 12)}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }}
                    axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} height={36} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Расторжений"
                    stroke="#7C5CFF" strokeWidth={2.5} fill="url(#gradViolet)"
                    dot={false} activeDot={{ r: 5, fill: "#7C5CFF", stroke: "white", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie: доли причин */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-500">
            <div className="mb-4">
              <h3 className="font-display font-bold text-white text-lg">Причины расторжений</h3>
              <p className="text-white/40 text-xs mt-0.5">Распределение по типам</p>
            </div>
            {loading ? (
              <div className="h-[180px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={colTotals.filter(c => c.total > 0)}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3} dataKey="total" nameKey="short" strokeWidth={0}>
                      {colTotals.filter(c => c.total > 0).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid rgba(124,92,255,0.3)", borderRadius: 12 }}
                      labelStyle={{ color: isLight ? "rgba(20,10,40,0.9)" : "white" }}
                      itemStyle={{ color: isLight ? "rgba(20,10,40,0.7)" : "rgba(255,255,255,0.7)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-1 gap-1.5 mt-1 max-h-[120px] overflow-y-auto">
                  {sorted.filter(c => c.total > 0).map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-white/50 text-xs truncate flex-1">{item.short}</span>
                      <span className="text-white text-xs font-bold ml-auto">{item.total}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts Row 2: Bar + Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bar: топ-9 причин */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-600">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Причины — сравнение</h3>
                <p className="text-white/40 text-xs mt-0.5">Суммарно по всем городам</p>
              </div>
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={sorted.map((c, i) => ({ name: c.short, value: c.total, color: PIE_COLORS[i] }))}
                  margin={{ top: 0, right: 5, left: -20, bottom: 30 }}
                  barSize={18}>
                  <defs>
                    <linearGradient id="barViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" />
                      <stop offset="100%" stopColor="#B16CEA" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 9 }}
                    axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Расторжений" radius={[4, 4, 0, 0]}>
                    {sorted.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Heatmap: все города × все причины */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Города × Причины</h3>
                <p className="text-white/40 text-xs mt-0.5">Тепловая карта — все города и все причины расторжений</p>
              </div>
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : rows.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="LayoutGrid" size={28} />
                <p className="text-xs">Нет данных. Заполните таблицу в настройках.</p>
              </div>
            ) : (() => {
              const sortedRows = [...rows].sort((a, b) => rowTotal(b) - rowTotal(a));
              const maxVal = Math.max(...sortedRows.flatMap(r => COLUMNS.map(c => Number(r[c.key]) || 0)), 1);
              return (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: 110 }} />
                      {COLUMNS.map(c => <col key={c.key} />)}
                    </colgroup>
                    <thead>
                      <tr>
                        <th />
                        {COLUMNS.map((c, ci) => (
                          <th key={c.key} className="pb-3 px-0.5 text-center align-bottom">
                            <div
                              className="text-xs font-medium leading-tight mx-auto"
                              style={{ color: PIE_COLORS[ci % PIE_COLORS.length], writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 72, display: 'flex', alignItems: 'center' }}
                            >
                              {c.short}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((r) => (
                        <tr key={r.city as string} className="group">
                          <td className="pr-3 py-0.5 text-xs text-white/60 font-medium truncate" title={r.city as string}>
                            {r.city as string}
                          </td>
                          {COLUMNS.map((c, ci) => {
                            const val = Number(r[c.key]) || 0;
                            const intensity = val / maxVal;
                            const color = PIE_COLORS[ci % PIE_COLORS.length];
                            const isHovered = hoveredCell?.city === r.city && hoveredCell?.col === c.key;
                            return (
                              <td key={c.key} className="px-0.5 py-0.5">
                                <div
                                  className="rounded-md flex items-center justify-center cursor-default transition-all duration-150 relative"
                                  style={{
                                    height: 28,
                                    background: intensity > 0
                                      ? `${color}${Math.round(intensity * 220 + 20).toString(16).padStart(2, '0')}`
                                      : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                    outline: isHovered ? `2px solid ${color}` : 'none',
                                    outlineOffset: 1,
                                  }}
                                  onMouseEnter={() => setHoveredCell({ city: r.city as string, col: c.key, val })}
                                  onMouseLeave={() => setHoveredCell(null)}
                                >
                                  {isHovered && (
                                    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg text-xs text-white font-semibold whitespace-nowrap pointer-events-none"
                                      style={{ background: color, boxShadow: `0 4px 16px ${color}66` }}>
                                      {c.label}: {val}
                                    </div>
                                  )}
                                  <span className="text-xs font-semibold" style={{ color: intensity > 0.45 ? '#fff' : intensity > 0 ? color : 'rgba(255,255,255,0.15)' }}>
                                    {val > 0 ? val : ''}
                                  </span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center gap-3 mt-5">
                    <span className="text-white/25 text-xs">Меньше</span>
                    <div className="flex gap-0.5">
                      {[0.08, 0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
                        <div key={i} className="w-5 h-3 rounded-sm" style={{ background: `${PIE_COLORS[0]}${Math.round(v * 220 + 20).toString(16).padStart(2, '0')}` }} />
                      ))}
                    </div>
                    <span className="text-white/25 text-xs">Больше</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-in-up delay-800 mt-4">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <div>
              <h3 className="font-display font-bold text-white text-lg">Причины расторжений по городам</h3>
              <p className="text-white/40 text-xs mt-0.5">Полная таблица данных</p>
            </div>
            <span className="glass rounded-xl px-3 py-1.5 text-xs text-white/50 font-semibold">
              {rows.length} городов · {grandTotal.toLocaleString("ru-RU")} всего
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-3 text-white/30 py-12 text-sm">
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
              Загрузка...
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-white/20 py-12">
              <Icon name="Table" size={28} />
              <p className="text-xs">Нет данных. Заполните таблицу в настройках.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left px-4 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                      style={{ background: "var(--sticky-cell-bg)", minWidth: 130 }}>
                      Город
                    </th>
                    {COLUMNS.map((col, i) => (
                      <th key={col.key}
                        className="px-3 py-3 text-center text-xs font-medium leading-tight"
                        style={{ minWidth: 100, maxWidth: 130, color: PIE_COLORS[i] }}>
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-white/60 font-bold text-xs text-center whitespace-nowrap">
                      Итого
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => {
                    const total = COLUMNS.reduce((s, c) => s + (Number(row[c.key]) || 0), 0);
                    const maxVal = Math.max(...COLUMNS.map(c => Number(row[c.key]) || 0));
                    return (
                      <tr key={row.id}
                        className="border-b border-white/5 transition-colors hover:bg-white/3"
                        style={{ animationDelay: `${ri * 0.02}s` }}>
                        <td className="px-4 py-2.5 text-white/80 font-semibold text-xs whitespace-nowrap sticky left-0 z-10"
                          style={{ background: "var(--sticky-cell-bg)" }}>
                          {row.city as string}
                        </td>
                        {COLUMNS.map((col, i) => {
                          const val = Number(row[col.key]) || 0;
                          const intensity = maxVal > 0 ? val / maxVal : 0;
                          return (
                            <td key={col.key} className="px-2 py-2 text-center relative">
                              {val > 0 && (
                                <span
                                  className="absolute inset-1 rounded-md pointer-events-none"
                                  style={{ background: PIE_COLORS[i], opacity: intensity * 0.18 }}
                                />
                              )}
                              <span className="relative text-xs font-medium"
                                style={{ color: val > 0 ? PIE_COLORS[i] : "var(--text-faint)" }}>
                                {val > 0 ? val : "—"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${total > 0 ? "text-gradient-violet" : "text-white/20"}`}>
                            {total}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/10">
                    <td className="px-4 py-3 text-white/60 font-bold text-xs sticky left-0 z-10"
                      style={{ background: "var(--sticky-cell-bg)" }}>
                      ИТОГО
                    </td>
                    {COLUMNS.map((col, i) => {
                      const total = rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
                      return (
                        <td key={col.key} className="px-2 py-3 text-center">
                          <span className="text-xs font-bold" style={{ color: total > 0 ? PIE_COLORS[i] : "var(--text-faint)" }}>
                            {total > 0 ? total : "—"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-black text-gradient-pink">{grandTotal}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-white/20 text-xs animate-fade-in-up delay-800">
          {rows.length} городов · {grandTotal.toLocaleString("ru-RU")} расторжений · Данные из базы
        </p>
      </div>
    </div>
  );
}