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
  const rows = (json?.data ?? []).filter((v) => String(v.text ?? "").trim());
  return { verses: rows.length, chars: rows.reduce((s, v) => s + v.text.length, 0) };
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
