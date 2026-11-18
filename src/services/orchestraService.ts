import { INITIAL_REPERTOIRE, INITIAL_SHEET_MUSIC, ORCHESTRA_INSTRUMENTS } from '../data/orchestraCatalog';
import { generateAuthorizedSheetPdfBlob } from '../lib/pdfGenerator';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { AccessStatus, MusicianProfile, Naipe, RepertoireTrack, SheetMusicPart } from '../types/orchestra';

const STORAGE_KEYS = {
  PROFILES: 'oec_local_profiles_v1',
  SESSION_USER_ID: 'oec_local_session_uid_v1',
  REPERTOIRE: 'oec_local_repertoire_v1',
  SHEETS: 'oec_local_sheets_v1',
  PASSWORDS: 'oec_local_passwords_v1',
};

const localUploadedPdfFiles = new Map<string, File>();

const SEED_LOCAL_PROFILES: MusicianProfile[] = [
  {
    id: 'local-admin-maestro',
    full_name: 'Coordenação & Regência OEC',
    email: 'orquestraevangelicadecuritiba@gmail.com',
    phone: '(41) 99900-1000',
    instrument: 'Grade Completa (Regência)',
    naipe: 'Percussão & Base',
    church: 'Sede Central Curitiba',
    experience_years: '15+ anos',
    notes: 'Regência titular e gestão do acervo de partituras.',
    access_status: 'approved',
    role: 'admin',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'local-member-approved',
    full_name: 'Helena Oliveira',
    email: 'helena.violino@exemplo.com.br',
    phone: '(41) 99812-3344',
    instrument: 'Violino I',
    naipe: 'Cordas',
    church: 'Igreja Batista do Batel',
    experience_years: '6 a 10 anos',
    notes: 'Spalla auxiliar — acesso liberado.',
    access_status: 'approved',
    role: 'musician',
    created_at: '2026-09-10T14:20:00Z',
  },
  {
    id: 'local-member-pending',
    full_name: 'Lucas Ferreira',
    email: 'lucas.trompete@exemplo.com.br',
    phone: '(41) 99744-8811',
    instrument: 'Trompete Bb',
    naipe: 'Metais',
    church: 'Assembleia de Deus Vila Guaíra',
    experience_years: '3 a 5 anos',
    notes: 'Aguardando confirmação após primeiro ensaio.',
    access_status: 'pending',
    role: 'musician',
    created_at: '2026-11-12T18:45:00Z',
  },
];

const memoryFallbackStorage = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallbackStorage.get(key) ?? null;
  }
}

function safeSetItem(key: string, value: string): void {
  memoryFallbackStorage.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore SecurityError inside restricted iframes; memoryFallbackStorage holds session state
  }
}

function safeRemoveItem(key: string): void {
  memoryFallbackStorage.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore SecurityError
  }
}

const DEFAULT_DEMO_PASSWORDS: Record<string, string> = {
  'orquestraevangelicadecuritiba@gmail.com': 'curitiba2026',
  'helena.violino@exemplo.com.br': 'violino123',
  'lucas.trompete@exemplo.com.br': 'trompete123',
};

function getLocalProfiles(): MusicianProfile[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_LOCAL_PROFILES));
      safeSetItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(DEFAULT_DEMO_PASSWORDS));
      return SEED_LOCAL_PROFILES;
    }
    return JSON.parse(raw) as MusicianProfile[];
  } catch {
    return SEED_LOCAL_PROFILES;
  }
}

function saveLocalProfiles(profiles: MusicianProfile[]) {
  safeSetItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

function getLocalPasswords(): Record<string, string> {
  try {
    const raw = safeGetItem(STORAGE_KEYS.PASSWORDS);
    if (!raw) {
      safeSetItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(DEFAULT_DEMO_PASSWORDS));
      return DEFAULT_DEMO_PASSWORDS;
    }
    return { ...DEFAULT_DEMO_PASSWORDS, ...(JSON.parse(raw) as Record<string, string>) };
  } catch {
    return DEFAULT_DEMO_PASSWORDS;
  }
}

export interface RegisterMusicianPayload {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  instrument: string;
  naipe: Naipe;
  church: string;
  experience_years: string;
  notes?: string;
}

export interface AuthResult {
  profile: MusicianProfile | null;
  requiresEmailConfirmation?: boolean;
  error?: string;
}

