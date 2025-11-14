package main

import (
        "context"
        "database/sql"
        "encoding/json"
        "log"
        "net/http"
        "os"
        "time"

        "github.com/go-chi/chi/v5"
        "github.com/go-chi/chi/v5/middleware"

        _ "github.com/lib/pq"
)

type Config struct {
        ControlDBURL string
        Port         string
}

type City struct {
        ID             string
        Name           string
        Slug           string
        LogoURL        string
        PrimaryColor   string
        SecondaryColor string
        AccentColor    string
        DBURL          string
        IsActive       bool
}

// Resposta para o front (login, app do cidadão, painéis)
type CityThemeResponse struct {
        Name           string `json:"name"`
        Slug           string `json:"slug"`
        LogoURL        string `json:"logoUrl"`
        PrimaryColor   string `json:"primaryColor"`
        SecondaryColor string `json:"secondaryColor"`
        AccentColor    string `json:"accentColor"`
}

type App struct {
        cfg       Config
        controlDB *sql.DB
}

func main() {
        // 1. Config
        cfg := Config{
                ControlDBURL: getEnv("CONTROL_DB_URL", ""),
                Port:         getEnv("PORT", "8080"),
        }

        if cfg.ControlDBURL == "" {
                log.Fatal("Env CONTROL_DB_URL é obrigatório (string de conexão do Postgres/Supabase do painel da empresa)")
        }

        // 2. Conexão com banco de controle
        controlDB, err := sql.Open("postgres", cfg.ControlDBURL)
        if err != nil {
                log.Fatalf("Erro ao abrir conexão com CONTROL_DB_URL: %v", err)
        }
        if err := controlDB.Ping(); err != nil {
                log.Fatalf("Erro ao conectar no banco de controle: %v", err)
        }

        app := &App{
                cfg:       cfg,
                controlDB: controlDB,
        }

        // 3. Router HTTP
        r := chi.NewRouter()
        r.Use(middleware.Logger)
        r.Use(middleware.Recoverer)
        
        // CORS middleware para permitir requisições do frontend
        r.Use(func(next http.Handler) http.Handler {
                return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
                        w.Header().Set("Access-Control-Allow-Origin", "*")
                        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
                        
                        if r.Method == "OPTIONS" {
                                w.WriteHeader(http.StatusOK)
                                return
                        }
                        
                        next.ServeHTTP(w, r)
                })
        })

        r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
                w.WriteHeader(http.StatusOK)
                _, _ = w.Write([]byte("ok"))
        })

        // Endpoint para buscar tema da cidade (logo + cores)
        r.Get("/api/cities/{slug}/theme", app.handleGetCityTheme)

        addr := ":" + cfg.Port
        log.Printf("Servidor rodando em %s", addr)
        if err := http.ListenAndServe(addr, r); err != nil {
                log.Fatalf("Erro ao subir servidor: %v", err)
        }
}

// Handler: GET /api/cities/{slug}/theme
func (a *App) handleGetCityTheme(w http.ResponseWriter, r *http.Request) {
        slug := chi.URLParam(r, "slug")
        if slug == "" {
                http.Error(w, "slug é obrigatório", http.StatusBadRequest)
                return
        }

        ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
        defer cancel()

        city, err := a.getCityBySlug(ctx, slug)
        if err == sql.ErrNoRows {
                http.Error(w, "cidade não encontrada", http.StatusNotFound)
                return
        }
        if err != nil {
                log.Printf("Erro ao buscar cidade por slug=%s: %v", slug, err)
                http.Error(w, "erro interno", http.StatusInternalServerError)
                return
        }

        if !city.IsActive {
                http.Error(w, "cidade desativada", http.StatusForbidden)
                return
        }

        resp := CityThemeResponse{
                Name:           city.Name,
                Slug:           city.Slug,
                LogoURL:        city.LogoURL,
                PrimaryColor:   city.PrimaryColor,
                SecondaryColor: city.SecondaryColor,
                AccentColor:    city.AccentColor,
        }

        writeJSON(w, http.StatusOK, resp)
}

// Busca cidade no banco de controle
func (a *App) getCityBySlug(ctx context.Context, slug string) (*City, error) {
        const q = `
                select
                        id,
                        name,
                        slug,
                        coalesce(logo_url, '') as logo_url,
                        coalesce(primary_color, '') as primary_color,
                        coalesce(secondary_color, '') as secondary_color,
                        coalesce(accent_color, '') as accent_color,
                        coalesce(db_url, '') as db_url,
                        is_active
                from public.cities
                where slug = $1
                limit 1;
        `

        var c City
        err := a.controlDB.QueryRowContext(ctx, q, slug).Scan(
                &c.ID,
                &c.Name,
                &c.Slug,
                &c.LogoURL,
                &c.PrimaryColor,
                &c.SecondaryColor,
                &c.AccentColor,
                &c.DBURL,
                &c.IsActive,
        )
        if err != nil {
                return nil, err
        }

        return &c, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
        w.Header().Set("Content-Type", "application/json; charset=utf-8")
        w.WriteHeader(status)
        if err := json.NewEncoder(w).Encode(v); err != nil {
                log.Printf("Erro ao serializar JSON: %v", err)
        }
}

func getEnv(key, fallback string) string {
        if val := os.Getenv(key); val != "" {
                return val
        }
        return fallback
}
