// Importa biblias open source (canon protestante de 66 libros) al formato
// del repo: bibles/<versionId>/books/<slug>/chapters/<n>.json con
// {version, book, chapter, data:[{verse, text}]}.
//
// Fuentes:
//  - getBible v2 (https://api.getbible.net/v2/<abbr>.json): un JSON por biblia.
//    Se filtra estrictamente nr 1..66 (sin deuterocanonicos).
//  - wldeh/bible-api (jsDelivr): carpetas por nombre localizado; se mapean a
//    slugs canonicos y se descarga capitulo a capitulo.
//
// Ademas escribe bibles/<versionId>/booknames.json (slug -> nombre display)
// para el seeding en Mongo.
//
// Uso:  node tools/import-open-bibles.mjs [versionId ...]  (sin args = todas)
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CANONICAL_ORDER = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth",
  "1-samuel", "2-samuel", "1-kings", "2-kings", "1-chronicles", "2-chronicles", "ezra",
  "nehemiah", "esther", "job", "psalms", "proverbs", "ecclesiastes", "song-of-solomon",
  "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
  "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah",
  "malachi", "matthew", "mark", "luke", "john", "acts", "romans", "1-corinthians",
  "2-corinthians", "galatians", "ephesians", "philippians", "colossians", "1-thessalonians",
  "2-thessalonians", "1-timothy", "2-timothy", "titus", "philemon", "hebrews", "james",
  "1-peter", "2-peter", "1-john", "2-john", "3-john", "jude", "revelation",
];

// Capitulos estandar del canon protestante (para fuentes por capitulo).
const CHAPTER_COUNTS = {
  genesis: 50, exodus: 40, leviticus: 27, numbers: 36, deuteronomy: 34, joshua: 24,
  judges: 21, ruth: 4, "1-samuel": 31, "2-samuel": 24, "1-kings": 22, "2-kings": 25,
  "1-chronicles": 29, "2-chronicles": 36, ezra: 10, nehemiah: 13, esther: 10, job: 42,
  psalms: 150, proverbs: 31, ecclesiastes: 12, "song-of-solomon": 8, isaiah: 66,
  jeremiah: 52, lamentations: 5, ezekiel: 48, daniel: 12, hosea: 14, joel: 3, amos: 9,
  obadiah: 1, jonah: 4, micah: 7, nahum: 3, habakkuk: 3, zephaniah: 3, haggai: 2,
  zechariah: 14, malachi: 4, matthew: 28, mark: 16, luke: 24, john: 21, acts: 28,
  romans: 16, "1-corinthians": 16, "2-corinthians": 13, galatians: 6, ephesians: 6,
  philippians: 4, colossians: 4, "1-thessalonians": 5, "2-thessalonians": 3,
  "1-timothy": 6, "2-timothy": 4, titus: 3, philemon: 1, hebrews: 13, james: 5,
  "1-peter": 5, "2-peter": 3, "1-john": 5, "2-john": 1, "3-john": 1, jude: 1,
  revelation: 22,
};

