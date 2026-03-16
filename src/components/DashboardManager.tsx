import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useDashboards } from "@/hooks/useDashboards";
import { DASHBOARD_DATA_URL } from "@/config/dashboards";
import type { DashboardConfig, ColumnDef } from "@/config/dashboards";
import GenericTable from "@/components/GenericTable";

interface Props {
  onClose: () => void;
}

type Mode = "list" | "create" | "edit";

interface TableRow {
  city: string;
  [key: string]: string | number;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function DashboardManager({ onClose }: Props) {
  const navigate = useNavigate();
  const { dashboards, loading, create, update, remove } = useDashboards();
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<DashboardConfig | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [columns, setColumns] = useState<ColumnDef[]>([{ key: "col1", label: "Причина 1" }]);
  const [rows, setRows] = useState<TableRow[]>([{ city: "" }]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingRowIdx, setEditingRowIdx] = useState<number | null>(null);
  const [editingColIdx, setEditingColIdx] = useState<number | null>(null);
  const rowInputRef = useRef<HTMLInputElement>(null);
  const colInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setTitle("");
    setSlug("");
    setColumns([{ key: "col1", label: "Причина 1" }]);
    setRows([{ city: "", col1: 0 }]);
    setEditing(null);
    setNewColName("");
    setMode("create");
  };

