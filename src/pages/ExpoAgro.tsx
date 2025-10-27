import { Layout } from "@/components/Layout";
import expoAgroBanner from "@/assets/expo-agro-banner.png";
import expoQuarta from "@/assets/expo-quarta.jpg";
import expoQuinta from "@/assets/expo-quinta.jpg";
import expoSexta from "@/assets/expo-sexta.jpg";
import expoSabado from "@/assets/expo-sabado.jpg";

export default function ExpoAgro() {
  return (
    <Layout>
      <div style={{ background: '#f6c10e', margin: '-1.5rem', marginBottom: '0', minHeight: '100vh', paddingBottom: '4rem' }}>
      <style>{`
        .expo-wrap {
          max-width: 980px;
          margin-inline: auto;
          padding: 14px;
          position: relative;
        }
        .expo-frame {
          position: relative;
          border-radius: 22px;
          overflow: hidden;
          background: #f6c10e;
        }
        .expo-frame::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          padding: 10px;
          background:
            repeating-linear-gradient(90deg, #19a3ff, #19a3ff 16px, transparent 16px, transparent 32px),
            repeating-linear-gradient(0deg, #19a3ff, #19a3ff 16px, transparent 16px, transparent 32px);
          -webkit-mask:
            radial-gradient(10px 6px at 8px 8px, #000 94%, transparent 96%) 0 0/32px 32px repeat,
            radial-gradient(10px 6px at 24px 24px, #000 94%, transparent 96%) 0 0/32px 32px repeat;
          mask:
            radial-gradient(10px 6px at 8px 8px, #000 94%, transparent 96%) 0 0/32px 32px repeat,
            radial-gradient(10px 6px at 24px 24px, #000 94%, transparent 96%) 0 0/32px 32px repeat;
          border-radius: 22px;
        }
        .expo-content {
          position: relative;
          margin: 12px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fff7d1, #ffe48e 60%, #ffd25c);
          border: 2px solid #f2b70a;
          overflow: hidden;
        }
        .expo-hero {
          display: grid;
          gap: 10px;
          padding: 12px;
        }
        .expo-banner {
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid #f3b11a;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        .expo-banner img {
          width: 100%;
          height: auto;
          display: block;
        }
        .expo-chips {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          padding: 2px;
        }
        .expo-chip {
          border-radius: 999px;
          border: 2px solid #0e75c7;
          background: linear-gradient(180deg, #23b0ff, #0079e6);
          color: #fff;
          padding: 0.65rem 0.95rem;
          font-weight: 800;
          letter-spacing: 0.2px;
          box-shadow: 0 6px 0 #045a9e;
          transform: translateY(0);
          transition: transform 0.08s ease;
          cursor: pointer;
          text-align: center;
          font-size: 14px;
        }
        .expo-chip:active {
          transform: translateY(2px);
        }
        .expo-live {
          margin-top: 8px;
          border-radius: 16px;
          border: 3px solid #19a3ff;
          overflow: hidden;
          background: #0e0f12;
        }
        .expo-live iframe {
          width: 100%;
          aspect-ratio: 16/9;
          border: 0;
          display: block;
        }
        .expo-live-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: linear-gradient(90deg, #e34b1f, #ba3516);
          color: #fff;
          padding: 8px 12px;
          font-weight: 900;
          letter-spacing: 0.3px;
        }
        .expo-live-pill {
          background: #00000028;
          border: 2px solid #ffffff80;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 12px;
        }
        .expo-grid {
          display: grid;
          gap: 10px;
          padding: 12px;
        }
        @media (min-width: 760px) {
          .expo-grid.cols-2 {
            grid-template-columns: 1fr 1fr;
          }
        }
        .expo-card {
          background: #fff6d7;
          border: 2px solid #f1cb65;
          border-radius: 16px;
          padding: 12px;
          color: #26221d;
        }
        .expo-card h3 {
          margin: 0 0 6px 0;
          font-size: 16px;
          color: #4b3a25;
        }
        .expo-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          background: #fff1bd;
          border: 1px dashed #e4b74e;
          border-radius: 12px;
          padding: 10px;
          margin-top: 6px;
        }
        .expo-pill {
          background: #ffe06f;
          border: 2px solid #f1b93a;
          border-radius: 999px;
          padding: 0.12rem 0.55rem;
          font-weight: 800;
          font-size: 12px;
          color: #7a4b05;
        }
        .expo-strip {
          padding: 0 12px 12px;
        }
        .expo-poster-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          scroll-snap-type: x mandatory;
        }
        .expo-poster {
          flex: 0 0 72%;
          max-width: 420px;
          scroll-snap-align: center;
          border-radius: 16px;
          overflow: hidden;
          border: 2px solid #f3b11a;
          background: #111;
        }
        .expo-poster img {
          display: block;
          width: 100%;
          height: auto;
        }
        .expo-poster small {
          display: block;
          text-align: center;
          background: #fff7d1;
          color: #5a3a13;
          padding: 6px 8px;
          font-weight: 700;
        }
        .expo-footer {
          text-align: center;
          color: #63451e;
          font-size: 12px;
          padding: 12px;
        }
      `}</style>

      <div className="expo-wrap">
        <div className="expo-frame">
          <div className="expo-content">
            {/* Hero Section */}
            <section className="expo-hero">
              <div className="expo-banner">
                <img
                  src={expoAgroBanner}
                  alt="19ª Expo Agro - Afogados da Ingazeira"
                />
              </div>

              <div className="expo-chips">
                <button className="expo-chip">📍 Localização</button>
                <button className="expo-chip">📅 Programação</button>
                <button className="expo-chip">🎤 Palestrantes</button>
                <button className="expo-chip">🏆 Prêmios</button>
              </div>

              {/* Live Section */}
              <div className="expo-live">
                <div className="expo-live-head">
                  <span>🔴 AO VIVO</span>
                  <span className="expo-live-pill">ONLINE</span>
                </div>
                <iframe
                  src="https://www.youtube.com/embed/KGp78Im2YmQ"
                  title="Expo Agro - Transmissão ao Vivo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>

            {/* Grid Section */}
            <section className="expo-grid cols-2">
              <div className="expo-card">
                <h3>🌾 Agricultura</h3>
                <div className="expo-line">
                  <span>Inovações</span>
                  <span className="expo-pill">NOVO</span>
                </div>
                <div className="expo-line">
                  <span>Tecnologia</span>
                  <span className="expo-pill">HOT</span>
                </div>
              </div>

              <div className="expo-card">
                <h3>🐄 Pecuária</h3>
                <div className="expo-line">
                  <span>Exposição</span>
                  <span className="expo-pill">2 dias</span>
                </div>
                <div className="expo-line">
                  <span>Leilões</span>
                  <span className="expo-pill">5 lotes</span>
                </div>
              </div>

              <div className="expo-card">
                <h3>🎯 Workshops</h3>
                <div className="expo-line">
                  <span>Inscrições</span>
                  <span className="expo-pill">Abertas</span>
                </div>
                <div className="expo-line">
                  <span>Vagas</span>
                  <span className="expo-pill">50</span>
                </div>
              </div>

              <div className="expo-card">
                <h3>🍴 Gastronomia</h3>
                <div className="expo-line">
                  <span>Food Trucks</span>
                  <span className="expo-pill">15+</span>
                </div>
                <div className="expo-line">
                  <span>Regional</span>
                  <span className="expo-pill">Top</span>
                </div>
              </div>
            </section>

            {/* Posters Section */}
            <section className="expo-strip">
              <div className="expo-poster-row">
                <div className="expo-poster">
                  <img
                    src={expoQuarta}
                    alt="Programação Quarta 02.07"
                  />
                  <small>Quarta 02.07 - Shows às 21h</small>
                </div>
                <div className="expo-poster">
                  <img
                    src={expoQuinta}
                    alt="Programação Quinta 03.07"
                  />
                  <small>Quinta 03.07 - Shows às 21h</small>
                </div>
                <div className="expo-poster">
                  <img
                    src={expoSexta}
                    alt="Programação Sexta 04.07"
                  />
                  <small>Sexta 04.07 - Shows às 21h</small>
                </div>
                <div className="expo-poster">
                  <img
                    src={expoSabado}
                    alt="Programação Sábado 05.07"
                  />
                  <small>Sábado 05.07 - Shows às 21h</small>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="expo-footer">
              Expo Agro 2025 • Afogados da Ingazeira - PE
            </footer>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
}
