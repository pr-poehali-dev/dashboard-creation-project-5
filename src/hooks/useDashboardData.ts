import { useState, useEffect } from "react";
import { DASHBOARD_DATA_URL } from "@/config/dashboards";
import type { ColumnDef } from "@/config/dashboards";

const PIE_COLORS = [
  "#8B5CF6", "#00BFFF", "#3F00FF", "#FFB800",
  "#00CC44", "#3B82F6", "#F59E0B", "#4400CC",
  "#A855F7", "#06B6D4", "#EF4444", "#10B981",
];

const MONTHS_ORDER = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

export { PIE_COLORS, MONTHS_ORDER };

export default function useDashboardData(
  apiUrl: string,
  columns: ColumnDef[],
  dashboardId?: number,
) {
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showAllCities, setShowAllCities] = useState(false);

  const isUniversalApi = apiUrl === DASHBOARD_DATA_URL || apiUrl.startsWith(DASHBOARD_DATA_URL);
  const fetchUrl = isUniversalApi && dashboardId ? `${DASHBOARD_DATA_URL}?dashboard_id=${dashboardId}` : apiUrl;

  useEffect(() => {
    setAllRows([]);
    setLoading(true);
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

  const allCitiesAggregated2 = (() => {
    const monthFilter = selectedMonth
      ? allRows.filter(r => !hasMonths || r.month === selectedMonth)
      : allRows;
    const map: Record<string, Row> = {};
    monthFilter.forEach(r => {
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
  const allCitiesGrandTotal = allCitiesAggregated2.reduce((s, r) => s + rowTotal(r), 0);

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

  const reasonTrend = (colKey: string) => {
    if (!hasMonths || allMonths.length < 2) return null;
    const curMonthIdx = new Date().getMonth();
    const curMonthName = MONTHS_ORDER[curMonthIdx];
    const prevMonthName = curMonthIdx > 0 ? MONTHS_ORDER[curMonthIdx - 1] : MONTHS_ORDER[11];
    const calc = (m: string) => allRows
      .filter(r => (!selectedCity || r.city === selectedCity) && r.month === m)
      .reduce((s, r) => s + (Number(r[colKey]) || 0), 0);
    const prev = calc(prevMonthName);
    const cur = calc(curMonthName);
    if (prev === 0) return null;
    return ((cur - prev) / prev) * 100;
  };
  const top1Trend = top1 ? reasonTrend(top1.key) : null;
  const top2Trend = top2 ? reasonTrend(top2.key) : null;

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

  return {
    allRows, setAllRows,
    loading,
    selectedCity, setSelectedCity,
    selectedMonth, setSelectedMonth,
    showAllCities, setShowAllCities,
    isUniversalApi, fetchUrl,
    hasMonths, cities, allMonths,
    filteredRows, rowTotal, colTotal, grandTotal,
    aggregatedByCityRows, allCitiesAggregated2, allCitiesGrandTotal,
    aggregatedByMonthRows, colTotals, sorted, top1, top2,
    cityBarData, allRowsTotal, cityShare,
    cityRank, totalCities,
    monthOverMonth, monthlyTrendData,
    top3Reasons, top1Trend, top2Trend,
    reasonsByMonth, concentrationPct,
    anomalies, cityProfileData,
  };
}
