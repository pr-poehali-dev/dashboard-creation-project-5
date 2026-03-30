import type { KpiCard } from "@/components/dashboard/DashboardKpiCards";
import type { Row } from "@/hooks/useDashboardData";

interface KpiParams {
  selectedCity: string | null;
  selectedMonth: string | null;
  title: string;
  grandTotal: number;
  monthOverMonth: { prevMonth: string; prevTotal: number; currentTotal: number; change: number } | null;
  aggregatedByCityRows: Row[];
  rowTotal: (row: Row) => number;
  top1: { label: string; total: number; key: string } | undefined;
  top2: { label: string; total: number; key: string } | undefined;
  top1Trend: number | null;
  top2Trend: number | null;
  cityRank: number;
  totalCities: number;
  cities: string[];
  cityShare: number;
  allRowsTotal: number;
}

export default function useDashboardKpi({
  selectedCity, selectedMonth, title, grandTotal, monthOverMonth,
  aggregatedByCityRows, rowTotal, top1, top2, top1Trend, top2Trend,
  cityRank, totalCities, cities, cityShare, allRowsTotal,
}: KpiParams): KpiCard[] {
  return [
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
      sub: top1Trend !== null
        ? `${top1Trend > 0 ? "\u2191" : "\u2193"} ${Math.abs(Math.round(top1Trend))}% · ${top1!.total.toLocaleString("ru-RU")} случаев`
        : top1 ? `${top1.total.toLocaleString("ru-RU")} случаев` : "",
      changeType: top1Trend !== null ? (top1Trend > 0 ? "up" : "down") : null,
    },
    {
      label: "2-я по частоте",
      value: top2?.label ?? "\u2014",
      icon: "AlertCircle",
      gradient: "gradient-cyan",
      textGradient: "text-gradient-cyan",
      glow: "rgba(0,229,204,0.35)",
      sub: top2Trend !== null
        ? `${top2Trend > 0 ? "\u2191" : "\u2193"} ${Math.abs(Math.round(top2Trend))}% · ${top2!.total.toLocaleString("ru-RU")} случаев`
        : top2 ? `${top2.total.toLocaleString("ru-RU")} случаев` : "",
      changeType: top2Trend !== null ? (top2Trend > 0 ? "up" : "down") : null,
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
}
