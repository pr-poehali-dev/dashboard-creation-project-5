import Icon from "@/components/ui/icon";
import type { ColumnDef } from "@/config/dashboards";

interface Row {
  id: number;
  city: string;
  month?: string;
  [key: string]: number | string | undefined;
}

interface Props {
  title: string;
  selectedCity: string | null;
  selectedMonth: string | null;
  hasMonths: boolean;
  readonly: boolean;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  dirty: boolean;
  columns: ColumnDef[];
  filteredRows: Row[];
  aggregatedByCityRows: Row[];
  rowTotal: (row: Row) => number;
  colTotal: (key: string) => number;
  grandTotal: number;
  onSave: () => void;
  onChange: (id: number, col: string, val: string) => void;
}

export default function DashboardDataTable({
  title, selectedCity, selectedMonth, hasMonths, readonly, loading,
  saving, saved, dirty, columns, filteredRows, aggregatedByCityRows,
  rowTotal, colTotal, grandTotal, onSave, onChange,
}: Props) {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="font-display font-bold text-white text-lg">
            {title}
            {selectedCity ? ` · ${selectedCity}` : ""}
            {selectedMonth ? ` · ${selectedMonth}` : ""}
          </h3>
          {!readonly && <p className="text-white/40 text-xs mt-0.5">Кликните на ячейку для редактирования</p>}
        </div>
        {!readonly && (
          <button onClick={onSave} disabled={saving || !dirty}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${dirty ? "gradient-violet text-white shadow-lg cursor-pointer hover:opacity-90" : "bg-white/5 text-white/30 cursor-not-allowed"}`}
            style={dirty ? { boxShadow: "0 4px 20px rgba(124,92,255,0.4)" } : {}}>
            {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : saved ? <Icon name="Check" size={16} /> : <Icon name="Save" size={16} />}
            {saving ? "Сохранение..." : saved ? "Сохранено" : "Сохранить"}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-3 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                style={{ background: "var(--sticky-cell-bg)", minWidth: 110 }}>
                {hasMonths && !selectedMonth ? "Город" : hasMonths ? "Город" : "Город / Причина"}
              </th>
              {hasMonths && !selectedMonth && (
                <th className="text-left px-3 py-3 text-white/50 font-medium text-xs whitespace-nowrap">
                  Месяц
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} className="px-1.5 py-3 text-white/50 font-medium text-[10px] text-center leading-tight"
                  style={{ minWidth: 60 }}>
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap">ИТОГО</th>
            </tr>
          </thead>
          <tbody>
            {hasMonths && !selectedMonth ? (
              aggregatedByCityRows.map((row, ri) => (
                <tr key={row.city} className="border-b border-white/5 transition-colors hover:bg-white/3">
                  <td className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                    style={{ background: "var(--sticky-cell-bg)" }}>
                    {row.city}
                  </td>
                  <td className="px-3 py-2.5 text-white/40 text-xs">Все</td>
                  {columns.map(col => (
                    <td key={col.key} className="px-1 py-1.5 text-center">
                      <span className={`text-xs ${Number(row[col.key]) > 0 ? "text-white/80" : "text-white/25"}`}>
                        {(Number(row[col.key]) || 0).toLocaleString("ru-RU")}
                      </span>
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rowTotal(row) > 0 ? "text-gradient-violet" : "text-white/30"}`}>
                      {rowTotal(row).toLocaleString("ru-RU")}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              filteredRows.map((row, ri) => (
                <tr key={row.id} className="border-b border-white/5 transition-colors hover:bg-white/3"
                  style={{ animationDelay: `${ri * 0.03}s` }}>
                  <td className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                    style={{ background: "var(--sticky-cell-bg)" }}>
                    {row.city}
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-1 py-1.5 text-center">
                      {readonly ? (
                        <span className={`text-xs ${Number(row[col.key]) > 0 ? "text-white/80" : "text-white/25"}`}>
                          {(Number(row[col.key]) || 0).toLocaleString("ru-RU")}
                        </span>
                      ) : (
                        <input type="number" min={0}
                          value={row[col.key] === 0 ? "" : String(row[col.key])}
                          placeholder="0"
                          onChange={e => onChange(row.id, col.key, e.target.value)}
                          className="w-full text-center text-white/80 text-xs rounded-lg py-1.5 px-1 outline-none transition-all duration-150
                            bg-transparent border border-transparent hover:border-white/15 focus:border-violet-500/60 focus:bg-violet-500/8
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ minWidth: 40 }} />
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rowTotal(row) > 0 ? "text-gradient-violet" : "text-white/30"}`}>
                      {rowTotal(row).toLocaleString("ru-RU")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/10">
              <td className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-10"
                style={{ background: "var(--sticky-cell-bg)" }}>ИТОГО</td>
              {hasMonths && !selectedMonth && <td></td>}
              {columns.map(col => (
                <td key={col.key} className="px-1 py-3 text-center">
                  <span className={`text-xs font-bold ${colTotal(col.key) > 0 ? "text-gradient-cyan" : "text-white/30"}`}>
                    {colTotal(col.key).toLocaleString("ru-RU")}
                  </span>
                </td>
              ))}
              <td className="px-2 py-3 text-center">
                <span className="text-sm font-black text-gradient-pink">{grandTotal.toLocaleString("ru-RU")}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}