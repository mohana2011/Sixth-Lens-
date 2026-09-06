// Generates placeholder transparent-PNG logo marks (a simple ring + "SL"
// monogram) with zero dependencies, so the app has something to render out
// of the box. Replace public/logo-black.png and public/logo-white.png with
// your real logo files whenever you're ready — the app already points at
// those exact filenames, no code changes needed.
//
// This hand-rolls a minimal PNG encoder (not via sharp) because sharp's
// native binary refuses to load on this machine's Node 19.8.1 — sharp
// requires Node ^18.17 / ^20.3 / >=21. The actual upload pipeline
// (app/api/galleries/[id]/photos/route.ts) needs a supported Node version
// to run; see the README note.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 256;

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Draws a ring + a simple blocky "S" and "L" using rectangles (no font
// rendering needed) onto an RGBA pixel buffer.
function renderMark(rgb) {
  const px = new Uint8Array(SIZE * SIZE * 4);
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = SIZE * 0.42;
  const ringWidth = SIZE * 0.02;

  function setPixel(x, y, a) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    px[i] = rgb[0];
    px[i + 1] = rgb[1];
    px[i + 2] = rgb[2];
    px[i + 3] = Math.max(px[i + 3], a);
  }

  // Ring.
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (Math.abs(d - outerR) < ringWidth) setPixel(x, y, 255);
    }
  }

  // Blocky monogram "S L" as filled rectangles, roughly centered.
  const bars = [
    // S (three horizontal bars + two verticals, drawn as simple strokes)
    [0.28, 0.34, 0.46, 0.4],
    [0.28, 0.46, 0.34, 0.52],
    [0.28, 0.46, 0.46, 0.52],
    [0.4, 0.52, 0.46, 0.58],
    [0.28, 0.58, 0.46, 0.64],
    // L
    [0.54, 0.34, 0.6, 0.64],
    [0.54, 0.58, 0.72, 0.64],
  ];
  for (const [x0, y0, x1, y1] of bars) {
    for (let y = Math.round(y0 * SIZE); y < Math.round(y1 * SIZE); y++) {
      for (let x = Math.round(x0 * SIZE); x < Math.round(x1 * SIZE); x++) {
        setPixel(x, y, 255);
      }
    }
  }

  return px;
}

function encodePng(px) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (1 + SIZE * 4);
    raw[rowStart] = 0; // filter: none
    raw.set(px.subarray(y * SIZE * 4, (y + 1) * SIZE * 4), rowStart + 1);
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function main() {
  const outDir = path.join(__dirname, '..', 'public');
  fs.writeFileSync(path.join(outDir, 'logo-black.png'), encodePng(renderMark([17, 17, 16])));
  fs.writeFileSync(path.join(outDir, 'logo-white.png'), encodePng(renderMark([255, 255, 255])));
  console.log('Placeholder logos written to /public');
}

main();
