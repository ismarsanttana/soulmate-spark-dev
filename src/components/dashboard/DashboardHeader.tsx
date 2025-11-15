import { usePlatformUser } from "@/hooks/usePlatformUser";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function DashboardHeader() {
  const { data: platformData } = usePlatformUser();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("ub-theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("ub-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold">UrbanByte Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Painel de Gestão da Plataforma Multi-Tenant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-toggle-theme"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin/urbanbyte/settings")}
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3 ml-2 pl-2 border-l">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">
              {platformData?.platformUser?.full_name || platformData?.platformUser?.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {platformData?.role}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            data-testid="button-logout-header"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
