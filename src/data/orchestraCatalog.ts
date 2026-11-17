import { InstrumentDefinition, Naipe, RepertoireTrack, SheetMusicPart } from '../types/orchestra';

export const NAIPES: Naipe[] = ['Cordas', 'Madeiras', 'Metais', 'Percussão & Base'];

export const ORCHESTRA_INSTRUMENTS: InstrumentDefinition[] = [
  { id: 'violino-1', name: 'Violino I', naipe: 'Cordas', clef: 'Clave de Sol', transposition: 'Em Dó (C)', standNote: 'Linha melódica principal e divisi agudo' },
  { id: 'violino-2', name: 'Violino II', naipe: 'Cordas', clef: 'Clave de Sol', transposition: 'Em Dó (C)', standNote: 'Harmonia central e contracantos rítmicos' },
  { id: 'viola', name: 'Viola', naipe: 'Cordas', clef: 'Clave de Dó (3ª linha)', transposition: 'Em Dó (C)', standNote: 'Preenchimento médio-grave do naipe' },
  { id: 'violoncelo', name: 'Violoncelo', naipe: 'Cordas', clef: 'Clave de Fá / Tenor', transposition: 'Em Dó (C)', standNote: 'Baixo harmônico e solos cantabile' },
  { id: 'contrabaixo', name: 'Contrabaixo', naipe: 'Cordas', clef: 'Clave de Fá', transposition: 'Soa oitava abaixo', standNote: 'Sustentação grave e pizzicato de base' },

  { id: 'flauta', name: 'Flauta Transversal', naipe: 'Madeiras', clef: 'Clave de Sol', transposition: 'Em Dó (C)', standNote: 'Flauta I / II e ornamentos agudos' },
  { id: 'oboe', name: 'Oboé', naipe: 'Madeiras', clef: 'Clave de Sol', transposition: 'Em Dó (C)', standNote: 'Solos pastorais e afinação Lá 440Hz' },
  { id: 'clarinete-bb', name: 'Clarinete Bb', naipe: 'Madeiras', clef: 'Clave de Sol', transposition: 'Em Si Bemol (Bb)', standNote: 'Clarinete I / II com transposição em Bb' },
  { id: 'sax-alto', name: 'Saxofone Alto Eb', naipe: 'Madeiras', clef: 'Clave de Sol', transposition: 'Em Mi Bemol (Eb)', standNote: 'Dobra harmônica e contraponto lírico' },
  { id: 'sax-tenor', name: 'Saxofone Tenor Bb', naipe: 'Madeiras', clef: 'Clave de Sol', transposition: 'Em Si Bemol (Bb)', standNote: 'Corpo médio-grave das madeiras' },
  { id: 'fagote', name: 'Fagote', naipe: 'Madeiras', clef: 'Clave de Fá', transposition: 'Em Dó (C)', standNote: 'Fundação grave das madeiras' },

  { id: 'trompete-bb', name: 'Trompete Bb', naipe: 'Metais', clef: 'Clave de Sol', transposition: 'Em Si Bemol (Bb)', standNote: 'Trompete I / II para fanfarras e tutti' },
  { id: 'trompa-f', name: 'Trompa em F', naipe: 'Metais', clef: 'Clave de Sol', transposition: 'Em Fá (F)', standNote: 'Trompa I / II — ponte entre madeiras e metais' },
  { id: 'trombone', name: 'Trombone Tenor / Baixo', naipe: 'Metais', clef: 'Clave de Fá', transposition: 'Em Dó (C)', standNote: 'Trombone I / II / III em coral harmônico' },
  { id: 'tuba', name: 'Tuba / Bombardino', naipe: 'Metais', clef: 'Clave de Fá', transposition: 'Em Dó (C)', standNote: 'Base acústica solene dos metais' },

  { id: 'timpanos', name: 'Tímpanos & Percussão', naipe: 'Percussão & Base', clef: 'Clave de Fá / Rítmica', transposition: 'Afinação sinfônica', standNote: 'Tímpanos, pratos sinfônicos e caixa' },
  { id: 'piano', name: 'Piano / Teclado & Grade', naipe: 'Percussão & Base', clef: 'Clave de Sol e Fá', transposition: 'Em Dó (C)', standNote: 'Redução orquestral e acompanhamento' },
];

