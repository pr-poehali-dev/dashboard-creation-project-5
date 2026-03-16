import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import DashboardManager from "@/components/DashboardManager";
import { useTheme } from "@/context/ThemeContext";
import { useDashboards } from "@/hooks/useDashboards";

const PASSWORD = "Lazarev-Analitika032=1";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { dashboards } = useDashboards();
  const slug = (location.state as { slug?: string } | null)?.slug;
  const dashboard = dashboards.find(d => d.slug === slug) ?? dashboards[0];
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "var(--page-bg)" }}>
        {/* Ambient blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full animate-float"
            style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full animate-float delay-400"
            style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
        </div>
        {/* Theme toggle on login screen */}
        <button onClick={toggle}
          className="glass glass-hover fixed top-4 right-4 z-20 rounded-full w-10 h-10 flex items-center justify-center text-white/60"
          title={theme === "light" ? "Тёмная тема" : "Светлая тема"}>
          <Icon name={theme === "light" ? "Moon" : "Sun"} size={18} />
        </button>

        <div className={`relative z-10 w-full max-w-sm animate-fade-in-up ${shaking ? "animate-shake" : ""}`}>
          <div className="glass rounded-3xl p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 gradient-violet rounded-2xl flex items-center justify-center"
                style={{ boxShadow: "0 8px 32px rgba(124,92,255,0.4)" }}>
                <Icon name="Lock" size={24} className="text-white" />
              </div>
            </div>

            <h1 className="font-display font-black text-2xl text-white text-center mb-1">Настройки</h1>
            <p className="text-white/40 text-sm text-center mb-8">Введите пароль для доступа</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={input}
                  onChange={e => { setInput(e.target.value); setError(false); }}
                  placeholder="Пароль"
                  autoFocus
                  className={`w-full glass rounded-xl px-4 py-3 pr-11 text-white text-sm outline-none transition-all duration-200
                    placeholder:text-white/25
                    ${error
                      ? "border border-red-500/60 bg-red-500/5"
                      : "border border-transparent focus:border-violet-500/50 focus:bg-violet-500/5"
                    }`}
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-xs text-center animate-fade-in-up">
                  Неверный пароль. Попробуйте ещё раз.
                </p>
              )}

              <button type="submit"
                className="w-full gradient-violet text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ boxShadow: "0 4px 24px rgba(124,92,255,0.4)" }}>
                Войти
              </button>

              <button type="button" onClick={() => navigate("/")}
                className="w-full text-white/30 hover:text-white/60 text-sm py-2 transition-colors">
                ← Вернуться назад
              </button>
            </form>
          </div>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
          }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
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

        <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
          <p className="text-white/40 text-sm text-center">Выберите дашборд для редактирования данных</p>
          <button onClick={() => setShowManager(true)}
            className="gradient-violet text-white rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ boxShadow: "0 4px 20px rgba(124,92,255,0.4)" }}>
            <Icon name="LayoutDashboard" size={16} />
            Управление дашбордами
          </button>
        </div>
      </div>
    </div>
    {showManager && <DashboardManager onClose={() => setShowManager(false)} />}
    </>
  );
}