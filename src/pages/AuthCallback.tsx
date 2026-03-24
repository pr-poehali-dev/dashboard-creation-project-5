import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    // AuthContext handles the code exchange in its useEffect
    // This page just shows a loading state
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--page-bg)" }}>
      <div className="text-center animate-fade-in-up">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/50 text-sm">Авторизация...</p>
      </div>
    </div>
  );
}
