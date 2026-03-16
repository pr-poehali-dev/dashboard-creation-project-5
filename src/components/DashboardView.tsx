import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import { DASHBOARD_DATA_URL } from "@/config/dashboards";
import type { ColumnDef } from "@/config/dashboards";

const PIE_COLORS = [
  "#6C3FFF", "#00FFDD", "#FF007A", "#FF6B00",
  "#00E064", "#0077FF", "#FFD000", "#FF2244", "#CC00FF",
  "#FF6EC7", "#00C2FF", "#FFB800",
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

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [newCity, setNewCity] = useState("");

  const isUniversalApi = apiUrl === DASHBOARD_DATA_URL || apiUrl.startsWith(DASHBOARD_DATA_URL);
  const fetchUrl = isUniversalApi && dashboardId ? `${DASHBOARD_DATA_URL}?dashboard_id=${dashboardId}` : apiUrl;

  useEffect(() => {
    setRows([]);
    setLoading(true);
    setDirty(false);
    setSaved(false);
    fetch(fetchUrl)
      .then(r => r.json())
      .then(data => {
        const parsed: Row[] = typeof data === "string" ? JSON.parse(data) : data;
        setRows(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fetchUrl]);

  const handleChange = (id: number, col: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    setRows(prev => prev.map(r => r.id === id ? { ...r, [col]: num } : r));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = isUniversalApi
        ? rows.map(r => ({ ...r, id: r.id < 0 ? undefined : r.id }))
        : rows;
      await fetch(fetchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      if (isUniversalApi) {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        setRows(typeof data === "string" ? JSON.parse(data) : data);
      }
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const rowTotal = (row: Row) => columns.reduce((s, c) => s + (Number(row[c.key]) || 0), 0);
  const colTotal = (key: string) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0);

  const colTotals = columns.map((c, i) => ({ ...c, total: colTotal(c.key), color: PIE_COLORS[i % PIE_COLORS.length] }));
  const sorted = [...colTotals].sort((a, b) => b.total - a.total);
  const top1 = sorted[0];
  const top2 = sorted[1];

  const cityBarData = rows.map(r => ({ name: r.city as string, total: rowTotal(r) }));

  const kpiCards = [
    {
      label: `Всего · ${title}`,
      value: grandTotal.toLocaleString("ru-RU"),
      icon: "BarChart2",
      gradient: "gradient-violet",
      textGradient: "text-gradient-violet",
      glow: "rgba(124,92,255,0.35)",
      sub: `${rows.length} городов`,
    },
    {
      label: "Главная причина",
      value: top1?.label ?? "—",
      icon: "AlertTriangle",
      gradient: "gradient-pink",
      textGradient: "text-gradient-pink",
      glow: "rgba(255,60,172,0.35)",
      sub: top1 ? `${top1.total} случаев` : "",
    },
    {
      label: "2-я по частоте",
      value: top2?.label ?? "—",
      icon: "AlertCircle",
      gradient: "gradient-cyan",
      textGradient: "text-gradient-cyan",
      glow: "rgba(0,229,204,0.35)",
      sub: top2 ? `${top2.total} случаев` : "",
    },
    {
      label: "Городов с данными",
      value: rows.filter(r => rowTotal(r) > 0).length.toLocaleString("ru-RU"),
      icon: "MapPin",
      gradient: "gradient-green",
      textGradient: "text-gradient-green",
      glow: "rgba(0,212,106,0.35)",
      sub: `из ${rows.length}`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={card.label} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
            style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
                style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
                <Icon name={card.icon} size={18} className="text-white" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">{card.sub}</span>
            </div>
            <p className="text-white/50 text-xs mb-1">{card.label}</p>
            {loading ? (
              <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
            ) : (
              <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
                <AnimatedNumber value={card.value} />
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area */}
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
              <AreaChart data={cityBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }}
                  axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} height={36} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Итого"
                  stroke="#7C5CFF" strokeWidth={2.5} fill={`url(#${gradId})`}
                  dot={false} activeDot={{ r: 5, fill: "#7C5CFF", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie */}
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
                    contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid rgba(124,92,255,0.3)", borderRadius: 12 }}
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

      {/* Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <h3 className="font-display font-bold text-white text-lg mb-1">Причины — сравнение</h3>
          <p className="text-white/40 text-xs mb-6">Суммарно по всем городам</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sorted.map(c => ({ name: c.label, value: c.total, color: c.color }))}
                margin={{ top: 5, right: 5, left: -20, bottom: 55 }} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(20,10,40,0.07)" : "rgba(255,255,255,0.05)"} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 9 }}
                  axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Итого" radius={[4, 4, 0, 0]}>
                  {sorted.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Города — stacked bar по причинам */}
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-white text-lg">
                {showAllCities ? "Все города" : "Топ-5 городов"}
              </h3>
              <p className="text-white/40 text-xs mt-0.5">1 полоса = 1 город · цвета = причины</p>
            </div>
            {!loading && rows.length > 5 && (
              <button onClick={() => setShowAllCities(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: showAllCities ? "rgba(124,92,255,0.2)" : "rgba(255,255,255,0.06)",
                  color: showAllCities ? "#a78bfa" : "rgba(255,255,255,0.5)",
                  border: showAllCities ? "1px solid rgba(124,92,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                }}>
                <Icon name={showAllCities ? "ChevronUp" : "ChevronDown"} size={14} />
                {showAllCities ? "Свернуть" : `Показать все (${rows.length})`}
              </button>
            )}
          </div>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">Загрузка...</div>
          ) : rows.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-white/20">
              <Icon name="BarChart2" size={28} />
              <p className="text-xs">Нет данных</p>
            </div>
          ) : (() => {
            const sortedRows = [...rows].sort((a, b) => rowTotal(b) - rowTotal(a));
            const displayed = showAllCities ? sortedRows : sortedRows.slice(0, 5);
            const maxVal = Math.max(...displayed.map(r => rowTotal(r)), 1);
            return (
              <>
                <div className="space-y-3">
                  {displayed.map(row => {
                    const total = rowTotal(row);
                    return (
                      <div key={row.id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-white/70 font-medium">{row.city}</span>
                          <span className="text-white/50">{total.toLocaleString("ru-RU")}</span>
                        </div>
                        <div className="h-5 rounded-lg bg-white/5 overflow-hidden flex"
                          style={{ width: "100%" }}>
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
                    <span key={c.key} className="flex items-center gap-1.5 text-xs text-white/45">
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
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h3 className="font-display font-bold text-white text-lg">{title}</h3>
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
                  Город / Причина
                </th>
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
              {rows.map((row, ri) => (
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
              ))}
            </tbody>
            {isUniversalApi && !readonly && (
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="px-2 py-1.5 sticky left-0 z-10" style={{ background: "var(--sticky-cell-bg)" }}>
                    <div className="flex items-center gap-1">
                      <input
                        value={newCity}
                        onChange={e => setNewCity(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && newCity.trim()) {
                            const tempId = -(Date.now());
                            const newRow: Row = { id: tempId, city: newCity.trim() };
                            columns.forEach(c => { newRow[c.key] = 0; });
                            setRows(prev => [...prev, newRow]);
                            setNewCity("");
                            setDirty(true);
                            setSaved(false);
                          }
                        }}
                        placeholder="+ Новый город"
                        className="w-full bg-transparent text-white/40 text-xs rounded-lg py-1.5 px-2 outline-none border border-dashed border-white/10 hover:border-white/20 focus:border-violet-500/60 transition-all placeholder:text-white/20"
                      />
                    </div>
                  </td>
                  <td colSpan={columns.length + 1}></td>
                </tr>
              </tbody>
            )}
            <tfoot>
              <tr className="border-t-2 border-white/10">
                <td className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-10"
                  style={{ background: "var(--sticky-cell-bg)" }}>ИТОГО</td>
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