export async function getCurrentSessionProfile(): Promise<MusicianProfile | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .maybeSingle();
    return (profile as MusicianProfile | null) ?? null;
  }

  const uid = safeGetItem(STORAGE_KEYS.SESSION_USER_ID);
  if (!uid) return null;
  const profiles = getLocalProfiles();
  return profiles.find((p) => p.id === uid) ?? null;
}

export async function signUpMusician(payload: RegisterMusicianPayload): Promise<AuthResult> {
  const emailNorm = payload.email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password: payload.password,
      options: {
        data: {
          full_name: payload.full_name.trim(),
          phone: payload.phone.trim(),
          instrument: payload.instrument,
          naipe: payload.naipe,
          church: payload.church.trim(),
          experience_years: payload.experience_years,
          notes: payload.notes?.trim() ?? '',
        },
      },
    });

    if (error) {
      return { profile: null, error: error.message };
    }

    if (!data.session) {
      return { profile: null, requiresEmailConfirmation: true };
    }

    // Aguardar brevemente o trigger criar o perfil
    await new Promise((r) => setTimeout(r, 350));
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    return { profile: (profile as MusicianProfile | null) ?? null };
  }

  // Modo demonstração local (espelha exatamente o fluxo do Supabase)
  const profiles = getLocalProfiles();
  if (profiles.some((p) => p.email.toLowerCase() === emailNorm)) {
    return { profile: null, error: 'Este e-mail já possui inscrição cadastrada. Faça login na Área do Músico.' };
  }

  const newProfile: MusicianProfile = {
    id: `local-${Date.now()}`,
    full_name: payload.full_name.trim(),
    email: emailNorm,
    phone: payload.phone.trim(),
    instrument: payload.instrument,
    naipe: payload.naipe,
    church: payload.church.trim(),
    experience_years: payload.experience_years,
    notes: payload.notes?.trim(),
    access_status: 'pending',
    role: 'musician',
    created_at: new Date().toISOString(),
  };

  profiles.unshift(newProfile);
  saveLocalProfiles(profiles);

  const passwords = getLocalPasswords();
  passwords[emailNorm] = payload.password;
  safeSetItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
  safeSetItem(STORAGE_KEYS.SESSION_USER_ID, newProfile.id);

  return { profile: newProfile };
}

export async function signInMusician(email: string, password: string): Promise<AuthResult> {
  const emailNorm = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password,
    });
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('email not confirmed')) {
        return {
          profile: null,
          error:
            'Seu e-mail ainda não está confirmado no Supabase. Confirme pelo link enviado no seu e-mail ou clique em "Confirm user" em Authentication → Users no painel do Supabase.',
        };
      }
      return {
        profile: null,
        error: `E-mail ou senha inválidos no Supabase (${error.message}). Verifique se a senha é a mesma definida no seu projeto Supabase.`,
      };
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      return {
        profile: null,
        error:
          'Login confirmado no Supabase, mas seu perfil ainda não foi criado na tabela public.profiles. Execute o SQL no SQL Editor do Supabase.',
      };
    }

    return { profile: profile as MusicianProfile };
  }

  const profiles = getLocalProfiles();
  const passwords = getLocalPasswords();
  const found = profiles.find((p) => p.email.toLowerCase() === emailNorm);
  if (!found || passwords[emailNorm] !== password) {
    if (emailNorm === 'orquestraevangelicadecuritiba@gmail.com') {
      return {
        profile: null,
        error:
          'Este ambiente de pré-visualização ainda não está ligado ao seu Supabase. Clique no botão "Entrar como Coordenação" abaixo (1 clique) para abrir o painel de envio.',
      };
    }
    return { profile: null, error: 'E-mail ou senha inválidos.' };
  }

  safeSetItem(STORAGE_KEYS.SESSION_USER_ID, found.id);
  return { profile: found };
}

export async function signOutMusician(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    return;
  }
  safeRemoveItem(STORAGE_KEYS.SESSION_USER_ID);
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const emailNorm = email.trim().toLowerCase();
  if (!emailNorm) {
    return { ok: false, error: 'Informe o seu e-mail para recuperar a senha.' };
  }

  if (isSupabaseConfigured && supabase) {
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.resetPasswordForEmail(emailNorm, { redirectTo });
    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.status === 429) {
        return {
          ok: false,
          error:
            'Limite temporário de envio de e-mails do Supabase atingido (aguarde alguns minutos ou defina a senha diretamente pelo SQL Editor do Supabase).',
        };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  return {
    ok: false,
    error: 'No modo de demonstração local, use o botão de acesso com 1 clique abaixo.',
  };
}

