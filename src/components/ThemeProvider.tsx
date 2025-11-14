import { useEffect, ReactNode } from "react";
import { useCityTheme } from "@/hooks/useCityTheme";

interface ThemeProviderProps {
  children: ReactNode;
  citySlug?: string;
}

export function ThemeProvider({ children, citySlug = "afogados-da-ingazeira" }: ThemeProviderProps) {
  const { data: cityTheme, isLoading } = useCityTheme(citySlug);

  useEffect(() => {
    if (cityTheme) {
      const root = document.documentElement;
      
      root.style.setProperty("--city-primary-color", cityTheme.primary_color);
      root.style.setProperty("--city-secondary-color", cityTheme.secondary_color);
      root.style.setProperty("--city-accent-color", cityTheme.accent_color);
      
      console.log(`[ThemeProvider] Applied theme for ${cityTheme.name}`, {
        primary: cityTheme.primary_color,
        secondary: cityTheme.secondary_color,
        accent: cityTheme.accent_color,
      });
    }
  }, [cityTheme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Carregando tema...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
