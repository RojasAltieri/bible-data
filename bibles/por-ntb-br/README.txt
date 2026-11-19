NTB-BR · Nova Tradução BibliaTodo · Texto bíblico
66 livros · 1.189 capítulos · 31.104 versículos em português brasileiro.
Esta publicação contém somente o texto bíblico, sem introduções nem notas de estudo.

O esquema JSON 3 conserva os campos públicos da BibliaTodo: libros > capitulos >
versiculos, codigo (código USFM do livro), nombre, numero e texto (texto bíblico exato).
idioma=pt, version=NTB-BR, edicion=texto. Não requer identificadores editoriais privados.
SQLite: libros(codigo,orden,nombre), versiculos(libro,capitulo,versiculo,texto),
metadatos(clave,valor). Chave do versículo: libro + capitulo + versiculo.
USFM e USX 3.1: 66 livros com identificadores USFM padrão. Codificação UTF-8.
Preserve os arquivos LICENSE.txt, CREDITS.txt, README.txt e a atribuição.
O uso e a distribuição são gratuitos conforme a licença, sem royalties ou comissões.
https://www.bibliatodo.org/pt/ntb-br/ · info@bibliatodo.org

METODOLOGIA
As traduções da BibliaTodo são feitas a partir dos textos das Escrituras em hebraico, aramaico e grego. Nossa metodologia identifica as edições textuais que utilizamos.
A fidelidade ao sentido do hebraico, do aramaico e do grego é o critério principal. A clareza não autoriza acrescentar explicações teológicas nem resolver ambiguidades que o texto e seu contexto preservam. As escolhas de tradução devem ser justificadas pelas línguas bíblicas; explicações, interpretações e aplicações são apresentadas separadamente no material de estudo.
https://www.bibliatodo.org/pt/ntb-br/credits

Também disponível em outros idiomas
Español · Nueva Traducción BibliaTodo (NTBT)
Texto bíblico · PDF: https://downloads.bibliatodo.org/texto/NTBT.pdf
Texto bíblico · EPUB: https://downloads.bibliatodo.org/texto/NTBT.epub
Edição com estudo completo · PDF: https://downloads.bibliatodo.org/estudio/NTBT.pdf
Edição com estudo completo · EPUB: https://downloads.bibliatodo.org/estudio/NTBT.epub
Todos os formatos: https://www.bibliatodo.org/es/ntbt/materials
English · BibliaTodo New Translation (BTNT)
Texto bíblico · PDF: https://downloads.bibliatodo.org/en/texto/BTNT.pdf
Texto bíblico · EPUB: https://downloads.bibliatodo.org/en/texto/BTNT.epub
Edição com estudo completo · PDF: https://downloads.bibliatodo.org/en/estudio/BTNT.pdf
Edição com estudo completo · EPUB: https://downloads.bibliatodo.org/en/estudio/BTNT.epub
Todos os formatos: https://www.bibliatodo.org/en/btnt/materials

Por que compartilhamos gratuitamente nossas traduções
Nosso maior desejo é que mais pessoas conheçam Jesus Cristo por meio das Escrituras. Compartilhamos nossas traduções sob uma licença gratuita para fins comerciais ou sem fins lucrativos, sem royalties, comissões ou taxas de licença.
Você pode imprimir para uso pessoal, distribuir a tradução completa em formato digital, inclusive em sites e aplicativos pagos, e usar versículos, citações, seleções e livros bíblicos individuais em impressos ou produtos para doar ou vender. Preserve o texto e a atribuição e identifique seus acréscimos.
Antes de imprimir a Bíblia completa, todo o Antigo Testamento ou todo o Novo Testamento para vender, doar ou distribuir a terceiros, faça o cadastro gratuito, verifique seu e-mail e solicite a aprovação por escrito da edição. Envie o protocolo e a diagramação final para info@bibliatodo.org. Não há cobrança de royalties, comissões ou taxas de licença.
Os usos autorizados diretamente não exigem cadastro. O comprovante pessoal e os avisos editoriais são opcionais. Edições aprovadas podem ser reimpressas com a mesma capa, diagramação e conteúdo editorial.
https://www.bibliatodo.org/pt/ntb-br/credits#sharing


ESTRUTURA E ENTREGA
NTB-BR-2026-11-17 · 2026-11-17
A estrutura literária não muda o texto nem a numeração. p=[versículo, deslocamento Unicode, estilo]: 0=parágrafo, 1=q1, 2=q2, 3=q3. d identifica títulos antigos; s, inícios de estrofe. Os deslocamentos contam pontos de código Unicode a partir de zero, antes do espaço que inicia a linha seguinte. JSON inclui formato em cada capítulo; SQLite usa formato_capitulos(libro,capitulo,formato). USFM/USX usam p, q1–q3, b e d; qa identifica rótulos acrósticos. A numeração própria de Salmos 47:9–10 é conservada. A data de corte identifica esta entrega separadamente do catálogo, do USFM 3.1 e da licença.
