import { useState, useEffect } from "react";

export interface CityMonthData {
  plan: number;
  fact: number;
}

export interface CityData {
  city: string;
  months: Record<string, CityMonthData>;
}

export interface CityTotals {
  plan: number;
  fact: number;
  diff: number;
  pct: number;
}

export const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
export const MONTH_LABELS: Record<string, string> = {
  "Январь": "Январь", "Февраль": "Февраль", "Март": "Март", "Апрель": "Апрель",
  "Май": "Май", "Июнь": "Июнь", "Июль": "Июль", "Август": "Август",
  "Сентябрь": "Сентябрь", "Октябрь": "Октябрь", "Ноябрь": "Ноябрь", "Декабрь": "Декабрь",
};

export const PIE_COLORS = [
  "#7B2FFF", "#00FFD5", "#FF0066", "#FF7700",
  "#00FF6E", "#0088FF", "#FFE000", "#FF1133",
  "#DD00FF", "#FF55CC", "#00CCFF", "#FFC800",
  "#8855FF", "#00FFBB", "#FF33AA", "#FFAA00",
];

export const DASHBOARD_ID = 6;

export function AnimatedNumber({ value, key2 }: { value: string | number; key2?: string }) {
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

export function fmtMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} млн`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)} тыс`;
  return v.toFixed(0);
}

export function fmtFull(v: number): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

export function pctColor(pct: number): string {
  if (pct >= 100) return "text-emerald-400";
  if (pct >= 80) return "text-amber-400";
  return "text-red-400";
}

export function pctBg(pct: number): string {
  if (pct >= 100) return "bg-emerald-500/20 text-emerald-400";
  if (pct >= 80) return "bg-amber-500/20 text-amber-400";
  return "bg-red-500/20 text-red-400";
}

interface TPayload { color: string; name: string; value: number; }
interface TTooltip { active?: boolean; payload?: TPayload[]; label?: string; }

export const CustomTooltip = ({ active, payload, label }: TTooltip) => {
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

export const PieTooltip = ({ active, payload }: TTooltip) => {
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

export function getCityTotals(city: CityData, activeMonths: string[], month?: string | null): CityTotals {
  let plan = 0, fact = 0;
  const ms = month ? [month] : activeMonths;
  ms.forEach(m => {
    const md = city.months[m];
    if (md) { plan += md.plan; fact += md.fact; }
  });
  return { plan, fact, diff: fact - plan, pct: plan > 0 ? (fact / plan) * 100 : 0 };
}

export default {};