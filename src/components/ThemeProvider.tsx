import { useEffect, ReactNode } from "react";
import { useCityTheme } from "@/hooks/useCityTheme";
import { hexToHSL } from "@/lib/colorUtils";

interface ThemeProviderProps {
  children: ReactNode;
  citySlug?: string;
}

export function ThemeProvider({ children, citySlug = "afogados-da-ingazeira" }: ThemeProviderProps) {
  const { data: cityTheme, isLoading } = useCityTheme(citySlug);

  useEffect(() => {
    if (cityTheme) {
      const root = document.documentElement;
      
      // Converte cores HEX para HSL (formato Tailwind)
      const primaryHSL = hexToHSL(cityTheme.primary_color);
      const secondaryHSL = hexToHSL(cityTheme.secondary_color);
      const accentHSL = hexToHSL(cityTheme.accent_color);
      
      // Define as variáveis globais da cidade
      root.style.setProperty("--city-primary", primaryHSL);
      root.style.setProperty("--city-secondary", secondaryHSL);
      root.style.setProperty("--city-accent", accentHSL);
      
      // Substitui as cores do tema atual com as cores da cidade
      root.style.setProperty("--primary", primaryHSL);
      root.style.setProperty("--secondary", secondaryHSL);
      root.style.setProperty("--accent", accentHSL);
      
      // Atualiza também os charts para usar as cores da cidade
      root.style.setProperty("--chart-1", primaryHSL);
      root.style.setProperty("--chart-2", secondaryHSL);
      
      console.log(`[ThemeProvider] Applied theme for ${cityTheme.name}`, {
        primary: `${cityTheme.primary_color} → ${primaryHSL}`,
        secondary: `${cityTheme.secondary_color} → ${secondaryHSL}`,
        accent: `${cityTheme.accent_color} → ${accentHSL}`,
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
