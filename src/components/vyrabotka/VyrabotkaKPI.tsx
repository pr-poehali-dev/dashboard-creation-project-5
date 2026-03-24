import Icon from "@/components/ui/icon";
import { AnimatedNumber } from "./VyrabotkaUtils";

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  gradient: string;
  textGradient: string;
  glow: string;
  sub: string;
}

interface VyrabotkaKPIProps {
  cards: KpiCard[];
  kpiKey: string;
}

export default function VyrabotkaKPI({ cards, kpiKey }: VyrabotkaKPIProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={card.label + kpiKey} className="glass glass-hover rounded-2xl p-5 animate-fade-in-up"
          style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${card.gradient} flex items-center justify-center`}
              style={{ boxShadow: `0 8px 24px ${card.glow}` }}>
              <Icon name={card.icon} size={18} className="text-white" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">{card.sub}</span>
          </div>
          <p className="text-white/50 text-xs mb-1">{card.label}</p>
          <p className={`font-display text-2xl font-bold ${card.textGradient}`}>
            <AnimatedNumber value={card.value} key2={kpiKey} />
          </p>
        </div>
      ))}
    </div>
  );
}
