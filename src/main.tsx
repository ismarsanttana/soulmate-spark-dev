import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Bootstrap } from "./core/Bootstrap";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

/**
 * Main Entry Point
 * 
 * Single BrowserRouter for entire application.
 * Bootstrap component detects domain context and renders appropriate AppShell:
 * - urbanbyte.com.br → RootShell (marketing site)
 * - dash.urbanbyte.com.br → MasterAppShell (UrbanByte Control Center)
 * - colaborador.urbanbyte.com.br → CollaboratorShell (team panel)
 * - parceiro.urbanbyte.com.br → PartnerShell (partner panel)
 * - {city}.urbanbyte.com.br → CityAppShell (city portal)
 * 
 * In development: Use query params to simulate domains
 * - ?mode=dash → Master dashboard
 * - ?mode=city&subdomain=afogados → City portal
 */
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider>
      <Bootstrap />
    </ThemeProvider>
  </BrowserRouter>,
);
