import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./theme-toggle";

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-gradient-to-br from-primary to-blue-700 text-white rounded-2xl p-5 shadow-lg mb-5">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img
            src="https://afogadosdaingazeira.pe.gov.br/img/logo_afogados.png"
            alt="Prefeitura de Afogados da Ingazeira"
            className="h-12 w-auto bg-white p-1 rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold">Conecta Afogados</h1>
            <p className="text-xs opacity-90">Prefeitura de Afogados da Ingazeira-PE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="bg-white/15 p-2 rounded-xl hover:bg-white/20 transition"
            aria-label="Compartilhar"
          >
            <i className="fas fa-share-nodes text-white"></i>
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <i className="fas fa-sun"></i>
          <span>29°C - Ensolarado</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="far fa-calendar"></i>
          <span>{formatDate(currentDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <i className="far fa-clock"></i>
          <span>{formatTime(currentDate)}</span>
        </div>
      </div>

      <div className="mt-4 relative">
        <input
          type="text"
          placeholder="Buscar serviços, protocolos, notícias..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl bg-white/90 text-gray-900 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/60"
        />
        <i className="fas fa-search absolute right-3 top-3.5 text-gray-400"></i>
      </div>
    </div>
  );
};
