import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0";

const COLUMNS: { key: string; label: string; short: string }[] = [
  { key: "deadline_violations",   label: "Нарушены сроки выполнения работы", short: "Нарушены сроки" },
  { key: "poor_quality_service",  label: "Некачественно оказанные услуги",   short: "Некач. услуги" },
  { key: "patient_no_contact",    label: "Пациент не выходит на связь",       short: "Нет связи" },
  { key: "patient_died",          label: "Пациент умер",                      short: "Пациент умер" },
  { key: "reregistration",        label: "Переоформление",                    short: "Переоформление" },
  { key: "complaint",             label: "Претензия",                        short: "Претензия" },
  { key: "procedures_not_needed", label: "Процедуры не понадобились",        short: "Проц. не нужны" },
  { key: "financial_difficulties",label: "Финансовые трудности",             short: "Фин. трудности" },
  { key: "refund_completed",      label: "Возврат за пройденные",            short: "Возврат" },
];

const PIE_COLORS = ["#7C5CFF","#00E5CC","#FF3CAC","#FF7A00","#00D46A","#0096FF","#FFD600","#FF4444","#B16CEA"];

interface Row {
  id: number;
  city: string;
  [key: string]: number | string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const done = useRef(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const target = value;
    if (done.current && prevValue.current === target) return;
    prevValue.current = target;
    done.current = true;
    const steps = 40;
    const step = target / steps;
    let cur = 0, count = 0;
    const iv = setInterval(() => {
      cur += step; count++;
      if (count >= steps) { setDisplayed(target); clearInterval(iv); return; }
      setDisplayed(Math.floor(cur));
    }, 1000 / steps);
    return () => clearInterval(iv);
  }, [value]);

  return <span>{displayed.toLocaleString("ru-RU")}</span>;
}

interface TPayload { color: string; name: string; value: number; }
interface TTooltip { active?: boolean; payload?: TPayload[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: TTooltip) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip p-3 rounded-xl" style={{ minWidth: 160 }}>
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-white/70 text-xs truncate">{p.name}:</span>
          <span className="font-semibold text-white ml-auto pl-2">{p.value.toLocaleString("ru-RU")}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("Все");
  const [reasonFilter, setReasonFilter] = useState("Все");

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

  // Filtered rows
  const filteredRows = cityFilter === "Все" ? rows : rows.filter(r => r.city === cityFilter);

