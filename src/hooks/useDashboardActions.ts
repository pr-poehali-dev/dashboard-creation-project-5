import { useState } from "react";
import type { Row } from "@/hooks/useDashboardData";

export default function useDashboardActions(
  allRows: Row[],
  setAllRows: React.Dispatch<React.SetStateAction<Row[]>>,
  fetchUrl: string,
  isUniversalApi: boolean,
) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleChange = (id: number, col: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    if (isNaN(num) || num < 0) return;
    setAllRows(prev => prev.map(r => r.id === id ? { ...r, [col]: num } : r));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = isUniversalApi
        ? allRows.map(r => ({ ...r, id: r.id < 0 ? undefined : r.id }))
        : allRows;
      await fetch(fetchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      if (isUniversalApi) {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        setAllRows(typeof data === "string" ? JSON.parse(data) : data);
      }
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const resetSaveState = () => {
    setDirty(false);
    setSaved(false);
  };

  return { saving, saved, dirty, handleChange, handleSave, resetSaveState };
}
