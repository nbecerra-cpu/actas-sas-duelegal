// app/api/generate-docx/route.js
// Genera documento .docx profesional del acta de asamblea S.A.S.

import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, HeadingLevel,
} from "docx";

// ── Utilidades ──────────────────────────────────────────────
const n2w = (n) => {
  n = parseInt(n) || 0;
  if (n === 0) return "cero";
  const u = ["","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"];
  const t = ["diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve"];
  const d = ["","diez","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
  const c = ["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];
  if (n < 0) return "menos " + n2w(-n);
  if (n < 10) return u[n];
  if (n < 20) return t[n - 10];
  if (n < 100) { if (n === 20) return "veinte"; if (n < 30) return "veinti" + u[n % 10]; return d[Math.floor(n / 10)] + (n % 10 ? " y " + u[n % 10] : ""); }
  if (n === 100) return "cien";
  if (n < 1000) return c[Math.floor(n / 100)] + (n % 100 ? " " + n2w(n % 100) : "");
  if (n < 1000000) { const th = Math.floor(n / 1000); return (th === 1 ? "mil" : n2w(th) + " mil") + (n % 1000 ? " " + n2w(n % 1000) : ""); }
  if (n < 1000000000) { const m = Math.floor(n / 1000000); return (m === 1 ? "un millón" : n2w(m) + " millones") + (n % 1000000 ? " " + n2w(n % 1000000) : ""); }
  return n.toString();
};

const fmtDateW = (ds) => {
  if (!ds) return "[FECHA]";
  const d = new Date(ds + "T12:00:00");
  const ms = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const day = d.getDate(), m = ms[d.getMonth()], y = d.getFullYear();
  return `${n2w(day)} (${day}) del mes de ${m} del año dos mil ${n2w(y - 2000)} (${y})`;
};

const fmtHourW = (ts) => {
  if (!ts) return "[HORA]";
  const [h, mi] = ts.split(":").map(Number);
  const p = h < 12 ? "de la mañana" : (h < 18 ? "de la tarde" : "de la noche");
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  if (mi === 0) return `las ${n2w(h12)} ${p} (${ts.replace(/^0/, "")} ${h < 12 ? "a.m." : "p.m."})`;
  return `las ${n2w(h12)} y ${n2w(mi)} minutos ${p} (${ts} ${h < 12 ? "a.m." : "p.m."})`;
};

const fmtCurrency = (v) => {
  if (!v) return "";
  const n = parseInt(String(v).replace(/\D/g, ""));
  return isNaN(n) ? "" : n.toLocaleString("es-CO");
};

// ── Estilos comunes ──────────────────────────────────────────
const FONT = "Times New Roman";
const SIZE_NORMAL = 24; // 12pt
const SIZE_TITLE = 28;  // 14pt
const SIZE_SMALL = 20;  // 10pt
const BRAND_COLOR = "232C54";

const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function justifiedPara(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 200, line: 360 },
    ...opts,
    children: runs,
  });
}

function titlePara(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_TITLE, allCaps: true })],
  });
}

function sectionTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({ text: text.toUpperCase() + ".", bold: true, font: FONT, size: SIZE_NORMAL })],
  });
}

function normalRun(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SIZE_NORMAL, ...opts });
}

function boldRun(text, opts = {}) {
  return normalRun(text, { bold: true, ...opts });
}

