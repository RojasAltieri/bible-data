"""Convert the publisher's NTBT text-only JSON ZIP to the BibleVerse catalog format.

Run with Python 3: python tools/import-ntbt.py /path/to/NTBT-json.zip
Source: https://downloads.bibliatodo.org/texto/NTBT-json.zip
"""

import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1] / "bibles"
VERSION = "spa-ntbt"
EDITION = "NTBT-2026-11-06"
DIGEST = "f6b0d0e01390630bffe9b70decdd523f331c14945efe56572ecf3c92fd945db2"
BOOK_CODES = """
GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB
PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG
ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT
PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV
""".split()


def encode(value):
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n").encode()


def convert(source):
    if hashlib.sha256(source.read_bytes()).hexdigest() != DIGEST:
        raise ValueError("The source ZIP differs from the reviewed edition")
    with ZipFile(source) as archive:
        bible = json.loads(archive.read("NTBT.json"))
        files = {name: archive.read(name) for name in ("CREDITOS.txt", "LICENCIA.txt", "LEEME.txt")}

    canon = json.loads((ROOT / "spa-vbl/booknames.json").read_bytes())["books"]
    if bible["identificacion"] != EDITION or [b["codigo"] for b in bible["libros"]] != BOOK_CODES:
        raise ValueError("Unexpected edition or book order")

    names = {}
    chapters = verses = 0
    for slug, book in zip(canon, bible["libros"], strict=True):
        names[slug] = book["nombre"]
        for number, chapter in enumerate(book["capitulos"], 1):
            data = []
            for index, verse in enumerate(chapter["versiculos"], 1):
                if index != verse["numero"] or not verse["texto"].strip():
                    raise ValueError(f"Invalid verse at {slug} {number}:{index}")
                extras = {k: v for k, v in verse.items() if k not in ("numero", "texto")}
                data.append({"verse": str(index), "text": verse["texto"], **extras})
            if chapter["numero"] != number or not data:
                raise ValueError(f"Invalid chapter at {slug} {number}")
            extras = {k: v for k, v in chapter.items() if k not in ("numero", "versiculos")}
            files[f"books/{slug}/chapters/{number}.json"] = encode(
                {"version": VERSION, "book": slug, "chapter": number, "data": data, **extras}
            )
            chapters += 1
            verses += len(data)
    if (len(names), chapters, verses) != (66, 1189, 31104):
        raise ValueError("Unexpected canon size")
    files["booknames.json"] = encode({
        "versionId": VERSION, "name": "Nueva Traducción BibliaTodo (NTBT)", "language": "es",
        "edition": EDITION, "sourceSha256": DIGEST,
        "copyright": "Santa Biblia, Nueva Traducción BibliaTodo (NTBT). Publicada por BibliaTodo Bible Society, sello editorial de BibliaTodo LLC. Uso, reproducción y distribución autorizados gratuitamente conforme a la Licencia NTBT. https://www.bibliatodo.org/es/ntbt/",
        "license": "BibliaTodo Bible Society · Licencia NTBT",
        "licenseUrl": "https://www.bibliatodo.org/es/ntbt/", "books": names,
    })
    with ZipFile(ROOT / f"{VERSION}.zip", "w") as output:
        for name, content in sorted(files.items()):
            path = ROOT / VERSION / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
            output.writestr(ZipInfo(name), content, compress_type=ZIP_DEFLATED)
    print(f"{EDITION}: {len(names)} books, {chapters} chapters, {verses} verses")


if __name__ == "__main__":
    convert(Path(sys.argv[1]))