// Carpetas de wldeh (nombres localizados sin espacios) -> slug canonico.
const HI_FOLDERS = {
  "उत्पत्ति": "genesis", "निर्गमन": "exodus", "लैव्यव्यवस्था": "leviticus", "गिनती": "numbers",
  "व्यवस्थाविवरण": "deuteronomy", "यहोशू": "joshua", "न्यायियों": "judges", "रूत": "ruth",
  "1शमूएल": "1-samuel", "2शमूएल": "2-samuel", "1राजाओं": "1-kings", "2राजाओं": "2-kings",
  "1इतिहास": "1-chronicles", "2इतिहास": "2-chronicles", "एज्रा": "ezra", "नहेम्याह": "nehemiah",
  "एस्तेर": "esther", "अय्यूब": "job", "भजनसंहिता": "psalms", "नीतिवचन": "proverbs",
  "सभोपदेशक": "ecclesiastes", "श्रेष्ठगीत": "song-of-solomon", "यशायाह": "isaiah",
  "यिर्मयाह": "jeremiah", "विलापगीत": "lamentations", "यहेजकेल": "ezekiel", "दानिय्येल": "daniel",
  "होशे": "hosea", "योएल": "joel", "आमोस": "amos", "ओबद्याह": "obadiah", "योना": "jonah",
  "मीका": "micah", "नहूम": "nahum", "हबक्कूक": "habakkuk", "सपन्याह": "zephaniah",
  "हाग्गै": "haggai", "जकर्याह": "zechariah", "मलाकी": "malachi", "मत्ती": "matthew",
  "मरकुस": "mark", "लूका": "luke", "यूहन्ना": "john", "प्रेरितोंकेकाम": "acts",
  "रोमियों": "romans", "1कुरिन्थियों": "1-corinthians", "2कुरिन्थियों": "2-corinthians",
  "गलातियों": "galatians", "इफिसियों": "ephesians", "फिलिप्पियों": "philippians",
  "कुलुस्सियों": "colossians", "1थिस्सलुनीकियों": "1-thessalonians",
  "2थिस्सलुनीकियों": "2-thessalonians", "1तीमुथियुस": "1-timothy", "2तीमुथियुस": "2-timothy",
  "तीतुस": "titus", "फिलेमोन": "philemon", "इब्रानियों": "hebrews", "याकूब": "james",
  "1पतरस": "1-peter", "2पतरस": "2-peter", "1यूहन्ना": "1-john", "2यूहन्ना": "2-john",
  "3यूहन्ना": "3-john", "यहूदा": "jude", "प्रकाशितवाक्य": "revelation",
};

const BN_FOLDERS = {
  "আদিপুস্তক": "genesis", "যাত্রাপুস্তক": "exodus", "লেবীয়": "leviticus", "গণনা": "numbers",
  "দ্বিতীয়বিবরণ": "deuteronomy", "যিহোশূয়": "joshua", "বিচারকর্ত্তৃগণ": "judges", "রূত": "ruth",
  "1শমূয়েল": "1-samuel", "2শমূয়েল": "2-samuel", "1রাজাবলি": "1-kings", "2রাজাবলি": "2-kings",
  "1বংশাবলি": "1-chronicles", "2বংশাবলি": "2-chronicles", "ইষ্রা": "ezra", "নহিমিয়": "nehemiah",
  "ইষ্টের": "esther", "ইয়োব": "job", "গীতসংহিতা": "psalms", "হিতোপদেশ": "proverbs",
  "উপদেশক": "ecclesiastes", "পরমগীত": "song-of-solomon", "যিশাইয়": "isaiah",
  "যিরমিয়": "jeremiah", "বিলাপ": "lamentations", "যিহিস্কেল": "ezekiel", "দানিয়েল": "daniel",
  "হোশেয়": "hosea", "যোয়েল": "joel", "আমোষ": "amos", "ওবদিয়": "obadiah", "যোনা": "jonah",
  "মীখা": "micah", "নহূম": "nahum", "হবককূক": "habakkuk", "সফনিয়": "zephaniah",
  "হগয়": "haggai", "সখরিয়": "zechariah", "মালাখি": "malachi", "মথি": "matthew",
  "মার্ক": "mark", "লুক": "luke", "যোহন": "john", "প্রেরিতদেরকার্য্য": "acts",
  "রোমীয়": "romans", "1করিন্থীয়": "1-corinthians", "2করিন্থীয়": "2-corinthians",
  "গালাতীয়": "galatians", "ইফিষীয়": "ephesians", "ফিলিপীয়": "philippians",
  "কলসীয়": "colossians", "1থিষলনীকীয়": "1-thessalonians", "2থিষলনীকীয়": "2-thessalonians",
  "1তীমথিয়": "1-timothy", "2তীমথিয়": "2-timothy", "তীত": "titus", "ফিলীমন": "philemon",
  "ইব্রীয়": "hebrews", "যাকোব": "james", "1পিতর": "1-peter", "2পিতর": "2-peter",
  "1যোহন": "1-john", "2যোহন": "2-john", "3যোহন": "3-john", "যিহূদা": "jude",
  "প্রকাশিতবাক্য": "revelation",
};

