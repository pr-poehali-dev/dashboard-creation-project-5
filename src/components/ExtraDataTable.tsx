import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import type { ColumnDef } from "@/config/dashboards";

interface Row {
  id: number;
  [key: string]: number | string;
}

interface ExtraDataTableProps {
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

export default function ExtraDataTable({ title, subtitle, apiUrl, columns: initialColumns, editable = false, onColumnsChange }: ExtraDataTableProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<ColumnDef[]>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
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

  const handleChange = (rowIdx: number, col: string, val: string) => {
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [col]: val } : r));
    setDirty(true);
    setSaved(false);
  };

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

  const addRow = () => {
    const newRow: Row = { id: 0 };
    columns.forEach(c => { newRow[c.key] = ""; });
    setRows(prev => [...prev, newRow]);
    setDirty(true);
    setSaved(false);
  };

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
    setDirty(true);
    setSaved(false);
  };

  const addColumn = () => {
    const key = `col${Date.now()}`;
    const newCols = [...columns, { key, label: "" }];
    setColumns(newCols);
    setRows(prev => prev.map(r => ({ ...r, [key]: "" })));
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
        return { ...rest, [key]: v ?? "" } as Row;
      }));
    }
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
              <button onClick={addRow}
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
              {columns.map((col, ci) => (
                <th
                  key={col.key}
                  className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                  style={{ minWidth: 100, background: "var(--sticky-cell-bg)" }}
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
              {editable && <th className="px-2 py-3 w-8" style={{ background: "var(--sticky-cell-bg)" }}></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.id || ri} className="border-b border-white/5 transition-colors hover:bg-white/3">
                {columns.map(col => (
                  <td key={col.key} className="px-2 py-1.5 text-center">
                    <input
                      type="text"
                      value={row[col.key] ?? ""}
                      placeholder="—"
                      onChange={e => handleChange(ri, col.key, e.target.value)}
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
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (editable ? 1 : 0)} className="text-center py-8 text-white/20 text-xs">
                  Нет данных. Нажмите «+ Строка» чтобы добавить.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
