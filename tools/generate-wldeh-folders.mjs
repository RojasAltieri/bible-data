// Genera el mapa {carpetaLocalizada -> slug canonico} para una biblia de
// wldeh/bible-api, sin tener que escribir a mano los 66 nombres de libro.
//
// Como funciona: lista las carpetas de libros via GitHub API (1 request), y
// luego identifica cada una por huella digital (cantidad de capitulos +
// versiculos del capitulo 1), que es unica para cada libro del canon
// protestante. La cantidad de capitulos se obtiene por busqueda binaria con
// HEAD contra jsDelivr (sin limite de rate).
//
// Uso:  node tools/generate-wldeh-folders.mjs <wldehId> [--verify=NOMBRE_MAPA]
import {
  CANONICAL_ORDER,
  CHAPTER_COUNTS,
  CH1_VERSES,
  LAST_CH_VERSES,
} from "./canon-fingerprint.mjs";

const id = process.argv[2];
if (!id) throw new Error("Uso: node tools/generate-wldeh-folders.mjs <wldehId>");

const CDN = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${id}/books`;

async function listFolders() {
  const url = `https://api.github.com/repos/wldeh/bible-api/contents/bibles/${id}/books`;
  const res = await fetch(url, { headers: { "User-Agent": "bibleverse-import" } });
  if (!res.ok) throw new Error(`GitHub API ${res.status} para ${id}`);
  return (await res.json()).filter((x) => x.type === "dir").map((x) => x.name);
}

async function exists(folder, n) {
  const res = await fetch(`${CDN}/${encodeURIComponent(folder)}/chapters/${n}.json`, {
    method: "HEAD",
  });
  return res.ok;
}

// Los totales de capitulos solo pueden ser uno de los 66 valores del canon, asi
// que la busqueda binaria corre sobre esa lista corta (~30 valores distintos)
// en vez de sobre 1..150: baja de ~8 probes a ~5.
const POSIBLES = [...new Set(Object.values(CHAPTER_COUNTS))].sort((a, b) => a - b);

async function chapterCount(folder) {
  if (!(await exists(folder, 1))) return 0;
  let lo = 0;
  let hi = POSIBLES.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (await exists(folder, POSIBLES[mid])) lo = mid;
    else hi = mid - 1;
  }
  return POSIBLES[lo];
}

async function chapterStats(folder, n) {
  const res = await fetch(`${CDN}/${encodeURIComponent(folder)}/chapters/${n}.json`);
  if (!res.ok) return { verses: -1, chars: 0 };
  const json = await res.json();
  const rows = dedupe(json?.data ?? []).filter((v) => String(v.text ?? "").trim());
  return { verses: rows.length, chars: rows.reduce((s, v) => s + v.text.length, 0) };
}

