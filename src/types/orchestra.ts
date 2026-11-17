export type Naipe = 'Cordas' | 'Madeiras' | 'Metais' | 'Percussão & Base';

export type AccessStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'musician' | 'admin';

export interface InstrumentDefinition {
  id: string;
  name: string;
  naipe: Naipe;
  clef: string;
  transposition: string;
  standNote: string;
}

export interface MusicianProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  instrument: string;
  naipe: Naipe;
  church: string;
  experience_years: string;
  notes?: string;
  access_status: AccessStatus;
  role: UserRole;
  created_at: string;
}

export interface RepertoireTrack {
  id: string;
  code: string;
  title: string;
  composer: string;
  arranger: string;
  category: 'Hinos Clássicos' | 'Louvor Sinfônico' | 'Suíte Orquestral';
  key_signature: string;
  tempo_bpm: number;
  duration_seconds: number;
  audio_url?: string | null;
  description: string;
  is_public: boolean;
  sort_order: number;
  melody_notes?: number[];
}

export interface SheetMusicPart {
  id: string;
  repertoire_id: string;
  instrument: string;
  naipe: Naipe;
  part_label: string;
  file_path: string;
  pages_count: number;
  updated_at?: string;
}
