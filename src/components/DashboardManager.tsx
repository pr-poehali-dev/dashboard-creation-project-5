import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useDashboards } from "@/hooks/useDashboards";
import { DASHBOARD_DATA_URL } from "@/config/dashboards";
import type { DashboardConfig, ColumnDef } from "@/config/dashboards";

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
  const [columns, setColumns] = useState<ColumnDef[]>([{ key: "", label: "" }]);
  const [rows, setRows] = useState<TableRow[]>([{ city: "" }]);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const openCreate = () => {
    setTitle("");
    setSlug("");
    setColumns([{ key: "", label: "" }]);
    setRows([{ city: "" }]);
    setEditing(null);
    setMode("create");
  };

  const openEdit = (d: DashboardConfig) => {
    setTitle(d.title);
    setSlug(d.slug);
    setColumns(d.columns.length ? d.columns : [{ key: "", label: "" }]);
    setRows([{ city: "" }]);
    setEditing(d);
    setMode("edit");
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) setSlug(slugify(val));
  };

  const addColumn = () => setColumns(c => [...c, { key: "", label: "" }]);
  const removeColumn = (i: number) => {
    setColumns(c => c.filter((_, idx) => idx !== i));
    setRows(r => r.map(row => {
      const copy = { ...row };
      const removed = columns[i]?.key;
      if (removed && removed in copy) {
        const { [removed]: _, ...rest } = copy as Record<string, string | number>;
        return rest as TableRow;
      }
      return copy;
    }));
  };
  const setColLabel = (i: number, val: string) => {
    setColumns(prev => {
      const next = [...prev];
      const oldKey = next[i].key;
      const newKey = slugify(val);
      next[i] = { label: val, key: newKey || oldKey };
      if (oldKey && newKey && oldKey !== newKey) {
        setRows(r => r.map(row => {
          const copy = { ...row };
          if (oldKey in copy) {
            copy[newKey] = copy[oldKey];
            const { [oldKey]: _, ...rest } = copy as Record<string, string | number>;
            return rest as TableRow;
          }
          return copy;
        }));
      }
      return next;
    });
  };

  const addRow = () => setRows(r => [...r, { city: "" }]);
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
        const dataUrl = `${DASHBOARD_DATA_URL}`;
        const validRows = rows.filter(r => (r.city as string).trim());
        await create({
          title,
          slug,
          api_url: dataUrl,
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
      <div className="glass rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

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

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/50 text-xs">Колонки (причины / категории)</label>
                  <button onClick={addColumn} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <Icon name="Plus" size={13} /> Добавить колонку
                  </button>
                </div>
                <div className="space-y-2">
                  {columns.map((col, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={col.label}
                        onChange={e => setColLabel(i, e.target.value)}
                        placeholder="Название колонки"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500/60 transition-all placeholder:text-white/20"
                      />
                      {columns.length > 1 && (
                        <button onClick={() => removeColumn(i)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {mode === "create" && validColumns.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/50 text-xs">Данные таблицы</label>
                    <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      <Icon name="Plus" size={13} /> Добавить строку
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left text-white/50 text-xs font-medium px-3 py-2 min-w-[140px]">Город</th>
                          {validColumns.map(col => (
                            <th key={col.key} className="text-left text-white/50 text-xs font-medium px-3 py-2 min-w-[100px]">{col.label}</th>
                          ))}
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, ri) => (
                          <tr key={ri} className="border-t border-white/5 hover:bg-white/3">
                            <td className="px-1 py-1">
                              <input
                                value={row.city as string}
                                onChange={e => setCellValue(ri, "city", e.target.value)}
                                placeholder="Город"
                                className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-violet-500/60 rounded-lg px-2 py-1.5 text-white text-sm outline-none transition-all placeholder:text-white/15"
                              />
                            </td>
                            {validColumns.map(col => (
                              <td key={col.key} className="px-1 py-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={row[col.key] ?? 0}
                                  onChange={e => setCellValue(ri, col.key, e.target.value)}
                                  className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-violet-500/60 rounded-lg px-2 py-1.5 text-white text-sm outline-none transition-all text-center"
                                />
                              </td>
                            ))}
                            <td className="px-1 py-1">
                              {rows.length > 1 && (
                                <button onClick={() => removeRow(ri)} className="text-white/15 hover:text-red-400 transition-colors p-1">
                                  <Icon name="X" size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                {mode === "create" ? "Создать" : "Сохранить"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}