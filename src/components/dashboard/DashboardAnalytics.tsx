import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Icon from "@/components/ui/icon";

interface Anomaly {
  city: string;
  reason: string;
  month: string;
  prev: number;
  cur: number;
  pctChange: number;
  color: string;
  sparkline: number[];
}

interface Top3Reason {
  key: string;
  label: string;
  total: number;
  color: string;
  pct: number;
}

interface CityProfileItem {
  reason: string;
  fullLabel: string;
  city: number;
  avg: number;
  cityRaw: number;
  avgRaw: number;
  color: string;
}

interface Props {
  anomalies: Anomaly[];
  top3Reasons: Top3Reason[];
  concentrationPct: number;
  grandTotal: number;
  loading: boolean;
  isLight: boolean;
  axisColor: string;
  selectedCity: string | null;
  selectedMonth: string | null;
  cityProfileData: CityProfileItem[];
}

export default function DashboardAnalytics({
  anomalies, top3Reasons, concentrationPct, grandTotal, loading, isLight,
  axisColor, selectedCity, selectedMonth, cityProfileData,
}: Props) {
  return (
    <>
      {anomalies.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(255,60,172,0.25)" }}>
              <Icon name="Zap" size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Аномалии</h3>
              <p className="text-white/40 text-xs mt-0.5">Резкие скачки причин (±80% к предыдущему месяцу)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((a, i) => {
              const isUp = a.pctChange > 0;
              const absPct = Math.abs(a.pctChange);
              const multiplier = a.prev > 0 ? a.cur / a.prev : 0;
              const changeLabel = a.prev === 0
                ? "с нуля"
                : absPct > 300
                  ? `×${multiplier.toFixed(1)}`
                  : `${isUp ? "+" : ""}${Math.round(a.pctChange)}%`;
              const accentColor = isUp ? "#EF4444" : "#10B981";
              const spark = a.sparkline;
              const sparkMin = Math.min(...spark);
              const sparkMax = Math.max(...spark);
              const sparkRange = sparkMax - sparkMin || 1;
              const sparkH = 56;
              const sparkPad = 4;

              return (
                <div key={i} className="relative overflow-hidden rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: isLight ? "rgba(20,10,40,0.03)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${accentColor}20`,
                    boxShadow: `0 0 20px ${accentColor}12, 0 0 40px ${accentColor}06`,
                  }}>
                  <svg className="absolute bottom-0 left-0 w-full pointer-events-none" height={sparkH}
                    viewBox={`0 0 100 ${sparkH}`} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`anomalyFill-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accentColor} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,${sparkH} ${spark.map((v, si) =>
                        `${(si / Math.max(spark.length - 1, 1)) * 100},${sparkPad + (sparkH - sparkPad) - ((v - sparkMin) / sparkRange) * (sparkH - sparkPad * 2)}`
                      ).join(" ")} 100,${sparkH}`}
                      fill={`url(#anomalyFill-${i})`}
                    />
                    <polyline
                      points={spark.map((v, si) =>
                        `${(si / Math.max(spark.length - 1, 1)) * 100},${sparkPad + (sparkH - sparkPad) - ((v - sparkMin) / sparkRange) * (sparkH - sparkPad * 2)}`
                      ).join(" ")}
                      fill="none" stroke={accentColor} strokeWidth={1.5}
                      strokeLinecap="round" strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  <div className="relative flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: isLight ? "#1a1a2e" : "#fff" }}>
                        {a.reason}
                      </p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)" }}>
                        {!selectedCity ? `${a.city} · ` : ""}{a.month}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ background: `${accentColor}15` }}>
                      <Icon name={isUp ? "TrendingUp" : "TrendingDown"} size={12} style={{ color: accentColor }} />
                      <span className="text-xs font-bold" style={{ color: accentColor }}>{changeLabel}</span>
                    </div>
                  </div>

                  <div className="relative flex items-end justify-between">
                    <div>
                      <span className="text-2xl font-bold font-mono leading-none" style={{ color: isLight ? "#1a1a2e" : "#fff" }}>
                        {a.cur.toLocaleString("ru-RU")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs pb-0.5" style={{ color: isLight ? "rgba(20,10,40,0.3)" : "rgba(255,255,255,0.25)" }}>
                      <span className="font-mono">{a.prev.toLocaleString("ru-RU")}</span>
                      <Icon name="ArrowRight" size={10} />
                      <span className="font-mono font-semibold" style={{ color: accentColor }}>{a.cur.toLocaleString("ru-RU")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && grandTotal > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="mb-5">
            <h3 className="font-display font-bold text-white text-lg">Топ причины</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {selectedCity ? selectedCity : "Все города"}
              {selectedMonth ? ` · ${selectedMonth}` : ""} · доля от общего
            </p>
          </div>
          <div className="space-y-4">
            {top3Reasons.map((item, i) => (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                      style={{ background: item.color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.total.toLocaleString("ru-RU")}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${item.color}20`, color: item.color }}>
                      {item.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(20,10,40,0.06)" : "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}CC)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && grandTotal > 0 && (
        <div className="glass rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-cyan flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,191,255,0.25)" }}>
              <Icon name="Target" size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white/50 text-xs">Концентрация причин</p>
              <p className="font-display text-xl font-bold text-gradient-cyan">
                Топ-3 = {concentrationPct.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="mt-3 h-4 rounded-full overflow-hidden flex" style={{ background: isLight ? "rgba(20,10,40,0.06)" : "rgba(255,255,255,0.06)" }}>
            {top3Reasons.map((item, i) => (
              <div key={item.key} className="h-full transition-all duration-700"
                title={`${item.label}: ${item.pct.toFixed(1)}%`}
                style={{ width: `${item.pct}%`, background: item.color }} />
            ))}
            {concentrationPct < 100 && (
              <div className="h-full" style={{ width: `${100 - concentrationPct}%`, background: isLight ? "rgba(20,10,40,0.04)" : "rgba(255,255,255,0.04)" }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {top3Reasons.map(item => (
              <span key={item.key} className="flex items-center gap-1.5 text-xs text-white/50">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                {item.label}: {item.pct.toFixed(1)}%
              </span>
            ))}
            <span className="text-xs text-white/30">
              Остальные: {(100 - concentrationPct).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {selectedCity && cityProfileData.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
              style={{ boxShadow: "0 8px 24px rgba(0,212,106,0.25)" }}>
              <Icon name="Radar" size={18} className="text-white" fallback="CircleAlert" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Профиль города</h3>
              <p className="text-white/40 text-xs mt-0.5">{selectedCity} vs средние по всем городам</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={cityProfileData}>
                <PolarGrid stroke={isLight ? "rgba(20,10,40,0.1)" : "rgba(255,255,255,0.1)"} />
                <PolarAngleAxis dataKey="reason" tick={{ fill: axisColor, fontSize: 9 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name={selectedCity} dataKey="city" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
                <Radar name="Среднее" dataKey="avg" stroke="#00BFFF" fill="#00BFFF" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                <Tooltip contentStyle={{ background: "var(--tooltip-bg)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12 }}
                  formatter={(value: number, name: string, props: { payload: { fullLabel: string; cityRaw: number; avgRaw: number } }) => {
                    const d = props.payload;
                    return name === selectedCity ? `${d.cityRaw}` : `${d.avgRaw}`;
                  }} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex flex-col justify-center gap-1.5">
              {(() => {
                const maxVal = Math.max(...cityProfileData.map(d => Math.max(d.cityRaw, d.avgRaw)), 1);
                return cityProfileData
                  .filter(d => d.cityRaw > 0 || d.avgRaw > 0)
                  .sort((a, b) => b.cityRaw - a.cityRaw)
                  .map((d, i) => {
                    const cityW = Math.max((d.cityRaw / maxVal) * 100, 1);
                    const avgW = Math.max((d.avgRaw / maxVal) * 100, 1);
                    const diff = d.cityRaw - d.avgRaw;
                    const pct = d.avgRaw > 0 ? Math.round((diff / d.avgRaw) * 100) : 0;
                    return (
                      <div key={i} className="group">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-white/50 truncate max-w-[60%]" title={d.fullLabel}>{d.fullLabel}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.cityRaw}</span>
                            <span className="text-[10px] text-white/25">vs {d.avgRaw}</span>
                            {diff !== 0 && (
                              <span className={`text-[10px] font-semibold ${diff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                {diff > 0 ? "+" : ""}{pct}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(20,10,40,0.06)" : "rgba(255,255,255,0.06)" }}>
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                            style={{ width: `${cityW}%`, background: d.color, opacity: 0.85 }} />
                          <div className="absolute top-0 h-full w-0.5 rounded-full transition-all duration-500"
                            style={{ left: `${avgW}%`, background: "#00BFFF", opacity: 0.6 }} />
                        </div>
                      </div>
                    );
                  });
              })()}
              <div className="flex items-center gap-4 mt-1 pt-1.5 border-t border-white/5">
                <span className="flex items-center gap-1.5 text-[10px] text-white/35">
                  <span className="w-4 h-1.5 rounded-full bg-violet-500 opacity-80" /> {selectedCity}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/35">
                  <span className="w-0.5 h-2.5 rounded-full bg-cyan-400 opacity-60" /> Среднее
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}