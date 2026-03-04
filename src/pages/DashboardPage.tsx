import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useTheme } from "@/context/ThemeContext";
import GenericTable from "@/components/GenericTable";
import { DASHBOARDS } from "@/config/dashboards";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  const dashboard = DASHBOARDS.find(d => d.id === id);

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
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title="Назад"
            >
              <Icon name="ArrowLeft" size={18} />
            </button>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                {dashboard.title}
              </h1>
              <div className="flex items-center gap-2">
                {DASHBOARDS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/dashboard/${d.id}`)}
                    className={`text-xs px-3 py-1 rounded-full transition-all duration-200 ${
                      d.id === id
                        ? "gradient-violet text-white font-semibold"
                        : "glass glass-hover text-white/50"
                    }`}
                  >
                    {d.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
              title={isLight ? "Тёмная тема" : "Светлая тема"}
            >
              <Icon name={isLight ? "Moon" : "Sun"} size={18} />
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="glass glass-hover rounded-full w-10 h-10 flex items-center justify-center text-white/60"
            >
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </div>

        <GenericTable
          title={dashboard.title}
          subtitle="Кликните на ячейку для редактирования"
          apiUrl={dashboard.apiUrl}
          columns={dashboard.columns}
        />
      </div>
    </div>
  );
}