const SW_FOLDERS = {
  "mwanzo": "genesis", "kutoka": "exodus", "walawi": "leviticus", "hesabu": "numbers",
  "kumbukumbu": "deuteronomy", "yoshua": "joshua", "waamuzi": "judges", "ruthu": "ruth",
  "1samweli": "1-samuel", "2samweli": "2-samuel", "1wafalme": "1-kings", "2wafalme": "2-kings",
  "1nyakati": "1-chronicles", "2nyakati": "2-chronicles", "ezra": "ezra", "nehemia": "nehemiah",
  "esta": "esther", "ayubu": "job", "zaburi": "psalms", "mithali": "proverbs",
  "mhubiri": "ecclesiastes", "wimbo": "song-of-solomon", "isaya": "isaiah",
  "yeremia": "jeremiah", "maombolezo": "lamentations", "ezekieli": "ezekiel",
  "danieli": "daniel", "hosea": "hosea", "yoeli": "joel", "amosi": "amos",
  "obadia": "obadiah", "yona": "jonah", "mika": "micah", "nahumu": "nahum",
  "habakuki": "habakkuk", "sefania": "zephaniah", "hagai": "haggai", "zekaria": "zechariah",
  "malaki": "malachi", "mathayo": "matthew", "marko": "mark", "luka": "luke",
  "yohana": "john", "matendo": "acts", "warumi": "romans", "1wakorintho": "1-corinthians",
  "2wakorintho": "2-corinthians", "wagalatia": "galatians", "waefeso": "ephesians",
  "wafilipi": "philippians", "wakolosai": "colossians", "1wathesalonike": "1-thessalonians",
  "2wathesalonike": "2-thessalonians", "1timotheo": "1-timothy", "2timotheo": "2-timothy",
  "tito": "titus", "filemoni": "philemon", "waebrania": "hebrews", "yakobo": "james",
  "1petro": "1-peter", "2petro": "2-peter", "1yohana": "1-john", "2yohana": "2-john",
  "3yohana": "3-john", "yuda": "jude", "ufunuo": "revelation",
};

// Generado con tools/generate-wldeh-folders.mjs ta-irvtam (66/66).
const TA_FOLDERS = {
  "ஆதி": "genesis",
  "யாத்": "exodus",
  "லேவி": "leviticus",
  "எண்": "numbers",
  "உபா": "deuteronomy",
  "யோசு": "joshua",
  "நியா": "judges",
  "ரூத்": "ruth",
  "1சாமு": "1-samuel",
  "2சாமு": "2-samuel",
  "1இராஜா": "1-kings",
  "2இராஜா": "2-kings",
  "1நாளா": "1-chronicles",
  "2நாளா": "2-chronicles",
  "எஸ்றா": "ezra",
  "நெகே": "nehemiah",
  "எஸ்த": "esther",
  "யோபு": "job",
  "சங்": "psalms",
  "நீதி": "proverbs",
  "பிரச": "ecclesiastes",
  "உன்": "song-of-solomon",
  "ஏசா": "isaiah",
  "எரே": "jeremiah",
  "புலம்": "lamentations",
  "எசேக்": "ezekiel",
  "தானி": "daniel",
  "ஓசியா": "hosea",
  "யோவேல்": "joel",
  "ஆமோ": "amos",
  "ஒபதி": "obadiah",
  "யோனா": "jonah",
  "மீகா": "micah",
  "நாகூ": "nahum",
  "ஆப": "habakkuk",
  "செப்ப": "zephaniah",
  "ஆகாய்": "haggai",
  "சகரி": "zechariah",
  "மல்கி": "malachi",
  "மத்": "matthew",
  "மாற்": "mark",
  "லூக்": "luke",
  "யோவா": "john",
  "அப்": "acts",
  "ரோமர்": "romans",
  "1கொரி": "1-corinthians",
  "2கொரி": "2-corinthians",
  "கலா": "galatians",
  "எபே": "ephesians",
  "பிலி": "philippians",
  "கொலோ": "colossians",
  "1தெச": "1-thessalonians",
  "2தெச": "2-thessalonians",
  "1தீமோ": "1-timothy",
  "2தீமோ": "2-timothy",
  "தீத்": "titus",
  "பிலே": "philemon",
  "எபி": "hebrews",
  "யாக்": "james",
  "1பேது": "1-peter",
  "2பேது": "2-peter",
  "1யோவா": "1-john",
  "2யோவா": "2-john",
  "3யோவா": "3-john",
  "யூதா": "jude",
  "வெளி": "revelation"
};