export async function updateUserPassword(
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.length < 6) {
    return { ok: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  return { ok: true };
}

export function signInLocalDemoAccount(
  target: 'admin' | 'approved' | 'pending'
): MusicianProfile {
  const profiles = getLocalProfiles();
  let match =
    target === 'admin'
      ? profiles.find((p) => p.role === 'admin')
      : target === 'approved'
      ? profiles.find((p) => p.role === 'musician' && p.access_status === 'approved')
      : profiles.find((p) => p.role === 'musician' && p.access_status === 'pending');

  if (!match) {
    const seed =
      target === 'admin'
        ? SEED_LOCAL_PROFILES[0]
        : target === 'approved'
        ? SEED_LOCAL_PROFILES[1]
        : SEED_LOCAL_PROFILES[2];
    profiles.unshift(seed);
    saveLocalProfiles(profiles);
    match = seed;
  }

  safeSetItem(STORAGE_KEYS.SESSION_USER_ID, match.id);
  return match;
}

export async function fetchPublicRepertoire(): Promise<RepertoireTrack[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('repertoire')
      .select('*')
      .eq('is_public', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((row, index) => ({
        ...(row as RepertoireTrack),
        melody_notes: INITIAL_REPERTOIRE[index % INITIAL_REPERTOIRE.length]?.melody_notes,
      }));
    }
  }

  const raw = safeGetItem(STORAGE_KEYS.REPERTOIRE);
  if (raw) {
    try {
      return JSON.parse(raw) as RepertoireTrack[];
    } catch {
      // ignore
    }
  }
  return INITIAL_REPERTOIRE;
}

export async function fetchSheetMusicArchive(profile: MusicianProfile | null): Promise<SheetMusicPart[]> {
  const isAuthorized = Boolean(profile && (profile.access_status === 'approved' || profile.role === 'admin'));

  if (isSupabaseConfigured && supabase) {
    if (!isAuthorized) {
      // Usuário sem permissão não recebe registros da tabela protegida por RLS
      return INITIAL_SHEET_MUSIC;
    }
    const { data, error } = await supabase.from('sheet_music').select('*').order('part_label', { ascending: true });
    if (!error && data && data.length > 0) {
      return data as SheetMusicPart[];
    }
  }

  const raw = safeGetItem(STORAGE_KEYS.SHEETS);
  if (raw) {
    try {
      return JSON.parse(raw) as SheetMusicPart[];
    } catch {
      // ignore
    }
  }
  return INITIAL_SHEET_MUSIC;
}

export async function downloadPrivateSheetPdf(
  part: SheetMusicPart,
  track: RepertoireTrack,
  profile: MusicianProfile | null
): Promise<{ url?: string; error?: string; isGeneratedFallback?: boolean }> {
  if (!profile) {
    return { error: 'Faça login na Área do Músico para acessar as partituras privadas.' };
  }
  if (profile.access_status !== 'approved' && profile.role !== 'admin') {
    return {
      error: 'Seu acesso às partituras ainda aguarda liberação pela coordenação da orquestra.',
    };
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.storage
      .from('partituras')
      .createSignedUrl(part.file_path, 180);

    if (!error && data?.signedUrl) {
      return { url: data.signedUrl };
    }
  }

  const localFile = localUploadedPdfFiles.get(part.file_path);
  if (localFile) {
    return { url: URL.createObjectURL(localFile) };
  }

  // Gera o PDF real da partitura quando o bucket ainda não possui o arquivo binário enviado
  const instrumentInfo = ORCHESTRA_INSTRUMENTS.find((i) => i.name === part.instrument);
  const blob = generateAuthorizedSheetPdfBlob(track, part, instrumentInfo, profile.full_name);
  const objectUrl = URL.createObjectURL(blob);
  return { url: objectUrl, isGeneratedFallback: true };
}

// ============================================================================
// Funções exclusivas da Coordenação (Admin)
// ============================================================================
export async function listAllMusicians(): Promise<MusicianProfile[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      return data as MusicianProfile[];
    }
    return [];
  }
  return getLocalProfiles();
}

export async function updateMusicianAccessStatus(
  musicianId: string,
  status: AccessStatus
): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('profiles')
      .update({ access_status: status, updated_at: new Date().toISOString() })
      .eq('id', musicianId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  const profiles = getLocalProfiles().map((p) =>
    p.id === musicianId ? { ...p, access_status: status } : p
  );
  saveLocalProfiles(profiles);
  return { ok: true };
}

