import { createHash } from 'node:crypto';
import { access, copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://trophies.invalid';
const allowedExtension = /\.(?:m?js|css|woff2?|ttf|otf|png|svg|jpe?g|webp|avif|ico|webmanifest|txt)$/i;
const textExtensions = new Set(['.html', '.txt', '.js', '.css', '.webmanifest']);
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const inside = (directory, path) => { const delta = relative(directory, path); return delta !== '..' && !delta.startsWith('..' + sep) && !isAbsolute(delta); };
const put = async (path, value) => { await mkdir(dirname(path), { recursive: true }); await writeFile(path, value); };

export async function prepare(rootDirectory = root) {
  const iconDirectory = join(rootDirectory, 'public/trophies/icons');
  await mkdir(iconDirectory, { recursive: true });
  const source = await readFile(join(iconDirectory, 'icon.svg'));
  for (const size of [192, 512]) await sharp(source).resize(size, size).png({ compressionLevel: 9 }).toFile(join(iconDirectory, `icon-${size}.png`));
}

function references(content, path) {
  const result = new Set();
  const add = (value, fromMarkup = false) => {
    try {
      const url = new URL(value.replace(/\\\//g, '/').replace(/&amp;/g, '&'), origin + path);
      if (url.origin !== origin || !allowedExtension.test(url.pathname)) return;
      if (['/trophies-sw.js', '/trophies/sw.js'].includes(url.pathname)) return;
      if (!fromMarkup && !url.pathname.startsWith('/_next/static/') && !url.pathname.startsWith('/trophies/')) return;
      result.add(url.pathname);
    } catch { /* JavaScript strings need not be valid URLs. */ }
  };
  for (const match of content.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)) add(match[1], true);
  for (const match of content.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) add(match[1], true);
  for (const match of content.matchAll(/["'`](\.{1,2}\/[^"'`\s]+|\/[^"'`\s]+)["'`]/g)) add(match[1]);
  for (const match of content.matchAll(/\/_next\/static\/[a-zA-Z0-9_.~%/+@-]+/g)) add(match[0]);
  for (const match of content.matchAll(/["'`](?:\/?_next\/)?(static\/(?:chunks|media)\/[^"'`\s]+)["'`]/g)) add('/_next/' + match[1]);
  return result;
}

async function collect(directory, seeds) {
  const queue = [...seeds];
  const found = new Set();
  while (queue.length) {
    const url = queue.shift();
    if (found.has(url)) continue;
    const file = resolve(directory, '.' + decodeURIComponent(url));
    if (!inside(directory, file) || !await exists(file) || !(await stat(file)).isFile()) throw new Error('Missing offline resource: ' + url);
    found.add(url);
    if (!textExtensions.has(extname(file))) continue;
    for (const ref of references(await readFile(file, 'utf8'), url)) {
      const target = resolve(directory, '.' + decodeURIComponent(ref));
      if (!inside(directory, target)) throw new Error('Resource escaped static export: ' + ref);
      if (await exists(target) && (await stat(target)).isFile()) queue.push(ref);
      else if (['.html', '.css', '.webmanifest'].includes(extname(file)) && !ref.includes('${')) throw new Error('Linked resource is missing: ' + ref + ' in ' + url);
    }
  }
  return [...found].sort();
}

async function shellPaths(directory, prefix = '/trophies') {
  const result = [];
  if (await exists(join(directory, prefix + '.html'))) result.push(prefix + '.html');
  const folder = join(directory, prefix);
  if (await exists(folder)) for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) result.push(...await shellPaths(directory, prefix + '/' + entry.name));
    else if (entry.name.endsWith('.html') && entry.name !== 'index.html') result.push(prefix + '/' + entry.name);
  }
  return [...new Set(result)];
}

export async function buildOffline(rootDirectory = root) {
  const output = join(rootDirectory, 'out');
  const publicDirectory = join(rootDirectory, 'public');
  const shells = await shellPaths(output);
  if (!shells.includes('/trophies.html')) throw new Error('Run next build first: out/trophies.html is missing.');
  const fixed = ['/trophies/manifest.webmanifest', '/trophies/icons/icon.svg', '/trophies/icons/icon-192.png', '/trophies/icons/icon-512.png'];
  for (const path of fixed) { await mkdir(dirname(join(output, path)), { recursive: true }); await copyFile(join(publicDirectory, path), join(output, path)); }
  const routes = {};
  const seeds = [...shells, ...fixed];
  for (const shell of shells) {
    const route = shell.slice(0, -5);
    routes[route] = shell;
    routes[route + '/'] = shell;
    routes[shell] = shell;
    await mkdir(join(output, route), { recursive: true });
    await copyFile(join(output, shell), join(output, route, 'index.html'));
    const flight = route + '.txt';
    if (await exists(join(output, flight))) seeds.push(flight);
  }
  const precache = await collect(output, seeds);
  const template = await readFile(join(publicDirectory, 'trophies/sw.js'), 'utf8');
  const hash = createHash('sha256').update(template).update(JSON.stringify(routes));
  let bytes = 0;
  for (const path of precache) { const content = await readFile(join(output, path)); hash.update(path).update(content); bytes += content.length; }
  const version = hash.digest('hex').slice(0, 16);
  const worker = template.replace('__TROPHIES_CACHE_VERSION__', version).replace('/* TROPHIES_PRECACHE */ []', JSON.stringify(precache)).replace('/* TROPHIES_ROUTES */ {}', JSON.stringify(routes));
  if (worker.includes('__TROPHIES_CACHE_VERSION__') || worker.includes('/* TROPHIES_PRECACHE */') || worker.includes('/* TROPHIES_ROUTES */')) throw new Error('Invalid Trophy Tracker worker template.');
  await put(join(output, 'trophies-sw.js'), worker);
  const report = { version, scope: '/trophies', worker: '/trophies-sw.js', files: precache.length, bytes, routes, urls: precache };
  await put(join(output, 'trophies/precache.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await prepare();
    if (process.argv.includes('--prepare')) console.log('Trophies: prepared 192/512 icons.');
    else { const report = await buildOffline(); console.log(`Trophies: offline version ${report.version}, ${report.files} resources, ${(report.bytes / 1024 / 1024).toFixed(2)} MiB.`); }
  } catch (error) { console.error('Trophies build failed:', error.message); process.exitCode = 1; }
}
