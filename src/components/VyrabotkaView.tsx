import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import funcUrls from "../../backend/func2url.json";
import {
  type CityData,
  type CityMonthData,
  MONTHS,
  MONTH_LABELS,
  PIE_COLORS,
  DASHBOARD_ID,
  fmtMoney,
  getCityTotals,
} from "./vyrabotka/VyrabotkaUtils";
import VyrabotkaKPI from "./vyrabotka/VyrabotkaKPI";
import VyrabotkaCityView from "./vyrabotka/VyrabotkaCityView";
import VyrabotkaAllView from "./vyrabotka/VyrabotkaAllView";

export default function VyrabotkaView() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const axisColor = isLight ? "rgba(20,10,40,0.4)" : "rgba(255,255,255,0.35)";

  const [DATA, setDATA] = useState<CityData[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    const url = `${funcUrls["dashboard-data"]}?dashboard_id=${DASHBOARD_ID}`;
    fetch(url)
      .then(r => r.json())
      .then((rows: Array<{ id: number; city: string; plan: number; fact: number }>) => {
        const cityMap: Record<string, Record<string, CityMonthData>> = {};
        rows.forEach(r => {
          const sep = r.city.lastIndexOf(" — ");
          if (sep === -1) return;
          const cityName = r.city.substring(0, sep);
          const month = r.city.substring(sep + 3);
          if (!cityMap[cityName]) cityMap[cityName] = {};
          cityMap[cityName][month] = { plan: r.plan, fact: r.fact };
        });
        const mapped: CityData[] = Object.entries(cityMap).map(([city, months]) => ({ city, months }));
        setDATA(mapped);
      })
      .catch(e => console.error("Failed to load vyrabotka data", e))
      .finally(() => setDataLoading(false));
  }, []);

  const activeMonths = MONTHS.filter(m =>
    DATA.some(d => {
      const md = d.months[m];
      return md && (md.plan > 0 || md.fact > 0);
    })
  );

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
          Загрузка данных...
        </div>
      </div>
    );
  }

  const filteredData = selectedCity ? DATA.filter(d => d.city === selectedCity) : DATA;

  let totalPlan = 0, totalFact = 0;
  filteredData.forEach(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    totalPlan += t.plan;
    totalFact += t.fact;
  });
  const totalDiff = totalFact - totalPlan;
  const totalPct = totalPlan > 0 ? (totalFact / totalPlan) * 100 : 0;

  const cityRanking = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { ...d, ...t };
  }).filter(c => c.plan > 0).sort((a, b) => b.pct - a.pct);

  const bestCity = cityRanking[0];
  const worstCity = cityRanking[cityRanking.length - 1];

  const monthlyData = activeMonths.map(m => {
    let plan = 0, fact = 0;
    filteredData.forEach(d => {
      const md = d.months[m];
      if (md) { plan += md.plan; fact += md.fact; }
    });
    return { name: MONTH_LABELS[m] || m, shortName: m, plan, fact, pct: plan > 0 ? ((fact / plan) * 100) : 0 };
  });

  const barData = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { name: d.city, plan: t.plan, fact: t.fact, pct: t.pct };
  }).sort((a, b) => b.pct - a.pct);

  const pieDataFact = DATA.map((d, i) => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { name: d.city, value: t.fact, color: PIE_COLORS[i % PIE_COLORS.length] };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const deviationData = DATA.map(d => {
    const t = getCityTotals(d, activeMonths, selectedMonth);
    return { name: d.city, value: t.diff, pct: t.pct };
  }).filter(d => d.value !== 0).sort((a, b) => b.pct - a.pct);

  const kpiKey = `${selectedCity || "all"}-${selectedMonth || "all"}`;

  const kpiCards = selectedCity
    ? (() => {
        const ct = getCityTotals(DATA.find(d => d.city === selectedCity)!, activeMonths, selectedMonth);
        const rank = cityRanking.findIndex(c => c.city === selectedCity) + 1;
        return [
          {
            label: `План · ${selectedCity}`,
            value: fmtMoney(ct.plan),
            icon: "Target",
            gradient: "gradient-violet",
            textGradient: "text-gradient-violet",
            glow: "rgba(124,92,255,0.35)",
            sub: selectedMonth ? MONTH_LABELS[selectedMonth] : "За период",
          },
          {
            label: `Факт · ${selectedCity}`,
            value: fmtMoney(ct.fact),
            icon: "TrendingUp",
            gradient: "gradient-cyan",
            textGradient: "text-gradient-cyan",
            glow: "rgba(0,229,204,0.35)",
            sub: `${ct.pct.toFixed(1)}% от плана`,
          },
          {
            label: "Отклонение",
            value: (ct.diff >= 0 ? "+" : "") + fmtMoney(ct.diff),
            icon: ct.diff >= 0 ? "ArrowUpRight" : "ArrowDownRight",
            gradient: ct.diff >= 0 ? "gradient-green" : "gradient-pink",
            textGradient: ct.diff >= 0 ? "text-gradient-green" : "text-gradient-pink",
            glow: ct.diff >= 0 ? "rgba(0,212,106,0.35)" : "rgba(255,60,172,0.35)",
            sub: fmtMoney(Math.abs(ct.diff)) + " ₽",
          },
          {
            label: "Место в рейтинге",
            value: `${rank} из ${cityRanking.length}`,
            icon: "Award",
            gradient: rank <= 3 ? "gradient-green" : rank <= 10 ? "gradient-violet" : "gradient-pink",
            textGradient: rank <= 3 ? "text-gradient-green" : rank <= 10 ? "text-gradient-violet" : "text-gradient-pink",
            glow: rank <= 3 ? "rgba(0,212,106,0.35)" : "rgba(124,92,255,0.35)",
            sub: `${ct.pct.toFixed(1)}% выполнения`,
          },
        ];
      })()
    : [
        {
          label: "Общий план",
          value: fmtMoney(totalPlan),
          icon: "Target",
          gradient: "gradient-violet",
          textGradient: "text-gradient-violet",
          glow: "rgba(124,92,255,0.35)",
          sub: selectedMonth ? MONTH_LABELS[selectedMonth] : "За период",
        },
        {
          label: "Общий факт",
          value: fmtMoney(totalFact),
          icon: "TrendingUp",
          gradient: "gradient-cyan",
          textGradient: "text-gradient-cyan",
          glow: "rgba(0,229,204,0.35)",
          sub: `${totalPct.toFixed(1)}% от плана`,
        },
        {
          label: "Отклонение",
          value: (totalDiff >= 0 ? "+" : "") + fmtMoney(totalDiff),
          icon: totalDiff >= 0 ? "ArrowUpRight" : "ArrowDownRight",
          gradient: totalDiff >= 0 ? "gradient-green" : "gradient-pink",
          textGradient: totalDiff >= 0 ? "text-gradient-green" : "text-gradient-pink",
          glow: totalDiff >= 0 ? "rgba(0,212,106,0.35)" : "rgba(255,60,172,0.35)",
          sub: `${DATA.length} городов`,
        },
        {
          label: "Лучший город",
          value: bestCity?.city ?? "—",
          icon: "Award",
          gradient: "gradient-green",
          textGradient: "text-gradient-green",
          glow: "rgba(0,212,106,0.35)",
          sub: bestCity ? `${bestCity.pct.toFixed(1)}%` : "",
        },
      ];

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="MapPin" size={14} className="text-violet-400" />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Город</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCity(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                !selectedCity ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
              }`}>
              Все города
            </button>
            {DATA.map(d => (
              <button key={d.city}
                onClick={() => setSelectedCity(selectedCity === d.city ? null : d.city)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  selectedCity === d.city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
                }`}>
                {d.city}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/8" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Calendar" size={14} className="text-cyan-400" />
            <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Месяц</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedMonth(null)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                !selectedMonth ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
              }`}>
              Все месяцы
            </button>
            {activeMonths.map(m => (
              <button key={m}
                onClick={() => setSelectedMonth(selectedMonth === m ? null : m)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
                }`}>
                {MONTH_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <VyrabotkaKPI cards={kpiCards} kpiKey={kpiKey} />

      {selectedCity ? (
        <VyrabotkaCityView
          selectedCity={selectedCity}
          DATA={DATA}
          activeMonths={activeMonths}
          monthlyData={monthlyData}
          totalPlan={totalPlan}
          totalFact={totalFact}
          totalDiff={totalDiff}
          totalPct={totalPct}
          kpiKey={kpiKey}
          isLight={isLight}
          axisColor={axisColor}
          cityRanking={cityRanking}
        />
      ) : (
        <VyrabotkaAllView
          DATA={DATA}
          activeMonths={activeMonths}
          selectedMonth={selectedMonth}
          monthlyData={monthlyData}
          barData={barData}
          pieDataFact={pieDataFact}
          deviationData={deviationData}
          cityRanking={cityRanking}
          isLight={isLight}
          axisColor={axisColor}
          setSelectedCity={setSelectedCity}
        />
      )}
    </div>
  );
}