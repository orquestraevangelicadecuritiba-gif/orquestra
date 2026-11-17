import {
  Clock,
  Download,
  Eye,
  FileText,
  Lock,
  Music2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import instrumentsImg from '../assets/images/wind_instruments_curitiba_1794878255941.jpg';
import { NAIPES, ORCHESTRA_INSTRUMENTS } from '../data/orchestraCatalog';
import { downloadPrivateSheetPdf } from '../services/orchestraService';
import {
  MusicianProfile,
  Naipe,
  RepertoireTrack,
  SheetMusicPart,
} from '../types/orchestra';

interface InstrumentMaterialsSectionProps {
  tracks: RepertoireTrack[];
  sheets: SheetMusicPart[];
  selectedTrackId: string;
  onChangeTrackId: (id: string) => void;
  profile: MusicianProfile | null;
  onOpenPortal: () => void;
  onPreviewPdf: (url: string, title: string, fileName: string) => void;
}

export function InstrumentMaterialsSection({
  tracks,
  sheets,
  selectedTrackId,
  onChangeTrackId,
  profile,
  onOpenPortal,
  onPreviewPdf,
}: InstrumentMaterialsSectionProps) {
  const [selectedNaipe, setSelectedNaipe] = useState<Naipe>('Cordas');
  const [selectedInstrument, setSelectedInstrument] = useState<string>('Violino I');
  const [imgError, setImgError] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyPartId, setBusyPartId] = useState<string | null>(null);

  const isAuthorized = Boolean(
    profile && (profile.access_status === 'approved' || profile.role === 'admin')
  );

  const instrumentsInNaipe = useMemo(
    () => ORCHESTRA_INSTRUMENTS.filter((inst) => inst.naipe === selectedNaipe),
    [selectedNaipe]
  );

  const activeInstrumentInfo = useMemo(
    () => ORCHESTRA_INSTRUMENTS.find((inst) => inst.name === selectedInstrument) ?? instrumentsInNaipe[0],
    [selectedInstrument, instrumentsInNaipe]
  );

  const activeTrack = tracks.find((t) => t.id === selectedTrackId) ?? tracks[0];

  // Partituras filtradas pela obra selecionada e instrumento selecionado (ou todas do instrumento across obras)
  const partsForInstrument = useMemo(() => {
    return sheets.filter(
      (part) =>
        part.instrument === (activeInstrumentInfo?.name ?? selectedInstrument)
    );
  }, [sheets, activeInstrumentInfo, selectedInstrument]);

  const handleNaipeClick = (naipe: Naipe) => {
    setSelectedNaipe(naipe);
    const first = ORCHESTRA_INSTRUMENTS.find((i) => i.naipe === naipe);
    if (first) {
      setSelectedInstrument(first.name);
    }
    setActionMessage(null);
  };

  const handleFilterMyInstrument = () => {
    if (!profile) return;
    setSelectedNaipe(profile.naipe);
    setSelectedInstrument(profile.instrument);
    setActionMessage(null);
  };

  const handleOpenPart = async (part: SheetMusicPart, mode: 'preview' | 'download') => {
    if (!profile) {
      onOpenPortal();
      return;
    }
    if (!isAuthorized) {
      setActionMessage(
        'Acesso bloqueado: sua inscrição está em análise. Somente participantes com acesso liberado pela coordenação podem abrir ou baixar os PDFs.'
      );
      return;
    }

    const track = tracks.find((t) => t.id === part.repertoire_id) ?? activeTrack;
    if (!track) return;

    setBusyPartId(part.id);
    setActionMessage(null);
    const result = await downloadPrivateSheetPdf(part, track, profile);
    setBusyPartId(null);

    if (result.error || !result.url) {
      setActionMessage(result.error ?? 'Não foi possível carregar o arquivo PDF.');
      return;
    }

    const safeFileName = `${track.code}-${part.instrument.replace(/\s+/g, '-')}.pdf`;

    if (mode === 'preview') {
      onPreviewPdf(result.url, `${track.title} — ${part.instrument}`, safeFileName);
    } else {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = safeFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <section id="instrumentos" className="py-14 sm:py-20 border-b border-[#E7E0D3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho + Fotografia de Instrumentos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-widest uppercase text-[#78716C]">
              02. Organização por Naipes <span aria-hidden="true">·</span> Material Técnico
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] [text-wrap:balance]">
              Material por Instrumento &amp; Partituras Privadas
            </h2>
            <p className="mt-3 text-base text-[#44403C] leading-relaxed max-w-2xl">
              Explore as especificações de clave e transposição de cada naipe da orquestra. Os cadernos completos em PDF permanecem protegidos no acervo privado e são liberados exclusivamente aos músicos participantes aprovados pela coordenação.
            </p>

            {/* Seletor de Naipes em Alto Relevo */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5" role="tablist" aria-label="Naipes da orquestra">
              {NAIPES.map((naipe) => {
                const active = selectedNaipe === naipe;
                return (
                  <button
                    key={naipe}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleNaipeClick(naipe)}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-2xl whitespace-nowrap shrink-0 cursor-pointer ${
                      active ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                    }`}
                  >
                    {naipe}
                  </button>
                );
              })}

              {profile && (
                <button
                  type="button"
                  onClick={handleFilterMyInstrument}
                  className="px-4 py-2.5 text-sm font-semibold rounded-2xl btn-raised-gold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Meu Instrumento ({profile.instrument})
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <figure>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-[#DED6C8] bg-[#EBE6DF] shadow-[0_14px_30px_-14px_rgba(28,25,23,0.18)]">
                {!imgError ? (
                  <img
                    src={instrumentsImg}
                    alt="Flauta transversal, oboé, clarinete, fagote e trompa dispostos sobre pedra clara"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-10 h-10 text-[#9A6B2F]" />
                  </div>
                )}
              </div>
              <figcaption className="mt-2.5 text-xs text-[#78716C] italic font-serif">
                Fig. 2 — Flauta transversal, oboé, clarinete, fagote e trompa; partituras transpostas conforme o instrumento.
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Grade de Instrumentos do Naipe Selecionado */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8">
          {instrumentsInNaipe.map((inst) => {
            const active = activeInstrumentInfo?.id === inst.id;
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => {
                  setSelectedInstrument(inst.name);
                  setActionMessage(null);
                }}
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                }`}
              >
                {inst.name}
              </button>
            );
          })}
        </div>

        {/* Bloco Unificado: Ficha do Instrumento + Acervo Restrito de PDFs */}
        <div id="partituras" className="card-elevated rounded-3xl p-6 sm:p-8">
          {/* Barra de Status de Segurança do Acervo Privado */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#EBE6DF]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                <span>{activeInstrumentInfo?.naipe}</span>
                <span aria-hidden="true">·</span>
                <span>{activeInstrumentInfo?.clef}</span>
                <span aria-hidden="true">·</span>
                <span>{activeInstrumentInfo?.transposition}</span>
              </div>
              <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                Partituras em PDF — {activeInstrumentInfo?.name}
              </h3>
              <p className="mt-1 text-sm text-[#57534E]">
                {activeInstrumentInfo?.standNote}
              </p>
            </div>

            {/* Indicador explícito (ícone + texto) do nível de permissão atual */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {!profile && (
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-2xl btn-raised-primary whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Entrar para Liberar PDFs</span>
                </button>
              )}

              {profile && profile.access_status === 'pending' && profile.role !== 'admin' && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FDF8EE] border border-[#E6D3A8] text-[#785319] text-xs sm:text-sm font-medium">
                  <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Inscrição em análise — Aguardando liberação</span>
                </div>
              )}

              {profile && profile.access_status === 'rejected' && profile.role !== 'admin' && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs sm:text-sm font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Acesso restrito pela coordenação</span>
                </div>
              )}

              {isAuthorized && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#EFF6F1] border border-[#BFE0C9] text-[#14532D] text-xs sm:text-sm font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Acesso Liberado · {profile?.full_name.split(' ')[0]}</span>
                </div>
              )}
            </div>
          </div>

          {actionMessage && (
            <div
              role="alert"
              className="mt-5 px-4 py-3 rounded-2xl bg-[#FDF8EE] border border-[#E6D3A8] text-sm text-[#785319] flex items-center justify-between gap-4"
            >
              <span>{actionMessage}</span>
              <button
                type="button"
                onClick={() => setActionMessage(null)}
                className="text-xs font-semibold underline shrink-0 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Filtro opcional por obra específica */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label htmlFor="repertoire-sheet-filter" className="text-xs sm:text-sm font-medium text-[#57534E]">
              Filtrar por obra do repertório:
            </label>
            <select
              id="repertoire-sheet-filter"
              value={selectedTrackId}
              onChange={(e) => onChangeTrackId(e.target.value)}
              className="sm:w-80 px-4 py-2.5 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <option value="all">Todas as obras do repertório</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Arquivos PDF do Instrumento */}
          <div className="mt-6 divide-y divide-[#EBE6DF] border-t border-[#EBE6DF]">
            {partsForInstrument
              .filter((part) => selectedTrackId === 'all' || part.repertoire_id === selectedTrackId)
              .map((part) => {
                const track = tracks.find((t) => t.id === part.repertoire_id);
                if (!track) return null;
                const isBusy = busyPartId === part.id;

                return (
                  <div
                    key={part.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isAuthorized
                            ? 'bg-[#EFF3F8] border-[#C8D6E8] text-[#1E3A5F]'
                            : 'bg-[#F3EFE7] border-[#DED6C8] text-[#78716C]'
                        }`}
                      >
                        {isAuthorized ? (
                          <FileText className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <Lock className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                          <span className="font-mono-tabular font-semibold text-[#1E3A5F]">
                            {track.code}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{track.key_signature}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{part.pages_count} páginas PDF</span>
                        </div>
                        <p className="mt-0.5 text-sm sm:text-base font-semibold text-[#1C1917] truncate">
                          {track.title} — {part.instrument}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {isAuthorized ? (
                        <>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOpenPart(part, 'preview')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl btn-raised-sm-surface whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                            <span>Visualizar</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleOpenPart(part, 'download')}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl btn-raised-sm-primary whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                          >
                            <Download className="w-4 h-4" aria-hidden="true" />
                            <span>{isBusy ? 'Gerando...' : 'Baixar PDF'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            profile
                              ? setActionMessage(
                                  'Seu cadastro ainda não possui liberação ativa. Aguarde a aprovação da coordenação.'
                                )
                              : onOpenPortal()
                          }
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-xl btn-raised-sm-surface text-[#57534E] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-[#9A6B2F]" aria-hidden="true" />
                          <span>
                            {profile ? 'Aguardando Liberação' : 'Restrito a Participantes'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
