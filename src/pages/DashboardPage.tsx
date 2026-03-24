import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import DashboardView from "@/components/DashboardView";
import VyrabotkaView from "@/components/VyrabotkaView";
import DashboardManager from "@/components/DashboardManager";
import { useDashboards } from "@/hooks/useDashboards";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  const [showManager, setShowManager] = useState(false);
  const { dashboards, loading } = useDashboards();

  const dashboard = dashboards.find(d => d.slug === id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
        <div className="flex items-center gap-3 text-white/40">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-violet-500 animate-spin" />
          Загрузка...
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
        <div className="text-white/40 text-center">
          <p className="text-2xl font-bold mb-2">Дашборд не найден</p>
          <button onClick={() => navigate("/")} className="text-sm underline">На главную</button>
        </div>
      </div>
    );
  }

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title="Назад">
              <Icon name="ArrowLeft" size={18} />
            </button>
            <div>
              <img
                src="https://cdn.poehali.dev/projects/4ade81fe-7dfe-4328-81a3-9fe38e0d8baa/bucket/3d383b24-7864-41cd-9864-ea05cc49ff51.png"
                alt="Dream Team"
                className="h-10 mb-3 object-contain"
              />
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                {dashboard.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                {dashboards.map(d => (
                  <button key={d.id}
                    onClick={() => navigate(`/dashboard/${d.slug}`)}
                    className={`text-xs px-3 py-1 rounded-full transition-all duration-200 ${
                      d.slug === id
                        ? "gradient-violet text-white font-semibold"
                        : "glass glass-hover text-white/50"
                    }`}>
                    {d.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title={isLight ? "Тёмная тема" : "Светлая тема"}>
              <Icon name={isLight ? "Moon" : "Sun"} size={18} />
            </button>
            <button onClick={() => navigate("/settings", { state: { slug: id } })}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60">
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </div>

        {dashboard.slug === "vyrabotka" ? (
          <VyrabotkaView />
        ) : (
          <DashboardView
            key={dashboard.slug}
            title={dashboard.title}
            apiUrl={dashboard.api_url}
            columns={dashboard.columns}
            dashboardId={dashboard.id}
            readonly
          />
        )}
      </div>
    </div>
    {showManager && <DashboardManager onClose={() => setShowManager(false)} />}
    </>
  );
}