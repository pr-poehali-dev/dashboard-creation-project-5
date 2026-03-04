import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useDashboards } from "@/hooks/useDashboards";
import type { DashboardConfig, ColumnDef } from "@/config/dashboards";

interface Props {
  onClose: () => void;
}

type Mode = "list" | "create" | "edit";

const EMPTY_FORM = {
  title: "",
  slug: "",
  api_url: "",
  columns: [{ key: "", label: "" }] as ColumnDef[],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function DashboardManager({ onClose }: Props) {
  const { dashboards, loading, create, update, remove } = useDashboards();
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<DashboardConfig | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setMode("create");
  };

  const openEdit = (d: DashboardConfig) => {
    setForm({ title: d.title, slug: d.slug, api_url: d.api_url, columns: d.columns.length ? d.columns : [{ key: "", label: "" }] });
    setEditing(d);
    setMode("edit");
  };

  const handleTitleChange = (val: string) => {
    setForm(f => ({ ...f, title: val, slug: f.slug || slugify(val) }));
  };

  const setCol = (i: number, field: keyof ColumnDef, val: string) => {
    setForm(f => {
      const cols = [...f.columns];
      cols[i] = { ...cols[i], [field]: field === "key" ? slugify(val) : val };
      return { ...f, columns: cols };
    });
  };

  const addCol = () => setForm(f => ({ ...f, columns: [...f.columns, { key: "", label: "" }] }));
  const removeCol = (i: number) => setForm(f => ({ ...f, columns: f.columns.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.slug.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, columns: form.columns.filter(c => c.key && c.label) };
      if (mode === "create") await create(payload);
      else if (editing) await update(editing.id, payload);
      setMode("list");
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
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up" style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

        {/* Header */}
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

          {/* LIST MODE */}
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

          {/* CREATE / EDIT MODE */}
          {(mode === "create" || mode === "edit") && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">Название дашборда</label>
                  <input
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Например: Причины возвратов"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">URL адрес страницы</label>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-sm">/dashboard/</span>
                    <input
                      value={form.slug}
                      onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                      placeholder="nazvanie"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1.5 block">API URL (откуда берутся данные)</label>
                  <input
                    value={form.api_url}
                    onChange={e => setForm(f => ({ ...f, api_url: e.target.value }))}
                    placeholder="https://functions.poehali.dev/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/60 focus:bg-violet-500/5 transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Columns */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white/50 text-xs">Колонки таблицы</label>
                  <button onClick={addCol} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                    <Icon name="Plus" size={13} /> Добавить колонку
                  </button>
                </div>
                <div className="space-y-2">
                  {form.columns.map((col, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={col.label}
                        onChange={e => setCol(i, "label", e.target.value)}
                        placeholder="Название колонки"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-violet-500/60 transition-all placeholder:text-white/20"
                      />
                      <input
                        value={col.key}
                        onChange={e => setCol(i, "key", e.target.value)}
                        placeholder="ключ"
                        className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/60 text-xs outline-none focus:border-violet-500/60 transition-all placeholder:text-white/20 font-mono"
                      />
                      <button onClick={() => removeCol(i)} className="text-white/20 hover:text-red-400 transition-colors p-1">
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-white/20 text-xs mt-2">Ключ — латинскими буквами, используется для хранения данных в БД</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 flex-shrink-0 flex justify-between items-center">
          {mode === "list" ? (
            <>
              <p className="text-white/30 text-xs">{dashboards.length} дашбордов</p>
              <button
                onClick={openCreate}
                className="gradient-violet text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}
              >
                <Icon name="Plus" size={16} /> Создать дашборд
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setMode("list")} className="text-white/40 text-sm hover:text-white/60 transition-colors">
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="gradient-violet text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}
              >
                {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Icon name="Check" size={16} />}
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
