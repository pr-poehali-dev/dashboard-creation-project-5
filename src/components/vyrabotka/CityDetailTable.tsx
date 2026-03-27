import {
  type CityData,
  MONTH_LABELS,
  COLORS,
  fmtFull,
  pctBg,
} from "./VyrabotkaUtils";

interface Props {
  selectedCity: string;
  cd: CityData;
  activeMonths: string[];
  totalPlan: number;
  totalFact: number;
  totalDiff: number;
  totalPct: number;
}

export default function CityDetailTable({
  selectedCity, cd, activeMonths,
  totalPlan, totalFact, totalDiff, totalPct,
}: Props) {
  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      <div className="mb-6">
        <h3 className="font-display font-bold text-white text-lg">{selectedCity} · Помесячная детализация</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-white/50 font-medium py-3 px-3">Месяц</th>
              <th className="text-right text-white/50 font-medium py-3 px-3">План</th>
              <th className="text-right text-white/50 font-medium py-3 px-3">Факт</th>
              <th className="text-right text-white/50 font-medium py-3 px-3">Отклонение</th>
              <th className="text-right text-white/50 font-medium py-3 px-3">%</th>
            </tr>
          </thead>
          <tbody>
            {activeMonths.map(m => {
              const md = cd.months[m];
              if (!md) return null;
              const diff = md.fact - md.plan;
              const pct = md.plan > 0 ? (md.fact / md.plan) * 100 : 0;
              return (
                <tr key={m} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 text-white font-medium">{MONTH_LABELS[m]}</td>
                  <td className="py-3 px-3 text-right text-white/70">{fmtFull(md.plan)}</td>
                  <td className="py-3 px-3 text-right text-white">{md.fact > 0 ? fmtFull(md.fact) : "—"}</td>
                  <td className="py-3 px-3 text-right font-semibold" style={{ color: diff >= 0 ? COLORS.good : COLORS.bad }}>
                    {md.fact > 0 ? ((diff >= 0 ? "+" : "") + fmtFull(diff)) : "—"}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {md.fact > 0 ? (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctBg(pct)}`}>
                        {pct.toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/20">
              <td className="py-3 px-3 text-white font-bold">Итого</td>
              <td className="py-3 px-3 text-right text-white font-bold">{fmtFull(totalPlan)}</td>
              <td className="py-3 px-3 text-right text-white font-bold">{fmtFull(totalFact)}</td>
              <td className="py-3 px-3 text-right font-bold" style={{ color: totalDiff >= 0 ? COLORS.good : COLORS.bad }}>
                {(totalDiff >= 0 ? "+" : "") + fmtFull(totalDiff)}
              </td>
              <td className="py-3 px-3 text-right">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pctBg(totalPct)}`}>
                  {totalPct.toFixed(1)}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
