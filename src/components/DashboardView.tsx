import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { DASHBOARD_DATA_URL } from "@/config/dashboards";
import type { ColumnDef } from "@/config/dashboards";
import DashboardFilters from "@/components/dashboard/DashboardFilters";
import DashboardKpiCards from "@/components/dashboard/DashboardKpiCards";
import type { KpiCard } from "@/components/dashboard/DashboardKpiCards";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardAnalytics from "@/components/dashboard/DashboardAnalytics";
import DashboardDataTable from "@/components/dashboard/DashboardDataTable";

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
    const results: { city: string; reason: string; month: string; prev: number; cur: number; pctChange: number; color: string; sparkline: number[] }[] = [];
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
              sparkline: monthVals.slice(0, i + 1),
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

  const kpiCards: KpiCard[] = [
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
      changeType: null,
    },
    {
      label: "2-я по частоте",
      value: top2?.label ?? "\u2014",
      icon: "AlertCircle",
      gradient: "gradient-cyan",
      textGradient: "text-gradient-cyan",
      glow: "rgba(0,229,204,0.35)",
      sub: top2 ? `${top2.total.toLocaleString("ru-RU")} случаев` : "",
      changeType: null,
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

  return (
    <div className="space-y-4">
      {hasMonths && (
        <DashboardFilters
          cities={cities}
          allMonths={allMonths}
          selectedCity={selectedCity}
          selectedMonth={selectedMonth}
          onCityChange={setSelectedCity}
          onMonthChange={setSelectedMonth}
        />
      )}

      <DashboardKpiCards cards={kpiCards} loading={loading} kpiKey={kpiKey} />

      <DashboardCharts
        selectedCity={selectedCity}
        selectedMonth={selectedMonth}
        hasMonths={hasMonths}
        loading={loading}
        isLight={isLight}
        axisColor={axisColor}
        gradId={gradId}
        columns={columns}
        aggregatedByMonthRows={aggregatedByMonthRows}
        cityBarData={cityBarData}
        colTotals={colTotals}
        sorted={sorted}
        grandTotal={grandTotal}
        monthlyTrendData={monthlyTrendData}
        reasonsByMonth={reasonsByMonth}
        aggregatedByCityRows={aggregatedByCityRows}
        rowTotal={rowTotal}
        showAllCities={showAllCities}
        onShowAllCitiesToggle={() => setShowAllCities(v => !v)}
        PIE_COLORS={PIE_COLORS}
      />

      <DashboardAnalytics
        anomalies={anomalies}
        top3Reasons={top3Reasons}
        concentrationPct={concentrationPct}
        grandTotal={grandTotal}
        loading={loading}
        isLight={isLight}
        axisColor={axisColor}
        selectedCity={selectedCity}
        selectedMonth={selectedMonth}
        cityProfileData={cityProfileData}
      />

      <DashboardDataTable
        title={title}
        selectedCity={selectedCity}
        selectedMonth={selectedMonth}
        hasMonths={hasMonths}
        readonly={readonly}
        loading={loading}
        saving={saving}
        saved={saved}
        dirty={dirty}
        columns={columns}
        filteredRows={filteredRows}
        aggregatedByCityRows={aggregatedByCityRows}
        rowTotal={rowTotal}
        colTotal={colTotal}
        grandTotal={grandTotal}
        onSave={handleSave}
        onChange={handleChange}
      />
    </div>
  );
}