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

const SEED_LOCAL_PROFILES: MusicianProfile[] = [
  {
    id: 'local-admin-maestro',
    full_name: 'Coordenação & Regência OEC',
    email: 'orquestraevangelicadecuritiba@gmail.com',
    phone: '(41) 99900-1000',
    instrument: 'Piano / Teclado & Grade',
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

function getLocalProfiles(): MusicianProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_LOCAL_PROFILES));
      localStorage.setItem(
        STORAGE_KEYS.PASSWORDS,
        JSON.stringify({
          'orquestraevangelicadecuritiba@gmail.com': 'curitiba2026',
          'helena.violino@exemplo.com.br': 'violino123',
          'lucas.trompete@exemplo.com.br': 'trompete123',
        })
      );
      return SEED_LOCAL_PROFILES;
    }
    return JSON.parse(raw) as MusicianProfile[];
  } catch {
    return SEED_LOCAL_PROFILES;
  }
}

function saveLocalProfiles(profiles: MusicianProfile[]) {
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
}

function getLocalPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
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
      .single();
    return (profile as MusicianProfile | null) ?? null;
  }

  const uid = localStorage.getItem(STORAGE_KEYS.SESSION_USER_ID);
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
  localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
  localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, newProfile.id);

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
      return { profile: null, error: 'E-mail ou senha inválidos.' };
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    return { profile: (profile as MusicianProfile | null) ?? null };
  }

  const profiles = getLocalProfiles();
  const passwords = getLocalPasswords();
  const found = profiles.find((p) => p.email.toLowerCase() === emailNorm);
  if (!found || passwords[emailNorm] !== password) {
    return { profile: null, error: 'E-mail ou senha inválidos.' };
  }

  localStorage.setItem(STORAGE_KEYS.SESSION_USER_ID, found.id);
  return { profile: found };
}

export async function signOutMusician(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.SESSION_USER_ID);
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

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPERTOIRE);
    if (raw) {
      return JSON.parse(raw) as RepertoireTrack[];
    }
  } catch {
    // ignore
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

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEETS);
    if (raw) {
      return JSON.parse(raw) as SheetMusicPart[];
    }
  } catch {
    // ignore
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
  const newPart: SheetMusicPart = {
    id: `part-custom-${Date.now()}`,
    repertoire_id: repertoireId,
    instrument,
    naipe,
    part_label: `${instrument} — ${file.name.replace(/\.pdf$/i, '')}`,
    file_path: `local/${file.name}`,
    pages_count: 2,
    updated_at: new Date().toISOString().slice(0, 10),
  };
  localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify([newPart, ...current]));
  return { ok: true };
}