// Generado con tools/generate-wldeh-folders.mjs te-IN-irvtel (66/66).
const TE_FOLDERS = {
  "ఆది": "genesis",
  "నిర్గమ": "exodus",
  "లేవీ": "leviticus",
  "సంఖ్యా": "numbers",
  "ద్వితీ": "deuteronomy",
  "యెహో": "joshua",
  "న్యాయాధి": "judges",
  "రూతు": "ruth",
  "1సమూ": "1-samuel",
  "2సమూ": "2-samuel",
  "1రాజులు": "1-kings",
  "2రాజులు": "2-kings",
  "1దిన": "1-chronicles",
  "2దిన": "2-chronicles",
  "ఎజ్రా": "ezra",
  "నెహెమ్యా": "nehemiah",
  "ఎస్తేరు": "esther",
  "యోబు": "job",
  "కీర్తన": "psalms",
  "సామెత": "proverbs",
  "ప్రసంగి": "ecclesiastes",
  "పరమ": "song-of-solomon",
  "యెషయా": "isaiah",
  "యిర్మీయా": "jeremiah",
  "విలాప": "lamentations",
  "యెహె": "ezekiel",
  "దాని": "daniel",
  "హోషే": "hosea",
  "యోవే": "joel",
  "ఆమోసు": "amos",
  "ఓబద్యా": "obadiah",
  "యోనా": "jonah",
  "మీకా": "micah",
  "నహూ": "nahum",
  "హబ": "habakkuk",
  "జెఫన్యా": "zephaniah",
  "హగ్గయి": "haggai",
  "జెకర్యా": "zechariah",
  "మలాకీ": "malachi",
  "మత్తయి": "matthew",
  "మార్కు": "mark",
  "లూకా": "luke",
  "యోహాను": "john",
  "అపొస్తలులకార్యములు": "acts",
  "రోమాపత్రిక": "romans",
  "1కొరింతీపత్రిక": "1-corinthians",
  "2కొరింతీపత్రిక": "2-corinthians",
  "గలతీపత్రిక": "galatians",
  "ఎఫెసీపత్రిక": "ephesians",
  "ఫిలిప్పీపత్రిక": "philippians",
  "కొలస్సీపత్రిక": "colossians",
  "1తెస్సలోనికపత్రిక": "1-thessalonians",
  "2తెస్సలోనికపత్రిక": "2-thessalonians",
  "1తిమోతిపత్రిక": "1-timothy",
  "2తిమోతిపత్రిక": "2-timothy",
  "తీతుపత్రిక": "titus",
  "ఫిలేమోనుపత్రిక": "philemon",
  "హెబ్రీపత్రిక": "hebrews",
  "యాకోబుపత్రిక": "james",
  "1పేతురుపత్రిక": "1-peter",
  "2పేతురుపత్రిక": "2-peter",
  "1యోహానుపత్రిక": "1-john",
  "2యోహానుపత్రిక": "2-john",
  "3యోహానుపత్రిక": "3-john",
  "యూదాపత్రిక": "jude",
  "ప్రకటనగ్రంథం": "revelation"
};

