import { useMemo } from "react";
import { useTheme } from "./theme-provider";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const iconClass = useMemo(
    () => (isDark ? "fas fa-sun" : "fas fa-moon"),
    [isDark],
  );
  const label = isDark ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="bg-white/15 p-2 rounded-xl hover:bg-white/20 transition text-white"
      aria-label={label}
      title={label}
    >
      <i className={`${iconClass} text-white`}></i>
    </button>
  );
};

