import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/f8817ea5-4b71-410d-8ce1-257b80d75df0";

const COLUMNS: { key: string; label: string }[] = [
  { key: "deadline_violations", label: "Нарушены сроки выполнения работы" },
  { key: "poor_quality_service", label: "Некачественно оказанные услуги" },
  { key: "patient_no_contact", label: "Пациент не выходит на связь" },
  { key: "patient_died", label: "Пациент умер" },
  { key: "reregistration", label: "Переоформление" },
  { key: "complaint", label: "Претензия" },
  { key: "procedures_not_needed", label: "Процедуры не понадобились" },
  { key: "financial_difficulties", label: "Финансовые трудности" },
  { key: "refund_completed", label: "Возврат за пройденные" },
];

interface Row {
  id: number;
  city: string;
  [key: string]: number | string;
}

export default function TerminationsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        setRows(parsed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      await fetch(API_URL, {
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

  const colTotal = (col: string) =>
    rows.reduce((sum, r) => sum + (Number(r[col]) || 0), 0);

  const rowTotal = (row: Row) =>
    COLUMNS.reduce((sum, c) => sum + (Number(row[c.key]) || 0), 0);

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
    <div className="glass rounded-2xl overflow-hidden animate-fade-in-up delay-700">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h3 className="font-display font-bold text-white text-lg">Причины расторжений</h3>
          <p className="text-white/40 text-xs mt-0.5">Кликните на ячейку для редактирования</p>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-4 py-3 text-white/50 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                style={{ background: "rgba(13,11,24,0.95)", minWidth: 140 }}>
                Город / Причина
              </th>
              {COLUMNS.map(col => (
                <th key={col.key}
                  className="px-3 py-3 text-white/50 font-medium text-xs text-center leading-tight"
                  style={{ minWidth: 90, maxWidth: 110 }}>
                  <span className="block" style={{ writingMode: "horizontal-tb" }}>{col.label}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-white/70 font-bold text-xs text-center whitespace-nowrap">
                ИТОГО
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.id}
                className="border-b border-white/5 transition-colors hover:bg-white/3"
                style={{ animationDelay: `${ri * 0.03}s` }}>
                <td className="px-4 py-2.5 text-white/80 font-medium text-xs whitespace-nowrap sticky left-0 z-10"
                  style={{ background: "rgba(13,11,24,0.95)" }}>
                  {row.city}
                </td>
                {COLUMNS.map(col => (
                  <td key={col.key} className="px-2 py-1.5 text-center">
                    <input
                      type="number"
                      min={0}
                      value={row[col.key] === 0 ? "" : String(row[col.key])}
                      placeholder="0"
                      onChange={e => handleChange(row.id, col.key, e.target.value)}
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
                    {rowTotal(row)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals */}
          <tfoot>
            <tr className="border-t-2 border-white/10">
              <td className="px-4 py-3 text-white/70 font-bold text-xs sticky left-0 z-10"
                style={{ background: "rgba(13,11,24,0.95)" }}>
                ИТОГО
              </td>
              {COLUMNS.map(col => (
                <td key={col.key} className="px-2 py-3 text-center">
                  <span className={`text-xs font-bold ${colTotal(col) > 0 ? "text-gradient-cyan" : "text-white/30"}`}>
                    {colTotal(col)}
                  </span>
                </td>
              ))}
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
