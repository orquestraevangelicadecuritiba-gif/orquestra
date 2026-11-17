import { CheckCircle2, KeyRound, LockKeyhole, UserPlus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { NAIPES, ORCHESTRA_INSTRUMENTS } from '../data/orchestraCatalog';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { signInMusician, signUpMusician } from '../services/orchestraService';
import { MusicianProfile, Naipe } from '../types/orchestra';

interface MusicianRegistrationSectionProps {
  profile: MusicianProfile | null;
  onAuthenticated: (profile: MusicianProfile) => void;
  onOpenPortal: () => void;
}

export function MusicianRegistrationSection({
  profile,
  onAuthenticated,
  onOpenPortal,
}: MusicianRegistrationSectionProps) {
  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Campos de inscrição
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [instrument, setInstrument] = useState('Violino I');
  const [church, setChurch] = useState('');
  const [experienceYears, setExperienceYears] = useState('3 a 5 anos');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');

  // Campos de login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedInstrumentDef = ORCHESTRA_INSTRUMENTS.find((i) => i.name === instrument);
  const derivedNaipe: Naipe = selectedInstrumentDef?.naipe ?? 'Cordas';

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    const res = await signUpMusician({
      full_name: fullName,
      email,
      password,
      phone,
      instrument,
      naipe: derivedNaipe,
      church,
      experience_years: experienceYears,
      notes,
    });
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    if (res.requiresEmailConfirmation) {
      setSuccessMsg(
        'Inscrição enviada! Confirme seu e-mail para ativar sua conta. Após confirmação, a coordenação liberará o acesso às partituras.'
      );
      return;
    }

    if (res.profile) {
      onAuthenticated(res.profile);
      setSuccessMsg(
        'Inscrição recebida com sucesso! Seu cadastro está em análise e as partituras em PDF serão liberadas pela coordenação.'
      );
      setFullName('');
      setEmail('');
      setPhone('');
      setChurch('');
      setNotes('');
      setPassword('');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    const res = await signInMusician(loginEmail, loginPassword);
    setSubmitting(false);

    if (res.error || !res.profile) {
      setErrorMsg(res.error ?? 'Não foi possível entrar. Verifique seus dados.');
      return;
    }
    onAuthenticated(res.profile);
  };

  const quickFillDemo = (demoEmail: string, demoPass: string) => {
    setMode('login');
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <section id="inscricao" className="py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Coluna Esquerda: Orientações aos Músicos */}
          <div className="lg:col-span-5">
            <p className="text-xs font-medium tracking-widest uppercase text-[#78716C]">
              03. Participação &amp; Ingresso <span aria-hidden="true">·</span> Curitiba
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#1C1917] [text-wrap:balance]">
              Inscrição de Músicos Interessados
            </h2>
            <p className="mt-3 text-base text-[#44403C] leading-relaxed">
              Instrumentistas cristãos da Grande Curitiba que desejam servir com seu talento musical podem se inscrever abaixo. A mesma conta criada na inscrição servirá para baixar as partituras privadas quando seu acesso for liberado.
            </p>

            <ol className="mt-8 space-y-6 border-t border-[#E7E0D3] pt-6">
              <li>
                <p className="text-sm font-semibold text-[#1C1917]">
                  01. Cadastro e escolha do instrumento
                </p>
                <p className="mt-1 text-sm text-[#57534E]">
                  Informe seu instrumento, igreja de origem e nível de leitura de partitura.
                </p>
              </li>
              <li>
                <p className="text-sm font-semibold text-[#1C1917]">
                  02. Contato e ensaio de integração
                </p>
                <p className="mt-1 text-sm text-[#57534E]">
                  A regência entra em contato pelo WhatsApp para alinhar o ensaio presencial em Curitiba.
                </p>
              </li>
              <li>
                <p className="text-sm font-semibold text-[#1C1917]">
                  03. Liberação dos arquivos em PDF
                </p>
                <p className="mt-1 text-sm text-[#57534E]">
                  Com a participação confirmada, a coordenação libera seu usuário no Supabase e todas as partituras privadas ficam disponíveis.
                </p>
              </li>
            </ol>

            {!isSupabaseConfigured && (
              <div className="mt-8 p-5 rounded-3xl bg-[#F3EFE7] border border-[#DED6C8]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#785319]">
                  Ambiente de Demonstração Interativa
                </p>
                <p className="mt-1.5 text-xs text-[#57534E] leading-relaxed">
                  Conecte seu projeto Supabase no arquivo <code className="font-mono-tabular">.env</code> para persistência em nuvem. Para testar os níveis de permissão agora, preencha um dos perfis abaixo:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => quickFillDemo('helena.violino@exemplo.com.br', 'violino123')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl btn-raised-sm-surface cursor-pointer"
                  >
                    Músico Liberado
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFillDemo('lucas.trompete@exemplo.com.br', 'trompete123')}
                    className="px-3 py-1.5 text-xs font-medium rounded-xl btn-raised-sm-surface cursor-pointer"
                  >
                    Músico Pendente
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      quickFillDemo('orquestraevangelicadecuritiba@gmail.com', 'curitiba2026')
                    }
                    className="px-3 py-1.5 text-xs font-medium rounded-xl btn-raised-sm-primary cursor-pointer"
                  >
                    Coordenação (Admin)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita: Cartão de Formulário Arredondado com Botões em Alto Relevo */}
          <div className="lg:col-span-7">
            <div className="card-elevated rounded-3xl p-6 sm:p-8">
              {profile ? (
                <div className="py-6 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-[#EFF6F1] border border-[#BFE0C9] text-[#14532D] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold text-[#1C1917]">
                    Sessão ativa: {profile.full_name}
                  </h3>
                  <p className="mt-2 text-sm text-[#57534E]">
                    Instrumento: <strong>{profile.instrument}</strong> ({profile.naipe})
                    <br />
                    Situação do acervo:{' '}
                    <strong>
                      {profile.access_status === 'approved' || profile.role === 'admin'
                        ? 'Acesso Liberado aos PDFs'
                        : profile.access_status === 'pending'
                        ? 'Aguardando Liberação da Coordenação'
                        : 'Acesso Suspenso'}
                    </strong>
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onOpenPortal}
                      className="px-5 py-3 text-sm font-semibold rounded-2xl btn-raised-primary cursor-pointer"
                    >
                      Abrir Área do Músico
                    </button>
                    <a
                      href="#partituras"
                      className="px-5 py-3 text-sm font-semibold rounded-2xl btn-raised-surface cursor-pointer"
                    >
                      Ir para Partituras
                    </a>
                  </div>
                </div>
              ) : (
                <>
                  {/* Alternância Nova Inscrição / Entrar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#EBE6DF]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setErrorMsg(null);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${
                          mode === 'register' ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                        }`}
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Nova Inscrição</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMsg(null);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl cursor-pointer ${
                          mode === 'login' ? 'btn-raised-sm-primary' : 'btn-raised-sm-surface'
                        }`}
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Já sou Inscrito</span>
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="mt-5 px-4 py-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
                    >
                      {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div
                      role="status"
                      className="mt-5 px-4 py-3 rounded-2xl bg-[#EFF6F1] border border-[#BFE0C9] text-sm text-[#14532D]"
                    >
                      {successMsg}
                    </div>
                  )}

                  {mode === 'register' ? (
                    <form onSubmit={handleRegister} className="mt-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reg-name" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            Nome completo *
                          </label>
                          <input
                            id="reg-name"
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ex.: Gabriel Almeida"
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          />
                        </div>

                        <div>
                          <label htmlFor="reg-email" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            E-mail *
                          </label>
                          <input
                            id="reg-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu.email@exemplo.com"
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reg-phone" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            WhatsApp (Curitiba / Região) *
                          </label>
                          <input
                            id="reg-phone"
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(41) 99999-0000"
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          />
                        </div>

                        <div>
                          <label htmlFor="reg-instrument" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            Instrumento principal *
                          </label>
                          <select
                            id="reg-instrument"
                            value={instrument}
                            onChange={(e) => setInstrument(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reg-church" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            Igreja / Congregação *
                          </label>
                          <input
                            id="reg-church"
                            type="text"
                            required
                            value={church}
                            onChange={(e) => setChurch(e.target.value)}
                            placeholder="Nome da igreja em Curitiba"
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          />
                        </div>

                        <div>
                          <label htmlFor="reg-exp" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            Tempo de prática e leitura
                          </label>
                          <select
                            id="reg-exp"
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          >
                            <option value="1 a 2 anos">1 a 2 anos (leitura básica)</option>
                            <option value="3 a 5 anos">3 a 5 anos (leitura intermediária)</option>
                            <option value="6 a 10 anos">6 a 10 anos (experiência orquestral)</option>
                            <option value="10+ anos">Mais de 10 anos (avançado)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="reg-pass" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            Senha de acesso às partituras *
                          </label>
                          <input
                            id="reg-pass"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo de 6 caracteres"
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          />
                        </div>

                        <div>
                          <label htmlFor="reg-notes" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                            Observações (opcional)
                          </label>
                          <input
                            id="reg-notes"
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex.: Leio clave de fá e sol"
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <p className="text-xs text-[#78716C]">
                          Naipe selecionado: <strong className="text-[#1C1917]">{derivedNaipe}</strong>
                        </p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm sm:text-base font-semibold rounded-2xl btn-raised-primary whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>{submitting ? 'Enviando inscrição...' : 'Enviar Inscrição'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className="mt-6 space-y-5">
                      <div>
                        <label htmlFor="login-email" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          E-mail cadastrado
                        </label>
                        <input
                          id="login-email"
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                        />
                      </div>

                      <div>
                        <label htmlFor="login-password" className="block text-xs font-semibold text-[#44403C] mb-1.5">
                          Senha
                        </label>
                        <input
                          id="login-password"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Sua senha"
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-[#DCD3C4] bg-[#FBF9F5] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm sm:text-base font-semibold rounded-2xl btn-raised-primary whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          <LockKeyhole className="w-4 h-4" />
                          <span>{submitting ? 'Verificando...' : 'Entrar na Área do Músico'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
