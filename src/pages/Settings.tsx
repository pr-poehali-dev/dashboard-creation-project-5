import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import DashboardManager from "@/components/DashboardManager";
import UserManager from "@/components/UserManager";
import { useTheme } from "@/context/ThemeContext";
import { useDashboards } from "@/hooks/useDashboards";
import { useAuth } from "@/context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { dashboards } = useDashboards();
  const { user, logout } = useAuth();
  const slug = (location.state as { slug?: string } | null)?.slug;
  const dashboard = dashboards.find(d => d.slug === slug) ?? dashboards[0];
  const [showManager, setShowManager] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")}
              className="glass glass-hover w-10 h-10 rounded-full flex items-center justify-center text-white/60">
              <Icon name="ArrowLeft" size={18} />
            </button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight mb-0.5">
                Настройки
              </h1>
              <p className="text-white/40 text-sm">
                {dashboard ? `Редактирование таблицы: ${dashboard.title}` : "Настройки таблиц"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title={theme === "light" ? "Тёмная тема" : "Светлая тема"}>
              <Icon name={theme === "light" ? "Moon" : "Sun"} size={18} />
            </button>
            <button onClick={handleLogout}
              className="glass glass-hover flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-red-400 transition-colors">
              <Icon name="LogOut" size={16} />
              Выйти
            </button>
          </div>
        </div>

        {user && (
          <div className="glass rounded-2xl p-5 mb-6 animate-fade-in-up flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center border border-white/10">
              <span className="text-white font-bold text-sm">
                {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-white/30 text-xs">
                {user.role === "admin" ? "Администратор" : user.role === "editor" ? "Редактор" : "Наблюдатель"}
                {" · Bitrix ID: " + user.bitrix_id}
              </p>
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
          <p className="text-white/40 text-sm text-center">Выберите действие</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setShowManager(true)}
              className="gradient-violet text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}>
              <Icon name="LayoutDashboard" size={16} />
              Управление дашбордами
            </button>
            {isAdmin && (
              <button onClick={() => setShowUsers(true)}
                className="gradient-cyan text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
                style={{ boxShadow: "0 4px 20px rgba(0,229,204,0.4)" }}>
                <Icon name="Users" size={16} />
                Управление доступом
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    {showManager && <DashboardManager onClose={() => setShowManager(false)} />}
    {showUsers && <UserManager onClose={() => setShowUsers(false)} />}
    </>
  );
}
