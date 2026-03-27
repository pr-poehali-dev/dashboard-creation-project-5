import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";
import { COLORS } from "./VyrabotkaUtils";

function SpeedometerGauge({ value, label, scoreLabel, color }: { value: number; label: string; scoreLabel: string; color: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const totalTicks = 40;
  const startAngle = -210;
  const endAngle = 30;
  const angleRange = endAngle - startAngle;
  const needleAngle = startAngle + (clamped / 100) * angleRange;
  const cx = 150, cy = 140, r = 110;
  const filledTicks = Math.round((clamped / 100) * totalTicks);

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const angle = startAngle + (i / (totalTicks - 1)) * angleRange;
    const rad = (angle * Math.PI) / 180;
    const innerR = r - 14;
    const outerR = r;
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
      filled: i < filledTicks,
    };
  });

  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLen = r - 30;
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  return (
    <div className="flex flex-col items-center">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-white mb-2">{clamped.toFixed(0)}%</p>
      <svg viewBox="0 0 300 175" className="w-full max-w-[280px]">
        <defs>
          <linearGradient id="tickGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="needleGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.filled ? "url(#tickGrad)" : "rgba(255,255,255,0.1)"}
            strokeWidth={3} strokeLinecap="round"
            style={{ transition: `stroke 0.05s ease ${i * 20}ms` }} />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={color} strokeWidth={3} strokeLinecap="round"
          filter="url(#needleGlow)"
          style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <circle cx={cx} cy={cy} r={6} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        <circle cx={cx} cy={cy} r={3} fill="#0f0a1e" />
        <text x={40} y={170} fill="rgba(255,255,255,0.35)" fontSize="12" textAnchor="middle">0</text>
        <text x={260} y={170} fill="rgba(255,255,255,0.35)" fontSize="12" textAnchor="middle">100%</text>
      </svg>
      <span className="text-sm font-bold px-4 py-1.5 rounded-full -mt-2" style={{ background: `${color}20`, color }}>
        {scoreLabel}
      </span>
    </div>
  );
}

function MetricBar({ label, value, max = 100, color, suffix = "%" }: { label: string; value: number; max?: number; color: string; suffix?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-28 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
          }} />
      </div>
      <span className="text-sm font-semibold text-white/80 w-14 text-right">{value.toFixed(1)}{suffix}</span>
    </div>
  );
}

interface GrowthRateItem {
  name: string;
  growth: number;
  decline: number;
  raw: number;
  fact: number;
  isFirst: boolean;
}

interface Props {
  overallScore: number;
  scoreColor: string;
  scoreLabel: string;
  efficiencyMetrics: { label: string; value: number; max: number; color: string }[];
  growthRateData: GrowthRateItem[];
  avgGrowthRate: number;
  isLight: boolean;
  axisColor: string;
}

export default function CityEfficiencyPanel({
  overallScore, scoreColor, scoreLabel,
  efficiencyMetrics, growthRateData, avgGrowthRate,
  isLight, axisColor,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="mb-6">
          <h3 className="font-display font-bold text-white text-lg">
            <Icon name="Activity" size={20} className="inline mr-2 text-violet-400" />
            Эффективность клиники
          </h3>
          <p className="text-white/40 text-xs mt-0.5">Комплексная оценка по 3 метрикам</p>
        </div>
        <div className="flex flex-col items-center">
          <SpeedometerGauge value={overallScore} label="Общий балл" scoreLabel={scoreLabel} color={scoreColor} />
          <div className="w-full max-w-lg mt-6 flex flex-col gap-3">
            {efficiencyMetrics.map((m) => (
              <MetricBar key={m.label} label={m.label} value={m.value} max={m.max} color={m.color} />
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 animate-fade-in-up flex flex-col" style={{ animationDelay: "0.1s" }}>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-white text-lg">
                <Icon name="TrendingUp" size={20} className="inline mr-2 text-cyan-400" />
                Темп роста
              </h3>
              <p className="text-white/40 text-xs mt-0.5">Прирост факта м/м, %</p>
            </div>
            <div className={`text-right px-3 py-1.5 rounded-xl ${avgGrowthRate >= 0 ? "bg-[#00CC44]/10" : "bg-[#E50000]/10"}`}>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Средний</p>
              <p className={`font-display text-xl font-bold ${avgGrowthRate >= 0 ? "text-[#00CC44]" : "text-[#E50000]"}`}>
                {avgGrowthRate >= 0 ? "+" : ""}{avgGrowthRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        {growthRateData.length > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.good }} />
                <span className="text-xs text-white/40">Прирост</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.bad }} />
                <span className="text-xs text-white/40">Отклонение</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = growthRateData.find(r => r.name === label);
                      if (!d) return null;
                      return (
                        <div className="p-3 rounded-xl" style={{ background: "rgba(15,10,30,0.95)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <p className="text-xs text-white/50 mb-1">{label}</p>
                          {d.growth > 0 && <p className="text-sm" style={{ color: COLORS.good }}>Прирост: +{d.growth.toFixed(1)}%</p>}
                          {d.decline > 0 && <p className="text-sm" style={{ color: COLORS.bad }}>Отклонение: {d.decline.toFixed(1)}%</p>}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="growth" name="Прирост" fill={COLORS.good} fillOpacity={0.85} radius={[6, 6, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="decline" name="Отклонение" fill={COLORS.bad} fillOpacity={0.85} radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
            Недостаточно данных (нужно минимум 2 месяца)
          </div>
        )}
      </div>
    </div>
  );
}
