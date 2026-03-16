import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboards } from "@/hooks/useDashboards";
import DashboardManager from "@/components/DashboardManager";
import DashboardView from "@/components/DashboardView";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  const [showManager, setShowManager] = useState(false);
  const { dashboards, loading } = useDashboards();

  const first = dashboards[0];

  return (
    <>
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
        <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full animate-float delay-200"
          style={{ background: "radial-gradient(circle, #00E5CC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-3)" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
              {first?.title ?? "Дашборды"}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {dashboards.map(d => (
                <button key={d.id}
                  onClick={() => navigate(`/dashboard/${d.slug}`)}
                  className="text-xs px-3 py-1.5 rounded-full glass glass-hover text-white/60 hover:text-white transition-all duration-200">
                  {d.title}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title={isLight ? "Тёмная тема" : "Светлая тема"}>
              <Icon name={isLight ? "Moon" : "Sun"} size={18} />
            </button>
            <button className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Bell" size={18} />
            </button>
            <button onClick={() => navigate("/settings")}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 gap-3 text-white/30">
            <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
            Загрузка дашбордов...
          </div>
        ) : first ? (
          <DashboardView
            title={first.title}
            apiUrl={first.api_url}
            columns={first.columns}
            dashboardId={first.id}
            readonly
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-white/30">
            <Icon name="LayoutDashboard" size={48} />
            <p className="text-lg">Нет дашбордов</p>
            <button onClick={() => setShowManager(true)}
              className="gradient-violet text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
              style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}>
              <Icon name="Plus" size={16} /> Создать первый дашборд
            </button>
          </div>
        )}
      </div>
    </div>
    {showManager && <DashboardManager onClose={() => setShowManager(false)} />}
    </>
  );
}