import { Headphones, Music2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import heroOrchestraImg from '../assets/images/hero_orchestra_curitiba_1794877624493.jpg';

export function HeroSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section id="inicio" className="pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-[#E7E0D3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Coluna Editorial Esquerda */}
          <div className="lg:col-span-6 flex flex-col justify-center py-2">
            <p className="text-xs font-medium tracking-widest uppercase text-[#78716C] mb-4">
              Curitiba, Paraná <span aria-hidden="true">·</span> Temporada Sinfônica 2026
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold tracking-tight text-[#1C1917] leading-[1.08] [text-wrap:balance]">
              Louvor sinfônico com excelência, reverência e comunhão.
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#44403C] leading-relaxed max-w-xl">
              Conheça e ouça gratuitamente o repertório oficial da Orquestra Evangélica de Curitiba. Músicos interessados podem realizar sua inscrição pelo portal e, após liberação da coordenação, acessar as partituras em PDF de cada naipe.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#repertorio"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold rounded-2xl btn-raised-primary whitespace-nowrap shrink-0"
              >
                <Headphones className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Ouvir Repertório Público</span>
              </a>

              <a
                href="#inscricao"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-semibold rounded-2xl btn-raised-gold whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Inscrever-se na Orquestra</span>
              </a>
            </div>
          </div>

          {/* Coluna Fotográfica Direita */}
          <div className="lg:col-span-6">
            <figure className="h-full flex flex-col">
              <div className="relative flex-1 min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] rounded-3xl overflow-hidden border border-[#DED6C8] bg-[#EBE6DF] shadow-[0_18px_40px_-18px_rgba(28,25,23,0.22)]">
                {!imgError ? (
                  <img
                    src={heroOrchestraImg}
                    alt="Orquestra Evangélica de Curitiba durante ensaio sinfônico no auditório"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full lg:h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EFEAE0] to-[#DFD7C8] p-8 text-center">
                    <Music2 className="w-12 h-12 text-[#1E3A5F] mb-3" />
                    <span className="font-display text-xl text-[#1C1917]">
                      Orquestra Evangélica de Curitiba
                    </span>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
                />
              </div>
              <figcaption className="mt-3 text-xs text-[#78716C] italic font-serif">
                Fig. 1 — Formação completa com cordas, madeiras, metais e percussão em Curitiba.
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Faixa Institucional de 4 Colunas Abaixo do Hero */}
        <div className="mt-10 pt-8 border-t border-[#E7E0D3] grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1E3A5F]">04</p>
            <p className="mt-1 text-sm font-semibold text-[#1C1917]">Naipes Sinfônicos</p>
            <p className="mt-0.5 text-xs text-[#57534E]">Cordas, madeiras, metais e base</p>
          </div>
          <div>
            <p className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1E3A5F]">100%</p>
            <p className="mt-1 text-sm font-semibold text-[#1C1917]">Repertório Aberto</p>
            <p className="mt-0.5 text-xs text-[#57534E]">Audição pública liberada a todos</p>
          </div>
          <div>
            <p className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#9A6B2F]">PDF</p>
            <p className="mt-1 text-sm font-semibold text-[#1C1917]">Acervo Restrito</p>
            <p className="mt-0.5 text-xs text-[#57534E]">Somente participantes liberados</p>
          </div>
          <div>
            <p className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#1E3A5F]">18</p>
            <p className="mt-1 text-sm font-semibold text-[#1C1917]">Partes por Instrumento</p>
            <p className="mt-0.5 text-xs text-[#57534E]">Edição revisada para ensaios</p>
          </div>
        </div>
      </div>
    </section>
  );
}