  const openEdit = (d: DashboardConfig) => {
    setTitle(d.title);
    setSlug(d.slug);
    setColumns(d.columns.length ? d.columns : [{ key: "col1", label: "Причина 1" }]);
    setRows([{ city: "" }]);
    setEditing(d);
    setMode("edit");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) setSlug(slugify(val));
  };

  const addColumn = () => {
    const key = `col${Date.now()}`;
    setColumns(c => [...c, { key, label: "" }]);
    setRows(r => r.map(row => ({ ...row, [key]: 0 })));
    const idx = columns.length;
    setTimeout(() => { setEditingColIdx(idx); setTimeout(() => colInputRef.current?.focus(), 30); }, 0);
  };

  const commitColumn = (i: number, val: string) => {
    const label = val.trim();
    const oldKey = columns[i]?.key;
    const newKey = slugify(label) || oldKey;
    setColumns(prev => prev.map((c, ci) => ci === i ? { key: newKey, label } : c));
    if (oldKey !== newKey) {
      setRows(r => r.map(row => {
        const { [oldKey]: v, ...rest } = row as Record<string, string | number>;
        return { ...rest, [newKey]: v ?? 0 } as TableRow;
      }));
    }
    setEditingColIdx(null);
  };

  const removeColumn = (i: number) => {
    const removed = columns[i]?.key;
    setColumns(c => c.filter((_, idx) => idx !== i));
    if (removed) {
      setRows(r => r.map(row => {
        const { [removed]: _, ...rest } = row as Record<string, string | number>;
        return rest as TableRow;
      }));
    }
  };

  const addRow = () => {
    const newRow: TableRow = { city: "" };
    columns.forEach(c => { newRow[c.key] = 0; });
    setRows(r => {
      const idx = r.length;
      setTimeout(() => { setEditingRowIdx(idx); setTimeout(() => rowInputRef.current?.focus(), 30); }, 0);
      return [...r, newRow];
    });
  };

  const commitRow = (i: number, val: string) => {
    setRows(r => r.map((row, ri) => ri === i ? { ...row, city: val } : row));
    setEditingRowIdx(null);
  };

  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const setCellValue = (rowIdx: number, key: string, val: string) => {
    setRows(r => r.map((row, i) => i === rowIdx ? { ...row, [key]: key === "city" ? val : (val === "" ? 0 : parseInt(val, 10) || 0) } : row));
  };

  const validColumns = columns.filter(c => c.key && c.label);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      if (mode === "create") {
        const validRows = rows.filter(r => (r.city as string).trim());
        await create({
          title,
          slug,
          api_url: DASHBOARD_DATA_URL,
          columns: validColumns,
          rows: validRows,
        } as Omit<DashboardConfig, "id"> & { rows: TableRow[] });
        onClose();
        navigate(`/dashboard/${slug}`);
      } else if (editing) {
        await update(editing.id, { title, slug, columns: validColumns });
        setMode("list");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await remove(id);
    setDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="glass rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in-up" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            {mode !== "list" && (
              <button onClick={() => setMode("list")} className="glass glass-hover rounded-full w-8 h-8 flex items-center justify-center text-white/60">
                <Icon name="ArrowLeft" size={16} />
              </button>
            )}
            <h2 className="font-display font-bold text-white text-lg">
              {mode === "list" ? "Управление дашбордами" : mode === "create" ? "Новый дашборд" : "Редактировать дашборд"}
            </h2>
          </div>
          <button onClick={onClose} className="glass glass-hover rounded-full w-8 h-8 flex items-center justify-center text-white/60">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">

          {mode === "list" && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-white/30 gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
                  Загрузка...
                </div>
              ) : dashboards.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-sm">Нет дашбордов</div>
              ) : (
                dashboards.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                    <div>
                      <p className="text-white font-semibold text-sm">{d.title}</p>
                      <p className="text-white/40 text-xs mt-0.5">{d.columns.length} колонок · /{d.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(d)} className="glass glass-hover rounded-lg px-3 py-1.5 text-white/60 text-xs flex items-center gap-1.5">
                        <Icon name="Pencil" size={13} /> Изменить
                      </button>
                      {deleteId === d.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(d.id)} className="rounded-lg px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold">
                            Удалить
                          </button>
                          <button onClick={() => setDeleteId(null)} className="glass glass-hover rounded-lg px-2 py-1.5 text-white/40 text-xs">
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(d.id)} className="glass glass-hover rounded-lg p-1.5 text-white/30 hover:text-red-400 transition-colors">
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-5">
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Название дашборда</label>
                <input
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Например: Причины возвратов"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all placeholder:text-white/20"
                />
              </div>

              {mode === "edit" && editing && (
                <GenericTable
                  title={editing.title}
                  subtitle="Кликните на ячейку для редактирования"
                  apiUrl={`${editing.api_url}?dashboard_id=${editing.id}`}
                  columns={editing.columns}
                  editable
                  onColumnsChange={async (cols) => {
                    await update(editing.id, { columns: cols });
                  }}
                />
              )}

              {mode === "create" && <div className="glass rounded-2xl overflow-hidden border border-white/10">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <span className="text-white/50 text-xs">Таблица данных</span>
                  <div className="flex items-center gap-2">
                    <button onClick={addColumn}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                      <Icon name="Plus" size={13} /> Столбец
                    </button>
                    <button onClick={addRow}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                      <Icon name="Plus" size={13} /> Строка
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-white/3">
                        <th className="text-left text-white/50 text-xs font-medium px-4 py-3 min-w-[140px] sticky left-0 z-10" style={{ background: "rgba(30,20,50,0.95)" }}>
                          Город / Причина
                        </th>
                        {columns.map((col, ci) => (
                          <th key={col.key} className="text-center text-xs font-medium px-3 py-3 min-w-[110px] relative group" style={{ minWidth: 90 }}>
                            {editingColIdx === ci ? (
                              <input
                                ref={colInputRef}
                                defaultValue={col.label}
                                placeholder="Название..."
                                onBlur={e => commitColumn(ci, e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") commitColumn(ci, e.currentTarget.value); }}
                                className="w-full bg-white text-gray-800 text-xs text-center outline-none rounded-lg px-2 py-1 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  onClick={() => { setEditingColIdx(ci); setTimeout(() => colInputRef.current?.focus(), 30); }}
                                  className="cursor-pointer hover:text-white transition-colors text-white/50">
                                  {col.label || <span className="text-white/20 italic">пусто</span>}
                                </span>
                                {columns.length > 1 && (
                                  <button onClick={() => removeColumn(ci)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all flex-shrink-0">
                                    <Icon name="X" size={11} />
                                  </button>
                                )}
                              </div>
                            )}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap">ИТОГО</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/5 hover:bg-white/3">
                          <td className="px-4 py-2 sticky left-0 z-10" style={{ background: "rgba(30,20,50,0.95)" }}>
                            {editingRowIdx === ri ? (
                              <input
                                ref={rowInputRef}
                                defaultValue={row.city as string}
                                placeholder="Название города..."
                                onBlur={e => commitRow(ri, e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") commitRow(ri, e.currentTarget.value); }}
                                className="w-full bg-white text-gray-800 text-xs rounded-lg py-1 px-2 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                              />
                            ) : (
                              <span
                                onClick={() => { setEditingRowIdx(ri); setTimeout(() => rowInputRef.current?.focus(), 30); }}
                                className="text-white/80 text-xs font-medium cursor-pointer hover:text-white transition-colors">
                                {row.city || <span className="text-white/20 italic">пусто</span>}
                              </span>
                            )}
                          </td>
                          {columns.map(col => (
                            <td key={col.key} className="px-2 py-1.5 text-center">
                              <input
                                type="number" min={0}
                                value={row[col.key] ?? 0}
                                onChange={e => setCellValue(ri, col.key, e.target.value)}
                                className="w-full text-center text-white/80 text-xs rounded-lg py-1.5 px-1 outline-none transition-all bg-transparent border border-transparent hover:border-white/15 focus:border-violet-500/60 focus:bg-violet-500/8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={{ minWidth: 52 }}
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-xs font-bold text-white/30">
                                {columns.reduce((s, c) => s + (Number(row[c.key]) || 0), 0).toLocaleString("ru-RU")}
                              </span>
                              {rows.length > 1 && (
                                <button onClick={() => removeRow(ri)} className="text-white/15 hover:text-red-400 transition-colors ml-1">
                                  <Icon name="X" size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between flex-shrink-0">
          {mode === "list" ? (
            <>
              <button onClick={onClose} className="text-white/40 hover:text-white/60 text-sm transition-colors">Закрыть</button>
              <button onClick={openCreate}
                className="gradient-violet text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}>
                <Icon name="Plus" size={15} /> Новый дашборд
              </button>
            </>
          ) : mode === "edit" ? (
            <button onClick={() => setMode("list")} className="text-white/40 hover:text-white/60 text-sm transition-colors">← Назад</button>
          ) : (
            <>
              <button onClick={() => setMode("list")} className="text-white/40 hover:text-white/60 text-sm transition-colors">Отмена</button>
              <button onClick={handleSave} disabled={saving || !title.trim() || validColumns.length === 0}
                className="gradient-violet text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}>
                {saving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Icon name="Check" size={15} />
                )}
                Создать
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}