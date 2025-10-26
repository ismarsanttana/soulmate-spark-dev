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
      className="fixed right-6 bottom-40 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95"
      aria-label={label}
      title={label}
    >
      <i className={`${iconClass} text-sm`}></i>
    </button>
  );
};