// Generado con tools/generate-wldeh-folders.mjs pa-IN-irvpun (66/66).
const PA_FOLDERS = {
  "ਉਤ": "genesis",
  "ਕੂਚ": "exodus",
  "ਲੇਵੀਆਂ": "leviticus",
  "ਗਿਣਤੀ": "numbers",
  "ਬਿਵਸਥਾ": "deuteronomy",
  "ਯਹੋਸ਼ੁ": "joshua",
  "ਨਿਆਂਈ": "judges",
  "ਰੂਥ": "ruth",
  "1ਸਮੂ": "1-samuel",
  "2ਸਮੂ": "2-samuel",
  "1ਰਾਜਾ": "1-kings",
  "2ਰਾਜਾ": "2-kings",
  "1ਇਤ": "1-chronicles",
  "2ਇਤ": "2-chronicles",
  "ਅਜ਼ਰਾ": "ezra",
  "ਨਹਮਯਾਹ": "nehemiah",
  "ਅਸਤਰ": "esther",
  "ਅੱਯੂਬ": "job",
  "ਜ਼ਬੂਰ": "psalms",
  "ਕਹਾਉਤਾਂ": "proverbs",
  "ਉਪਦੇਸ਼ਕ": "ecclesiastes",
  "ਸੁਲੇਮਾਨਦਾਗੀਤ": "song-of-solomon",
  "ਯਸਾ": "isaiah",
  "ਯਿਰਮਿਯਾਹ": "jeremiah",
  "ਵਿਰਲਾਪ": "lamentations",
  "ਹਿਜ਼ਕੀਏਲ": "ezekiel",
  "ਦਾਨੀਏਲ": "daniel",
  "ਹੋਸ਼ੇ": "hosea",
  "ਯੋਏਲ": "joel",
  "ਆਮੋਸ": "amos",
  "ਓਬਦਯਾਹ": "obadiah",
  "ਯੂਨਾ": "jonah",
  "ਮੀਕਾ": "micah",
  "ਨਹੂਮ": "nahum",
  "ਹਬੱਕੂਕ": "habakkuk",
  "ਸਫ਼ਨਯਾਹ": "zephaniah",
  "ਹੱਜਈ": "haggai",
  "ਜ਼ਕਰ": "zechariah",
  "ਮਲਾਕੀ": "malachi",
  "ਮੱਤੀ": "matthew",
  "ਮਰਕੁਸ": "mark",
  "ਲੂਕਾ": "luke",
  "ਯੂਹੰਨਾ": "john",
  "ਰਸੂਲਾਂਦੇਕਰਤੱਬ": "acts",
  "ਰੋਮੀਆਂ": "romans",
  "1ਕੁਰਿੰਥੀ": "1-corinthians",
  "2ਕੁਰਿੰਥੀ": "2-corinthians",
  "ਗਲਾਤਿਯਾ": "galatians",
  "ਅਫ਼ਸੀਆਂ": "ephesians",
  "ਫਿਲਿੱਪੀਆਂ": "philippians",
  "ਕੁਲੁੱਸੀਆਂ": "colossians",
  "1ਥੱਸਲੁ": "1-thessalonians",
  "2ਥੱਸਲੁ": "2-thessalonians",
  "1ਤਿਮੋਥਿ": "1-timothy",
  "2ਤਿਮੋਥਿ": "2-timothy",
  "ਤੀਤੁਸ": "titus",
  "ਫਿਲੇਮੋਨ": "philemon",
  "ਇਬਰਾਨੀ": "hebrews",
  "ਯਾਕੂਬ": "james",
  "1ਪਤ": "1-peter",
  "2ਪਤ": "2-peter",
  "1ਯੂਹੰਨਾ": "1-john",
  "2ਯੂਹੰਨਾ": "2-john",
  "3ਯੂਹੰਨਾ": "3-john",
  "ਯਹੂਦਾ": "jude",
  "ਪਰਕਾਸ਼ਦੀਪੋਥੀ": "revelation"
};

