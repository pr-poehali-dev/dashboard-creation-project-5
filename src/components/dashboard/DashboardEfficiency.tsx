import Icon from "@/components/ui/icon";

interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

interface ColumnDef {
  key: string;
  label: string;
}

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

  const uniqueId = `eff-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="flex flex-col items-center">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="font-display text-3xl font-bold text-white mb-2">{clamped.toFixed(0)}%</p>
      <svg viewBox="0 0 300 175" className="w-full max-w-[280px]">
        <defs>
          <linearGradient id={`tickGrad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id={`needleGlow-${uniqueId}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.filled ? `url(#tickGrad-${uniqueId})` : "rgba(255,255,255,0.1)"}
            strokeWidth={3} strokeLinecap="round"
            style={{ transition: `stroke 0.05s ease ${i * 20}ms` }} />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={color} strokeWidth={3} strokeLinecap="round"
          filter={`url(#needleGlow-${uniqueId})`}
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

function MetricBar({ label, value, max = 100, color, suffix = "", inverse }: { label: string; value: number; max?: number; color: string; suffix?: string; inverse?: boolean }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-32 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${color}40`,
          }} />
      </div>
      <span className="text-sm font-semibold text-white/80 w-20 text-right">
        {value.toLocaleString("ru-RU")}{suffix}
        {inverse && <Icon name="TrendingDown" size={11} className="inline ml-1 text-emerald-400" />}
      </span>
    </div>
  );
}

interface Props {
  selectedCity: string | null;
  loading: boolean;
  columns: ColumnDef[];
  aggregatedByCityRows: Row[];
  rowTotal: (row: Row) => number;
  grandTotal: number;
  isLight: boolean;
}

export default function DashboardEfficiency({
  selectedCity, loading, columns, aggregatedByCityRows, rowTotal, grandTotal, isLight,
}: Props) {
  if (loading || aggregatedByCityRows.length === 0) return null;

  const cityTotals = aggregatedByCityRows
    .map(r => ({ city: r.city as string, total: rowTotal(r) }))
    .sort((a, b) => a.total - b.total);

  const maxTotal = Math.max(...cityTotals.map(c => c.total), 1);
  const avgTotal = grandTotal / cityTotals.length;

  const currentCity = selectedCity
    ? cityTotals.find(c => c.city === selectedCity)
    : null;

  const cityTotal = currentCity?.total ?? 0;

  const score = maxTotal > 0 ? Math.max(0, 100 - (cityTotal / maxTotal) * 100) : 100;

  const scoreColor = score >= 70 ? "#10B981" : score >= 40 ? "#F59E0B" : "#EF4444";
  const scoreLabel = score >= 70 ? "Хорошо" : score >= 40 ? "Средне" : "Плохо";

  const topReasons = columns
    .map(c => ({
      label: c.label,
      value: selectedCity
        ? Number(aggregatedByCityRows.find(r => r.city === selectedCity)?.[c.key] || 0)
        : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .filter(r => r.value > 0);

  const reasonColors = ["#EF4444", "#F59E0B", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981", "#EC4899", "#6366F1", "#14B8A6"];

  const rank = cityTotals.findIndex(c => c.city === selectedCity) + 1;
  const totalCities = cityTotals.length;

  if (!selectedCity) {
    const best3 = cityTotals.slice(0, 3);
    const worst3 = cityTotals.slice(-3).reverse();

    return (
      <div className="glass rounded-2xl p-6 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
            style={{ boxShadow: "0 8px 24px rgba(16,185,129,0.25)" }}>
            <Icon name="Activity" size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-lg">Эффективность клиник</h3>
            <p className="text-white/40 text-xs mt-0.5">Меньше обращений = лучше клиника</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-emerald-400 font-semibold mb-3 flex items-center gap-1.5">
              <Icon name="ThumbsUp" size={14} /> Лучшие клиники
            </p>
            <div className="space-y-2.5">
              {best3.map((c, i) => (
                <div key={c.city} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-400"
                    style={{ background: "rgba(16,185,129,0.15)" }}>{i + 1}</span>
                  <span className="text-sm text-white/80 flex-1 truncate">{c.city}</span>
                  <span className="text-sm font-mono font-semibold text-emerald-400">{c.total.toLocaleString("ru-RU")}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-red-400 font-semibold mb-3 flex items-center gap-1.5">
              <Icon name="AlertTriangle" size={14} /> Требуют внимания
            </p>
            <div className="space-y-2.5">
              {worst3.map((c, i) => (
                <div key={c.city} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-red-400"
                    style={{ background: "rgba(239,68,68,0.15)" }}>{totalCities - i}</span>
                  <span className="text-sm text-white/80 flex-1 truncate">{c.city}</span>
                  <span className="text-sm font-mono font-semibold text-red-400">{c.total.toLocaleString("ru-RU")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/8">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>Среднее: <span className="font-semibold text-white/60">{Math.round(avgTotal).toLocaleString("ru-RU")}</span> обращений</span>
            <span>Разброс: <span className="font-semibold text-white/60">{cityTotals[0]?.total.toLocaleString("ru-RU")} — {cityTotals[cityTotals.length - 1]?.total.toLocaleString("ru-RU")}</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-green flex items-center justify-center"
          style={{ boxShadow: "0 8px 24px rgba(16,185,129,0.25)" }}>
          <Icon name="Activity" size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-display font-bold text-white text-lg">Эффективность клиники</h3>
          <p className="text-white/40 text-xs mt-0.5">{selectedCity} · чем меньше обращений — тем лучше</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col items-center">
          <SpeedometerGauge value={score} label="Оценка клиники" scoreLabel={scoreLabel} color={scoreColor} />
          <div className="flex items-center gap-4 mt-4">
            <div className="text-center px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Место</p>
              <p className="font-display text-xl font-bold text-white">{rank}/{totalCities}</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Обращений</p>
              <p className="font-display text-xl font-bold text-white">{cityTotal.toLocaleString("ru-RU")}</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Среднее</p>
              <p className="font-display text-xl font-bold text-white/60">{Math.round(avgTotal).toLocaleString("ru-RU")}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <p className="text-xs text-white/40 font-semibold mb-1">Причины обращений</p>
          {topReasons.slice(0, 5).map((r, i) => (
            <MetricBar key={r.label} label={r.label} value={r.value} max={topReasons[0]?.value || 1}
              color={reasonColors[i % reasonColors.length]} suffix="" />
          ))}
          {cityTotal > avgTotal && (
            <div className="mt-2 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <Icon name="AlertTriangle" size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-300">
                Выше среднего на <span className="font-bold">{Math.round(((cityTotal - avgTotal) / avgTotal) * 100)}%</span>
              </span>
            </div>
          )}
          {cityTotal <= avgTotal && (
            <div className="mt-2 p-3 rounded-xl flex items-center gap-2" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <Icon name="CheckCircle" size={14} className="text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-300">
                Ниже среднего на <span className="font-bold">{Math.round(((avgTotal - cityTotal) / avgTotal) * 100)}%</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
