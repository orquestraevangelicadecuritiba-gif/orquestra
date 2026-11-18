import {
  Check,
  Clock,
  Disc3,
  FileUp,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { NAIPES, ORCHESTRA_INSTRUMENTS } from '../data/orchestraCatalog';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  addRepertoireTrack,
  listAllMusicians,
  requestPasswordReset,
  signInLocalDemoAccount,
  signInMusician,
  signOutMusician,
  updateMusicianAccessStatus,
  updateUserPassword,
  uploadPrivateSheetPdf,
} from '../services/orchestraService';
import { AccessStatus, MusicianProfile, Naipe, RepertoireTrack } from '../types/orchestra';

interface MemberPortalModalProps {
  open: boolean;
  onClose: () => void;
  profile: MusicianProfile | null;
  tracks: RepertoireTrack[];
  recoveryMode?: boolean;
  onRecoveryDone?: () => void;
  onProfileChange: (profile: MusicianProfile | null) => void;
  onSheetsUpdated: () => void;
}

export function MemberPortalModal({
  open,
  onClose,
  profile,
  tracks,
  recoveryMode = false,
  onRecoveryDone,
  onProfileChange,
  onSheetsUpdated,
}: MemberPortalModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin state
  const [adminTab, setAdminTab] = useState<'members' | 'repertoire' | 'upload' | 'deploy'>('members');
  const [members, setMembers] = useState<MusicianProfile[]>([]);
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [uploadTrackId, setUploadTrackId] = useState(tracks[0]?.id ?? '');
  const [uploadInstrument, setUploadInstrument] = useState('Violino I');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  // Novo Repertório state
  const [repCode, setRepCode] = useState('');
  const [repTitle, setRepTitle] = useState('');
  const [repComposer, setRepComposer] = useState('');
  const [repArranger, setRepArranger] = useState('Arr. Orquestra Evangélica de Curitiba');
  const [repCategory, setRepCategory] = useState<RepertoireTrack['category']>('Louvor Sinfônico');
  const [repKey, setRepKey] = useState('Dó Maior');
  const [repBpm, setRepBpm] = useState(76);
  const [repDuration, setRepDuration] = useState(210);
  const [repDesc, setRepDesc] = useState('');
  const [repAudioFile, setRepAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && profile?.role === 'admin') {
      void listAllMusicians().then(setMembers);
    }
  }, [open, profile]);

  useEffect(() => {
    if (!uploadTrackId && tracks[0]?.id) {
      setUploadTrackId(tracks[0].id);
    }
  }, [tracks, uploadTrackId]);

  if (!open) return null;

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setLoading(true);
    const res = await signInMusician(email, password);
    setLoading(false);
    if (res.error || !res.profile) {
      setAuthError(res.error ?? 'E-mail ou senha inválidos.');
      return;
    }
    onProfileChange(res.profile);
    setEmail('');
    setPassword('');
  };

  const handleForgotPassword = async () => {
    setAuthError(null);
    setAuthInfo(null);
    setLoading(true);
    const res = await requestPasswordReset(email);
    setLoading(false);
    if (!res.ok) {
      setAuthError(res.error ?? 'Não foi possível enviar o e-mail de recuperação.');
      return;
    }
    setAuthInfo('Link de redefinição enviado! Verifique sua caixa de entrada e spam.');
  };

  const handleSaveNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    setLoading(true);
    const res = await updateUserPassword(newPassword);
    setLoading(false);
    if (!res.ok) {
      setAuthError(res.error ?? 'Não foi possível atualizar a senha.');
      return;
    }
    setNewPassword('');
    setAuthInfo('Nova senha salva com sucesso!');
    onRecoveryDone?.();
  };

  const handleSignOut = async () => {
    await signOutMusician();
    onProfileChange(null);
  };

  const handleQuickDemoAccess = (target: 'admin' | 'approved' | 'pending') => {
    setAuthError(null);
    const next = signInLocalDemoAccount(target);
    onProfileChange(next);
    if (target === 'admin') {
      setAdminTab('upload');
    }
  };

  const handleStatusUpdate = async (musicianId: string, nextStatus: AccessStatus) => {
    setAdminMessage(null);
    const res = await updateMusicianAccessStatus(musicianId, nextStatus);
    if (!res.ok) {
      setAdminMessage(res.error ?? 'Erro ao atualizar acesso.');
      return;
    }
    const refreshed = await listAllMusicians();
    setMembers(refreshed);
    setAdminMessage('Permissão do participante atualizada com sucesso.');
  };

  const handleUploadPdf = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setAdminMessage('Selecione um arquivo PDF para enviar.');
      return;
    }
    const inst = ORCHESTRA_INSTRUMENTS.find((i) => i.name === uploadInstrument);
    const naipe: Naipe = inst?.naipe ?? 'Cordas';

    setLoading(true);
    const res = await uploadPrivateSheetPdf(uploadTrackId, uploadInstrument, naipe, uploadFile);
    setLoading(false);

    if (!res.ok) {
      setAdminMessage(res.error ?? 'Erro ao enviar partitura.');
      return;
    }

    setUploadFile(null);
    setAdminMessage('Partitura PDF adicionada ao acervo privado com sucesso!');
    onSheetsUpdated();
  };

  const handleAddRepertoire = async (e: FormEvent) => {
    e.preventDefault();
    setAdminMessage(null);
    setLoading(true);
    const res = await addRepertoireTrack({
      code: repCode,
      title: repTitle,
      composer: repComposer,
      arranger: repArranger,
      category: repCategory,
      key_signature: repKey,
      tempo_bpm: Number(repBpm) || 76,
      duration_seconds: Number(repDuration) || 210,
      description: repDesc,
      audioFile: repAudioFile,
    });
    setLoading(false);

    if (!res.ok) {
      setAdminMessage(res.error ?? 'Erro ao publicar obra no repertório.');
      return;
    }

    setRepCode('');
    setRepTitle('');
    setRepComposer('');
    setRepDesc('');
    setRepAudioFile(null);
    setAdminMessage('Obra e áudio adicionados ao repertório público com sucesso!');
    onSheetsUpdated();
  };

  const filteredMembers = members.filter((m) =>
    memberFilter === 'all' ? true : m.access_status === memberFilter
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Área do Músico e Coordenação"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-[#FBF9F5] border border-[#DED6C8] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E7E0D3]">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#78716C]">
              Orquestra Evangélica de Curitiba
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              {profile ? 'Área do Participante' : 'Acesso ao Acervo Privado'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="w-10 h-10 rounded-xl btn-raised-sm-surface inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!profile ? (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-[#44403C] leading-relaxed">
              Entre com o e-mail e senha cadastrados na sua inscrição. Apenas músicos com acesso liberado pela coordenação podem visualizar e baixar os PDFs das partituras.
            </p>

            {authError && (
              <div
                role="alert"
                className="px-4 py-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
              >
                {authError}
              </div>
            )}

            {authInfo && (
              <div
                role="status"
                className="px-4 py-3 rounded-2xl bg-[#EFF6F1] border border-[#BFE0C9] text-sm text-[#14532D]"
              >
                {authInfo}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="modal-login-email" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                  E-mail
                </label>
                <input
                  id="modal-login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="modal-login-pass" className="block text-xs font-semibold text-[#44403C]">
                    Senha
                  </label>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-[#1E3A5F] hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <input
                  id="modal-login-pass"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <a
                  href="#inscricao"
                  onClick={onClose}
                  className="text-sm font-medium text-[#1E3A5F] hover:underline"
                >
                  Ainda não me inscrevi — ir para inscrição
                </a>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-sm font-semibold rounded-2xl btn-raised-primary cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </div>
            </form>

            {!isSupabaseConfigured && (
              <div className="p-4 rounded-2xl bg-[#F3EFE7] border border-[#DED6C8] text-xs text-[#57534E] space-y-3">
                <p className="font-semibold text-[#1C1917]">
                  Acesso rápido de demonstração (1 clique):
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('admin')}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-primary cursor-pointer"
                  >
                    Entrar como Coordenação (Enviar PDFs e Repertório)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('approved')}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-surface cursor-pointer"
                  >
                    Músico Liberado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('pending')}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-surface cursor-pointer"
                  >
                    Músico Pendente
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {recoveryMode && (
              <form
                onSubmit={handleSaveNewPassword}
                className="p-5 rounded-2xl bg-[#FDF8EE] border border-[#E6D3A8] space-y-3"
              >
                <p className="text-sm font-semibold text-[#1C1917]">
                  Definir nova senha de acesso
                </p>
                {authError && <p className="text-xs text-[#991B1B]">{authError}</p>}
                {authInfo && <p className="text-xs text-[#14532D]">{authInfo}</p>}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha (mín. 6 caracteres)"
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-white"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl btn-raised-sm-primary cursor-pointer"
                  >
                    Salvar Nova Senha
                  </button>
                </div>
              </form>
            )}

            {/* Resumo do Perfil Logado */}
            <div className="p-5 rounded-2xl bg-white border border-[#E7E0D3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-[#78716C]">
                  {profile.naipe} <span aria-hidden="true">·</span> {profile.instrument} <span aria-hidden="true">·</span> {profile.church}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-[#1C1917]">
                  {profile.full_name}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                  {profile.access_status === 'approved' || profile.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 text-[#14532D]">
                      <ShieldCheck className="w-4 h-4" />
                      Acesso Liberado às Partituras Privadas
                    </span>
                  ) : profile.access_status === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 text-[#785319]">
                      <Clock className="w-4 h-4" />
                      Inscrição em análise — Aguardando liberação
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[#991B1B]">
                      <ShieldAlert className="w-4 h-4" />
                      Acesso restrito pela coordenação
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!isSupabaseConfigured && profile.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('admin')}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl btn-raised-sm-primary shrink-0 cursor-pointer"
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Ir para Painel Admin (Enviar Arquivos)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl btn-raised-sm-surface shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>

            {/* Painel Exclusivo da Coordenação (Admin) */}
            {profile.role === 'admin' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminTab('members')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${
                      adminTab === 'members' ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Liberação de Músicos ({members.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('repertoire')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${
                      adminTab === 'repertoire' ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                    }`}
                  >
                    <Disc3 className="w-4 h-4" />
                    <span>Subir Repertório</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('upload')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${
                      adminTab === 'upload' ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                    }`}
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Enviar Partitura PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab('deploy')}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${
                      adminTab === 'deploy' ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                    }`}
                  >
                    <span>Guia GitHub Pages &amp; Supabase</span>
                  </button>
                </div>

                {adminMessage && (
                  <div className="px-4 py-3 rounded-2xl bg-[#EFF6F1] border border-[#BFE0C9] text-sm text-[#14532D]">
                    {adminMessage}
                  </div>
                )}

                {adminTab === 'members' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {(['all', 'pending', 'approved'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setMemberFilter(f)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer ${
                            memberFilter === f ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                          }`}
                        >
                          {f === 'all' ? 'Todos' : f === 'pending' ? 'Aguardando Liberação' : 'Liberados'}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-[#E7E0D3] bg-white divide-y divide-[#EBE6DF]">
                      {filteredMembers.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1C1917] truncate">
                              {m.full_name}
                            </p>
                            <p className="text-xs text-[#57534E]">
                              {m.instrument} ({m.naipe}) <span aria-hidden="true">·</span> {m.church || 'Sem igreja informada'} <span aria-hidden="true">·</span> {m.phone}
                            </p>
                            <p className="mt-1 text-xs font-medium">
                              Status:{' '}
                              <span
                                className={
                                  m.access_status === 'approved'
                                    ? 'text-[#14532D]'
                                    : m.access_status === 'pending'
                                    ? 'text-[#785319]'
                                    : 'text-[#991B1B]'
                                }
                              >
                                {m.access_status === 'approved'
                                  ? 'Acesso Liberado'
                                  : m.access_status === 'pending'
                                  ? 'Aguardando Liberação'
                                  : 'Bloqueado'}
                              </span>
                            </p>
                          </div>

                          {m.role !== 'admin' && (
                            <div className="flex items-center gap-2 shrink-0">
                              {m.access_status !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(m.id, 'approved')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-primary cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Liberar PDF</span>
                                </button>
                              )}
                              {m.access_status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(m.id, 'rejected')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-surface cursor-pointer"
                                >
                                  <span>Suspender</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {adminTab === 'repertoire' && (
                  <form
                    onSubmit={handleAddRepertoire}
                    className="p-5 rounded-2xl bg-white border border-[#E7E0D3] space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="rep-code" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Código *
                        </label>
                        <input
                          id="rep-code"
                          type="text"
                          required
                          value={repCode}
                          onChange={(e) => setRepCode(e.target.value)}
                          placeholder="Ex.: OEC-07"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="rep-title" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Título da obra *
                        </label>
                        <input
                          id="rep-title"
                          type="text"
                          required
                          value={repTitle}
                          onChange={(e) => setRepTitle(e.target.value)}
                          placeholder="Ex.: Aleluia (Messias)"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="rep-composer" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Compositor *
                        </label>
                        <input
                          id="rep-composer"
                          type="text"
                          required
                          value={repComposer}
                          onChange={(e) => setRepComposer(e.target.value)}
                          placeholder="Nome do compositor"
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        />
                      </div>

                      <div>
                        <label htmlFor="rep-arranger" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Arranjador *
                        </label>
                        <input
                          id="rep-arranger"
                          type="text"
                          required
                          value={repArranger}
                          onChange={(e) => setRepArranger(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="sm:col-span-2">
                        <label htmlFor="rep-cat" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Categoria
                        </label>
                        <select
                          id="rep-cat"
                          value={repCategory}
                          onChange={(e) => setRepCategory(e.target.value as RepertoireTrack['category'])}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        >
                          <option value="Hinos Clássicos">Hinos Clássicos</option>
                          <option value="Louvor Sinfônico">Louvor Sinfônico</option>
                          <option value="Suíte Orquestral">Suíte Orquestral</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="rep-key" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Tonalidade
                        </label>
                        <input
                          id="rep-key"
                          type="text"
                          required
                          value={repKey}
                          onChange={(e) => setRepKey(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        />
                      </div>

                      <div>
                        <label htmlFor="rep-bpm" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          BPM / Duração (s)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            id="rep-bpm"
                            type="number"
                            min={40}
                            max={220}
                            value={repBpm}
                            onChange={(e) => setRepBpm(Number(e.target.value))}
                            aria-label="Andamento em BPM"
                            className="w-full px-2.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                          />
                          <input
                            type="number"
                            min={30}
                            max={1800}
                            value={repDuration}
                            onChange={(e) => setRepDuration(Number(e.target.value))}
                            aria-label="Duração em segundos"
                            className="w-full px-2.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="rep-desc" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                        Notas da obra para o público e músicos
                      </label>
                      <textarea
                        id="rep-desc"
                        rows={2}
                        value={repDesc}
                        onChange={(e) => setRepDesc(e.target.value)}
                        placeholder="Ex.: Execução solene com entrada de cordas e coro de metais."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                      />
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#44403C] mb-1.5">
                        Arquivo de áudio MP3 / WAV (bucket público — opcional)
                      </span>
                      <label
                        htmlFor="rep-audio"
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-dashed border-[#DCD3C4] bg-[#FBF9F5] hover:border-[#1E3A5F] cursor-pointer transition-colors"
                      >
                        <span className="text-xs sm:text-sm text-[#44403C] truncate">
                          {repAudioFile
                            ? `Selecionado: ${repAudioFile.name}`
                            : 'Clique aqui para escolher um arquivo de áudio (.mp3, .wav, .ogg)'}
                        </span>
                        <span className="px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-surface shrink-0 text-center">
                          Escolher Áudio
                        </span>
                        <input
                          id="rep-audio"
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setRepAudioFile(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-semibold rounded-2xl btn-raised-primary cursor-pointer disabled:opacity-60"
                      >
                        {loading ? 'Publicando...' : 'Publicar no Repertório Público'}
                      </button>
                    </div>
                  </form>
                )}

                {adminTab === 'upload' && (
                  <form
                    onSubmit={handleUploadPdf}
                    className="p-5 rounded-2xl bg-white border border-[#E7E0D3] space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="up-track" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Obra do Repertório
                        </label>
                        <select
                          id="up-track"
                          value={uploadTrackId}
                          onChange={(e) => setUploadTrackId(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        >
                          {tracks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.code} — {t.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="up-inst" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Instrumento
                        </label>
                        <select
                          id="up-inst"
                          value={uploadInstrument}
                          onChange={(e) => setUploadInstrument(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#DCD3C4] bg-[#FBF9F5]"
                        >
                          {NAIPES.map((naipe) => (
                            <optgroup key={naipe} label={naipe}>
                              {ORCHESTRA_INSTRUMENTS.filter((i) => i.naipe === naipe).map((inst) => (
                                <option key={inst.id} value={inst.name}>
                                  {inst.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-[#44403C] mb-1.5">
                        Arquivo PDF da Partitura (bucket privado)
                      </span>
                      <label
                        htmlFor="up-pdf"
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-dashed border-[#DCD3C4] bg-[#FBF9F5] hover:border-[#1E3A5F] cursor-pointer transition-colors"
                      >
                        <span className="text-xs sm:text-sm text-[#44403C] truncate">
                          {uploadFile
                            ? `Selecionado: ${uploadFile.name}`
                            : 'Clique aqui para selecionar o arquivo .pdf da partitura'}
                        </span>
                        <span className="px-3.5 py-2 text-xs font-semibold rounded-xl btn-raised-sm-surface shrink-0 text-center">
                          Escolher PDF
                        </span>
                        <input
                          id="up-pdf"
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-semibold rounded-2xl btn-raised-primary cursor-pointer disabled:opacity-60"
                      >
                        {loading ? 'Enviando...' : 'Salvar Partitura Privada'}
                      </button>
                    </div>
                  </form>
                )}

                {adminTab === 'deploy' && (
                  <div className="p-5 rounded-2xl bg-white border border-[#E7E0D3] text-sm text-[#44403C] space-y-3 leading-relaxed">
                    <p className="font-semibold text-[#1C1917]">
                      Passo a passo para publicar no GitHub Pages com Supabase:
                    </p>
                    <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
                      <li>
                        No painel do Supabase, crie uma organização e um projeto novo, depois abra <strong>SQL Editor</strong> e execute o arquivo <code className="font-mono-tabular">supabase/schema.sql</code> incluído neste repositório.
                      </li>
                      <li>
                        No repositório do GitHub (<code className="font-mono-tabular">orquestraevangelicadecuritiba-gif</code>), configure <strong>Settings → Pages → Source: GitHub Actions</strong>.
                      </li>
                      <li>
                        Em <strong>Settings → Secrets and variables → Actions</strong>, adicione a variável <code className="font-mono-tabular">VITE_SUPABASE_URL</code> e o segredo <code className="font-mono-tabular">VITE_SUPABASE_ANON_KEY</code>.
                      </li>
                      <li>
                        Após cadastrar o e-mail da coordenação no site, rode no SQL Editor: <code className="font-mono-tabular">update public.profiles set role = &apos;admin&apos;, access_status = &apos;approved&apos; where email = &apos;orquestraevangelicadecuritiba@gmail.com&apos;;</code>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
