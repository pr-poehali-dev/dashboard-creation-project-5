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

export const COLORS = {
  plan: "#8B5CF6",
  planDark: "#6D3ACD",
  fact: "#00BFFF",
  factDark: "#0099CC",
  good: "#00CC44",
  warn: "#FFB800",
  bad: "#E50000",
  goodGlow: "rgba(0,204,68,0.4)",
  warnGlow: "rgba(255,184,0,0.4)",
  badGlow: "rgba(229,0,0,0.4)",
};

export const PIE_COLORS = [
  "#8B5CF6", "#00BFFF", "#3F00FF", "#FFB800",
  "#00CC44", "#3B82F6", "#F59E0B", "#4400CC",
  "#A855F7", "#06B6D4", "#EF4444", "#10B981",
  "#F97316", "#6366F1", "#14B8A6", "#7C3AED",
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
  return Math.round(v).toLocaleString("ru-RU") + " ₽";
}

export function fmtShort(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace(".", ",")} млрд`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} млн`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)} тыс`;
  return v.toFixed(0);
}

export function fmtFull(v: number): string {
  return v.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";
}

export function pctColor(pct: number): string {
  if (pct >= 100) return "text-[#00CC44]";
  if (pct >= 80) return "text-[#FFB800]";
  return "text-[#E50000]";
}

export function pctBg(pct: number): string {
  if (pct >= 100) return "bg-[#00CC44]/20 text-[#00CC44]";
  if (pct >= 80) return "bg-[#FFB800]/20 text-[#FFB800]";
  return "bg-[#E50000]/20 text-[#E50000]";
}

function lerpColor(pct: number): string {
  const clamped = Math.max(0, Math.min(pct, 120));
  if (clamped >= 100) return COLORS.good;
  if (clamped >= 80) {
    const t = (clamped - 80) / 20;
    const r = Math.round(255 * (1 - t) + 0 * t);
    const g = Math.round(184 * (1 - t) + 204 * t);
    const b = Math.round(0 * (1 - t) + 68 * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = clamped / 80;
  const r = Math.round(229 + (255 - 229) * (1 - t));
  const g = Math.round(0 + 184 * t);
  const b = 0;
  return `rgb(${r},${g},${b})`;
}

export function statusGradient(pct: number): string {
  const c = lerpColor(pct);
  const cBright = lerpColor(Math.min(pct + 5, 120));
  return `linear-gradient(90deg, ${c}, ${cBright})`;
}

export function statusGlow(pct: number): string {
  const c = lerpColor(pct);
  return `0 0 20px ${c}66, 0 0 40px ${c}26`;
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