// Algunas biblias de wldeh traen CADA VERSICULO REPETIDO (es-vbl trae los 36 de
// Juan 3 dos veces, 72 entradas). Si no se quitan antes de contar, la huella
// digital sale al doble, no coincide con ningun libro del canon y el emparejado
// asigna casi todos mal: en la primera pasada de es-vbl salio "hechos ->
// matthew", "marcos -> 1-corinthians", "santiago -> 1-peter". Se detecto porque
// 1 Corintios 1:3 decia "Una voz que clama en el desierto", que es Marcos 1:3.
function dedupe(rows) {
  const vistos = new Set();
  return rows.filter((v) => {
    const k = String(v?.verse ?? "");
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

const folders = await listFolders();
console.error(`[${id}] ${folders.length} carpetas encontradas`);

// El total de capitulos es canonico y estable entre traducciones, asi que se usa
// como clave exacta. Los conteos de versiculos NO son estables (p.ej. Lucas 1
// tiene 80 versiculos en IRV hindi y 71 en IRV telugu), asi que dentro de cada
// grupo de igual cantidad de capitulos se elige por cercania, no por igualdad.
const porCapitulos = new Map();
for (const slug of CANONICAL_ORDER) {
  const n = CHAPTER_COUNTS[slug];
  if (!porCapitulos.has(n)) porCapitulos.set(n, []);
  porCapitulos.get(n).push(slug);
}

// Las huellas se calculan en paralelo (lotes de 8): en serie son ~800 requests
// secuenciales y tarda mas de 10 minutos.
async function fingerprint(folder) {
  const chs = await chapterCount(folder);
  const first = await chapterStats(folder, 1);
  const last = chs > 1 ? await chapterStats(folder, chs) : first;
  return { folder, chs, first, last };
}

const prints = [];
const LOTE = 22;
for (let i = 0; i < folders.length; i += LOTE) {
  prints.push(...(await Promise.all(folders.slice(i, i + LOTE).map(fingerprint))));
  console.error(`  ...${Math.min(i + LOTE, folders.length)}/${folders.length}`);
}

const mapping = {};
const unresolved = [];

// Asignacion de costo minimo por grupo: se generan todos los pares
// (carpeta, slug) candidatos con su costo y se asignan de menor a mayor.
const pares = [];
for (const { folder, chs, first, last } of prints) {
  const candidatos = porCapitulos.get(chs) ?? [];
  if (!candidatos.length) {
    unresolved.push({ folder, chs, motivo: "ningun libro del canon tiene esa cantidad de capitulos" });
    continue;
  }
  for (const slug of candidatos) {
    const costo =
      Math.abs(first.verses - CH1_VERSES[slug]) + Math.abs(last.verses - LAST_CH_VERSES[slug]);
    pares.push({ folder, slug, costo, chars: first.chars });
  }
}

// Filemon y Judas son ambos de 1 capitulo y ~25 versiculos: el costo no los
// distingue. Judas es 40-50% mas largo en todos los idiomas verificados.
const unCap = prints.filter((p) => p.chs === 1);
if (unCap.length >= 2) {
  const porLargo = [...unCap].sort((a, b) => a.first.chars - b.first.chars);
  const masCorto = porLargo[0].folder;
  const masLargo = porLargo[porLargo.length - 1].folder;
  for (const par of pares) {
    if (par.slug === "jude") par.costo += par.folder === masLargo ? -2 : 2;
    if (par.slug === "philemon") par.costo += par.folder === masCorto ? -2 : 2;
  }
}

pares.sort((a, b) => a.costo - b.costo);
const usadas = new Set();
const asignados = new Set();
for (const { folder, slug } of pares) {
  if (usadas.has(folder) || asignados.has(slug)) continue;
  mapping[folder] = slug;
  usadas.add(folder);
  asignados.add(slug);
}

for (const { folder, chs, first, last } of prints) {
  const slug = mapping[folder];
  if (!slug) unresolved.push({ folder, chs, v1: first.verses, motivo: "sin candidato libre" });
  console.error(`  ${folder}: caps=${chs} v1=${first.verses} vN=${last.verses} -> ${slug ?? "SIN MATCH"}`);
}

if (unresolved.length) {
  console.error(`\nAVISO: ${unresolved.length} sin resolver:`, JSON.stringify(unresolved, null, 1));
}

// salida ordenada por canon, lista para pegar en import-open-bibles.mjs
const ordered = {};
for (const slug of CANONICAL_ORDER) {
  const folder = Object.keys(mapping).find((f) => mapping[f] === slug);
  if (folder) ordered[folder] = slug;
}
console.log(JSON.stringify(ordered, null, 2));
console.error(`\n[${id}] resueltos ${Object.keys(ordered).length}/66`);

// AVISO DE CORDURA. "resueltos 66/66" no significa que esten BIEN: el
// emparejado por costo minimo siempre encuentra una asignacion, aunque las
// huellas no se parezcan a nada. En la primera pasada de es-vbl dijo 66/66 con
// casi todo mal (hechos->matthew, marcos->1-corinthians) porque la fuente traia
// los versiculos duplicados y los conteos salian al doble.
//
// Un error que se anuncia como exito es peor que uno que revienta, asi que se
// comprueba cuanto se aleja cada huella del canon. Si muchas se alejan mucho,
// la asignacion no es de fiar por mas que el total cuadre.
//
// OJO AL CRITERIO: probado contra el caso real de es-vbl sin deduplicar, la
// MEDIANA salio 0% igualmente, porque a la mitad de los libros les toco por
// azar otro de conteo parecido. Lo que delato el desastre fue el RECUENTO de
// libros muy desviados: 21. No simplifiques esto a "mira la mediana".
const desviaciones = [];
for (const { folder, first } of prints) {
  const slug = mapping[folder];
  if (!slug) continue;
  const esperado = CH1_VERSES[slug];
  if (!esperado || first.verses <= 0) continue;
  desviaciones.push(Math.abs(first.verses - esperado) / esperado);
}
if (desviaciones.length) {
  desviaciones.sort((a, b) => a - b);
  const mediana = desviaciones[Math.floor(desviaciones.length / 2)];
  const lejos = desviaciones.filter((d) => d > 0.5).length;
  console.error(
    `[${id}] desviacion mediana del capitulo 1: ${(mediana * 100).toFixed(0)}%` +
      ` — ${lejos} libros a mas del 50%`,
  );
  if (mediana > 0.25 || lejos > 10) {
    console.error(
      `\n  !! NO TE FIES DE ESTE MAPA. Las huellas no se parecen al canon.\n` +
        `     Causa tipica: la fuente trae versiculos repetidos o partidos.\n` +
        `     Comprueba a mano un capitulo antes de importar nada:\n` +
        `     curl -sL "${CDN}/<carpeta>/chapters/1.json" | head -c 400`,
    );
    process.exitCode = 1;
  }
}
