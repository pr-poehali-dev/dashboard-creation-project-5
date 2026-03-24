import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Icon from "@/components/ui/icon";

export default function Login() {
  const { login, user, loading } = useAuth();
  const { theme, toggle } = useTheme();
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const deniedName = params.get("name");
  const deniedId = params.get("bitrix_id");

  useEffect(() => {
    if (user && !loading) {
      window.location.href = "/";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--page-bg)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full animate-float"
          style={{ background: "radial-gradient(circle, #7C5CFF 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity)" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full animate-float delay-400"
          style={{ background: "radial-gradient(circle, #FF3CAC 0%, transparent 70%)", filter: "blur(80px)", opacity: "var(--blob-opacity-2)" }} />
      </div>

      <button onClick={toggle}
        className="glass glass-hover fixed top-4 right-4 z-20 rounded-full w-10 h-10 flex items-center justify-center text-white/60"
        title={theme === "light" ? "Тёмная тема" : "Светлая тема"}>
        <Icon name={theme === "light" ? "Moon" : "Sun"} size={18} />
      </button>

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <div className="glass rounded-3xl p-8">
          <div className="flex justify-center mb-6">
            <img
              src="https://cdn.poehali.dev/projects/4ade81fe-7dfe-4328-81a3-9fe38e0d8baa/bucket/3d383b24-7864-41cd-9864-ea05cc49ff51.png"
              alt="Dream Team"
              className="h-12 object-contain"
            />
          </div>

          <h1 className="font-display font-black text-2xl text-white text-center mb-1">
            Аналитика
          </h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Войдите через Битрикс24 для доступа
          </p>

          {error === "access_denied" && (
            <div className="glass rounded-xl p-4 mb-6 border border-red-500/20 bg-red-500/5">
              <div className="flex items-start gap-3">
                <Icon name="ShieldAlert" size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-red-400 text-sm font-semibold mb-1">Доступ запрещён</p>
                  <p className="text-white/50 text-xs">
                    {deniedName && <>Пользователь <span className="text-white/70">{deniedName}</span> (ID: {deniedId}) не имеет доступа. </>}
                    Обратитесь к администратору.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error === "auth_failed" && (
            <div className="glass rounded-xl p-4 mb-6 border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-3">
                <Icon name="AlertTriangle" size={18} className="text-amber-400 shrink-0" />
                <p className="text-amber-400 text-sm">Ошибка авторизации. Попробуйте ещё раз.</p>
              </div>
            </div>
          )}

          <button onClick={login}
            className="w-full gradient-violet text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
            style={{ boxShadow: "0 4px 24px rgba(124,92,255,0.4)" }}>
            <Icon name="LogIn" size={18} />
            Войти через Битрикс24
          </button>

          <p className="text-white/20 text-xs text-center mt-6">
            Авторизация доступна только сотрудникам, добавленным администратором
          </p>
        </div>
      </div>
    </div>
  );
}