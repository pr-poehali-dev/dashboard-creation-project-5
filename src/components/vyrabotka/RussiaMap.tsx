import { COLORS } from "./VyrabotkaUtils";

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

/**
 * City coordinates mapped to approximate real geographic positions
 * within the 800x400 viewBox representing Russia.
 *
 * Coordinate system:
 *   x: ~20E (x=0) to ~190E (x=800)  -- longitude
 *   y: ~77N (y=0) to ~42N (y=400)   -- latitude (inverted)
 */
const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "Калининград":       { x: 52,  y: 218 },
  "Санкт-Петербург":   { x: 80,  y: 165 },
  "Ростов":            { x: 108, y: 300 },
  "Краснодар Буд":     { x: 98,  y: 315 },
  "Краснодар Сев":     { x: 96,  y: 308 },
  "Нижний Новгород":   { x: 118, y: 230 },
  "Самара":            { x: 140, y: 265 },
  "Пермь":             { x: 155, y: 215 },
  "Тольятти":          { x: 138, y: 270 },
  "Омск":              { x: 220, y: 260 },
  "Новосибирск":       { x: 250, y: 265 },
  "Кемерово":          { x: 262, y: 260 },
  "Новокузнецк":       { x: 264, y: 275 },
  "Барнаул":           { x: 248, y: 280 },
  "Красноярск":        { x: 290, y: 245 },
  "Улан-Удэ":         { x: 340, y: 280 },
};

/*
 * Simplified but recognizable Russia outline paths.
 *
 * Main body: traces from the Finnish border area clockwise --
 *   west border (Baltics, Belarus, Ukraine), south to Black Sea / Caucasus,
 *   Caspian coast, Kazakhstan border, Altai/Mongolia/China border,
 *   up to Pacific coast, Chukotka, then the long Arctic coast back west
 *   including Taymyr peninsula.
 *
 * Separate polygons for Kaliningrad exclave, Kamchatka, and Sakhalin.
 */

// Main continental Russia outline
const RUSSIA_MAIN = [
  // Start: northwest -- Finnish border / Kola peninsula area
  "M 68,140",
  // Arctic coast heading east -- Kola peninsula
  "L 60,130", "L 55,115", "L 62,100", "L 78,95",
  // White Sea indent
  "L 90,105", "L 95,115", "L 88,125", "L 92,130",
  // Continue Arctic coast east
  "L 105,110", "L 120,100", "L 135,90", "L 150,80",
  // Toward Novaya Zemlya area
  "L 170,72", "L 185,65", "L 200,60", "L 215,55",
  // Ob Bay / Yamal
  "L 210,75", "L 205,95", "L 210,110", "L 218,100",
  "L 225,80", "L 235,65", "L 250,55",
  // Taymyr peninsula -- big northward bump
  "L 265,48", "L 280,40", "L 295,35", "L 310,30",
  "L 325,28", "L 340,32", "L 350,40", "L 355,50",
  // East of Taymyr
  "L 360,60", "L 365,75", "L 370,65", "L 380,55",
  // Laptev Sea coast
  "L 395,50", "L 410,45", "L 425,50",
  // Lena delta area
  "L 440,55", "L 450,48", "L 460,45", "L 475,50",
  // East Siberian coast
  "L 490,55", "L 510,52", "L 530,48", "L 550,45",
  // Toward Chukotka
  "L 570,42", "L 590,40", "L 610,42", "L 630,48",
  "L 650,55", "L 665,62", "L 675,72",
  // Chukotka -- easternmost point, Bering Strait
  "L 685,65", "L 695,55", "L 705,50", "L 720,48",
  "L 735,52", "L 745,60", "L 750,72",
  // Turn south along Pacific coast
  "L 745,85", "L 738,100", "L 730,115",
  // Koryak coast
  "L 718,130", "L 705,145",
  // Sea of Okhotsk -- west side
  "L 690,160", "L 680,175",
  // Toward Magadan
  "L 665,185", "L 650,192",
  // Okhotsk coast continues south-west
  "L 635,200", "L 618,208",
  // Shantar / western Okhotsk Sea
  "L 600,215", "L 585,222",
  // Amur region, down toward Vladivostok
  "L 570,230", "L 560,245", "L 548,258",
  "L 538,270", "L 528,280", "L 520,290",
  // Primorsky Krai -- Vladivostok area (southernmost Pacific)
  "L 510,300", "L 505,310", "L 498,315",
  // Turn west along Chinese/Mongolian border
  "L 488,318", "L 475,322", "L 460,320",
  "L 445,315", "L 430,318", "L 415,322",
  // Mongolia border area
  "L 400,325", "L 385,320", "L 370,318",
  // Tuva / Altai
  "L 355,322", "L 340,325", "L 328,330",
  // Near Altai mountains -- southward dip
  "L 315,335", "L 300,340", "L 285,342",
  "L 270,345", "L 258,348", "L 248,350",
  // Kazakhstan border heading west
  "L 235,348", "L 222,345", "L 210,340",
  "L 198,338", "L 185,340", "L 175,335",
  "L 168,325", "L 162,312",
  // North of Caspian / Orenburg area
  "L 158,300", "L 155,290", "L 150,280",
  // Volga region -- turn south toward Caspian
  "L 145,290", "L 138,305",
  // Caspian coast -- Astrakhan / Dagestan
  "L 130,318", "L 125,330", "L 118,340",
  // Caucasus -- southernmost point
  "L 110,350", "L 102,358", "L 95,362",
  // West Caucasus toward Black Sea
  "L 88,358", "L 82,348", "L 78,335",
  // Black Sea coast -- Krasnodar / Crimea area
  "L 75,322", "L 72,310",
  // Rostov / Sea of Azov area
  "L 78,298", "L 85,290",
  // Ukraine border heading north
  "L 82,278", "L 78,265", "L 72,250",
  // Belarus / Smolensk border
  "L 68,238", "L 65,225", "L 62,212",
  // Baltic states border
  "L 60,200", "L 58,188", "L 60,175",
  // Finnish border -- back to start
  "L 62,162", "L 65,150", "L 68,140",
  "Z",
].join(" ");