const SPA_VBL_FOLDERS = {
  "génesis": "genesis",
  "éxodo": "exodus",
  "levítico": "leviticus",
  "números": "numbers",
  "deuteronomio": "deuteronomy",
  "josué": "joshua",
  "jueces": "judges",
  "rut": "ruth",
  "1samuel": "1-samuel",
  "2samuel": "2-samuel",
  "1reyes": "1-kings",
  "2reyes": "2-kings",
  "1crónicas": "1-chronicles",
  "2crónicas": "2-chronicles",
  "esdras": "ezra",
  "nehemías": "nehemiah",
  "ester": "esther",
  "job": "job",
  "salmos": "psalms",
  "proverbios": "proverbs",
  "eclesiastés": "ecclesiastes",
  "cantardeloscantares": "song-of-solomon",
  "isaías": "isaiah",
  "jeremías": "jeremiah",
  "lamentaciones": "lamentations",
  "ezequiel": "ezekiel",
  "daniel": "daniel",
  "oseas": "hosea",
  "joel": "joel",
  "amós": "amos",
  "abdías": "obadiah",
  "jonás": "jonah",
  "miqueas": "micah",
  "nahúm": "nahum",
  "habacuc": "habakkuk",
  "sofonías": "zephaniah",
  "ageo": "haggai",
  "zacarías": "zechariah",
  "malaquías": "malachi",
  "mateo": "matthew",
  "marcos": "mark",
  "lucas": "luke",
  "juan": "john",
  "hechos": "acts",
  "romanos": "romans",
  "1corintios": "1-corinthians",
  "2corintios": "2-corinthians",
  "gálatas": "galatians",
  "efesios": "ephesians",
  "filipenses": "philippians",
  "colosenses": "colossians",
  "1tesalonicenses": "1-thessalonians",
  "2tesalonicenses": "2-thessalonians",
  "1timoteo": "1-timothy",
  "2timoteo": "2-timothy",
  "tito": "titus",
  "filemón": "philemon",
  "hebreos": "hebrews",
  "santiago": "james",
  "1pedro": "1-peter",
  "2pedro": "2-peter",
  "1juan": "1-john",
  "2juan": "2-john",
  "3juan": "3-john",
  "judas": "jude",
  "apocalipsis": "revelation",
};

