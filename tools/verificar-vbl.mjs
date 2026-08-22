// Comprueba que la importacion desde USFM no perdio ni invento texto, sin que
// haya que fiarse de quien la escribio.
//
// LA IDEA
//
// Hay dos fuentes independientes de la misma VBL:
//   - el espejo wldeh, con los pies de nota PEGADOS dentro del versiculo
//   - el USFM oficial, con los pies delimitados aparte
//
// Si mi separacion es correcta, para cada versiculo debe cumplirse:
//
//     texto_limpio + notas  ==  texto_del_espejo   (mismas palabras)
//
// Se compara por multiconjunto de palabras normalizadas, no por cadena, porque
// el espejo y el USFM difieren en espacios y en donde cae la puntuacion.
//
// QUE DETECTA
//   - palabras del espejo que no estan ni en mi texto ni en mis notas
//     -> me comi texto
//   - palabras mias que no estan en el espejo
//     -> invente texto o deje marcado sin limpiar
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const ESPEJO = "C:/Users/ACER NITRO V/repos/bible-data/bibles/spa-vbl/books";
const NUEVO = process.argv[2] || "C:/bv/vbl-usfm/books";

if (!existsSync(NUEVO)) {
  console.error("  No existe la importacion nueva en " + NUEVO);
  process.exit(2);
}

// Palabras comparables: minusculas, sin puntuacion ni comillas tipograficas.
const palabras = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[“”"'’‘.,;:!¡?¿()\[\]—–\-…]/g, " ")
    .split(/\s+/)
    // Los numeros sueltos se ignoran: el espejo trae el marcador del pie
    // ("1:5") pegado al texto, y al normalizar se parte en "1" y "5", que no
    // son palabras del texto biblico sino restos del marcador.
    .filter((w) => w && !/^\d+$/.test(w));

const bolsa = (arr) => {
  const m = new Map();
  for (const p of arr) m.set(p, (m.get(p) || 0) + 1);
  return m;
};

let comparados = 0;
let iguales = 0;
const faltantes = [];
const sobrantes = [];

for (const libro of readdirSync(NUEVO)) {
  const dirN = path.join(NUEVO, libro, "chapters");
  const dirE = path.join(ESPEJO, libro, "chapters");
  if (!existsSync(dirE)) continue;
  for (const f of readdirSync(dirN)) {
    const pe = path.join(dirE, f);
    if (!existsSync(pe)) continue;
    const jn = JSON.parse(readFileSync(path.join(dirN, f), "utf8"));
    const je = JSON.parse(readFileSync(pe, "utf8"));
    const porVerso = new Map(je.data.map((v) => [String(v.verse), v.text]));
    for (const v of jn.data) {
      const espejo = porVerso.get(String(v.verse));
      if (espejo === undefined) continue;
      comparados++;
      const notas = v.nota ? (Array.isArray(v.nota) ? v.nota.join(" ") : v.nota) : "";
      const mias = bolsa(palabras(v.text + " " + notas));
      const suyas = bolsa(palabras(espejo));
      let falta = [];
      let sobra = [];
      for (const [p, n] of suyas) {
        const d = n - (mias.get(p) || 0);
        if (d > 0) falta.push(p + (d > 1 ? "x" + d : ""));
      }
      for (const [p, n] of mias) {
        const d = n - (suyas.get(p) || 0);
        if (d > 0) sobra.push(p + (d > 1 ? "x" + d : ""));
      }
      if (!falta.length && !sobra.length) { iguales++; continue; }
      const ref = libro + " " + jn.chapter + ":" + v.verse;
      if (falta.length) faltantes.push({ ref, falta: falta.slice(0, 8) });
      if (sobra.length) sobrantes.push({ ref, sobra: sobra.slice(0, 8) });
    }
  }
}

console.log("  versiculos comparados :", comparados.toLocaleString("es"));
console.log("  identicos             :", iguales.toLocaleString("es"),
  "(" + ((iguales * 100) / comparados).toFixed(2) + "%)");
console.log("  con palabras PERDIDAS :", faltantes.length);
console.log("  con palabras DE MAS   :", sobrantes.length);
console.log();
for (const x of faltantes.slice(0, 10)) console.log("  PERDIDO  " + x.ref + " -> " + x.falta.join(" "));
console.log();
for (const x of sobrantes.slice(0, 10)) console.log("  DE MAS   " + x.ref + " -> " + x.sobra.join(" "));

process.exitCode = faltantes.length ? 1 : 0;
