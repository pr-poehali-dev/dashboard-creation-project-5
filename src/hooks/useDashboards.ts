import { useState, useEffect, useCallback } from "react";
import { MANAGE_DASHBOARDS_URL, type DashboardConfig } from "@/config/dashboards";

export function useDashboards() {
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(MANAGE_DASHBOARDS_URL)
      .then(r => r.json())
      .then(data => { setDashboards(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload: Omit<DashboardConfig, "id">) => {
    const res = await fetch(MANAGE_DASHBOARDS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await res.json();
    setDashboards(prev => [...prev, created]);
    return created;
  };

  const update = async (id: number, payload: Partial<Omit<DashboardConfig, "id">>) => {
    const res = await fetch(`${MANAGE_DASHBOARDS_URL}?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    setDashboards(prev => prev.map(d => d.id === id ? updated : d));
    return updated;
  };

  const remove = async (id: number) => {
    await fetch(`${MANAGE_DASHBOARDS_URL}?id=${id}`, { method: "DELETE" });
    setDashboards(prev => prev.filter(d => d.id !== id));
  };

  return { dashboards, loading, reload: load, create, update, remove };
}