const SOURCES = {
  // Versión Biblia Libre (Free Bible Version): la unica traduccion moderna al
  // español con licencia abierta declarada. CC BY-SA 4.0,
  // (c) 2018-2020 Jonathan Gallagher y Shelly Barrios de Avila
  // (Free Bible Ministry, freebibleversion.org). Antiguo y Nuevo completos.
  //
  // OJO: eBible.org solo aloja el Nuevo Testamento y titula su edicion
  // "Versión Biblia Libre, Nuevo Testamento". Mirar solo ahi lleva a concluir
  // que el Antiguo no existe. El editor publica la Biblia entera (v5.2,
  // octubre 2025) y el espejo de wldeh trae los 66 libros: verificado
  // comparando Genesis 1:1 con YouVersion, son identicos.
  "spa-vbl": { type: "wldeh", id: "es-vbl", folders: SPA_VBL_FOLDERS, name: "Versión Biblia Libre", lang: "es" },
  "zho-cus": { type: "getbible", abbr: "cus", name: "圣经和合本 (简体)", lang: "zh" },
  // japkougo esta incompleta en getBible (faltan 25 capitulos); se usa la
  // clasica de dominio publico: Meiji Motoyaku AT + Taisho Kaiyaku NT.
  "jpn-bungo": { type: "getbible", abbr: "japbungo", name: "文語訳聖書", lang: "ja" },
  "rus-synodal": { type: "getbible", abbr: "synodal", name: "Синодальный перевод", lang: "ru" },
  "ita-diodati": { type: "getbible", abbr: "giovanni", name: "Diodati (1649)", lang: "it" },
  "arb-svd": { type: "getbible", abbr: "arabicsv", name: "سميث وفان دايك", lang: "ar" },
  "tgl-adb": { type: "getbible", abbr: "tagalog", name: "Ang Dating Biblia (1905)", lang: "tl" },
  // getBible "swahili" es solo NT y le falta Filipenses; se usa la Biblia
  // completa abierta de Biblica: Neno 2015 (66 libros).
  "swh-neno": { type: "wldeh", id: "swh-onen", folders: SW_FOLDERS, name: "Neno: Biblia Takatifu (2015)", lang: "sw" },
  "hin-irv": { type: "wldeh", id: "hi-IN-irvhin", folders: HI_FOLDERS, name: "इंडियन रिवाइज्ड वर्जन (IRV) 2019", lang: "hi" },
  "ben-irv": { type: "wldeh", id: "bn-irvben", folders: BN_FOLDERS, name: "ইন্ডিয়ান রিভাইজড ভার্সন (IRV) 2019", lang: "bn" },
  // 2026-07-29: ambas dominio publico verificado en distribution_license de getBible.
  // OJO: getBible "turkish" (Kutsal Kitap) NO se puede usar: "Copyrighted; Permission
  // to distribute granted to CrossWire" — el permiso es de CrossWire, no nuestro.
  // Alternativa libre para turco: turytc (Turkish WEB, CC BY-SA) en eBible.org.
  "zho-cut": { type: "getbible", abbr: "cut", name: "聖經和合本 (繁體)", lang: "zhHant" },
  "vie-1934": { type: "getbible", abbr: "vietnamese", name: "Kinh Thánh Tiếng Việt (1934)", lang: "vi" },
  "fin-1776": { type: "getbible", abbr: "finnish1776", name: "Biblia (1776)", lang: "fi" },
  // getBible deja distribution_license vacio para modernhebrew, pero el catalogo
  // de eBible.org lo declara "public domain" (mismo origen: Unbound Bible/Biola).
  "heb-modern": { type: "getbible", abbr: "modernhebrew", name: "תנ״ך ועברית מודרנית", lang: "he" },
  // NO AGREGAR getBible "thai" (Thai KJV): distribution_license =
  // "Copyrighted; Permission to distribute granted to CrossWire" — mismo caso que turkish.
  // Paquete India: IRV de Bridge Connectivity, CC BY-SA 4.0 (misma licencia
  // que hin-irv/ben-irv). Mapas de libro generados y validados automaticamente.
  "tam-irv": { type: "wldeh", id: "ta-irvtam", folders: TA_FOLDERS, name: "இண்டியன் ரிவைஸ்டு வெர்ஸன் (IRV) - தமிழ் 2019", lang: "ta" },
  "tel-irv": { type: "wldeh", id: "te-IN-irvtel", folders: TE_FOLDERS, name: "ఇండియన్ రివైజ్డ్ వెర్షన్ (IRV) - తెలుగు 2019", lang: "te" },
  "pan-irv": { type: "wldeh", id: "pa-IN-irvpun", folders: PA_FOLDERS, name: "ਇੰਡਿਅਨ ਰਿਵਾਇਜ਼ਡ ਵਰਜ਼ਨ (IRV) - ਪੰਜਾਬੀ 2019", lang: "pa" },
};

const clean = (s) => String(s ?? "").replace(/﻿/g, "").trim();

