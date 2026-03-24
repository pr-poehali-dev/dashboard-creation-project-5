import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";

const API = funcUrls["manage-users"];

interface AllowedUser {
  id: number;
  bitrix_id: number;
  name: string;
  role: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  editor: "Редактор",
  viewer: "Наблюдатель",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  editor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  viewer: "bg-white/10 text-white/50 border-white/10",
};

export default function UserManager({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newBitrixId, setNewBitrixId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const addUser = async () => {
    if (!newBitrixId || !newName) return;
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers,
        body: JSON.stringify({ bitrix_id: parseInt(newBitrixId), name: newName, role: newRole }),
      });
      setNewBitrixId("");
      setNewName("");
      setNewRole("viewer");
      setShowAdd(false);
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const updateRole = async (id: number, role: string) => {
    try {
      await fetch(API, {
        method: "PUT",
        headers,
        body: JSON.stringify({ id, role }),
      });
      setEditId(null);
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Удалить пользователя "${name}"? Он потеряет доступ к системе.`)) return;
    try {
      await fetch(`${API}?id=${id}`, { method: "DELETE", headers });
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="font-display font-bold text-white text-lg">Управление доступом</h2>
            <p className="text-white/40 text-xs mt-0.5">Пользователи, которые могут входить в систему</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(true)}
              className="gradient-violet text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.3)" }}>
              <Icon name="UserPlus" size={16} />
              Добавить
            </button>
            <button onClick={onClose}
              className="glass glass-hover w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-80px)] p-6 space-y-3">
          {showAdd && (
            <div className="glass rounded-2xl p-5 border border-violet-500/20 animate-fade-in-up">
              <h3 className="text-white font-semibold text-sm mb-4">Новый пользователь</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <input
                  type="number"
                  value={newBitrixId}
                  onChange={e => setNewBitrixId(e.target.value)}
                  placeholder="Bitrix ID"
                  className="glass rounded-xl px-4 py-2.5 text-white text-sm outline-none border border-transparent focus:border-violet-500/50 placeholder:text-white/25"
                />
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="ФИО"
                  className="glass rounded-xl px-4 py-2.5 text-white text-sm outline-none border border-transparent focus:border-violet-500/50 placeholder:text-white/25"
                />
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="glass rounded-xl px-4 py-2.5 text-white text-sm outline-none border border-transparent focus:border-violet-500/50 bg-transparent"
                >
                  <option value="viewer" className="bg-[#1a1a2e]">Наблюдатель</option>
                  <option value="editor" className="bg-[#1a1a2e]">Редактор</option>
                  <option value="admin" className="bg-[#1a1a2e]">Администратор</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addUser} disabled={saving || !newBitrixId || !newName}
                  className="gradient-violet text-white rounded-xl px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                  {saving ? "Сохранение..." : "Добавить"}
                </button>
                <button onClick={() => setShowAdd(false)}
                  className="text-white/40 hover:text-white/70 text-sm px-4 py-2 transition-colors">
                  Отмена
                </button>
              </div>
              <p className="text-white/30 text-xs mt-3">
                Bitrix ID — это число из URL профиля: bitrix24.ru/company/personal/user/<strong className="text-white/50">XXX</strong>/
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Users" size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Нет добавленных пользователей</p>
            </div>
          ) : (
            users.map(u => (
              <div key={u.id} className="glass glass-hover rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center border border-white/10">
                    <span className="text-white font-bold text-sm">
                      {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{u.name}</p>
                    <p className="text-white/30 text-xs">Bitrix ID: {u.bitrix_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editId === u.id ? (
                    <>
                      <select value={editRole} onChange={e => setEditRole(e.target.value)}
                        className="glass rounded-lg px-3 py-1.5 text-white text-xs outline-none bg-transparent border border-violet-500/30">
                        <option value="viewer" className="bg-[#1a1a2e]">Наблюдатель</option>
                        <option value="editor" className="bg-[#1a1a2e]">Редактор</option>
                        <option value="admin" className="bg-[#1a1a2e]">Администратор</option>
                      </select>
                      <button onClick={() => updateRole(u.id, editRole)}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors">
                        <Icon name="Check" size={16} />
                      </button>
                      <button onClick={() => setEditId(null)}
                        className="text-white/30 hover:text-white/60 transition-colors">
                        <Icon name="X" size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.viewer}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                      <button onClick={() => { setEditId(u.id); setEditRole(u.role); }}
                        className="text-white/20 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100">
                        <Icon name="Pencil" size={14} />
                      </button>
                      <button onClick={() => deleteUser(u.id, u.name)}
                        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
