BTNT · BibliaTodo New Translation · Biblical text
66 books · 1,189 chapters · 31,104 verses. Initial English release: text only.

JSON schema 3 retains the established BibliaTodo field names: libros > capitulos >
versiculos, codigo (USFM book code), nombre, numero, texto (exact Bible text).
idioma=en, version=BTNT, edicion=texto. No private editorial identifiers are needed.
SQLite: libros(codigo,orden,nombre), versiculos(libro,capitulo,versiculo,texto),
metadatos(clave,valor). Verse key: libro + capitulo + versiculo.
USFM and USX 3.1: 66 books, standard USFM identifiers. UTF-8 throughout.
Introductions and study notes will be delivered in a subsequent identified edition.
Preserve the accompanying LICENSE.txt, CREDITS.txt and attribution. Use and distribution are free under the accompanying license, without royalties or commissions.
https://www.bibliatodo.org/en/btnt/ · info@bibliatodo.org


METHODOLOGY
BibliaTodo translations are made from the Hebrew, Aramaic, and Greek texts of Scripture. Our methodology identifies the textual editions we use.
Faithfulness to the meaning of the Hebrew, Aramaic, and Greek is the primary criterion. Clear wording must not introduce theological explanations or resolve ambiguities that the text and its context retain. Translation choices must be justified from the biblical languages; explanations, interpretations, and applications are presented separately in study material.
https://www.bibliatodo.org/en/btnt/credits

Also available in other languages
Español · Nueva Traducción BibliaTodo (NTBT)
Bible text · PDF: https://downloads.bibliatodo.org/texto/NTBT.pdf
Bible text · EPUB: https://downloads.bibliatodo.org/texto/NTBT.epub
Complete study edition · PDF: https://downloads.bibliatodo.org/estudio/NTBT.pdf
Complete study edition · EPUB: https://downloads.bibliatodo.org/estudio/NTBT.epub
All formats: https://www.bibliatodo.org/es/ntbt/materials
Português (Brasil) · Nova Tradução BibliaTodo (NTB-BR)
Bible text · PDF: https://downloads.bibliatodo.org/pt/texto/NTB-BR.pdf
Bible text · EPUB: https://downloads.bibliatodo.org/pt/texto/NTB-BR.epub
All formats: https://www.bibliatodo.org/pt/ntb-br/materials

Why we share our translations freely
Our greatest hope is that more people will come to know Jesus Christ through Scripture. We share our translations under a free license for commercial and nonprofit uses, with no royalties, commissions, or license fees.
You may print for personal use, distribute the full translation digitally, including on paid websites and apps, and use verses, quotations, selections, and individual Bible books in printed materials or products to give away or sell. Preserve the text and attribution and clearly identify your additions.
Before printing a complete Bible, the complete Old Testament, or the complete New Testament for sale, donation, or distribution to third parties, register free of charge, verify your email address, and request written approval of the edition. Send your reference number and the final layout to info@bibliatodo.org. There are no royalties, commissions, or license fees.
Directly permitted uses require no registration. A personal certificate and editorial updates are optional. Approved editions may be reprinted with the same cover, layout, and editorial content.
https://www.bibliatodo.org/en/btnt/credits#sharing


STRUCTURE AND RELEASE
BTNT-2026-11-17 · 2026-11-17
Literary structure does not change the wording or verse numbering. p=[verse, Unicode offset, style]: 0=paragraph, 1=q1, 2=q2, 3=q3. d identifies ancient descriptive titles; s identifies stanza starts. Offsets count Unicode code points from zero, before the whitespace starting the following line. JSON includes formato in each chapter; SQLite uses formato_capitulos(libro,capitulo,formato). USFM/USX use p, q1–q3, b and d; qa marks acrostic labels. The edition retains Psalm 47:9–10 as two verses. The cutoff date identifies this release independently of the catalog number, USFM 3.1 and license.