// Algunas biblias de wldeh traen CADA VERSICULO REPETIDO: es-vbl devuelve los
// 36 versiculos de Juan 3 dos veces, 72 entradas. Escribirlos tal cual duplica
// el texto en la app, y contarlos rompe la identificacion de libros por huella
// digital de generate-wldeh-folders.mjs. Se quita la repeticion aqui tambien
// para que el arreglo no dependa de acordarse de regenerar el mapa.
function dedupeVersiculos(rows) {
  const vistos = new Set();
  return rows.filter((v) => {
    const k = String(v?.verse ?? "");
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (attempt === retries) throw new Error(`${url}: ${error.message}`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  return null;
}

async function writeChapter(versionId, slug, chapterNumber, verses) {
  const dir = path.join(repoRoot, "bibles", versionId, "books", slug, "chapters");
  await mkdir(dir, { recursive: true });
  const payload = {
    version: versionId,
    book: slug,
    chapter: chapterNumber,
    data: verses.map((v) => ({ verse: String(v.verse), text: clean(v.text) })),
  };
  await writeFile(path.join(dir, `${chapterNumber}.json`), JSON.stringify(payload));
}

async function importGetbible(versionId, cfg) {
  console.log(`\n[${versionId}] descargando getBible/${cfg.abbr}...`);
  const full = await fetchJson(`https://api.getbible.net/v2/${cfg.abbr}.json`);
  if (!full?.books) throw new Error("respuesta sin books");
  const bookNames = {};
  let books = 0;
  for (const book of full.books) {
    const nr = Number(book.nr);
    if (!Number.isInteger(nr) || nr < 1 || nr > 66) continue; // canon 66, sin apocrifos
    const slug = CANONICAL_ORDER[nr - 1];
    bookNames[slug] = clean(book.name);
    for (const ch of book.chapters ?? []) {
      const verses = (ch.verses ?? []).filter((v) => clean(v.text).length > 0);
      if (!verses.length) continue;
      await writeChapter(versionId, slug, Number(ch.chapter), verses);
    }
    books++;
  }
  return { books, bookNames };
}

async function importWldeh(versionId, cfg) {
  console.log(`\n[${versionId}] descargando wldeh/${cfg.id}...`);
  const base = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${cfg.id}/books`;
  const bookNames = {};
  let books = 0;
  for (const [folder, slug] of Object.entries(cfg.folders)) {
    const total = CHAPTER_COUNTS[slug];
    const tasks = [];
    for (let n = 1; n <= total; n++) {
      tasks.push(
        fetchJson(`${base}/${encodeURIComponent(folder)}/chapters/${n}.json`).then(
          (json) => ({ n, json }),
        ),
      );
    }
    const results = [];
    // lotes de 15 para no saturar el CDN
    for (let i = 0; i < tasks.length; i += 15) {
      results.push(...(await Promise.all(tasks.slice(i, i + 15))));
    }
    let written = 0;
    for (const { n, json } of results) {
      const rows = dedupeVersiculos(json?.data ?? []).filter(
        (v) => clean(v.text).length > 0,
      );
      if (!rows.length) continue;
      if (!bookNames[slug] && rows[0].book) bookNames[slug] = clean(rows[0].book);
      await writeChapter(versionId, slug, n, rows);
      written++;
    }
    if (written === 0) console.warn(`  AVISO ${slug}: sin capitulos`);
    else books++;
    process.stdout.write(`  ${slug}: ${written}/${total}\n`);
  }
  return { books, bookNames };
}

const requested = process.argv.slice(2);
const targets = requested.length ? requested : Object.keys(SOURCES);
for (const versionId of targets) {
  const cfg = SOURCES[versionId];
  if (!cfg) throw new Error(`Version desconocida: ${versionId}`);
  const done = path.join(repoRoot, "bibles", versionId, "booknames.json");
  if (existsSync(done) && !process.env.FORCE) {
    console.log(`[${versionId}] ya importada (bibles/${versionId}/booknames.json existe)`);
    continue;
  }
  const { books, bookNames } =
    cfg.type === "getbible"
      ? await importGetbible(versionId, cfg)
      : await importWldeh(versionId, cfg);
  await writeFile(
    done,
    JSON.stringify({ versionId, name: cfg.name, language: cfg.lang, books: bookNames }, null, 2),
  );
  console.log(`[${versionId}] OK: ${books} libros`);
}
console.log("\nImportacion completa.");
