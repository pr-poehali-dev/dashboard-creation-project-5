import Icon from "@/components/ui/icon";

interface Props {
  cities: string[];
  allMonths: string[];
  selectedCity: string | null;
  selectedMonth: string | null;
  onCityChange: (city: string | null) => void;
  onMonthChange: (month: string | null) => void;
}

export default function DashboardFilters({
  cities, allMonths, selectedCity, selectedMonth, onCityChange, onMonthChange,
}: Props) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="MapPin" size={14} className="text-violet-400" />
          <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Город</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onCityChange(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              !selectedCity ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
            }`}>
            Все города
          </button>
          {cities.map(city => (
            <button key={city}
              onClick={() => onCityChange(selectedCity === city ? null : city)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                selectedCity === city ? "gradient-violet text-white font-semibold" : "glass glass-hover text-white/50"
              }`}>
              {city}
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
            onClick={() => onMonthChange(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
              !selectedMonth ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
            }`}>
            Все месяцы
          </button>
          {allMonths.map(m => (
            <button key={m}
              onClick={() => onMonthChange(selectedMonth === m ? null : m)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                selectedMonth === m ? "gradient-cyan text-white font-semibold" : "glass glass-hover text-white/50"
              }`}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
