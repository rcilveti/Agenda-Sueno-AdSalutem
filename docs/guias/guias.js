// Genera las guías del paciente (castellano y catalán) de docs/, en Word, para exportarlas a PDF.
//
//   npm i docx            (no es dependencia del proyecto: la aplicación no usa ninguna)
//   node docs/guias/guias.js
//   soffice --headless --convert-to pdf Guia_del_paciente_v5_0_0_castellano.docx
//
// El texto vive en contenido.js. Las guías se publicaron hasta noviembre de 2026 desde un
// documento de LibreOffice que no estaba en el repositorio: al cambiar el orden de las pestañas
// del editor hubo que rehacerlas, y desde entonces la fuente es esta.
'use strict';
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
        WidthType, ShadingType, BorderStyle, AlignmentType, LevelFormat, convertInchesToTwip } = require('docx');

const FUENTE = 'Carlito';
const TINTA = '1b1b1b', SUAVE = '555555', LINEA = 'd9d9d9', CABEZA = 'f2f5f8';

// **negrita** dentro del texto
const runs = (t, o = {}) => t.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(p =>
  new TextRun({ text: p.replace(/\*\*/g, ''), bold: p.startsWith('**'), font: FUENTE, color: o.color || TINTA, size: o.size || 20 }));

const P = (t, o = {}) => new Paragraph({
  children: runs(t, o),
  spacing: { before: o.before === undefined ? 0 : o.before, after: o.after === undefined ? 120 : o.after, line: 276 },
  alignment: o.alignment,
});
const H1 = t => new Paragraph({ children: runs(t, { size: 30 }).map(r => r), heading: HeadingLevel.HEADING_1, spacing: { after: 60 } });
const H2 = t => new Paragraph({ children: runs('**' + t + '**', { size: 24 }), spacing: { before: 360, after: 120 }, keepNext: true });
const LI = (t, tipo, nivel = 0) => new Paragraph({
  children: runs(t), numbering: { reference: tipo, level: nivel },
  spacing: { after: 80, line: 276 },
});

function celda(t, o = {}) {
  return new TableCell({
    width: { size: o.w, type: WidthType.DXA },
    shading: o.cab ? { type: ShadingType.CLEAR, fill: CABEZA, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: runs(t, { size: 19 }), spacing: { after: 0, line: 252 } })],
  });
}

function tabla(filas) {
  const A = 4200, B = 5400;
  return new Table({
    columnWidths: [A, B],
    width: { size: A + B, type: WidthType.DXA },
    borders: ['top', 'bottom', 'left', 'right', 'insideHorizontal', 'insideVertical'].reduce((o, k) =>
      (o[k] = { style: BorderStyle.SINGLE, size: 4, color: LINEA }, o), {}),
    rows: filas.map(([a, b], i) => new TableRow({
      children: [celda(a, { w: A, cab: i === 0 }), celda(b, { w: B, cab: i === 0 })],
      tableHeader: i === 0,
    })),
  });
}

function documento(g) {
  const cuerpo = [
    H1(g.titulo),
    P(g.firma, { color: SUAVE, after: 200 }),
    P(g.entrada, { after: 240 }),
    H2(g.s1.titulo), P(g.s1.intro),
    ...g.s1.pasos.map(t => LI(t, 'num1')),
    ...g.s1.cola.map(t => P(t, { before: 120 })),
    H2(g.s2.titulo),
    ...g.s2.intro.map(t => P(t, { before: 120 })),
    ...g.s2.pasos.map(t => LI(t, 'num2')),
    new Paragraph({ children: [], spacing: { after: 120 } }),
    tabla(g.tabla),
    H2(g.s3.titulo), P(g.s3.intro),
    ...g.s3.puntos.map(t => LI(t, 'punto')),
    H2(g.faq.titulo),
    ...g.faq.puntos.map(t => LI(t, 'punto')),
    P(g.cierre, { before: 200 }),
  ];
  return new Document({
    creator: 'AdSalutem · Instituto del Sueño',
    title: g.titulo,
    styles: {
      default: {
        document: { run: { font: FUENTE, size: 20, color: TINTA } },
        heading1: { run: { font: FUENTE, size: 30, bold: true, color: TINTA },
                    paragraph: { spacing: { before: 0, after: 60 }, keepNext: true } },
      },
    },
    numbering: {
      config: [
        { reference: 'num1', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.45), hanging: convertInchesToTwip(0.25) } } } }] },
        { reference: 'num2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.45), hanging: convertInchesToTwip(0.25) } } } }] },
        { reference: 'punto', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.START,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.2) } } } }] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 },
                            margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 } } },
      children: cuerpo,
    }],
  });
}

const CONTENIDO = require('./contenido.js');
(async () => {
  for (const [arch, g] of Object.entries(CONTENIDO)) {
    const b = await Packer.toBuffer(documento(g));
    fs.writeFileSync(arch + '.docx', b);
    console.log(arch + '.docx', (b.length / 1024).toFixed(0) + ' KB');
  }
})();
