// Barre los 66 libros ya importados buscando defectos DE LA FUENTE, del tipo
// del "hol" que aparecio pegado al principio de Mateo 17:20:
//
//     "hol“Porque ustedes no creen lo suficiente"
//
// No es un fallo de la limpieza: viene asi en el USFM oficial. La pregunta es
// si es un caso suelto o hay muchos, porque de eso depende si la traduccion es
// publicable tal cual.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const BASE = "C:/Users/ACER NITRO V/repos/bible-data/bibles/spa-vbl/books";

const sospechas = [];
let versiculos = 0;

for (const libro of readdirSync(BASE)) {
  const dir = path.join(BASE, libro, "chapters");
  for (const f of readdirSync(dir)) {
    const j = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    for (const v of j.data) {
      versiculos++;
      const t = v.text;
      const ref = `${libro} ${j.chapter}:${v.verse}`;
      const anota = (motivo, muestra) => sospechas.push({ ref, motivo, muestra });

      // 1. La firma exacta del "hol": letras minusculas pegadas a una comilla
      //    de apertura al principio del versiculo.
      const m1 = t.match(/^[a-záéíóúüñ]{1,5}[“"«]/);
      if (m1) anota("fragmento pegado al inicio", t.slice(0, 60));

      // 2. Letras y digitos fundidos en una misma palabra (marcador colado).
      const m2 = t.match(/[a-záéíóúüñ]{2,}\d+(?![\d:])/i);
      if (m2) anota("digito pegado a palabra", m2[0] + " ...");

      // 3. Restos de marcado USFM que se hayan escapado.
      if (/\\[a-z]/i.test(t)) anota("marcado USFM sin limpiar", t.slice(0, 60));

      // 4. Comilla pegada entre dos letras sin espacio (fusion de trozos).
      const m4 = t.match(/[a-záéíóúüñ][“”][a-záéíóúüñ]/i);
      if (m4) anota("comilla fundida entre letras", m4[0]);

      // 5. Versiculo sospechosamente corto.
      if (t.length < 4) anota("versiculo casi vacio", JSON.stringify(t));
    }
  }
}

const porMotivo = {};
for (const s of sospechas) porMotivo[s.motivo] = (porMotivo[s.motivo] || 0) + 1;

console.log("  versiculos revisados :", versiculos.toLocaleString("es"));
console.log("  sospechas            :", sospechas.length);
console.log();
for (const [m, n] of Object.entries(porMotivo)) console.log(`  ${n.toString().padStart(4)}  ${m}`);
console.log();
for (const s of sospechas.slice(0, 25)) {
  console.log(`  ${s.ref.padEnd(28)} ${s.motivo}`);
  console.log(`      ${s.muestra}`);
}