// ── Generador principal ──────────────────────────────────────
export async function POST(request) {
  try {
    const { sociedad, reunion, accionistas, mesa, items } = await request.json();

    const FIXED_START = [
      "Lectura y aprobación del orden del día",
      "Elección del Presidente y Secretario de la Reunión",
      "Verificación del Quórum",
    ];
    const FIXED_END = ["Proposiciones y varios", "Lectura y aprobación del acta"];

    const totalAccSus = parseInt(sociedad.acc_sus) || 0;
    const accPresentes = accionistas.filter(a => a.asiste);
    const accPresCount = accPresentes.reduce((s, a) => s + (parseInt(a.acciones) || 0), 0);
    const tipoLabel = reunion.tipo === "ordinaria" ? "Ordinaria" : "Extraordinaria";

    const children = [];

    // ── Encabezado ──
    children.push(titlePara(
      `REUNIÓN DE ASAMBLEA GENERAL ${tipoLabel.toUpperCase()} DE ACCIONISTAS DE LA SOCIEDAD ${sociedad.nombre}`
    ));
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [boldRun(`ACTA No. ${reunion.num_acta}.`)],
    }));

    // ── Párrafo de apertura ──
    const apertura = [
      normalRun(`Siendo ${fmtHourW(reunion.hora)} del ${fmtDateW(reunion.fecha)}, se llevó a cabo la Reunión de Asamblea General ${tipoLabel} de Accionistas de la sociedad `),
      boldRun(sociedad.nombre),
      normalRun(` (en adelante "la Sociedad"), identificada con NIT ${sociedad.nit}, con domicilio principal en la ciudad de ${sociedad.domicilio}`),
    ];
    if (sociedad.matricula) {
      apertura.push(normalRun(`, inscrita en la Cámara de Comercio bajo matrícula mercantil No. ${sociedad.matricula}`));
    }
    apertura.push(normalRun("."));
    children.push(justifiedPara(apertura));

    // ── Tabla de asistencia ──
    children.push(new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [boldRun("ASISTENCIA:")],
    }));

    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          borders, margins: cellMargins, width: { size: 4500, type: WidthType.DXA },
          shading: { fill: BRAND_COLOR, type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "ASISTENTE", bold: true, font: FONT, size: SIZE_SMALL, color: "FFFFFF" })] })],
        }),
        new TableCell({
          borders, margins: cellMargins, width: { size: 3000, type: WidthType.DXA },
          shading: { fill: BRAND_COLOR, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ACCIONES SUSCRITAS Y PAGADAS", bold: true, font: FONT, size: SIZE_SMALL, color: "FFFFFF" })] })],
        }),
        new TableCell({
          borders, margins: cellMargins, width: { size: 1860, type: WidthType.DXA },
          shading: { fill: BRAND_COLOR, type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "% PARTICIPACIÓN", bold: true, font: FONT, size: SIZE_SMALL, color: "FFFFFF" })] })],
        }),
      ],
    });

    const dataRows = accPresentes.map(a => {
      const pct = totalAccSus > 0 ? ((parseInt(a.acciones) / totalAccSus) * 100).toFixed(2) : "0";
      return new TableRow({
        children: [
          new TableCell({ borders, margins: cellMargins, width: { size: 4500, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: a.nombre.toUpperCase(), font: FONT, size: SIZE_SMALL })] })] }),
          new TableCell({ borders, margins: cellMargins, width: { size: 3000, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(a.acciones), font: FONT, size: SIZE_SMALL })] })] }),
          new TableCell({ borders, margins: cellMargins, width: { size: 1860, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${pct}%`, font: FONT, size: SIZE_SMALL })] })] }),
        ],
      });
    });

    const totalRow = new TableRow({
      children: [
        new TableCell({ borders, margins: cellMargins, width: { size: 4500, type: WidthType.DXA },
          children: [new Paragraph({ children: [boldRun("TOTAL", { size: SIZE_SMALL })] })] }),
        new TableCell({ borders, margins: cellMargins, width: { size: 3000, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldRun(String(accPresCount), { size: SIZE_SMALL })] })] }),
        new TableCell({ borders, margins: cellMargins, width: { size: 1860, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldRun(`${totalAccSus > 0 ? ((accPresCount / totalAccSus) * 100).toFixed(0) : 0}%`, { size: SIZE_SMALL })] })] }),
      ],
    });

    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4500, 3000, 1860],
      rows: [headerRow, ...dataRows, totalRow],
    }));

    // ── Convocatoria ──
    if (reunion.convocatoria === "sin") {
      children.push(justifiedPara([
        normalRun(`Se deja constancia que la reunión se llevó a cabo sin convocatoria previa, toda vez que se encontraban representadas la totalidad de las ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas de la Sociedad, correspondientes al ciento por ciento (100%) del capital suscrito y pagado, y todos los accionistas aceptaron deliberar, de conformidad con el artículo 182 del Código de Comercio.`),
      ]));
    } else if (reunion.convocatoria === "con") {
      children.push(justifiedPara([
        normalRun(`Se deja constancia que la reunión fue convocada mediante ${reunion.forma_conv || "[forma de convocatoria]"} con fecha ${reunion.fecha_conv || "[fecha]"}, con una antelación de ${reunion.dias_ant || "[X]"} días, dando cumplimiento a los requisitos del artículo 20 de la Ley 1258 de 2008 y los estatutos sociales.`),
      ]));
    } else {
      children.push(justifiedPara([
        normalRun("Se deja constancia que la reunión se celebra por derecho propio, conforme al artículo 422 del Código de Comercio."),
      ]));
    }

    // ── Personas presentes ──
    const rom = ["i","ii","iii","iv","v","vi","vii","viii","ix","x"];
    const pp = [];
    if (mesa.pres_nombre) pp.push(`(${rom[pp.length]}) ${mesa.pres_nombre}, identificado con ${mesa.pres_doc || "[documento]"}, en calidad de ${mesa.pres_calidad || "Presidente de la Reunión"}`);
    if (mesa.sec_nombre) pp.push(`(${rom[pp.length]}) ${mesa.sec_nombre}, identificado con ${mesa.sec_doc || "[documento]"}, en calidad de ${mesa.sec_calidad || "Secretario de la Reunión"}`);
    (mesa.personas || []).filter(p => p.nombre).forEach(p => {
      pp.push(`(${rom[pp.length]}) ${p.nombre}, identificado con ${p.doc || "[documento]"}, en calidad de ${p.calidad || "[calidad]"}`);
    });
    children.push(justifiedPara([normalRun("Se encontraban presentes: " + pp.join("; ") + ".")]));

    // ── Orden del día ──
    children.push(new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [boldRun("ORDEN DEL DÍA:")],
    }));

    const allItems = [...FIXED_START, ...items.map(it => it.label), ...FIXED_END];
    allItems.forEach((item, i) => {
      children.push(new Paragraph({
        spacing: { after: 40 },
        indent: { left: 360 },
        children: [normalRun(`${i + 1}. ${item};`)],
      }));
    });

    children.push(justifiedPara([
      normalRun(`El orden del día fue aprobado con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco.`),
    ], { spacing: { before: 200, after: 200, line: 360 } }));

    // ── Punto 1: Lectura orden del día ──
    children.push(sectionTitle("LECTURA Y APROBACIÓN DEL ORDEN DEL DÍA"));
    children.push(justifiedPara([
      normalRun(`Tras dar lectura al orden del día, fue aprobado con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco, es decir, por unanimidad.`),
    ]));

    // ── Punto 2: Elección mesa ──
    children.push(sectionTitle("ELECCIÓN DEL PRESIDENTE Y SECRETARIO DE LA REUNIÓN"));
    children.push(justifiedPara([
      normalRun(`Se propuso elegir como Presidente al señor ${mesa.pres_nombre || "[NOMBRE]"} y como Secretario al señor(a) ${mesa.sec_nombre || "[NOMBRE]"}. Los nombramientos fueron aprobados con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco, es decir, por unanimidad.`),
    ]));

    // ── Punto 3: Verificación quórum ──
    children.push(sectionTitle("VERIFICACIÓN DEL QUÓRUM"));
    children.push(justifiedPara([
      normalRun(`El Secretario comprobó que se encontraban representadas ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, correspondientes al ${totalAccSus > 0 ? ((accPresCount / totalAccSus) * 100).toFixed(0) : 100}% del capital suscrito y pagado, quedando conformado el quórum deliberatorio y decisorio de conformidad con la Ley y los Estatutos.`),
    ]));

    // ── Puntos dinámicos (decisiones) ──
    items.forEach(item => {
      const vf = parseInt(item.votos?.favor) || accPresCount;
      const vc = parseInt(item.votos?.contra) || 0;
      const vb = parseInt(item.votos?.blanco) || 0;
      const unanime = vf === accPresCount && vc === 0 && vb === 0;

      children.push(sectionTitle(item.label));

      if (item.textoFinal?.trim()) {
        // Split by newlines and create separate paragraphs
        item.textoFinal.split("\n").filter(p => p.trim()).forEach(paragraph => {
          children.push(justifiedPara([normalRun(paragraph.trim())]));
        });
      } else if (item.resumen?.trim()) {
        children.push(justifiedPara([normalRun(item.resumen)]));
        children.push(justifiedPara([
          normalRun(`La propuesta fue sometida a votación y aprobada con el voto favorable de ${n2w(vf)} (${vf}) acciones suscritas y pagadas, ${n2w(vc)} (${vc}) votos en contra y ${n2w(vb)} (${vb}) votos en blanco${unanime ? ", es decir, por unanimidad" : ""}.`),
        ]));
      } else {
        children.push(justifiedPara([normalRun("[Pendiente de redacción]", { italics: true, color: "999999" })]));
      }
    });

    // ── Proposiciones y varios ──
    children.push(sectionTitle("PROPOSICIONES Y VARIOS"));
    children.push(justifiedPara([
      normalRun("Se dispuso del espacio para proposiciones. Ninguno de los presentes formuló proposiciones adicionales."),
    ]));

    // ── Lectura y aprobación del acta ──
    children.push(sectionTitle("LECTURA Y APROBACIÓN DEL ACTA"));
    children.push(justifiedPara([
      normalRun(`Se elaboró la presente acta y fue sometida a consideración de la Asamblea. Fue aprobada con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco, es decir, por unanimidad.`),
    ]));
    children.push(justifiedPara([
      normalRun(`Se levantó la sesión a ${fmtHourW(reunion.hora_clausura || "11:00")}.`),
    ]));
    children.push(justifiedPara([normalRun("En constancia firman:")]));

    // ── Firmas ──
    children.push(new Paragraph({ spacing: { before: 1200 } }));

    children.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [4680, 4680],
      rows: [new TableRow({
        children: [
          new TableCell({
            borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            width: { size: 4680, type: WidthType.DXA },
            margins: { top: 80, bottom: 0, left: 0, right: 400 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [boldRun((mesa.pres_nombre || "[PRESIDENTE]").toUpperCase(), { size: SIZE_SMALL })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [normalRun("Presidente", { size: SIZE_SMALL })] }),
            ],
          }),
          new TableCell({
            borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            width: { size: 4680, type: WidthType.DXA },
            margins: { top: 80, bottom: 0, left: 400, right: 0 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [boldRun((mesa.sec_nombre || "[SECRETARIO]").toUpperCase(), { size: SIZE_SMALL })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [normalRun("Secretario", { size: SIZE_SMALL })] }),
            ],
          }),
        ],
      })],
    }));

    // ── Crear documento ──
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: FONT, size: SIZE_NORMAL },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 }, // Letter
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: `${sociedad.nombre} — Acta No. ${reunion.num_acta}`, font: FONT, size: 16, color: "999999" })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Página ", font: FONT, size: 16, color: "999999" }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "999999" }),
              ],
            })],
          }),
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    const filename = `Acta_No_${reunion.num_acta}_${tipoLabel}_${(sociedad.nombre || "SAS").replace(/\s+/g, "_")}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json(
      { error: "Error al generar el documento: " + error.message },
      { status: 500 }
    );
  }
}
