import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";

const PERIODS = ["7 дней", "30 дней", "90 дней", "Год"];
const CATEGORIES = ["Все", "Продажи", "Трафик", "Конверсия"];

const PERIOD_LABELS: Record<string, string[]> = {
  "7 дней": ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  "30 дней": ["1н", "2н", "3н", "4н", "5н", "6н", "7н", "8н", "9н", "10н", "11н", "12н"],
  "90 дней": ["Янв I", "Янв II", "Фев I", "Фев II", "Мар I", "Мар II", "Апр I", "Апр II", "Май I", "Май II"],
  "Год": ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
};

const generateData = (period: string) => {
  const labs = PERIOD_LABELS[period];
  return labs.map((name) => ({
    name,
    продажи: Math.floor(Math.random() * 800 + 400),
    трафик: Math.floor(Math.random() * 3000 + 1500),
    конверсия: +(Math.random() * 4 + 2).toFixed(1),
  }));
};

const pieData = [
  { name: "Органика", value: 38, color: "#7C5CFF" },
  { name: "Реклама", value: 27, color: "#00E5CC" },
  { name: "Соцсети", value: 20, color: "#FF3CAC" },
  { name: "Прямой", value: 15, color: "#FF7A00" },
];

const kpiCards = [
  { label: "Выручка", value: "2 847 300", suffix: "₽", change: "+18.4%", up: true, icon: "TrendingUp", gradient: "gradient-violet", textGradient: "text-gradient-violet", glow: "rgba(124,92,255,0.35)" },
  { label: "Посетителей", value: "148 920", suffix: "", change: "+12.1%", up: true, icon: "Users", gradient: "gradient-cyan", textGradient: "text-gradient-cyan", glow: "rgba(0,229,204,0.35)" },
  { label: "Конверсия", value: "4.7", suffix: "%", change: "-0.3%", up: false, icon: "Target", gradient: "gradient-pink", textGradient: "text-gradient-pink", glow: "rgba(255,60,172,0.35)" },
  { label: "Новых клиентов", value: "3 241", suffix: "", change: "+24.8%", up: true, icon: "UserPlus", gradient: "gradient-green", textGradient: "text-gradient-green", glow: "rgba(0,212,106,0.35)" },
];

