import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import type { ColumnDef } from "@/config/dashboards";

interface Row {
  id: number;
  city: string;
  [key: string]: number | string;
}

interface GenericTableProps {
  title: string;
  subtitle?: string;
  apiUrl: string;
  columns: ColumnDef[];
  editable?: boolean;
  onColumnsChange?: (cols: ColumnDef[]) => Promise<void>;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function GenericTable({ title, subtitle, apiUrl, columns: initialColumns, editable = false, onColumnsChange }: GenericTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
  const rowInputRef = useRef<HTMLInputElement>(null);
  const colInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns.map(c => c.key).join(",")]);

  const MONTH_ORDER: Record<string, number> = {
    "Январь": 1, "Февраль": 2, "Март": 3, "Апрель": 4, "Май": 5, "Июнь": 6,
    "Июль": 7, "Август": 8, "Сентябрь": 9, "Октябрь": 10, "Ноябрь": 11, "Декабрь": 12,
  };

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        const arr: Row[] = Array.isArray(parsed) ? parsed : [];
        const hasMonthField = arr.some(r => r.month && String(r.month).length > 0);
        const hasGroups = arr.some(r => r.city && String(r.city).includes(" — "));
        if (hasMonthField) {
          arr.sort((a, b) => {
            const cityA = String(a.city);
            const cityB = String(b.city);
            if (cityA !== cityB) return cityA.localeCompare(cityB, "ru");
            return (MONTH_ORDER[String(a.month)] || 99) - (MONTH_ORDER[String(b.month)] || 99);
          });
          arr.forEach(r => {
            if (r.month && String(r.month).length > 0) {
              r.city = `${r.city} — ${r.month}`;
            }
          });
        } else if (hasGroups) {
          arr.sort((a, b) => {
            const [cityA, monthA] = String(a.city).split(" — ");
            const [cityB, monthB] = String(b.city).split(" — ");
            if (cityA !== cityB) return cityA.localeCompare(cityB, "ru");
            return (MONTH_ORDER[monthA] || 99) - (MONTH_ORDER[monthB] || 99);
          });
        }
        setRows(arr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  const handleChange = useCallback((id: number, col: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    setRows(prev => prev.map(r => r.id === id ? { ...r, [col]: num } : r));
    setDirty(true);
    setSaved(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const hasMonthData = rows.some(r => r.month !== undefined);
      const saveRows = rows.map(r => {
        const cityStr = String(r.city);
        const sep = cityStr.lastIndexOf(" — ");
        if (sep !== -1 && hasMonthData) {
          return { ...r, city: cityStr.substring(0, sep), month: cityStr.substring(sep + 3) };
        }
        return r;
      });
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: saveRows }),
      });
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const addCity = (groupPrefix?: string) => {
    const newRow: Row = { id: 0, city: groupPrefix ? `${groupPrefix} — ` : "" };
    columns.forEach(c => { newRow[c.key] = 0; });
    setRows(prev => {
      let insertIdx = prev.length;
      if (groupPrefix) {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (String(prev[i].city).startsWith(groupPrefix + " — ")) {
            insertIdx = i + 1;
            break;
          }
        }
      }
      const updated = [...prev.slice(0, insertIdx), newRow, ...prev.slice(insertIdx)];
      setTimeout(() => { setEditingRowIdx(insertIdx); setTimeout(() => rowInputRef.current?.focus(), 30); }, 0);
      return updated;
    });
    setDirty(true);
    setSaved(false);
  };

  const commitCity = (idx: number, val: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, city: val } : r));
    setEditingRowIdx(null);
    setDirty(true);
  };

  const addColumn = () => {
    const key = `col${Date.now()}`;
    const newCols = [...columns, { key, label: "" }];
    setColumns(newCols);
    setRows(prev => prev.map(r => ({ ...r, [key]: 0 })));
    const idx = newCols.length - 1;
    setTimeout(() => { setEditingColIdx(idx); setTimeout(() => colInputRef.current?.focus(), 30); }, 0);
    setDirty(true);
    setSaved(false);
  };

  const commitColumn = async (idx: number, val: string) => {
    const label = val.trim();
    const key = slugify(label) || columns[idx]?.key || `col${idx}`;
    const oldKey = columns[idx]?.key;
    const updatedCols = columns.map((c, i) => i === idx ? { key, label } : c);
    setColumns(updatedCols);
    if (oldKey && oldKey !== key) {
      setRows(prev => prev.map(r => {
        const { [oldKey]: v, ...rest } = r as Record<string, string | number>;
        return { ...rest, [key]: v ?? 0 } as Row;
      }));
    }
    setEditingColIdx(null);
    if (onColumnsChange) await onColumnsChange(updatedCols);
  };

  const colTotal = (col: string | ColumnDef) => {
    const key = typeof col === "string" ? col : col.key;
    return rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
  };

  const rowTotal = (row: Row) =>
    columns.reduce((sum, c) => sum + (Number(row[c.key]) || 0), 0);

  const grandTotal = rows.reduce((sum, r) => sum + rowTotal(r), 0);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8 flex items-center justify-center gap-3 text-white/40">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
        Загрузка данных...
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="font-display font-bold text-white text-lg">{title}</h3>
          {subtitle && <p className="text-white/40 text-xs mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {editable && (
            <>
              <button onClick={addColumn}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                <Icon name="Plus" size={13} /> Столбец
              </button>
              <button onClick={addCity}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                <Icon name="Plus" size={13} /> Строка
              </button>
            </>
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

      <div className="overflow-auto max-h-[60vh]" style={{ scrollbarGutter: "stable" }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-white/8" style={{ background: "var(--sticky-cell-bg)" }}>
              <th
                className="text-left px-4 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-30"
                style={{ background: "var(--sticky-cell-bg)", minWidth: 140 }}
              >
                Город / Причина
              </th>
              {columns.map((col, ci) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                  style={{ minWidth: 90, maxWidth: 120, background: "var(--sticky-cell-bg)" }}
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
              <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap" style={{ background: "var(--sticky-cell-bg)" }}>
                ИТОГО
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const cityStr = String(row.city);
              const hasGroup = cityStr.includes(" — ");
              const groupName = hasGroup ? cityStr.split(" — ")[0] : null;
              const prevCity = ri > 0 ? String(rows[ri - 1].city) : "";
              const prevGroup = prevCity.includes(" — ") ? prevCity.split(" — ")[0] : null;
              const showGroupHeader = hasGroup && groupName !== prevGroup;

              return (
                <>
                  {showGroupHeader && (
                    <tr key={`group-${groupName}`} className="border-b border-white/8 bg-white/5">
                      <td
                        colSpan={columns.length + 2}
                        className="px-4 py-2 text-white/70 font-bold text-xs uppercase tracking-wide"
                      >
                        <div className="flex items-center justify-between">
                          <span>{groupName}</span>
                          {editable && (
                            <button
                              onClick={() => addCity(groupName!)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white/50 hover:text-white text-[10px] font-medium transition-colors normal-case tracking-normal"
                            >
                              <Icon name="Plus" size={10} /> строка
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr key={row.id || ri} className="border-b border-white/5 transition-colors hover:bg-white/3">
                    <td
                      className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                      style={{ background: "var(--sticky-cell-bg)", paddingLeft: hasGroup ? 28 : undefined }}
                    >
                      {editable && editingRowIdx === ri ? (
                        <input
                          ref={rowInputRef}
                          defaultValue={row.city}
                          placeholder="Название..."
                          onBlur={e => commitCity(ri, e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") commitCity(ri, e.currentTarget.value); }}
                          className="w-full bg-white text-gray-800 text-xs rounded-lg py-1 px-2 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                        />
                      ) : (
                        <span
                          onClick={editable ? () => { setEditingRowIdx(ri); setTimeout(() => rowInputRef.current?.focus(), 30); } : undefined}
                          className={editable ? "cursor-pointer hover:text-white transition-colors" : ""}
                        >
                          {hasGroup ? cityStr.split(" — ")[1] : (row.city || <span className="text-white/20 italic">пусто</span>)}
                        </span>
                      )}
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          min={0}
                          value={row[col.key] === 0 ? "" : String(row[col.key])}
                          placeholder="0"
                          onChange={e => handleChange(row.id || ri, col.key, e.target.value)}
                          className="w-full text-center text-white/80 text-xs rounded-lg py-1.5 px-1 outline-none transition-all duration-150
                            bg-transparent border border-transparent
                            hover:border-white/15 focus:border-violet-500/60 focus:bg-violet-500/8
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ minWidth: 52 }}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rowTotal(row) > 0 ? "text-gradient-violet" : "text-white/30"}`}>
                        {rowTotal(row).toLocaleString("ru-RU")}
                      </span>
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 z-20">
            <tr className="border-t-2 border-white/10" style={{ background: "var(--sticky-cell-bg)" }}>
              <td
                className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-30"
                style={{ background: "var(--sticky-cell-bg)" }}
              >
                ИТОГО
              </td>
              {columns.map(col => (
                <td key={col.key} className="px-2 py-3 text-center">
                  <span className={`text-xs font-bold ${colTotal(col) > 0 ? "text-gradient-cyan" : "text-white/30"}`}>
                    {colTotal(col).toLocaleString("ru-RU")}
                  </span>
                </td>
              ))}
              <td className="px-4 py-3 text-center">
                <span className="text-sm font-black text-gradient-pink">{grandTotal.toLocaleString("ru-RU")}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}