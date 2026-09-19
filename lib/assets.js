'use strict';

/**
 * 静态资源读取:优先从可执行文件内嵌资源读,回退到磁盘。
 *
 * 网页端有一个"单文件免安装版"——用 Node 的 SEA(Single Executable Application)
 * 把 JS 和 public/ 下的静态资源一起塞进一个 exe。这种情况下 __dirname 指向的
 * 是 exe 内部,磁盘上根本没有 public/ 目录,所以必须走内嵌资源。
 *
 * 普通 node server.js 运行时 sea.isSea() 为 false,行为与以前完全一致。
 */

const path = require('path');

let sea = null;
try {
  // Node 20.12+ 才有;老版本直接降级
  // eslint-disable-next-line global-require
  sea = require('node:sea');
} catch { /* 不是 SEA 环境 */ }

const isSeaBuild = !!(sea && typeof sea.isSea === 'function' && sea.isSea());

let keyCache = null;

/** 内嵌资源的所有 key(懒加载) */
function embeddedKeys() {
  if (!isSeaBuild) return [];
  if (!keyCache) {
    try {
      keyCache = new Set(sea.getAssetKeys());
    } catch {
      keyCache = new Set();
    }
  }
  return [...keyCache];
}

function hasEmbedded(key) {
  if (!isSeaBuild) return false;
  if (keyCache) return keyCache.has(key);
  return embeddedKeys().includes(key);
}

const TEXT_EXT = new Set(['.html', '.css', '.js', '.json', '.txt', '.md', '.svg', '.map', '.xml']);

/**
 * 读取内嵌资源。
 * @param {string} key 资源键,统一用正斜杠,例如 "public/index.html"
 * @returns {Buffer|null} 不是 SEA 构建、或没有该资源时返回 null
 */
function getEmbedded(key) {
  if (!isSeaBuild) return null;
  const normalized = key.split(path.sep).join('/');
  if (!hasEmbedded(normalized)) return null;
  try {
    const buf = sea.getRawAsset(normalized);
    return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  } catch {
    return null;
  }
}

/** 读取内嵌资源并当作文本返回 */
function getEmbeddedText(key) {
  const buf = getEmbedded(key);
  return buf ? buf.toString('utf8') : null;
}

/**
 * 统一的静态文件读取入口。
 * @param {string} publicDir 磁盘上的 public 目录(非 SEA 时用)
 * @param {string} relPath   相对于 public 的路径,例如 "style.css"
 * @returns {{data:Buffer, source:'embedded'|'disk'}|null}
 */
function readStatic(publicDir, relPath) {
  const rel = relPath.split(path.sep).join('/').replace(/^\/+/, '');
  const embedded = getEmbedded(`public/${rel}`);
  if (embedded) return { data: embedded, source: 'embedded' };

  try {
    const fs = require('fs');
    const full = path.join(publicDir, rel);
    if (!full.startsWith(publicDir)) return null;
    return { data: fs.readFileSync(full), source: 'disk' };
  } catch {
    return null;
  }
}

module.exports = {
  isSeaBuild,
  getEmbedded,
  getEmbeddedText,
  hasEmbedded,
  embeddedKeys,
  readStatic,
  TEXT_EXT,
};
