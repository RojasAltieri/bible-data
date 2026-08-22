// Importa la Versión Biblia Libre desde su USFM oficial.
//
// POR QUE NO EL ESPEJO DE wldeh
//
// El espejo trae el texto con los pies de nota PEGADOS dentro del versiculo y
// sin marca alguna:
//
//   "...y lo hizo de esta manera:3:16 La palabra a menudo traducida como
//    “tal” describe ante todo la forma... entregó a su único Hijo..."
//
// Eso es un problema de fondo, no cosmetico: los pies son comentario del
// traductor, no Escritura, y algunos toman postura sobre doctrinas discutidas
// (1 Corintios 14:2 sobre hablar en lenguas). Leidos asi, pasan por texto
// biblico.
//
// Separarlos por heuristica NO funciona. Se probo cortar en "punto + espacio +
// minuscula" y se comio Escritura en al menos 49 versiculos: en Galatas 2:2 la
// frase "Me reuní en privado con los líderes reconocidos" acabo dentro de la
// nota, porque la nota anterior terminaba en punto seguido de mayuscula.
//
// En USFM el pie viene delimitado: \f + \fr 3.16 \ft <nota> \f*  — se separa
// sin adivinar nada.
//
// DE REGALO: el USFM trae numeros de Strong por palabra (\w vida|strong="G2222"\w*).
// Se guardan en `strong` por si algun dia se usan; no estorban al texto.
//
// Uso:  node tools/import-vbl-usfm.mjs [--hazlo]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE =
  "https://freely-given.org/Software/BibleDropBox/Demos/VBL.USFM.Demo/YourSourceFiles/Unzipped";
const VERSION = "spa-vbl";
const ESCRIBIR = process.argv.includes("--hazlo");

// Codigo USFM de tres letras -> slug canonico del repo. El numero que lleva
// delante el archivo no es el orden canonico (Juan es 73, no 43), asi que se
// localiza por codigo.
const LIBROS = {
  GEN: "genesis", EXO: "exodus", LEV: "leviticus", NUM: "numbers",
  DEU: "deuteronomy", JOS: "joshua", JDG: "judges", RUT: "ruth",
  "1SA": "1-samuel", "2SA": "2-samuel", "1KI": "1-kings", "2KI": "2-kings",
  "1CH": "1-chronicles", "2CH": "2-chronicles", EZR: "ezra", NEH: "nehemiah",
  EST: "esther", JOB: "job", PSA: "psalms", PRO: "proverbs", ECC: "ecclesiastes",
  SNG: "song-of-solomon", ISA: "isaiah", JER: "jeremiah", LAM: "lamentations",
  EZK: "ezekiel", DAN: "daniel", HOS: "hosea", JOL: "joel", AMO: "amos",
  OBA: "obadiah", JON: "jonah", MIC: "micah", NAM: "nahum", HAB: "habakkuk",
  ZEP: "zephaniah", HAG: "haggai", ZEC: "zechariah", MAL: "malachi",
  MAT: "matthew", MRK: "mark", LUK: "luke", JHN: "john", ACT: "acts",
  ROM: "romans", "1CO": "1-corinthians", "2CO": "2-corinthians", GAL: "galatians",
  EPH: "ephesians", PHP: "philippians", COL: "colossians",
  "1TH": "1-thessalonians", "2TH": "2-thessalonians", "1TI": "1-timothy",
  "2TI": "2-timothy", TIT: "titus", PHM: "philemon", HEB: "hebrews",
  JAS: "james", "1PE": "1-peter", "2PE": "2-peter", "1JN": "1-john",
  "2JN": "2-john", "3JN": "3-john", JUD: "jude", REV: "revelation",
};

async function listarArchivos() {
  const res = await fetch(BASE + "/");
  if (!res.ok) throw new Error(`No se pudo listar el USFM: HTTP ${res.status}`);
  const html = await res.text();
  const nombres = [...html.matchAll(/(\d{2}-[A-Z0-9]{3}spavbl\.usfm)/g)].map((m) => m[1]);
  return [...new Set(nombres)];
}

// Quita el marcado de palabra dejando la palabra, y devuelve los Strong.
function limpiarPalabras(s, strong) {
  return s.replace(/\\w\s+([^|\\]*?)(\|[^\\]*?)?\\w\*/g, (_m, palabra, attr) => {
    if (attr && strong) {
      const g = attr.match(/strong="([^"]+)"/);
      if (g) strong.push(g[1]);
    }
    return palabra;
  });
}

