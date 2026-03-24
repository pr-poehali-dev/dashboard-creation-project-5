interface CityPoint {
  name: string;
  x: number;
  y: number;
  pct: number;
}

interface Props {
  cityRanking: Array<{ city: string; pct: number }>;
  onCityClick: (city: string) => void;
}

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "Калининград": { x: 88, y: 145 },
  "Санкт-Петербург": { x: 140, y: 115 },
  "Ростов": { x: 165, y: 225 },
  "Краснодар Буд": { x: 155, y: 235 },
  "Краснодар Сев": { x: 148, y: 240 },
  "Нижний Новгород": { x: 195, y: 155 },
  "Самара": { x: 225, y: 180 },
  "Пермь": { x: 250, y: 135 },
  "Тольятти": { x: 220, y: 185 },
  "Омск": { x: 330, y: 165 },
  "Новосибирск": { x: 365, y: 175 },
  "Кемерово": { x: 380, y: 170 },
  "Новокузнецк": { x: 385, y: 180 },
  "Барнаул": { x: 370, y: 185 },
  "Красноярск": { x: 415, y: 160 },
  "Улан-Удэ": { x: 465, y: 185 },
};

function getColor(pct: number, isTop: boolean): string {
  if (isTop) return "#00FF7F";
  if (pct >= 100) return "#00E5CC";
  if (pct >= 80) return "#FFAA00";
  return "#FF3366";
}

export default function RussiaMap({ cityRanking, onCityClick }: Props) {
  const topCity = cityRanking.length > 0 ? cityRanking[0].city : "";

  const cities: CityPoint[] = cityRanking
    .filter(c => CITY_COORDS[c.city])
    .map(c => ({
      name: c.city,
      x: CITY_COORDS[c.city].x,
      y: CITY_COORDS[c.city].y,
      pct: c.pct,
    }));

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      <div className="mb-4">
        <h3 className="font-display font-bold text-white text-lg">География выработки</h3>
        <p className="text-white/40 text-xs mt-0.5">% выполнения плана по городам</p>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF7F]" />
          <span className="text-[10px] text-white/50">Лидер</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00E5CC]" />
          <span className="text-[10px] text-white/50">≥100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFAA00]" />
          <span className="text-[10px] text-white/50">≥80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF3366]" />
          <span className="text-[10px] text-white/50">&lt;80%</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
        <svg viewBox="50 80 470 220" className="w-full h-auto">
          <defs>
            <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(124,92,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,229,204,0.05)" />
            </linearGradient>
          </defs>

          <path
            d="M75,150 L80,130 L95,120 L110,115 L125,110 L140,105 L155,108 L170,112 L185,108 L200,105 L215,108 L230,110 L245,105 L260,100 L275,95 L290,100 L305,105 L320,108 L335,112 L350,115 L365,110 L380,108 L395,105 L410,100 L425,105 L440,110 L455,115 L470,120 L485,125 L500,130 L510,140 L515,155 L510,170 L500,180 L490,190 L480,195 L470,200 L455,205 L440,200 L425,195 L410,200 L395,205 L380,210 L365,215 L350,210 L335,205 L320,210 L305,215 L290,220 L275,225 L260,230 L245,235 L230,230 L215,225 L200,230 L185,235 L170,240 L155,245 L140,240 L130,230 L120,220 L110,210 L100,200 L90,190 L80,175 L75,160 Z"
            fill="url(#mapGrad)"
            stroke="rgba(124,92,255,0.15)"
            strokeWidth="1"
          />

          <path
            d="M75,150 L80,130 L95,120 L110,115 L125,110 L140,105 L155,108 L170,112 L185,108 L200,105 L215,108 L230,110 L245,105 L260,100 L275,95 L290,100 L305,105 L320,108 L335,112 L350,115 L365,110 L380,108 L395,105 L410,100 L425,105 L440,110 L455,115 L470,120 L485,125 L500,130 L510,140 L515,155 L510,170 L500,180 L490,190 L480,195 L470,200 L455,205 L440,200 L425,195 L410,200 L395,205 L380,210 L365,215 L350,210 L335,205 L320,210 L305,215 L290,220 L275,225 L260,230 L245,235 L230,230 L215,225 L200,230 L185,235 L170,240 L155,245 L140,240 L130,230 L120,220 L110,210 L100,200 L90,190 L80,175 L75,160 Z"
            fill="none"
            stroke="rgba(124,92,255,0.08)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />

          {cities.map((city) => {
            const isTop = city.name === topCity;
            const color = getColor(city.pct, isTop);
            const r = isTop ? 8 : 6;
            const shortName = city.name.length > 8 ? city.name.slice(0, 7) + "…" : city.name;

            return (
              <g key={city.name} className="cursor-pointer" onClick={() => onCityClick(city.name)}>
                <circle cx={city.x} cy={city.y} r={r + 8} fill={color} opacity={0.08}>
                  <animate attributeName="r" values={`${r + 6};${r + 12};${r + 6}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.08;0.03;0.08" dur="3s" repeatCount="indefinite" />
                </circle>

                <circle cx={city.x} cy={city.y} r={r} fill={color} opacity={0.9}>
                  <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={city.x} cy={city.y} r={r - 2} fill={color} />

                <rect x={city.x - 22} y={city.y - r - 18} width={44} height={14} rx={4}
                  fill="rgba(10,5,25,0.85)" stroke={color} strokeWidth={0.5} strokeOpacity={0.4} />
                <text x={city.x} y={city.y - r - 8.5} textAnchor="middle" fill="white" fontSize={8} fontWeight={600}>
                  {city.pct.toFixed(0)}%
                </text>

                <text x={city.x} y={city.y + r + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={7}>
                  {shortName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
