import { deflateSync, crc32 } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const SIZE = 512;
const OUT = "public/textures/grain.png";
const LEVEL_SHARES = [0.015, 0.05, 0.12];
const PALETTE = [
  [120, 120, 120],
  [165, 165, 165],
  [210, 210, 210],
  [255, 255, 255],
];

let seed = 0x1d2c3b4a;
function random() {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function wrappedBlur(src: Float32Array): Float32Array {
  const out = new Float32Array(src.length);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += src[((y + dy + SIZE) % SIZE) * SIZE + ((x + dx + SIZE) % SIZE)];
        }
      }
      out[y * SIZE + x] = sum / 9;
    }
  }
  return out;
}

const noise = new Float32Array(SIZE * SIZE).map(random);
const blurred = wrappedBlur(noise);
const field = blurred.map((v, i) => v * 0.75 + noise[i] * 0.25);

const sorted = Float32Array.from(field).sort();
let cumulative = 0;
const cuts = LEVEL_SHARES.map((share) => {
  cumulative += share;
  return sorted[Math.floor(cumulative * sorted.length)];
});

const rowBytes = SIZE / 4;
const raw = Buffer.alloc((rowBytes + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  const rowStart = y * (rowBytes + 1);
  for (let x = 0; x < SIZE; x++) {
    const v = field[y * SIZE + x];
    const level = v <= cuts[0] ? 0 : v <= cuts[1] ? 1 : v <= cuts[2] ? 2 : 3;
    raw[rowStart + 1 + (x >> 2)] |= level << (6 - 2 * (x & 3));
  }
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0);
header.writeUInt32BE(SIZE, 4);
header[8] = 2;
header[9] = 3;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("PLTE", Buffer.from(PALETTE.flat())),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`${OUT}: ${png.length} bytes`);