function limpiarTexto(s) {
  return s
    // Cualquier otro marcador de caracter: \nd Señor\nd* -> Señor
    .replace(/\\\+?[a-z]+\d*\*/g, "")
    .replace(/\\\+?[a-z]+\d*\s?/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Erratas de la fuente. Se declaran en LICENSE.md, como exige la CC BY-SA, y
// van aqui a la vista para que se vea exactamente que se toca.
const CORRECCIONES = [
  {
    ref: "matthew 17:20",
    de: 'hol“Porque',
    a: "“Porque",
    porque: "tres caracteres sueltos al principio del versiculo",
  },
  {
    ref: "judges 12:6",
    de: "dirían“Sibboleth”",
    a: "dirían “Sibboleth”",
    porque: "falta el espacio antes de la comilla",
  },
];
const CORREGIDAS = new Set();

function corregir(texto) {
  let t = texto;
  for (const c of CORRECCIONES) {
    if (t.includes(c.de)) {
      t = t.split(c.de).join(c.a);
      CORREGIDAS.add(c.ref);
    }
  }
  return t;
}

const PERDIDOS = [];

function parsear(usfm) {
  const capitulos = new Map();
  let capActual = null;
  // Partir por \c y \v conservando el contenido.
  const trozos = usfm.split(/(?=\\[cv]\s)/);
  for (const trozo of trozos) {
    const mc = trozo.match(/^\\c\s+(\d+)/);
    if (mc) {
      capActual = Number(mc[1]);
      if (!capitulos.has(capActual)) capitulos.set(capActual, []);
      continue;
    }
    const mv = trozo.match(/^\\v\s+(\d+)\s?([\s\S]*)$/);
    if (!mv || capActual === null) continue;
    const verso = Number(mv[1]);
    let cuerpo = mv[2];

    // 1. Los pies, delimitados. Aqui no se adivina nada.
    const notas = [];
    cuerpo = cuerpo.replace(/\\f\s[\s\S]*?\\f\*/g, (m) => {
      const t = limpiarTexto(
        limpiarPalabras(m, null)
          .replace(/\\f\s*\+?\s*/, "")
          .replace(/\\f\*/, "")
          .replace(/\\fr\s*[\d.:]+\s*/, "")
          .replace(/\\f[tqvkl]\s*/g, ""),
      );
      if (t) notas.push(t);
      return " ";
    });

    // 2. Referencias cruzadas \x ... \x*, mismo trato.
    cuerpo = cuerpo.replace(/\\x\s[\s\S]*?\\x\*/g, " ");

    // 3. Palabras con Strong.
    const strong = [];
    cuerpo = limpiarPalabras(cuerpo, strong);

    const texto = corregir(limpiarTexto(cuerpo));
    // Un versiculo que se queda vacio no se salta en silencio: o el USFM lo
    // trae vacio a proposito, o el parser se lo esta comiendo, y hay que poder
    // distinguirlo. Perder texto biblico sin enterarse es el peor fallo
    // posible aqui.
    if (!texto) {
      PERDIDOS.push({ ref: capActual + ":" + verso, crudo: mv[2].slice(0, 120) });
      continue;
    }
    // Las notas del traductor NO se guardan. Son comentario, no Escritura, y
    // algunas toman postura sobre doctrinas discutidas (1 Corintios 14:2 sobre
    // hablar en lenguas). Se extraen para sacarlas del texto y se descartan.
    // Si algun dia se quisieran, se reimporta: la fuente sigue teniendolas.
    const fila = { verse: String(verso), text: texto };
    if (strong.length) fila.strong = strong;
    capitulos.get(capActual).push(fila);
  }
  return capitulos;
}

const archivos = await listarArchivos();
console.log(`  ${archivos.length} archivos USFM encontrados`);

let libros = 0;
let caps = 0;
let versos = 0;
const faltan = [];

for (const archivo of archivos) {
  const codigo = archivo.slice(3, 6);
  const slug = LIBROS[codigo];
  if (!slug) continue; // 00-FRT, portada
  const res = await fetch(`${BASE}/${archivo}`);
  if (!res.ok) {
    faltan.push(archivo);
    continue;
  }
  const capitulos = parsear(await res.text());
  if (!capitulos.size) {
    faltan.push(archivo);
    continue;
  }
  libros++;
  for (const [n, filas] of capitulos) {
    if (!filas.length) continue;
    caps++;
    versos += filas.length;
    if (ESCRIBIR) {
      const dir = path.join(repoRoot, "bibles", VERSION, "books", slug, "chapters");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, `${n}.json`),
        JSON.stringify({ version: VERSION, book: slug, chapter: n, data: filas }, null, 2) + "\n",
        "utf8",
      );
    }
  }
  console.log(`  ${slug}: ${capitulos.size} capitulos`);
}

console.log();
console.log(ESCRIBIR ? "  === ESCRITO ===" : "  === SIMULACION ===");
console.log("  libros     :", libros);
console.log("  capitulos  :", caps);
console.log("  versiculos :", versos.toLocaleString("es"));
if (faltan.length) console.log("  SIN DESCARGAR:", faltan.join(", "));
console.log("  omitidos   :", PERDIDOS.length, "(versiculos que la VBL no incluye)");
console.log("  erratas corregidas:", [...CORREGIDAS].join(", ") || "ninguna");
for (const c of CORRECCIONES) {
  if (!CORREGIDAS.has(c.ref)) console.log("  AVISO: ya no hace falta corregir " + c.ref + " (arreglado en origen?)");
}