export const INITIAL_REPERTOIRE: RepertoireTrack[] = [
  {
    id: 'rep-oec-01',
    code: 'OEC-01',
    title: 'Grandioso És Tu (How Great Thou Art)',
    composer: 'Carl Boberg · Stuart K. Hine',
    arranger: 'Arr. Orquestra Evangélica de Curitiba',
    category: 'Hinos Clássicos',
    key_signature: 'Sib Maior',
    tempo_bpm: 72,
    duration_seconds: 184,
    description:
      'Abertura contemplativa em cordas graves, exposição do tema nas madeiras e entrada triunfal de trompas e trompetes no refrão final.',
    is_public: true,
    sort_order: 1,
    // Sib Maior hymnal motif (frequencies in Hz)
    melody_notes: [293.66, 293.66, 293.66, 233.08, 293.66, 293.66, 349.23, 392.0, 349.23, 293.66, 261.63, 233.08, 293.66, 349.23, 466.16, 440.0],
  },
  {
    id: 'rep-oec-02',
    code: 'OEC-02',
    title: 'Castelo Forte é Nosso Deus',
    composer: 'Martinho Lutero',
    arranger: 'Arr. Coral Sinfônico OEC',
    category: 'Hinos Clássicos',
    key_signature: 'Dó Maior',
    tempo_bpm: 84,
    duration_seconds: 156,
    description:
      'Coral clássico reformado com polifonia inspirada na tradição barroca, destacando contraponto de violoncelos, fagote e naipe de metais.',
    is_public: true,
    sort_order: 2,
    // C Major choral motif
    melody_notes: [523.25, 523.25, 523.25, 392.0, 440.0, 493.88, 523.25, 440.0, 392.0, 523.25, 493.88, 440.0, 392.0, 440.0, 349.23, 329.63],
  },
  {
    id: 'rep-oec-03',
    code: 'OEC-03',
    title: 'Quão Grande é o Meu Deus',
    composer: 'Chris Tomlin · Ed Cash',
    arranger: 'Arr. Sinfônico Curitiba',
    category: 'Louvor Sinfônico',
    key_signature: 'Sol Maior',
    tempo_bpm: 76,
    duration_seconds: 210,
    description:
      'Construção dinâmica progressiva com ostinato de violinos II e viola, linha aérea de flauta transversal e ponte orquestral em tutti.',
    is_public: true,
    sort_order: 3,
    // G Major majestic motif
    melody_notes: [392.0, 440.0, 493.88, 587.33, 493.88, 440.0, 392.0, 329.63, 392.0, 440.0, 493.88, 659.25, 587.33, 493.88, 440.0, 392.0],
  },
  {
    id: 'rep-oec-04',
    code: 'OEC-04',
    title: 'Santo, Santo, Santo (Nicaea)',
    composer: 'John Bacchus Dykes',
    arranger: 'Arr. Câmara de Curitiba',
    category: 'Suíte Orquestral',
    key_signature: 'Mi Bemol Maior',
    tempo_bpm: 88,
    duration_seconds: 168,
    description:
      'Prelúdio de culto com diálogo antifonal entre fanfarra de metais e cordas em legato, encerrando com acorde sustentado em Mi bemol.',
    is_public: true,
    sort_order: 4,
    // Eb Major solemn motif
    melody_notes: [311.13, 311.13, 392.0, 392.0, 466.16, 466.16, 523.25, 466.16, 415.30, 392.0, 349.23, 311.13, 392.0, 466.16, 622.25, 587.33],
  },
  {
    id: 'rep-oec-05',
    code: 'OEC-05',
    title: 'Abertura Curitibana de Louvor (Suíte)',
    composer: 'Composição Original OEC',
    arranger: 'Orquestra Evangélica de Curitiba',
    category: 'Suíte Orquestral',
    key_signature: 'Ré Maior',
    tempo_bpm: 96,
    duration_seconds: 242,
    description:
      'Suíte em três breves movimentos reunindo temas tradicionais da igreja evangélica paranaense, com solos de oboé e trompa.',
    is_public: true,
    sort_order: 5,
    // D Major bright overture motif
    melody_notes: [293.66, 369.99, 440.0, 587.33, 554.37, 493.88, 440.0, 369.99, 392.0, 440.0, 493.88, 587.33, 659.25, 587.33, 440.0, 587.33],
  },
  {
    id: 'rep-oec-06',
    code: 'OEC-06',
    title: 'Maravilhosa Graça (Amazing Grace)',
    composer: 'John Newton · William Walker',
    arranger: 'Arr. Cordas & Madeiras OEC',
    category: 'Louvor Sinfônico',
    key_signature: 'Fá Maior',
    tempo_bpm: 68,
    duration_seconds: 192,
    description:
      'Compasso ternário expressivo iniciado por violoncelo solo e clarinete em Bb, modulando um tom acima na estrofe final.',
    is_public: true,
    sort_order: 6,
    // F Major 3/4 expressive motif
    melody_notes: [261.63, 349.23, 440.0, 349.23, 440.0, 392.0, 349.23, 293.66, 261.63, 349.23, 440.0, 349.23, 440.0, 392.0, 523.25, 698.46],
  },
];

// Gera a matriz de partituras privadas por obra e instrumento
export const INITIAL_SHEET_MUSIC: SheetMusicPart[] = INITIAL_REPERTOIRE.flatMap((track, trackIdx) =>
  ORCHESTRA_INSTRUMENTS.map((inst, instIdx) => ({
    id: `part-${track.code.toLowerCase()}-${inst.id}`,
    repertoire_id: track.id,
    instrument: inst.name,
    naipe: inst.naipe,
    part_label: `${track.code} — ${inst.name}`,
    file_path: `${track.code.toLowerCase()}/${inst.id}.pdf`,
    pages_count: inst.id === 'piano' ? 6 : 2 + ((trackIdx + instIdx) % 3),
    updated_at: '2026-11-10',
  }))
);