// Kaliningrad exclave
const KALININGRAD = [
  "M 46,215",
  "L 52,210",
  "L 58,212",
  "L 58,220",
  "L 54,224",
  "L 48,222",
  "Z",
].join(" ");

// Kamchatka peninsula
const KAMCHATKA = [
  "M 700,148",
  "L 708,138",
  "L 718,130",
  "L 725,140",
  "L 730,155",
  "L 735,170",
  "L 738,188",
  "L 735,205",
  "L 728,220",
  "L 720,232",
  "L 712,240",
  "L 705,235",
  "L 698,225",
  "L 695,210",
  "L 692,195",
  "L 690,180",
  "L 692,165",
  "L 696,155",
  "Z",
].join(" ");

// Sakhalin island
const SAKHALIN = [
  "M 560,195",
  "L 565,188",
  "L 570,180",
  "L 575,172",
  "L 578,165",
  "L 580,160",
  "L 582,165",
  "L 580,175",
  "L 577,185",
  "L 574,195",
  "L 570,205",
  "L 566,210",
  "L 562,205",
  "Z",
].join(" ");

function getColor(pct: number, isTop: boolean): string {
  if (isTop) return COLORS.good;
  if (pct >= 100) return COLORS.fact;
  if (pct >= 80) return COLORS.warn;
  return COLORS.bad;
}

export default function RussiaMap({ cityRanking, onCityClick }: Props) {
  const topCity = cityRanking.length > 0 ? cityRanking[0].city : "";

  const cities: CityPoint[] = cityRanking
    .filter((c) => CITY_COORDS[c.city])
    .map((c) => ({
      name: c.city,
      x: CITY_COORDS[c.city].x,
      y: CITY_COORDS[c.city].y,
      pct: c.pct,
    }));

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-display font-bold text-white text-lg">
          География выработки
        </h3>
        <p className="text-white/40 text-xs mt-0.5">
          % выполнения плана по городам
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.good }} />
          <span className="text-[10px] text-white/50">Лидер</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.fact }} />
          <span className="text-[10px] text-white/50">&ge;100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.warn }} />
          <span className="text-[10px] text-white/50">&ge;80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.bad }} />
          <span className="text-[10px] text-white/50">&lt;80%</span>
        </div>
      </div>

      {/* Map */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <svg viewBox="0 0 800 400" className="w-full h-auto">
          <defs>
            {/* Fill gradient for land */}
            <linearGradient id="russiaMapGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(139,92,246,0.10)" />
              <stop offset="100%" stopColor="rgba(0,191,255,0.06)" />
            </linearGradient>

            {/* Glow filter for city dots */}
            <filter id="cityGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* --- Russia land masses --- */}

          {/* Main body */}
          <path
            d={RUSSIA_MAIN}
            fill="url(#russiaMapGrad)"
            stroke="rgba(139,92,246,0.18)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Dashed inner stroke for depth */}
          <path
            d={RUSSIA_MAIN}
            fill="none"
            stroke="rgba(139,92,246,0.07)"
            strokeWidth="0.6"
            strokeDasharray="6 4"
            strokeLinejoin="round"
          />

          {/* Kaliningrad exclave */}
          <path
            d={KALININGRAD}
            fill="url(#russiaMapGrad)"
            stroke="rgba(139,92,246,0.18)"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Kamchatka peninsula */}
          <path
            d={KAMCHATKA}
            fill="url(#russiaMapGrad)"
            stroke="rgba(139,92,246,0.18)"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Sakhalin island */}
          <path
            d={SAKHALIN}
            fill="url(#russiaMapGrad)"
            stroke="rgba(139,92,246,0.18)"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* --- City markers --- */}
          {cities.map((city) => {
            const isTop = city.name === topCity;
            const color = getColor(city.pct, isTop);
            const dotR = isTop ? 5 : 3.5;
            const shortName =
              city.name.length > 10
                ? city.name.slice(0, 9) + "\u2026"
                : city.name;

            return (
              <g
                key={city.name}
                className="cursor-pointer"
                onClick={() => onCityClick(city.name)}
              >
                {/* Outer pulsing ring */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={dotR + 6}
                  fill={color}
                  opacity={0.07}
                >
                  <animate
                    attributeName="r"
                    values={`${dotR + 4};${dotR + 10};${dotR + 4}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.07;0.02;0.07"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Glowing dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={dotR}
                  fill={color}
                  opacity={0.85}
                  filter="url(#cityGlow)"
                >
                  <animate
                    attributeName="opacity"
                    values="0.85;0.55;0.85"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Solid inner dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={dotR - 1.5}
                  fill={color}
                />

                {/* Tooltip badge above */}
                <rect
                  x={city.x - 18}
                  y={city.y - dotR - 16}
                  width={36}
                  height={13}
                  rx={4}
                  fill="rgba(10,5,25,0.88)"
                  stroke={color}
                  strokeWidth={0.5}
                  strokeOpacity={0.5}
                />
                <text
                  x={city.x}
                  y={city.y - dotR - 6.5}
                  textAnchor="middle"
                  fill="white"
                  fontSize={8}
                  fontWeight={600}
                >
                  {city.pct.toFixed(0)}%
                </text>

                {/* City name below */}
                <text
                  x={city.x}
                  y={city.y + dotR + 11}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.45)"
                  fontSize={6.5}
                >
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