  // KPI totals
  const total = filteredRows.reduce((sum, r) => sum + COLUMNS.reduce((s, c) => s + (Number(r[c.key]) || 0), 0), 0);
  const topCity = (() => {
    if (!rows.length) return { name: "—", value: 0 };
    const sums = rows.map(r => ({ name: r.city as string, value: COLUMNS.reduce((s, c) => s + (Number(r[c.key]) || 0), 0) }));
    sums.sort((a, b) => b.value - a.value);
    return sums[0];
  })();
  const topReason = (() => {
    const sums = COLUMNS.map(c => ({ name: c.short, label: c.label, value: filteredRows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0) }));
    sums.sort((a, b) => b.value - a.value);
    return sums[0] || { name: "—", label: "—", value: 0 };
  })();
  const citiesWithData = rows.filter(r => COLUMNS.reduce((s, c) => s + (Number(r[c.key]) || 0), 0) > 0).length;

  // Bar chart: расторжения по городам
  const cityBarData = rows
    .map(r => ({ name: r.city as string, value: COLUMNS.reduce((s, c) => s + (Number(r[c.key]) || 0), 0) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Bar chart: по причинам (с фильтром)
  const reasonBarData = COLUMNS
    .map((c, i) => ({
      name: c.short,
      fullName: c.label,
      value: filteredRows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0),
      color: PIE_COLORS[i],
    }))
    .filter(d => reasonFilter === "Все" || d.fullName === reasonFilter)
    .sort((a, b) => b.value - a.value);

  // Pie: по причинам
  const pieData = COLUMNS
    .map((c, i) => ({
      name: c.short,
      value: filteredRows.reduce((s, r) => s + (Number(r[c.key]) || 0), 0),
      color: PIE_COLORS[i],
    }))
    .filter(d => d.value > 0);

  // Top-5 городов для фильтра
  const topCities = ["Все", ...rows
    .map(r => r.city as string)
    .filter(c => rows.find(r => r.city === c && COLUMNS.reduce((s, col) => s + (Number(r[col.key]) || 0), 0) > 0) || true)
  ];

  const kpiCards = [
    { label: "Всего расторжений",    value: total,           icon: "FileX",     gradient: "gradient-violet", textGradient: "text-gradient-violet", glow: "rgba(124,92,255,0.35)" },
    { label: "Городов с данными",    value: citiesWithData,  icon: "MapPin",    gradient: "gradient-cyan",   textGradient: "text-gradient-cyan",   glow: "rgba(0,229,204,0.35)" },
    { label: "Топ-город",            value: topCity.value,   icon: "TrendingUp",gradient: "gradient-pink",   textGradient: "text-gradient-pink",   glow: "rgba(255,60,172,0.35)", sub: topCity.name },
    { label: "Топ-причина",          value: topReason.value, icon: "AlertCircle",gradient: "gradient-green", textGradient: "text-gradient-green",  glow: "rgba(0,212,106,0.35)", sub: topReason.name },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0A0812 0%, #0D0F1C 50%, #080B18 100%)" }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full opacity-10 animate-float delay-200"
          style={{ background: "radial-gradient(circle, #00E5CC 0%, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              Причины расторжений
            </h1>
            <p className="text-white/40 text-sm">Аналитика по городам и причинам</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-white/60">
              {loading
                ? <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />Загрузка...</>
                : <><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Данные загружены</>
              }
            </div>
            <button className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Bell" size={18} />
            </button>
            <button onClick={() => navigate("/settings")}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up delay-100">
          {/* City filter */}
          <div className="glass rounded-2xl p-1 flex gap-1 flex-wrap">
            {topCities.slice(0, 8).map(c => (
              <button key={c} onClick={() => setCityFilter(c)}
                className={`filter-btn px-3 py-2 rounded-xl text-xs font-medium ${cityFilter === c ? "active" : "text-white/50 hover:text-white/80"}`}>
                {c}
              </button>
            ))}
          </div>
          {/* Reason filter */}
          <div className="glass rounded-2xl p-1 flex gap-1 flex-wrap">
            <button onClick={() => setReasonFilter("Все")}
              className={`filter-btn px-3 py-2 rounded-xl text-xs font-medium ${reasonFilter === "Все" ? "active" : "text-white/50 hover:text-white/80"}`}>
              Все причины
            </button>
            {COLUMNS.map(c => (
              <button key={c.key} onClick={() => setReasonFilter(reasonFilter === c.label ? "Все" : c.label)}
                className={`filter-btn px-3 py-2 rounded-xl text-xs font-medium ${reasonFilter === c.label ? "active" : "text-white/50 hover:text-white/80"}`}>
                {c.short}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((card, i) => (
            <div key={card.label} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
              style={{ animationDelay: `${(i + 2) * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
                  style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
                  <Icon name={card.icon} size={18} className="text-white" />
                </div>
              </div>
              <p className="text-white/50 text-xs mb-0.5">{card.label}</p>
              {"sub" in card && card.sub && (
                <p className="text-white/30 text-xs mb-1 truncate">{card.sub}</p>
              )}
              <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
                {loading ? <span className="text-white/20">—</span> : <AnimatedNumber value={card.value} />}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row 1: города + pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Bar: города */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up delay-400">
            <div className="mb-5">
              <h3 className="font-display font-bold text-white text-lg">Расторжения по городам</h3>
              <p className="text-white/40 text-xs mt-0.5">Суммарное количество по всем причинам</p>
            </div>
            {loading ? (
              <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : cityBarData.length === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="BarChart2" size={32} />
                <p className="text-sm">Нет данных. Заполните таблицу в настройках.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={cityBarData} margin={{ top: 5, right: 5, left: -20, bottom: 40 }} barSize={18}>
                  <defs>
                    <linearGradient id="barViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C5CFF" />
                      <stop offset="100%" stopColor="#B16CEA" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Расторжений" fill="url(#barViolet)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie: по причинам */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-500">
            <div className="mb-4">
              <h3 className="font-display font-bold text-white text-lg">По причинам</h3>
              <p className="text-white/40 text-xs mt-0.5">
                {cityFilter === "Все" ? "Все города" : cityFilter}
              </p>
            </div>
            {loading ? (
              <div className="h-[180px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : pieData.length === 0 ? (
              <div className="h-[180px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="PieChart" size={28} />
                <p className="text-xs">Нет данных</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgba(14,12,26,0.97)", border: "1px solid rgba(124,92,255,0.3)", borderRadius: 12 }}
                      labelStyle={{ color: "white" }} itemStyle={{ color: "rgba(255,255,255,0.7)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.slice(0, 5).map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-white/50 text-xs truncate">{item.name}</span>
                      <span className="text-white text-xs font-bold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts Row 2: причины + топ городов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bar: по причинам */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-600">
            <div className="mb-5">
              <h3 className="font-display font-bold text-white text-lg">По причинам</h3>
              <p className="text-white/40 text-xs mt-0.5">
                {cityFilter === "Все" ? "Все города" : cityFilter} · {reasonFilter === "Все" ? "Все причины" : reasonFilter}
              </p>
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : reasonBarData.every(d => d.value === 0) ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="BarChart3" size={28} />
                <p className="text-xs">Нет данных</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={reasonBarData} margin={{ top: 0, right: 5, left: -20, bottom: 50 }} barSize={16}>
                  <defs>
                    <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5CC" />
                      <stop offset="100%" stopColor="#0096FF" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
                    axisLine={false} tickLine={false} angle={-40} textAnchor="end" interval={0} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Расторжений" fill="url(#barCyan)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Топ городов — таблица */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-700">
            <div className="mb-5">
              <h3 className="font-display font-bold text-white text-lg">Рейтинг городов</h3>
              <p className="text-white/40 text-xs mt-0.5">По количеству расторжений</p>
            </div>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
            ) : cityBarData.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center gap-2 text-white/20">
                <Icon name="List" size={28} />
                <p className="text-xs">Нет данных</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cityBarData.slice(0, 8).map((item, i) => {
                  const max = cityBarData[0].value || 1;
                  const pct = Math.round((item.value / max) * 100);
                  const colors = ["#7C5CFF","#00E5CC","#FF3CAC","#FF7A00","#00D46A","#0096FF","#B16CEA","#FFD600"];
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white/30 text-xs w-4">{i + 1}</span>
                          <span className="text-white/80 text-xs font-medium">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: colors[i] }}>{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: colors[i], boxShadow: `0 0 8px ${colors[i]}60` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-white/20 text-xs animate-fade-in-up delay-800">
          {rows.length} городов · {total.toLocaleString("ru-RU")} расторжений · Данные из базы
        </p>
      </div>
    </div>
  );
}
