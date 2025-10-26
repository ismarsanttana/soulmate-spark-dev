import { useTheme } from "./theme-provider";

export const FloatingThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const iconClass = isDark ? "fas fa-sun" : "fas fa-moon";
  const label = isDark ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed left-6 bottom-28 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-all duration-200 hover:scale-110 hover:shadow-2xl active:scale-95"
      aria-label={label}
      title={label}
    >
      <i className={`${iconClass} text-xl`}></i>
    </button>
  );
};