export async function uploadPrivateSheetPdf(
  repertoireId: string,
  instrument: string,
  naipe: Naipe,
  file: File
): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseConfigured && supabase) {
    const safeName = `${repertoireId}/${instrument.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from('partituras')
      .upload(safeName, file, { contentType: 'application/pdf', upsert: true });

    if (uploadErr) {
      return { ok: false, error: uploadErr.message };
    }

    const { error: insertErr } = await supabase.from('sheet_music').insert({
      repertoire_id: repertoireId,
      instrument,
      naipe,
      part_label: `${instrument} — ${file.name.replace(/\.pdf$/i, '')}`,
      file_path: safeName,
      pages_count: 2,
    });

    if (insertErr) {
      return { ok: false, error: insertErr.message };
    }
    return { ok: true };
  }

  const current = await fetchSheetMusicArchive({
    id: 'admin',
    full_name: 'Admin',
    email: '',
    phone: '',
    instrument: '',
    naipe: 'Cordas',
    church: '',
    experience_years: '',
    access_status: 'approved',
    role: 'admin',
    created_at: '',
  });
  const localPath = `local/${Date.now()}-${file.name}`;
  localUploadedPdfFiles.set(localPath, file);

  const newPart: SheetMusicPart = {
    id: `part-custom-${Date.now()}`,
    repertoire_id: repertoireId,
    instrument,
    naipe,
    part_label: `${instrument} — ${file.name.replace(/\.pdf$/i, '')}`,
    file_path: localPath,
    pages_count: 2,
    updated_at: new Date().toISOString().slice(0, 10),
  };
  safeSetItem(STORAGE_KEYS.SHEETS, JSON.stringify([newPart, ...current]));
  return { ok: true };
}

export interface AddRepertoirePayload {
  code: string;
  title: string;
  composer: string;
  arranger: string;
  category: RepertoireTrack['category'];
  key_signature: string;
  tempo_bpm: number;
  duration_seconds: number;
  description: string;
  audioFile?: File | null;
}

export async function addRepertoireTrack(
  payload: AddRepertoirePayload
): Promise<{ ok: boolean; error?: string }> {
  const cleanCode = payload.code.trim().toUpperCase();

  if (isSupabaseConfigured && supabase) {
    let publicAudioUrl: string | null = null;

    if (payload.audioFile) {
      const ext = payload.audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
      const storagePath = `${cleanCode.toLowerCase()}-${Date.now()}.${ext}`;
      const { error: audioErr } = await supabase.storage
        .from('audios')
        .upload(storagePath, payload.audioFile, {
          contentType: payload.audioFile.type || 'audio/mpeg',
          upsert: true,
        });

      if (audioErr) {
        return { ok: false, error: `Erro ao enviar áudio: ${audioErr.message}` };
      }

      const { data: pubData } = supabase.storage.from('audios').getPublicUrl(storagePath);
      publicAudioUrl = pubData.publicUrl;
    }

    const { error: insertErr } = await supabase.from('repertoire').insert({
      code: cleanCode,
      title: payload.title.trim(),
      composer: payload.composer.trim(),
      arranger: payload.arranger.trim(),
      category: payload.category,
      key_signature: payload.key_signature.trim(),
      tempo_bpm: payload.tempo_bpm,
      duration_seconds: payload.duration_seconds,
      audio_url: publicAudioUrl,
      description: payload.description.trim(),
      is_public: true,
      sort_order: 99,
    });

    if (insertErr) {
      return { ok: false, error: insertErr.message };
    }
    return { ok: true };
  }

  // Modo demonstração local
  const current = await fetchPublicRepertoire();
  const localAudioUrl = payload.audioFile ? URL.createObjectURL(payload.audioFile) : null;
  const newTrack: RepertoireTrack = {
    id: `rep-${Date.now()}`,
    code: cleanCode,
    title: payload.title.trim(),
    composer: payload.composer.trim(),
    arranger: payload.arranger.trim(),
    category: payload.category,
    key_signature: payload.key_signature.trim(),
    tempo_bpm: payload.tempo_bpm,
    duration_seconds: payload.duration_seconds,
    audio_url: localAudioUrl,
    description: payload.description.trim(),
    is_public: true,
    sort_order: current.length + 1,
    melody_notes: INITIAL_REPERTOIRE[0]?.melody_notes,
  };
  safeSetItem(STORAGE_KEYS.REPERTOIRE, JSON.stringify([...current, newTrack]));
  return { ok: true };
}

