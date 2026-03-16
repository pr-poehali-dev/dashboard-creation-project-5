import { useState, useEffect, useCallback } from "react";
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
  const [newCity, setNewCity] = useState("");
  const [newColName, setNewColName] = useState("");

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
    if (!newCity.trim()) return;
    const newRow: Row = { id: 0, city: newCity.trim() };
    columns.forEach(c => { newRow[c.key] = 0; });
    setRows(prev => [...prev, newRow]);
    setNewCity("");
    setDirty(true);
    setSaved(false);
  };

  const addColumn = async () => {
    const name = newColName.trim();
    if (!name) return;
    const key = slugify(name) || `col${columns.length + 1}`;
    if (columns.some(c => c.key === key)) return;
    const newCols = [...columns, { key, label: name }];
    setColumns(newCols);
    setRows(prev => prev.map(r => ({ ...r, [key]: 0 })));
    setNewColName("");
    setDirty(true);
    setSaved(false);
    if (onColumnsChange) await onColumnsChange(newCols);
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
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                  style={{ minWidth: 90, maxWidth: 120 }}
                >
                  {col.label}
                </th>
              ))}
              {editable && (
                <th className="px-2 py-2" style={{ minWidth: 120 }}>
                  <input
                    value={newColName}
                    onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addColumn(); }}
                    placeholder="+ столбец"
                    className="w-full bg-transparent text-white/30 text-xs text-center outline-none border border-dashed border-white/15 hover:border-white/30 focus:border-violet-500/60 rounded-lg px-2 py-1.5 transition-all placeholder:text-white/20"
                  />
                </th>
              )}
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
                  {row.city}
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
                {editable && <td />}
                <td className="px-4 py-2.5 text-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${rowTotal(row) > 0 ? "text-gradient-violet" : "text-white/30"}`}>
                    {rowTotal(row)}
                  </span>
                </td>
              </tr>
            ))}
            {editable && (
              <tr className="border-b border-white/5">
                <td className="px-2 py-1.5 sticky left-0 z-10" style={{ background: "var(--sticky-cell-bg)" }}>
                  <input
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addCity(); }}
                    placeholder="+ Новый город"
                    className="w-full bg-transparent text-white/40 text-xs rounded-lg py-1.5 px-2 outline-none border border-dashed border-white/10 hover:border-white/20 focus:border-violet-500/60 transition-all placeholder:text-white/20"
                  />
                </td>
                <td colSpan={columns.length + 2} />
              </tr>
            )}
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
                    {colTotal(col)}
                  </span>
                </td>
              ))}
              {editable && <td />}
              <td className="px-4 py-3 text-center">
                <span className="text-sm font-black text-gradient-pink">{grandTotal}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
