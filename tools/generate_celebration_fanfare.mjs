// Genera assets/celebrations/fanfare.wav: fanfarria triunfal chiptune
// (sintesis propia, sin samples de terceros). PCM WAV 22050 Hz 16-bit mono.
// El sonido de cada celebracion es swappable via soundUrl (jsDelivr).
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 22050;

const NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, Bb4: 466.16, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, C6: 1046.5 };

// Fanfarria: motivo ascendente + acorde final sostenido (Do mayor).
// [freqs simultaneas], duracion en beats
const BPM = 132;
const SCORE = [
  [[NOTE.C4, NOTE.C5], 0.5],
  [[NOTE.E4, NOTE.E5], 0.5],
  [[NOTE.G4, NOTE.G5], 0.5],
  [[NOTE.C5, NOTE.C6], 1.0],
  [[], 0.25],
  [[NOTE.G4, NOTE.G5], 0.5],
  [[NOTE.A4, NOTE.A5], 0.5],
  [[NOTE.C5, NOTE.C6], 1.5],
  [[], 0.25],
  [[NOTE.F4, NOTE.A4, NOTE.C5, NOTE.F5], 0.75],
  [[NOTE.G4, NOTE.B4, NOTE.D5, NOTE.G5], 0.75],
  [[NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.E5], 2.5],
];

function squareWave(t, freq) {
  return Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.6 +
    Math.sin(2 * Math.PI * freq * t) * 0.4; // mezcla square+seno: menos aspero
}

const beatSec = 60 / BPM;
const totalSec = SCORE.reduce((s, [, b]) => s + b * beatSec, 0) + 0.6;
const samples = new Float64Array(Math.ceil(totalSec * SR));

let cursor = 0;
for (const [freqs, beats] of SCORE) {
  const durSec = beats * beatSec;
  const n = Math.floor(durSec * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // Envolvente: ataque rapido, caida suave; el acorde final decae largo.
    const attack = Math.min(1, t / 0.015);
    const release = Math.max(0, 1 - t / (durSec * 1.05));
    const env = attack * release;
    let value = 0;
    for (const f of freqs) value += squareWave(t, f) / Math.max(2, freqs.length);
    // Vibrato sutil para calidez
    samples[cursor + i] += value * env * 0.55 * (1 + 0.02 * Math.sin(2 * Math.PI * 5.5 * t));
  }
  cursor += n;
}

// Normalizar y convertir a PCM16
let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const scale = peak > 0 ? 0.9 / peak : 1;
const pcm = Buffer.alloc(samples.length * 2);
for (let i = 0; i < samples.length; i++) {
  pcm.writeInt16LE(Math.round(samples[i] * scale * 32767), i * 2);
}

// Cabecera WAV
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);

const outDir = path.join(repoRoot, "assets", "celebrations");
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "fanfare.wav");
writeFileSync(outFile, Buffer.concat([header, pcm]));
console.log(`OK ${outFile} (${((44 + pcm.length) / 1024).toFixed(0)} KB, ${totalSec.toFixed(1)}s)`);
