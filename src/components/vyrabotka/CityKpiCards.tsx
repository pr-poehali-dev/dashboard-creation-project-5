import Icon from "@/components/ui/icon";
import {
  AnimatedNumber,
  fmtMoney,
  COLORS,
  MONTH_LABELS,
} from "./VyrabotkaUtils";

interface Props {
  shareOfTotal: number;
  avgMonthlyFact: number;
  yearForecast: number;
  yearPlan: number;
  bestMonthLabel: string | null;
  kpiKey: string;
}

export default function CityKpiCards({
  shareOfTotal, avgMonthlyFact, yearForecast, yearPlan, bestMonthLabel, kpiKey,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center"
            style={{ boxShadow: "0 8px 24px rgba(139,92,246,0.35)" }}>
            <Icon name="Percent" size={18} className="text-white" />
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">от компании</span>
        </div>
        <p className="text-white/50 text-xs mb-1">Доля в общей выработке</p>
        <p className="font-display text-2xl font-bold text-gradient-violet">
          <AnimatedNumber value={`${shareOfTotal.toFixed(1)}%`} key2={kpiKey + "share"} />
        </p>
      </div>

      <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl gradient-cyan flex items-center justify-center"
            style={{ boxShadow: "0 8px 24px rgba(0,191,255,0.35)" }}>
            <Icon name="Calculator" size={18} className="text-white" />
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">среднее</span>
        </div>
        <p className="text-white/50 text-xs mb-1">Средний факт / мес</p>
        <p className="font-display text-2xl font-bold text-gradient-cyan">
          <AnimatedNumber value={fmtMoney(avgMonthlyFact)} key2={kpiKey + "avg"} />
        </p>
      </div>

      <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${yearForecast >= yearPlan ? "gradient-green" : "gradient-pink"} flex items-center justify-center`}
            style={{ boxShadow: yearForecast >= yearPlan ? `0 8px 24px ${COLORS.goodGlow}` : `0 8px 24px ${COLORS.badGlow}` }}>
            <Icon name="Rocket" size={18} className="text-white" />
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">прогноз</span>
        </div>
        <p className="text-white/50 text-xs mb-1">Прогноз на год</p>
        <p className={`font-display text-2xl font-bold ${yearForecast >= yearPlan ? "text-gradient-green" : "text-gradient-pink"}`}>
          <AnimatedNumber value={fmtMoney(yearForecast)} key2={kpiKey + "forecast"} />
        </p>
      </div>

      <div className="glass glass-hover rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
            style={{ boxShadow: `0 8px 24px ${COLORS.goodGlow}` }}>
            <Icon name="Trophy" size={18} className="text-white" />
          </div>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/8 text-white/40">лучший мес.</span>
        </div>
        <p className="text-white/50 text-xs mb-1">Лучший месяц</p>
        <p className="font-display text-2xl font-bold text-gradient-green">
          {bestMonthLabel || "—"}
        </p>
      </div>
    </div>
  );
}
