'use strict';

/**
 * 生成应用图标 build/icon.ico 与 build/icon.png
 *
 * 不依赖任何图像库:自己实现 PNG 编码(zlib 是 Node 内置的)和 ICO 封装,
 * 图形用有符号距离场(SDF)绘制,自带抗锯齿。
 *
 *   node tools/make-icon.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/* ============================ 图形绘制 ============================ */

// 配色:深蓝 -> 亮蓝 的对角渐变
const BG_FROM = [29, 78, 216];   // #1d4ed8
const BG_TO = [14, 165, 233];    // #0ea5e9
const FG = [255, 255, 255];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** 圆角矩形的有符号距离(负值在内部) */
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/** 圆环的有符号距离 */
function sdRing(px, py, cx, cy, radius, thickness) {
  return Math.abs(Math.hypot(px - cx, py - cy) - radius) - thickness / 2;
}

/** 椭圆环的有符号距离(近似) */
function sdEllipseRing(px, py, cx, cy, rx, ry, thickness) {
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  const d = Math.hypot(dx, dy);
  // 把归一化距离换回像素尺度
  return Math.abs(d - 1) * Math.min(rx, ry) - thickness / 2;
}

/** 水平线段(带圆头)的有符号距离 */
function sdSegment(px, py, x0, y0, x1, y1, thickness) {
  const vx = x1 - x0, vy = y1 - y0;
  const wx = px - x0, wy = py - y0;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : clamp((wx * vx + wy * vy) / len2, 0, 1);
  return Math.hypot(wx - vx * t, wy - vy * t) - thickness / 2;
}

/** 距离 -> 覆盖率(1px 过渡带,得到抗锯齿) */
const coverage = (d) => clamp(0.5 - d, 0, 1);

/** alpha 混合:把 src 颜色按 a(0~1)叠加到 dst(0~255 量级的 RGBA)上 */
function blend(dst, src, a) {
  if (a <= 0) return;
  const inv = 1 - a;
  dst[0] = src[0] * a + dst[0] * inv;
  dst[1] = src[1] * a + dst[1] * inv;
  dst[2] = src[2] * a + dst[2] * inv;
  // 注意:颜色是 0~255,而 a 是 0~1 的覆盖率,所以 alpha 要乘 255
  dst[3] = a * 255 + dst[3] * inv;
}

/**
 * 渲染一张 size x size 的 RGBA 图标
 * 设计:圆角方块渐变底 + 白色地球(圆环 + 赤道 + 经线椭圆)
 */
function renderIcon(size) {
  const S = size;
  const buf = new Uint8ClampedArray(S * S * 4); // 全透明
  const cx = S / 2, cy = S / 2;

  // 背景圆角方块:留 2% 边距,圆角半径 22%
  const margin = S * 0.02;
  const hw = S / 2 - margin, hh = S / 2 - margin;
  const radius = S * 0.22;

  // 地球几何
  const globeR = S * 0.295;          // 主圆半径
  const stroke = Math.max(S * 0.052, 0.9); // 线宽(小尺寸下保底)
  const ellipseRx = globeR * 0.46;

  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const px = x + 0.5, py = y + 0.5;
      const i = (y * S + x) * 4;

      // --- 背景 ---
      const dBg = sdRoundRect(px, py, cx, cy, hw, hh, radius);
      const aBg = coverage(dBg);
      if (aBg > 0) {
        // 对角渐变:左上 -> 右下
        const t = clamp(((px / S) + (py / S)) / 2, 0, 1);
        const col = [
          BG_FROM[0] + (BG_TO[0] - BG_FROM[0]) * t,
          BG_FROM[1] + (BG_TO[1] - BG_FROM[1]) * t,
          BG_FROM[2] + (BG_TO[2] - BG_FROM[2]) * t,
        ];
        blend(buf.subarray(i, i + 4), col, aBg);
      }
      if (aBg < 0.5) continue; // 方块外不再画前景

      // --- 前景地球(白色) ---
      const dOuter = sdRing(px, py, cx, cy, globeR, stroke);
      const aOuter = coverage(dOuter);
      if (aOuter > 0) blend(buf.subarray(i, i + 4), FG, aOuter);

      const dEquator = sdSegment(px, py, cx - globeR, cy, cx + globeR, cy, stroke * 0.9);
      const aEquator = coverage(dEquator) * (Math.hypot(px - cx, py - cy) <= globeR + stroke / 2 ? 1 : 0);
      if (aEquator > 0) blend(buf.subarray(i, i + 4), FG, aEquator);

      const dMeridian = sdEllipseRing(px, py, cx, cy, ellipseRx, globeR, stroke * 0.9);
      const aMeridian = coverage(dMeridian) * (Math.hypot(px - cx, py - cy) <= globeR + stroke / 2 ? 1 : 0);
      if (aMeridian > 0) blend(buf.subarray(i, i + 4), FG, aMeridian);
    }
  }

  // 把 Uint8ClampedArray 转成普通 Buffer
  return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
}

