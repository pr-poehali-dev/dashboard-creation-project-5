import { useState, useEffect, useRef, useMemo } from "react";
import Icon from "@/components/ui/icon";
import type { ColumnDef } from "@/config/dashboards";

const MONTHS_ORDER = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

interface Row {
  id: number;
  city?: string;
  month?: string;
  [key: string]: number | string | undefined;
}

interface ExtraDataTableProps {
  title: string;
  subtitle?: string;
  apiUrl: string;
  columns: ColumnDef[];
  editable?: boolean;
  hasCityMonth?: boolean;
  onColumnsChange?: (cols: ColumnDef[]) => Promise<void>;
}

export default function ExtraDataTable({ title, subtitle, apiUrl, columns: initialColumns, editable = false, hasCityMonth = false, onColumnsChange }: ExtraDataTableProps) {
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
  const colInputRef = useRef<HTMLInputElement>(null);

  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns.map(c => c.key).join(",")]);

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setAllRows(Array.isArray(parsed) ? parsed : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  const hasMonths = hasCityMonth || allRows.some(r => r.month && r.month.length > 0);
  const cities = useMemo(() => [...new Set(allRows.filter(r => r.city).map(r => r.city as string))], [allRows]);
  const allMonths = useMemo(() =>
    hasMonths ? MONTHS_ORDER.filter(m => allRows.some(r => r.month === m)) : [],
    [allRows, hasMonths]
  );

  const filteredRows = useMemo(() => allRows.filter(r => {
    if (selectedCity && r.city !== selectedCity) return false;
    if (hasMonths && selectedMonth && r.month !== selectedMonth) return false;
    return true;
  }), [allRows, selectedCity, selectedMonth, hasMonths]);

  const aggregatedByCityRows = useMemo(() => {
    if (!hasMonths || selectedMonth) return [];
    const map: Record<string, Row> = {};
    filteredRows.forEach(r => {
      const city = (r.city || "—") as string;
      if (!map[city]) {
        map[city] = { id: r.id, city };
        columns.forEach(c => { map[city][c.key] = 0; });
      }
      columns.forEach(c => {
        (map[city][c.key] as number) += Number(r[c.key]) || 0;
      });
    });
    return Object.values(map);
  }, [filteredRows, columns, hasMonths, selectedMonth]);

  const rowTotal = (row: Row) => columns.reduce((s, c) => s + (Number(row[c.key]) || 0), 0);
  const colTotal = (key: string) => filteredRows.reduce((s, r) => s + (Number(r[key]) || 0), 0);
  const grandTotal = filteredRows.reduce((s, r) => s + rowTotal(r), 0);

  const displayRows = hasMonths && !selectedMonth ? aggregatedByCityRows : filteredRows;

  const handleChange = (rowId: number, col: string, val: string) => {
    setAllRows(prev => prev.map(r => r.id === rowId ? { ...r, [col]: val } : r));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rowsToSave = selectedMonth
        ? allRows.filter(r => (!selectedCity || r.city === selectedCity) && r.month === selectedMonth)
        : selectedCity
          ? allRows.filter(r => r.city === selectedCity)
          : allRows;
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rowsToSave }),
      });
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    const newRow: Row = { id: 0 };
    columns.forEach(c => { newRow[c.key] = ""; });
    setAllRows(prev => [...prev, newRow]);
    setDirty(true);
    setSaved(false);
  };

  const removeRow = (idx: number) => {
    const targetRows = displayRows;
    const targetId = targetRows[idx]?.id;
    if (targetId) {
      setAllRows(prev => prev.filter(r => r.id !== targetId));
    } else {
      setAllRows(prev => {
        const displayIds = targetRows.map(r => r.id);
        const removeId = displayIds[idx];
        return prev.filter(r => r.id !== removeId);
      });
    }
    setDirty(true);
    setSaved(false);
  };

  const addColumn = () => {
    const key = `col${Date.now()}`;
    const newCols = [...columns, { key, label: "" }];
    setColumns(newCols);
    setAllRows(prev => prev.map(r => ({ ...r, [key]: "" })));
    const idx = newCols.length - 1;
    setTimeout(() => { setEditingColIdx(idx); setTimeout(() => colInputRef.current?.focus(), 30); }, 0);
    setDirty(true);
    setSaved(false);
  };

  const commitColumn = async (idx: number, val: string) => {
    const label = val.trim();
    const updatedCols = columns.map((c, i) => i === idx ? { ...c, label } : c);
    setColumns(updatedCols);
    setEditingColIdx(null);
    if (onColumnsChange) await onColumnsChange(updatedCols);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center gap-3 text-white/40">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
        Загрузка данных...
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ "--sticky-cell-bg": "rgba(30,20,50,0.97)" } as React.CSSProperties}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="font-display font-bold text-white text-lg">
            {title}
            {selectedCity ? ` · ${selectedCity}` : ""}
            {selectedMonth ? ` · ${selectedMonth}` : ""}
          </h3>
          {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {editable && !hasMonths && (
            <>
              <button onClick={addColumn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                <Icon name="Plus" size={13} /> Столбец
              </button>
              <button onClick={addRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                <Icon name="Plus" size={13} /> Строка
              </button>
            </>
          )}
          {editable && hasMonths && (
            <button onClick={addColumn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
              <Icon name="Plus" size={13} /> Столбец
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${dirty
                ? "gradient-violet text-white shadow-lg cursor-pointer hover:opacity-90"
                : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
            style={dirty ? { boxShadow: "0 4px 20px rgba(124,92,255,0.4)" } : {}}
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : saved ? (
              <Icon name="Check" size={16} />
            ) : (
              <Icon name="Save" size={16} />
            )}
            {saving ? "Сохранение..." : saved ? "Сохранено" : "Сохранить"}
          </button>
        </div>
      </div>

      {hasMonths && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-white/8">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-white/40 text-xs mr-1">Город:</span>
            <button
              onClick={() => setSelectedCity(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${!selectedCity ? "gradient-violet text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Все
            </button>
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedCity === city ? "gradient-violet text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
              >
                {city}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-white/40 text-xs mr-1">Месяц:</span>
            <button
              onClick={() => setSelectedMonth(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${!selectedMonth ? "gradient-violet text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Все
            </button>
            {allMonths.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${selectedMonth === month ? "gradient-violet text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-auto max-h-[60vh]" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-white/8" style={{ background: "var(--sticky-cell-bg)" }}>
              {hasMonths && (
                <th className="text-left px-3 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                  style={{ background: "var(--sticky-cell-bg)", minWidth: 110 }}>
                  Город
                </th>
              )}
              {hasMonths && !selectedMonth && (
                <th className="text-left px-3 py-3 text-white/50 font-medium text-xs whitespace-nowrap"
                  style={{ background: "var(--sticky-cell-bg)" }}>
                  Месяц
                </th>
              )}
              {columns.map((col, ci) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                  style={{ minWidth: 80, background: "var(--sticky-cell-bg)" }}
                >
                  {editable && editingColIdx === ci ? (
                    <input
                      ref={colInputRef}
                      defaultValue={col.label}
                      placeholder="Название..."
                      onBlur={e => commitColumn(ci, e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") commitColumn(ci, e.currentTarget.value); }}
                      className="w-full bg-white text-gray-800 text-xs text-center outline-none rounded-lg px-2 py-1 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <span
                      onClick={editable ? () => { setEditingColIdx(ci); setTimeout(() => colInputRef.current?.focus(), 30); } : undefined}
                      className={editable ? "cursor-pointer hover:text-white transition-colors" : ""}
                    >
                      {col.label || <span className="text-white/20 italic">пусто</span>}
                    </span>
                  )}
                </th>
              ))}
              {hasMonths && (
                <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap"
                  style={{ background: "var(--sticky-cell-bg)" }}>
                  ИТОГО
                </th>
              )}
              {editable && !hasMonths && <th className="px-2 py-3 w-8" style={{ background: "var(--sticky-cell-bg)" }}></th>}
            </tr>
          </thead>
          <tbody>
            {hasMonths && !selectedMonth ? (
              aggregatedByCityRows.map(row => (
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
            ) : hasMonths ? (
              filteredRows.map(row => (
                <tr key={row.id} className="border-b border-white/5 transition-colors hover:bg-white/3">
                  <td className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                    style={{ background: "var(--sticky-cell-bg)" }}>
                    {row.city}
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-1 py-1.5 text-center">
                      {editable ? (
                        <input
                          type="text"
                          value={row[col.key] ?? ""}
                          placeholder="—"
                          onChange={e => handleChange(row.id, col.key, e.target.value)}
                          className="w-full text-center text-white/80 text-xs rounded-lg py-1.5 px-1 outline-none transition-all duration-150
                            bg-transparent border border-transparent
                            hover:border-white/15 focus:border-violet-500/60 focus:bg-violet-500/8
                            placeholder:text-white/15"
                          style={{ minWidth: 60 }}
                        />
                      ) : (
                        <span className={`text-xs ${Number(row[col.key]) > 0 ? "text-white/80" : "text-white/25"}`}>
                          {row[col.key] || "—"}
                        </span>
                      )}
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
              displayRows.map((row, ri) => (
                <tr key={row.id || ri} className="border-b border-white/5 transition-colors hover:bg-white/3">
                  {columns.map(col => (
                    <td key={col.key} className="px-2 py-1.5 text-center">
                      <input
                        type="text"
                        value={row[col.key] ?? ""}
                        placeholder="—"
                        onChange={e => handleChange(row.id, col.key, e.target.value)}
                        className="w-full text-center text-white/80 text-xs rounded-lg py-1.5 px-1 outline-none transition-all duration-150
                          bg-transparent border border-transparent
                          hover:border-white/15 focus:border-violet-500/60 focus:bg-violet-500/8
                          placeholder:text-white/15"
                        style={{ minWidth: 60 }}
                      />
                    </td>
                  ))}
                  {editable && (
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => removeRow(ri)} className="text-white/15 hover:text-red-400 transition-colors">
                        <Icon name="X" size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
            {displayRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (hasMonths ? 2 : 0) + (editable && !hasMonths ? 1 : 0)} className="text-center py-8 text-white/20 text-xs">
                  Нет данных.
                </td>
              </tr>
            )}
          </tbody>
          {hasMonths && displayRows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-white/10">
                <td className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-10"
                  style={{ background: "var(--sticky-cell-bg)" }}>ИТОГО</td>
                {!selectedMonth && <td></td>}
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
          )}
        </table>
      </div>
    </div>
  );
}
