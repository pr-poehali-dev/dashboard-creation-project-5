import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
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

  const lineData = topCities.map(r => {
    const obj: Record<string, string | number> = { name: r.city as string };
    COLUMNS.forEach(c => { obj[c.short] = Number(r[c.key]) || 0; });
    return obj;
  });

  const avgPerCity = rows.length > 0 ? Math.round(grandTotal / rows.length) : 0;

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
      value: top1?.short ?? "—",
      suffix: "",
      icon: "AlertTriangle",
      gradient: "gradient-pink",
      textGradient: "text-gradient-pink",
      glow: "rgba(255,60,172,0.35)",
      sub: top1 ? `${top1.total} случаев` : "",
    },
    {
      label: "2-я по частоте",
      value: top2?.short ?? "—",
      suffix: "",
      icon: "AlertCircle",
      gradient: "gradient-cyan",
      textGradient: "text-gradient-cyan",
      glow: "rgba(0,229,204,0.35)",
      sub: top2 ? `${top2.total} случаев` : "",
    },
    {
      label: "Среднее на город",
      value: avgPerCity.toLocaleString("ru-RU"),
      suffix: "",
      icon: "BarChart2",
      gradient: "gradient-green",
      textGradient: "text-gradient-green",
      glow: "rgba(0,212,106,0.35)",
      sub: "расторжений",
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

          {/* Line: топ-5 городов по причинам */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Топ-5 городов</h3>
                <p className="text-white/40 text-xs mt-0.5">Профиль причин по наиболее проблемным городам</p>
              </div>
              {!loading && topCities[0] && (
                <div className="glass rounded-xl px-3 py-1.5 text-sm font-bold text-gradient-pink">
                  {topCities[0].city as string}
                </div>
              )}
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : rows.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="TrendingUp" size={28} />
                <p className="text-xs">Нет данных. Заполните таблицу в настройках.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
                    <defs>
                      <linearGradient id="linePink" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#FF3CAC" />
                        <stop offset="100%" stopColor="#FF7A00" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
                    <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 9 }}
                      axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    {COLUMNS.map((c, i) => (
                      <Line key={c.key} type="monotone" dataKey={c.short}
                        stroke={PIE_COLORS[i]} strokeWidth={2.5}
                        dot={{ fill: PIE_COLORS[i], r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: PIE_COLORS[i], stroke: "white", strokeWidth: 2 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {COLUMNS.map((c, i) => (
                    <span key={c.key} className="flex items-center gap-1.5 text-xs text-white/40">
                      <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: PIE_COLORS[i] }} />
                      {c.short}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-white/20 text-xs animate-fade-in-up delay-800">
          {rows.length} городов · {grandTotal.toLocaleString("ru-RU")} расторжений · Данные из базы
        </p>
      </div>
    </div>
  );
}