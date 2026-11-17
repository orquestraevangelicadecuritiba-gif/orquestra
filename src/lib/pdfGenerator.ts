import { InstrumentDefinition, RepertoireTrack, SheetMusicPart } from '../types/orchestra';

function escapePdfText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Gera um PDF 1.4 válido e imprimível da partitura do instrumento
 * exclusivamente para participantes autorizados quando o arquivo ainda
 * utiliza o acervo demonstrativo ou como espelho de conferência.
 */
export function generateAuthorizedSheetPdfBlob(
  track: RepertoireTrack,
  part: SheetMusicPart,
  instrumentInfo?: InstrumentDefinition,
  participantName?: string
): Blob {
  const safeTitle = escapePdfText(track.title);
  const safeComposer = escapePdfText(`${track.composer} | ${track.arranger}`);
  const safeInstrument = escapePdfText(part.instrument.toUpperCase());
  const safeClef = escapePdfText(instrumentInfo?.clef ?? 'Clave Padrão');
  const safeTransp = escapePdfText(instrumentInfo?.transposition ?? 'Em Dó');
  const safeKey = escapePdfText(track.key_signature);
  const safeMember = escapePdfText(participantName || 'Participante Autorizado');

  const lines: string[] = [];

  // Header & Orchestra Branding
  lines.push('BT');
  lines.push('/F2 10 Tf');
  lines.push('54 756 Td');
  lines.push('(ORQUESTRA EVANGELICA DE CURITIBA  -  ACERVO PRIVADO DE PARTITURAS) Tj');
  lines.push('ET');

  lines.push('0.12 0.23 0.37 RG 1.2 w 54 746 m 558 746 l S');

  // Piece Title & Metadata
  lines.push('BT');
  lines.push('/F1 20 Tf');
  lines.push('54 714 Td');
  lines.push(`(${safeTitle}) Tj`);
  lines.push('ET');

  lines.push('BT');
  lines.push('/F2 10 Tf');
  lines.push('54 696 Td');
  lines.push(`(Codigo: ${escapePdfText(track.code)}  |  Tonalidade: ${safeKey}  |  Andamento: ${track.tempo_bpm} BPM) Tj`);
  lines.push('ET');

  lines.push('BT');
  lines.push('/F2 9.5 Tf');
  lines.push('54 680 Td');
  lines.push(`(${safeComposer}) Tj`);
  lines.push('ET');

  // Instrument Part Box
  lines.push('0.96 0.95 0.92 rg 54 632 504 34 re f');
  lines.push('0.60 0.42 0.18 RG 0.8 w 54 632 504 34 re S');

  lines.push('0.10 0.10 0.10 rg');
  lines.push('BT');
  lines.push('/F1 13 Tf');
  lines.push('66 645 Td');
  lines.push(`(PARTE: ${safeInstrument}) Tj`);
  lines.push('ET');

  lines.push('BT');
  lines.push('/F2 9 Tf');
  lines.push('320 645 Td');
  lines.push(`(${safeClef}  -  ${safeTransp}) Tj`);
  lines.push('ET');

  // Draw 6 musical staves with barlines & note heads
  const staffYs = [575, 495, 415, 335, 255, 175];
  const rehearsalMarks = ['Intro', 'A', 'B', 'Coro', 'Ponte', 'Final'];

  staffYs.forEach((baseY, idx) => {
    // Rehearsal mark box
    lines.push('0.12 0.23 0.37 RG 0.8 w');
    lines.push(`54 ${baseY + 26} 26 14 re S`);
    lines.push('BT /F1 8.5 Tf 58 ' + (baseY + 30) + ` Td (${rehearsalMarks[idx]}) Tj ET`);

    // 5 staff lines
    lines.push('0.22 0.20 0.19 RG 0.65 w');
    for (let s = 0; s < 5; s++) {
      const y = baseY - s * 6;
      lines.push(`54 ${y} m 558 ${y} l S`);
    }

    // Measure barlines
    [54, 180, 306, 432, 558].forEach((bx) => {
      lines.push(`0.22 0.20 0.19 RG 0.9 w ${bx} ${baseY} m ${bx} ${baseY - 24} l S`);
    });

    // Stylized rhythmic note heads + stems across the staff
    lines.push('0.12 0.12 0.12 rg');
    for (let m = 0; m < 4; m++) {
      const measureStart = 76 + m * 126;
      for (let n = 0; n < 4; n++) {
        const nx = measureStart + n * 26;
        const step = ((idx * 3 + m * 2 + n) % 5) * 6;
        const ny = baseY - step;
        lines.push(`${nx} ${ny} 4.2 3.2 re f`);
        lines.push(`0.12 0.12 0.12 RG 0.9 w ${nx + 4} ${ny + 1} m ${nx + 4} ${ny + 18} l S`);
      }
    }
  });

  // Footer with participant authorization watermark
  lines.push('0.75 0.72 0.66 RG 0.6 w 54 78 m 558 78 l S');
  lines.push('0.35 0.32 0.30 rg');
  lines.push('BT');
  lines.push('/F2 8.5 Tf');
  lines.push('54 62 Td');
  lines.push(`(Uso exclusivo para ensaios da Orquestra Evangelica de Curitiba  |  Liberado para: ${safeMember}) Tj`);
  lines.push('ET');

  const streamContent = lines.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