/* ============================ PNG 编码 ============================ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** 把 RGBA 像素编码成 PNG */
function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  // 每行前面加一个 filter 字节(0 = None)
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ============================ ICO 编码 ============================ */

/** 把 RGBA 编成 ICO 里的 BMP(DIB)格式:32bpp BGRA + AND 掩码 */
function encodeDib(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);          // biSize
  header.writeInt32LE(size, 4);         // biWidth
  header.writeInt32LE(size * 2, 8);     // biHeight(含掩码,所以是 2 倍)
  header.writeUInt16LE(1, 12);          // biPlanes
  header.writeUInt16LE(32, 14);         // biBitCount
  header.writeUInt32LE(0, 16);          // biCompression = BI_RGB
  header.writeUInt32LE(0, 20);          // biSizeImage

  // 像素数据:BGRA,自下而上
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    const srcY = size - 1 - y; // 翻转
    for (let x = 0; x < size; x += 1) {
      const s = (srcY * size + x) * 4;
      const d = (y * size + x) * 4;
      pixels[d] = rgba[s + 2];     // B
      pixels[d + 1] = rgba[s + 1]; // G
      pixels[d + 2] = rgba[s];     // R
      pixels[d + 3] = rgba[s + 3]; // A
    }
  }

  // AND 掩码:32bpp 时 Windows 用 alpha 通道,掩码全 0 即可
  const maskStride = Math.ceil(size / 32) * 4;
  const mask = Buffer.alloc(maskStride * size, 0);

  return Buffer.concat([header, pixels, mask]);
}

/** 组装 ICO 文件 */
function encodeIco(entries) {
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);              // reserved
  dir.writeUInt16LE(1, 2);              // type = icon
  dir.writeUInt16LE(entries.length, 4); // count

  const dirEntries = [];
  let offset = 6 + entries.length * 16;

  for (const e of entries) {
    const de = Buffer.alloc(16);
    de[0] = e.size >= 256 ? 0 : e.size; // 256 用 0 表示
    de[1] = e.size >= 256 ? 0 : e.size;
    de[2] = 0;                          // 调色板颜色数
    de[3] = 0;                          // reserved
    de.writeUInt16LE(1, 4);             // planes
    de.writeUInt16LE(32, 6);            // bit count
    de.writeUInt32LE(e.data.length, 8); // 数据大小
    de.writeUInt32LE(offset, 12);       // 数据偏移
    offset += e.data.length;
    dirEntries.push(de);
  }

  return Buffer.concat([dir, ...dirEntries, ...entries.map((e) => e.data)]);
}

/* ============================ 主流程 ============================ */

const outDir = path.join(__dirname, '..', 'build');
fs.mkdirSync(outDir, { recursive: true });

// 大尺寸用 PNG 压缩(体积小),64 及以下用 BMP(兼容性最好)
const SIZES = [16, 24, 32, 48, 64, 128, 256];
const entries = SIZES.map((size) => {
  const rgba = renderIcon(size);
  const usePng = size > 64;
  return { size, data: usePng ? encodePng(rgba, size) : encodeDib(rgba, size), format: usePng ? 'PNG' : 'BMP' };
});

const ico = encodeIco(entries);
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);

// 额外输出一张大 PNG,给"关于"窗口和文档用
const png512 = encodePng(renderIcon(512), 512);
fs.writeFileSync(path.join(outDir, 'icon.png'), png512);

console.log('图标已生成:');
console.log(`  build/icon.ico   ${(ico.length / 1024).toFixed(1)} KB  (${SIZES.length} 种尺寸: ${SIZES.join(', ')})`);
console.log(`  build/icon.png   ${(png512.length / 1024).toFixed(1)} KB  (512x512)`);
for (const e of entries) {
  console.log(`    ${String(e.size).padStart(3)}x${String(e.size).padEnd(3)} ${e.format.padEnd(3)} ${String(e.data.length).padStart(6)} 字节`);
}
