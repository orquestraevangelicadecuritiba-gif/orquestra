import { LockKeyhole, Menu, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { MusicianProfile } from '../types/orchestra';

interface NavbarProps {
  profile: MusicianProfile | null;
  onOpenPortal: () => void;
}

export function Navbar({ profile, onOpenPortal }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const firstName = profile?.full_name.split(' ')[0] ?? '';
  const isApproved = profile?.access_status === 'approved' || profile?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E7E0D3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[74px] flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#inicio"
          className="font-display text-lg sm:text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] rounded-lg"
        >
          Orquestra Evangélica de Curitiba
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Navegação principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]"
        >
          <a
            href="#repertorio"
            className="hover:text-[#1E3A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Repertório
          </a>
          <a
            href="#instrumentos"
            className="hover:text-[#1E3A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Instrumentos
          </a>
          <a
            href="#partituras"
            className="hover:text-[#1E3A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Partituras
          </a>
          <a
            href="#inscricao"
            className="hover:text-[#1E3A5F] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Inscrição
          </a>
        </nav>

        {/* Zone 3: 1 primary tactile raised CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenPortal}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl btn-raised-primary whitespace-nowrap shrink-0 cursor-pointer"
          >
            {profile ? (
              <>
                {isApproved ? (
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                ) : (
                  <LockKeyhole className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span className="max-w-[120px] sm:max-w-[140px] truncate">{firstName}</span>
              </>
            ) : (
              <>
                <LockKeyhole className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Entrar / Coordenação</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl btn-raised-sm-surface cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#E7E0D3] bg-[#FBF9F5] px-4 py-4 space-y-2">
          <a
            href="#repertorio"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-[#292524] hover:bg-[#F3EFE7]"
          >
            Repertório
          </a>
          <a
            href="#instrumentos"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-[#292524] hover:bg-[#F3EFE7]"
          >
            Instrumentos
          </a>
          <a
            href="#partituras"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-[#292524] hover:bg-[#F3EFE7]"
          >
            Partituras
          </a>
          <a
            href="#inscricao"
            onClick={() => setMobileOpen(false)}
            className="block py-2.5 px-3 rounded-xl text-sm font-medium text-[#292524] hover:bg-[#F3EFE7]"
          >
            Inscrição
          </a>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenPortal();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-2xl btn-raised-primary cursor-pointer"
            >
              <LockKeyhole className="w-4 h-4" />
              <span>{profile ? `Conta: ${firstName}` : 'Entrar / Coordenação'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