function AnimatedNumber({ value }: { value: string }) {
  const [displayed, setDisplayed] = useState("0");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const numeric = parseFloat(value.replace(/\s/g, "").replace(",", "."));
    if (isNaN(numeric)) { setDisplayed(value); return; }
    const steps = 40;
    const step = numeric / steps;
    let cur = 0, count = 0;
    const iv = setInterval(() => {
      cur += step; count++;
      if (count >= steps) { setDisplayed(value); clearInterval(iv); return; }
      setDisplayed(Math.floor(cur).toLocaleString("ru-RU"));
    }, 1200 / steps);
    return () => clearInterval(iv);
  }, [value]);

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
  const [period, setPeriod] = useState("30 дней");
  const [category, setCategory] = useState("Все");
  const [data, setData] = useState(() => generateData("30 дней"));
  const [animKey, setAnimKey] = useState(0);

  const handlePeriod = (p: string) => {
    setPeriod(p);
    setData(generateData(p));
    setAnimKey(k => k + 1);
  };

  const showSales = category === "Все" || category === "Продажи";
  const showTraffic = category === "Все" || category === "Трафик";

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
              Аналитика
            </h1>
            <p className="text-white/40 text-sm">Обновлено сегодня в 14:32</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Данные в реальном времени
            </div>
            <button className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Bell" size={18} />
            </button>
            <button className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up delay-100">
          <div className="glass rounded-2xl p-1 flex gap-1 flex-wrap">
            {PERIODS.map(p => (
              <button key={p} onClick={() => handlePeriod(p)}
                className={`filter-btn px-4 py-2 rounded-xl text-sm font-medium ${period === p ? "active" : "text-white/50 hover:text-white/80"}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="glass rounded-2xl p-1 flex gap-1 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`filter-btn px-4 py-2 rounded-xl text-sm font-medium ${category === c ? "active" : "text-white/50 hover:text-white/80"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((card, i) => (
            <div key={card.label}
              className={`glass glass-hover rounded-2xl p-5 animate-fade-in-up`}
              style={{ animationDelay: `${(i + 2) * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
                  style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
                  <Icon name={card.icon} size={18} className="text-white" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.up ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {card.change}
                </span>
              </div>
              <p className="text-white/50 text-xs mb-1">{card.label}</p>
              <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
                <AnimatedNumber value={card.value} />
                {card.suffix && <span className="text-lg ml-0.5">{card.suffix}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Area Chart */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Динамика показателей</h3>
                <p className="text-white/40 text-xs mt-0.5">{period} · {category}</p>
              </div>
              <div className="flex gap-3">
                {showSales && <span className="flex items-center gap-1.5 text-xs text-white/50"><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#7C5CFF" }} />Продажи</span>}
                {showTraffic && <span className="flex items-center gap-1.5 text-xs text-white/50"><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: "#00E5CC" }} />Трафик</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240} key={`area-${animKey}-${category}`}>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5CC" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00E5CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {showSales && (
                  <Area type="monotone" dataKey="продажи" stroke="#7C5CFF" strokeWidth={2.5} fill="url(#gradViolet)"
                    dot={false} activeDot={{ r: 5, fill: "#7C5CFF", stroke: "white", strokeWidth: 2 }} />
                )}
                {showTraffic && (
                  <Area type="monotone" dataKey="трафик" stroke="#00E5CC" strokeWidth={2.5} fill="url(#gradCyan)"
                    dot={false} activeDot={{ r: 5, fill: "#00E5CC", stroke: "white", strokeWidth: 2 }} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-500">
            <div className="mb-4">
              <h3 className="font-display font-bold text-white text-lg">Источники трафика</h3>
              <p className="text-white/40 text-xs mt-0.5">Распределение по каналам</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(14,12,26,0.97)", border: "1px solid rgba(124,92,255,0.3)", borderRadius: 12 }}
                  labelStyle={{ color: "white" }} itemStyle={{ color: "rgba(255,255,255,0.7)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-white/50 text-xs truncate">{item.name}</span>
                  <span className="text-white text-xs font-bold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-600">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Продажи по периодам</h3>
                <p className="text-white/40 text-xs mt-0.5">Сравнительный анализ</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200} key={`bar-${animKey}-${category}`}>
              <BarChart data={data} margin={{ top: 0, right: 5, left: -20, bottom: 0 }} barSize={category === "Все" ? 10 : 18}>
                <defs>
                  <linearGradient id="barViolet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFF" />
                    <stop offset="100%" stopColor="#B16CEA" />
                  </linearGradient>
                  <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5CC" />
                    <stop offset="100%" stopColor="#0096FF" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {showSales && <Bar dataKey="продажи" fill="url(#barViolet)" radius={[4, 4, 0, 0]} />}
                {showTraffic && <Bar dataKey="трафик" fill="url(#barCyan)" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart - Conversion */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up delay-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-lg">Конверсия</h3>
                <p className="text-white/40 text-xs mt-0.5">Процент посетителей → клиент</p>
              </div>
              <div className="glass rounded-xl px-3 py-1.5 text-sm font-bold text-gradient-pink">
                4.7% avg
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200} key={`line-${animKey}`}>
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="linePink" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF3CAC" />
                    <stop offset="100%" stopColor="#FF7A00" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="конверсия" stroke="url(#linePink)" strokeWidth={2.5}
                  dot={{ fill: "#FF3CAC", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#FF7A00", stroke: "white", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-white/20 text-xs animate-fade-in-up delay-800">
          Данные за {period} · Последнее обновление: сегодня, 14:32
        </p>
      </div>
    </div>
  );
}