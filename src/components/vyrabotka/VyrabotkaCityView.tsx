import {
  type CityData,
  MONTHS,
  MONTH_LABELS,
  COLORS,
  getCityTotals,
} from "./VyrabotkaUtils";
import CityKpiCards from "./CityKpiCards";
import CityEfficiencyPanel from "./CityEfficiencyPanel";
import CityChartsPanel from "./CityChartsPanel";
import CityDetailTable from "./CityDetailTable";

interface MonthlyDataItem {
  name: string;
  shortName: string;
  plan: number;
  fact: number;
  pct: number;
}

interface Props {
  selectedCity: string;
  DATA: CityData[];
  activeMonths: string[];
  monthlyData: MonthlyDataItem[];
  totalPlan: number;
  totalFact: number;
  totalDiff: number;
  totalPct: number;
  kpiKey: string;
  isLight: boolean;
  axisColor: string;
  cityRanking: (CityData & { plan: number; fact: number; diff: number; pct: number })[];
}

export default function VyrabotkaCityView({
  selectedCity, DATA, activeMonths, monthlyData,
  totalPlan, totalFact, totalDiff, totalPct,
  kpiKey, isLight, axisColor, cityRanking,
}: Props) {
  const cd = DATA.find(d => d.city === selectedCity)!;
  if (!cd) return null;

  const monthsWithFact = activeMonths.filter(m => cd.months[m]?.fact > 0);
  const monthsData = monthsWithFact.map(m => ({ m, ...cd.months[m] }));

  const bestMonth = monthsData.length > 0
    ? monthsData.reduce((a, b) => (b.plan > 0 && (b.fact / b.plan) > (a.plan > 0 ? a.fact / a.plan : 0)) ? b : a)
    : null;

  const avgMonthlyFact = monthsWithFact.length > 0
    ? monthsData.reduce((s, d) => s + d.fact, 0) / monthsWithFact.length
    : 0;
  const yearForecast = avgMonthlyFact * 12;
  const yearPlan = activeMonths.reduce((s, m) => s + (cd.months[m]?.plan || 0), 0);

  const cityActiveMonths = activeMonths.filter(m => {
    const md = cd.months[m];
    return md && (md.plan > 0 || md.fact > 0);
  });
  let cumPlan = 0, cumFact = 0;
  const cumulativeData = cityActiveMonths.map(m => {
    const md = cd.months[m];
    if (md) { cumPlan += md.plan; cumFact += md.fact; }
    return { name: MONTH_LABELS[m], cumPlan, cumFact };
  });

  const allCitiesFactTotal = DATA.reduce((s, d) => {
    activeMonths.forEach(m => { s += d.months[m]?.fact || 0; });
    return s;
  }, 0);
  const cityFactTotal = monthsData.reduce((s, d) => s + d.fact, 0);
  const shareOfTotal = allCitiesFactTotal > 0 ? (cityFactTotal / allCitiesFactTotal) * 100 : 0;

  const cityTotals = getCityTotals(cd, activeMonths);
  const planExecution = cityTotals.pct;
  const stability = monthsData.length > 1
    ? (() => {
        const pcts = monthsData.map(d => d.plan > 0 ? (d.fact / d.plan) * 100 : 0);
        const avg = pcts.reduce((s, p) => s + p, 0) / pcts.length;
        const variance = pcts.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / pcts.length;
        const cv = avg > 0 ? (Math.sqrt(variance) / avg) * 100 : 100;
        return Math.max(0, Math.min(100, 100 - cv));
      })()
    : 50;
  const growthTrend = monthsData.length >= 2
    ? (() => {
        const last = monthsData[monthsData.length - 1];
        const prev = monthsData[monthsData.length - 2];
        const lastPct = last.plan > 0 ? (last.fact / last.plan) * 100 : 0;
        const prevPct = prev.plan > 0 ? (prev.fact / prev.plan) * 100 : 0;
        return Math.max(0, Math.min(100, 50 + (lastPct - prevPct)));
      })()
    : 50;
  const rank = cityRanking.findIndex(c => c.city === selectedCity) + 1;
  const rankScore = cityRanking.length > 1
    ? ((cityRanking.length - rank) / (cityRanking.length - 1)) * 100
    : 50;

  const overallScore = Math.min((planExecution * 0.55 + rankScore * 0.25 + Math.min(shareOfTotal * 5, 100) * 0.2), 100);
  const scoreColor = overallScore >= 80 ? COLORS.good : overallScore >= 60 ? COLORS.warn : COLORS.bad;
  const scoreLabel = overallScore >= 80 ? "Отлично" : overallScore >= 60 ? "Хорошо" : overallScore >= 40 ? "Средне" : "Критично";

  const efficiencyMetrics = [
    { label: "Выполнение плана", value: Math.min(planExecution, 100), max: 100, color: COLORS.plan },
    { label: "Позиция в рейтинге", value: rankScore, max: 100, color: COLORS.good },
    { label: "Доля среди всех клиник", value: shareOfTotal, max: Math.max(...DATA.map(d => {
      const total = activeMonths.reduce((s, m) => s + (d.months[m]?.fact || 0), 0);
      return allCitiesFactTotal > 0 ? (total / allCitiesFactTotal) * 100 : 0;
    })), color: COLORS.warn },
  ];

  const monthsWithData = activeMonths.filter(m => {
    const md = cd.months[m];
    return md && (md.plan > 0 || md.fact > 0);
  });
  const growthRateData = monthsWithData.length >= 2
    ? monthsWithData.map((m, i) => {
        const curr = cd.months[m];
        if (i === 0) return { name: MONTH_LABELS[m], growth: 0, decline: 0, raw: 0, fact: curr.fact, isFirst: true };
        const prevM = monthsWithData[i - 1];
        const prev = cd.months[prevM];
        const rate = prev.fact > 0 ? ((curr.fact - prev.fact) / prev.fact) * 100 : 0;
        const rounded = Math.round(rate * 10) / 10;
        return {
          name: MONTH_LABELS[m],
          growth: rounded >= 0 ? rounded : 0,
          decline: rounded < 0 ? Math.abs(rounded) : 0,
          raw: rounded,
          fact: curr.fact,
          isFirst: false,
        };
      }).filter(d => !d.isFirst)
    : [];
  const avgGrowthRate = growthRateData.length > 0
    ? growthRateData.reduce((s, d) => s + d.raw, 0) / growthRateData.length
    : 0;

  return (
    <>
      <CityKpiCards
        shareOfTotal={shareOfTotal}
        avgMonthlyFact={avgMonthlyFact}
        yearForecast={yearForecast}
        yearPlan={yearPlan}
        bestMonthLabel={bestMonth ? MONTH_LABELS[bestMonth.m] : null}
        kpiKey={kpiKey}
      />

      <CityEfficiencyPanel
        overallScore={overallScore}
        scoreColor={scoreColor}
        scoreLabel={scoreLabel}
        efficiencyMetrics={efficiencyMetrics}
        growthRateData={growthRateData}
        avgGrowthRate={avgGrowthRate}
        isLight={isLight}
        axisColor={axisColor}
      />

      <CityChartsPanel
        monthlyData={monthlyData}
        cumulativeData={cumulativeData}
        isLight={isLight}
        axisColor={axisColor}
      />

      <CityDetailTable
        selectedCity={selectedCity}
        cd={cd}
        activeMonths={activeMonths}
        totalPlan={totalPlan}
        totalFact={totalFact}
        totalDiff={totalDiff}
        totalPct={totalPct}
      />
    </>
  );
}