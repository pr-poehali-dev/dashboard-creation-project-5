import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

function AnimatedNumber({ value, animKey }: { value: string | number; animKey?: string }) {
  const [displayed, setDisplayed] = useState("0");
  const strVal = String(value);
  useEffect(() => {
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
  }, [strVal, animKey]);
  return <span>{displayed}</span>;
}

export interface KpiCard {
  label: string;
  value: string;
  icon: string;
  gradient: string;
  textGradient: string;
  glow: string;
  sub: string;
  changeType: string | null;
}

interface Props {
  cards: KpiCard[];
  loading: boolean;
  kpiKey: string;
}

export default function DashboardKpiCards({ cards, loading, kpiKey }: Props) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cards.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
      {cards.map((card, i) => (
        <div key={card.label} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
          style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
              style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
              <Icon name={card.icon} size={18} className="text-white" />
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              card.changeType === 'up' ? 'bg-red-500/15 text-red-400' :
              card.changeType === 'down' ? 'bg-emerald-500/15 text-emerald-400' :
              'bg-white/8 text-white/40'
            }`}>{card.sub}</span>
          </div>
          <p className="text-white/50 text-xs mb-1">{card.label}</p>
          {loading ? (
            <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
          ) : (
            <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
              <AnimatedNumber value={card.value} animKey={kpiKey} />
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
