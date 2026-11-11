import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const c = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    let cTable = [];
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = (v & 1) ? (0xedb88320 ^ (v >>> 1)) : (v >>> 1);
      cTable[n] = v;
    }
    let val = 0xffffffff;
    for (let i = 0; i < c.length; i++) val = cTable[(val ^ c[i]) & 0xff] ^ (val >>> 8);
    crc.writeUInt32BE((val ^ 0xffffffff) >>> 0, 0);
    return Buffer.concat([len, t, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const rawRows = [];
  for (let y = 0; y < height; y++) {
    rawRows.push(Buffer.from([0])); // filter type 0
    rawRows.push(rgbaBuffer.subarray(y * width * 4, (y + 1) * width * 4));
  }
  const idat = chunk('IDAT', zlib.deflateSync(Buffer.concat(rawRows)));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, chunk('IHDR', ihdr), idat, iend]);
}

function createIco(pngBuffer, width, height) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(1, 4); // count 1

  const entry = Buffer.alloc(16);
  entry.writeUInt8(width === 256 ? 0 : width, 0);
  entry.writeUInt8(height === 256 ? 0 : height, 1);
  entry.writeUInt8(0, 2); // colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bpp
  entry.writeUInt32LE(pngBuffer.length, 8); // size
  entry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  return Buffer.concat([header, entry, pngBuffer]);
}

// Generate a 48x48 icon
const size = 48;
const buf = Buffer.alloc(size * size * 4, 0);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const idx = (y * size + x) * 4;
  // Alpha blend
  const prevA = buf[idx + 3] / 255;
  const curA = a / 255;
  const outA = curA + prevA * (1 - curA);
  if (outA > 0) {
    buf[idx] = Math.round((r * curA + buf[idx] * prevA * (1 - curA)) / outA);
    buf[idx + 1] = Math.round((g * curA + buf[idx + 1] * prevA * (1 - curA)) / outA);
    buf[idx + 2] = Math.round((b * curA + buf[idx + 2] * prevA * (1 - curA)) / outA);
    buf[idx + 3] = Math.round(outA * 255);
  }
}

// Render shield & OP monogram
const cx = size / 2;
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    // Shield boundary test
    // top flat: y from 2 to 8, sides x from (24 - dy*...)
    const ny = y / size;
    const nx = Math.abs(x - cx) / (size / 2);
    
    // Shield contour
    let inShield = false;
    let onBorder = false;
    if (y >= 3 && y <= 45) {
      let maxW = 0.88;
      if (y > 18) {
        // taper down to point at y=45
        const prog = (y - 18) / (45 - 18);
        maxW = 0.88 * Math.sqrt(Math.max(0, 1 - prog * prog * 0.95));
      }
      if (nx <= maxW) {
        inShield = true;
        if (nx >= maxW - 0.1 || y <= 5 || (y >= 43 && nx >= maxW - 0.2)) {
          onBorder = true;
        }
      }
    }

    if (inShield) {
      if (onBorder) {
        // Gold gradient
        const t = y / size;
        setPixel(x, y, 212 + t * 20, 175 - t * 40, 55 - t * 20, 255);
      } else {
        // Dark metallic background
        const bg = 18 + Math.round((1 - y / size) * 15);
        setPixel(x, y, bg, bg + 2, bg + 6, 255);
      }
    }
  }
}

// Draw 'O' and 'P'
// 'O' on left (cx - 7, cy = 24, r=8)
for (let y = 16; y <= 32; y++) {
  for (let x = 11; x <= 27; x++) {
    const dx = (x - 19) / 7;
    const dy = (y - 24) / 7;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 1.05 && dist >= 0.55) {
      setPixel(x, y, 240, 245, 250, 255); // Silver/White
    }
  }
}

// 'P' on right (vertical bar x: 23-27, y: 16-36; loop x: 23-37, y: 16-27)
for (let y = 15; y <= 35; y++) {
  for (let x = 23; x <= 27; x++) {
    setPixel(x, y, 220, 180, 60, 255); // Gold stem
  }
}
for (let y = 15; y <= 27; y++) {
  for (let x = 25; x <= 37; x++) {
    const dx = (x - 30) / 6;
    const dy = (y - 21) / 5.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 1.1 && dist >= 0.45) {
      setPixel(x, y, 225, 185, 65, 255); // Gold loop
    }
  }
}

const png = createPng(size, size, buf);
const ico = createIco(png, size, size);
fs.writeFileSync('public/favicon.ico', ico);
fs.writeFileSync('public/apple-touch-icon.png', png);
console.log('Successfully generated public/favicon.ico and public/apple-touch-icon.png');
