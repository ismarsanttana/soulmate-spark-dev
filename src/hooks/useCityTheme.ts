import { useQuery } from "@tanstack/react-query";

export interface CityTheme {
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

const DEFAULT_THEME: CityTheme = {
  name: "Afogados da Ingazeira",
  slug: "afogados-da-ingazeira",
  logo_url: null,
  primary_color: "#004AAD",
  secondary_color: "#F5C842",
  accent_color: "#FFFFFF",
};

async function fetchCityTheme(citySlug: string): Promise<CityTheme> {
  const response = await fetch(`/api/cities/${citySlug}/theme`);
  
  if (!response.ok) {
    if (response.status === 404) {
      console.warn(`City ${citySlug} not found, using default theme`);
      return DEFAULT_THEME;
    }
    throw new Error(`Failed to fetch city theme: ${response.statusText}`);
  }
  
  return response.json();
}

export function useCityTheme(citySlug: string = "afogados-da-ingazeira") {
  return useQuery({
    queryKey: ["city-theme", citySlug],
    queryFn: () => fetchCityTheme(citySlug),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: DEFAULT_THEME,
  });
}
