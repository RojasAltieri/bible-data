# Versión Biblia Libre (VBL)

**Free Bible Version — Spanish**

Copyright © 2018-2020 Jonathan Gallagher y Shelly Barrios de Avila

Publicada y distribuida por **Free Bible Ministry, Inc.**
P.O. Box 594, Fulton MD 20959, Estados Unidos
<https://www.freebibleversion.org>

## Licencia

Este texto se distribuye bajo la licencia
**Creative Commons Reconocimiento-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)**.

<https://creativecommons.org/licenses/by-sa/4.0/deed.es>

Se permite usar y redistribuir el texto siempre que:

1. Se identifique como **Free Bible Version / Versión Biblia Libre** e incluya
   este aviso de copyright y la fuente.
2. Si se modifica el texto, se indique claramente que se hizo, de forma que
   quede claro que el licenciante original no respalda necesariamente los
   cambios.
3. Cualquier redistribución o adaptación se publique bajo **esta misma
   licencia**.

## CAMBIOS RESPECTO AL ORIGINAL

La CC BY-SA permite modificar el texto **siempre que se declare**. Esto es lo
que se ha hecho, y nada más:

### 1. Se han quitado las notas del traductor

El USFM trae notas al pie delimitadas (`\f … \f*`). **No se incluyen en esta
copia.** Son comentario del traductor, no Escritura, y algunas toman postura
sobre asuntos discutidos —por ejemplo la de 1 Corintios 14:2 sobre el don de
lenguas—. Mezcladas con el versículo se leen como si fueran texto bíblico.

El texto bíblico **no se ha tocado** al quitarlas: en USFM el pie viene
delimitado y se extrae sin ambigüedad.

### 2. Se han corregido dos erratas tipográficas

| Referencia | Original | Corregido |
|---|---|---|
| Mateo 17:20 | `hol“Porque ustedes…` | `“Porque ustedes…` |
| Jueces 12:6 | `dirían“Sibboleth”` | `dirían “Sibboleth”` |

Son tres caracteres sueltos y un espacio ausente, no decisiones de traducción.
Están declaradas en `tools/import-vbl-usfm.mjs` a la vista. **Se ha avisado al
editor** para que se corrijan en origen.

### 3. Los 16 versículos que la VBL omite siguen omitidos

Mateo 17:21, 18:11, 23:14 · Marcos 7:16, 9:44, 9:46, 11:26, 15:28 · Lucas
17:36, 23:17 · Juan 5:4 · Hechos 8:37, 15:34, 24:7, 28:29 · Romanos 16:24.

Los traductores no los incluyen porque no aparecen en los manuscritos griegos
más antiguos. **Esa decisión es suya, no nuestra**, y se respeta. La numeración
conserva el hueco a propósito: renumerar rompería la correspondencia con
cualquier otra Biblia, comentario o concordancia.

Estos versículos **sí están** en las Reina-Valera de este mismo repositorio.

## De dónde salió esta copia

Importada el 2026-08-22 desde el **USFM oficial del editor** con
`tools/import-vbl-usfm.mjs`: 66 libros, 1.189 capítulos, 31.086 versículos.
Incluye los números de Strong que trae la fuente.

### Por qué el USFM y no un espejo

Se importó primero desde el espejo `wldeh/bible-api`, y se descartó: trae los
pies de nota **pegados dentro del versículo, sin marca alguna**, y separarlos
por heurística resultó imposible sin comerse texto bíblico (falló en 49
versículos; en Gálatas 2:2 se tragó «Me reuní en privado con los líderes
reconocidos»).

El editor publica el Antiguo Testamento en PDF y eBible.org solo aloja el Nuevo
Testamento, así que el USFM de `freely-given.org` es la única fuente
estructurada con la Biblia completa y los pies delimitados.

## Comprobaciones

- `tools/verificar-vbl.mjs` — contrasta esta importación contra el espejo,
  versículo por versículo, y falla si se perdió texto.
- `tools/buscar-erratas.mjs` — barre los 31.086 versículos buscando restos de
  marcado y fragmentos pegados. **Da cero.**

Detalle en `../../../vault/apps/biblias-en-espanol-libres.md`.
