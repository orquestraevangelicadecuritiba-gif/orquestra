import { FileText, Music, Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import repertoireImg from '../assets/images/repertoire_sheet_music_1794877624849.jpg';
import { audioEngine, formatTime } from '../lib/audioEngine';
import { RepertoireTrack } from '../types/orchestra';

interface PublicRepertoireSectionProps {
  tracks: RepertoireTrack[];
  selectedTrackId: string;
  onSelectTrackForSheets: (trackId: string) => void;
}

const CATEGORIES = ['Todos', 'Hinos Clássicos', 'Louvor Sinfônico', 'Suíte Orquestral'] as const;

export function PublicRepertoireSection({
  tracks,
  selectedTrackId,
  onSelectTrackForSheets,
}: PublicRepertoireSectionProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [imgError, setImgError] = useState(false);
  const [playback, setPlayback] = useState(() => audioEngine.getSnapshot());

  useEffect(() => {
    return audioEngine.subscribe((snap) => setPlayback(snap));
  }, []);

  const filteredTracks = useMemo(() => {
    if (categoryFilter === 'Todos') return tracks;
    return tracks.filter((t) => t.category === categoryFilter);
  }, [tracks, categoryFilter]);

  const activeTrack =
    tracks.find((t) => t.id === playback.trackId) ??
    tracks.find((t) => t.id === selectedTrackId) ??
    tracks[0];

  const isActivePlaying = Boolean(activeTrack && playback.trackId === activeTrack.id && playback.isPlaying);
  const progressSeconds =
    activeTrack && playback.trackId === activeTrack.id ? playback.currentTime : 0;
  const totalSeconds =
    activeTrack && playback.trackId === activeTrack.id
      ? playback.duration
      : activeTrack?.duration_seconds ?? 180;

  return (
    <section id="repertorio" className="py-14 sm:py-20 border-b border-[#E7E0D3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-[#78716C]">
              01. Audição Pública <span aria-hidden="true">·</span> Acesso Livre
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] [text-wrap:balance]">
              Repertório da Temporada
            </h2>
            <p className="mt-2 text-base text-[#57534E] max-w-2xl">
              Ouça livremente os arranjos executados pela Orquestra Evangélica de Curitiba. Selecione qualquer obra abaixo para iniciar a audição de referência.
            </p>
          </div>

          {/* Controles interativos de filtro em botões arredondados táteis */}
          <div
            role="group"
            aria-label="Filtrar repertório por categoria"
            className="flex flex-wrap items-center gap-2"
          >
            {CATEGORIES.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player de Destaque da Obra Selecionada */}
        {activeTrack && (
          <div className="card-elevated rounded-3xl p-5 sm:p-7 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-4">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#E7E0D3] bg-[#F3EFE7]">
                  {!imgError ? (
                    <img
                      src={repertoireImg}
                      alt="Violino clássico e partitura orquestral em estante de madeira"
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-10 h-10 text-[#1E3A5F]" />
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                    <span className="font-mono-tabular font-semibold text-[#9A6B2F]">
                      {activeTrack.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activeTrack.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Tonalidade: {activeTrack.key_signature}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{activeTrack.tempo_bpm} BPM</span>
                  </div>

                  <h3 className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                    {activeTrack.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#57534E]">
                    {activeTrack.composer} <span aria-hidden="true">·</span> {activeTrack.arranger}
                  </p>
                  <p className="mt-3 text-sm sm:text-base text-[#44403C] leading-relaxed">
                    {activeTrack.description}
                  </p>
                </div>

                {/* Barra de Reprodução Tátil */}
                <div className="mt-6 pt-5 border-t border-[#EBE6DF] flex flex-col sm:flex-row sm:items-center gap-4">
                  <button
                    type="button"
                    onClick={() => audioEngine.playTrack(activeTrack)}
                    className="inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-2xl btn-raised-primary whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isActivePlaying ? (
                      <>
                        <Pause className="w-4 h-4 shrink-0" />
                        <span>Pausar Audição</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 shrink-0" />
                        <span>Ouvir Obra</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <span className="font-mono-tabular text-xs text-[#57534E] w-11 text-right shrink-0">
                      {formatTime(progressSeconds)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={totalSeconds}
                      value={Math.min(progressSeconds, totalSeconds)}
                      aria-label="Progresso da audição"
                      onChange={(e) => {
                        if (playback.trackId !== activeTrack.id) {
                          void audioEngine.playTrack(activeTrack).then(() => {
                            audioEngine.seek(Number(e.target.value));
                          });
                        } else {
                          audioEngine.seek(Number(e.target.value));
                        }
                      }}
                      className="w-full accent-[#1E3A5F] cursor-pointer h-2 rounded-lg"
                    />
                    <span className="font-mono-tabular text-xs text-[#57534E] w-11 shrink-0">
                      {formatTime(totalSeconds)}
                    </span>
                  </div>

                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    <Volume2 className="w-4 h-4 text-[#57534E]" aria-hidden="true" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={playback.volume}
                      aria-label="Volume do áudio"
                      onChange={(e) => audioEngine.setVolume(Number(e.target.value))}
                      className="w-20 accent-[#9A6B2F] cursor-pointer h-1.5 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista Completa do Repertório Público */}
        <div className="card-elevated rounded-3xl overflow-hidden">
          <div className="divide-y divide-[#EBE6DF]">
            {filteredTracks.map((track) => {
              const isTrackPlaying = playback.trackId === track.id && playback.isPlaying;
              const isSelected = activeTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  className={`p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-[#F8F5EE]' : 'hover:bg-[#FAF8F4]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => audioEngine.playTrack(track)}
                      aria-label={isTrackPlaying ? `Pausar ${track.title}` : `Ouvir ${track.title}`}
                      className={`w-11 h-11 rounded-2xl inline-flex items-center justify-center shrink-0 cursor-pointer ${
                        isTrackPlaying ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                      }`}
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                        <span className="font-mono-tabular font-semibold text-[#1E3A5F]">
                          {track.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{track.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{track.key_signature}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{formatTime(track.duration_seconds)}</span>
                      </div>
                      <h3 className="mt-0.5 text-base sm:text-lg font-semibold text-[#1C1917] truncate">
                        {track.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#57534E] truncate">
                        {track.composer} <span aria-hidden="true">·</span> {track.arranger}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pl-15 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => onSelectTrackForSheets(track.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-xl btn-raised-sm-surface whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#9A6B2F]" aria-hidden="true" />
                      <span>Ver Partituras</span>
                    </button>
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
