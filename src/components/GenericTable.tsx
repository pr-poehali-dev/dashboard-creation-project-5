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

  useEffect(() => {
    setLoading(true);
    fetch(apiUrl)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setRows(Array.isArray(parsed) ? parsed : []);
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
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const addCity = () => {
    const newRow: Row = { id: 0, city: "" };
    columns.forEach(c => { newRow[c.key] = 0; });
    setRows(prev => {
      const idx = prev.length;
      setTimeout(() => { setEditingRowIdx(idx); setTimeout(() => rowInputRef.current?.focus(), 30); }, 0);
      return [...prev, newRow];
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th
                className="text-left px-4 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                style={{ background: "var(--sticky-cell-bg)", minWidth: 140 }}
              >
                Город / Причина
              </th>
              {columns.map((col, ci) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                  style={{ minWidth: 90, maxWidth: 120 }}
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
              <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap">
                ИТОГО
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={row.id || ri}
                className="border-b border-white/5 transition-colors hover:bg-white/3"
              >
                <td
                  className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                  style={{ background: "var(--sticky-cell-bg)" }}
                >
                  {editable && editingRowIdx === ri ? (
                    <input
                      ref={rowInputRef}
                      defaultValue={row.city}
                      placeholder="Название города..."
                      onBlur={e => commitCity(ri, e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") commitCity(ri, e.currentTarget.value); }}
                      className="w-full bg-white text-gray-800 text-xs rounded-lg py-1 px-2 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <span
                      onClick={editable ? () => { setEditingRowIdx(ri); setTimeout(() => rowInputRef.current?.focus(), 30); } : undefined}
                      className={editable ? "cursor-pointer hover:text-white transition-colors" : ""}
                    >
                      {row.city || <span className="text-white/20 italic">пусто</span>}
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
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/10">
              <td
                className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-10"
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