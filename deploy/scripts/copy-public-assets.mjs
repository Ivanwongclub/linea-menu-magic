// Copy an explicit public-asset manifest. Existing destination bytes must match;
// this never overwrites a different file or removes a Storage object.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const option = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const manifest = JSON.parse(readFileSync(option('--manifest', '.deploy/assets.json'), 'utf8'));
const settings = Object.fromEntries(readFileSync(option('--env', 'deploy/compose.env'), 'utf8').split('\n')
  .filter(line => /^[A-Z_0-9]+=/.test(line)).map(line => {
    const split = line.indexOf('=');
    const value = line.slice(split + 1).trim();
    return [line.slice(0, split), value.startsWith('"') ? JSON.parse(value) : value];
  }));
const base = option('--url', 'http://127.0.0.1').replace(/\/$/, '');
const reportPath = option('--report', '.deploy/asset-copy-result.json');
const prior = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : {};
const results = { ...prior, files: prior.files ?? {}, failures: [] };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encodePath = path => path.split('/').map(encodeURIComponent).join('/');
const auth = { apikey: settings.SERVICE_ROLE_KEY, Authorization: `Bearer ${settings.SERVICE_ROLE_KEY}` };
const save = () => writeFileSync(reportPath, JSON.stringify(results, null, 2), { mode: 0o600 });
async function request(url, options = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await fetch(url, { ...options, signal: AbortSignal.timeout(120000) }); }
    catch (error) { if (attempt === 2) throw error; }
  }
}
async function copy(entry) {
  const key = `${entry.bucket}/${entry.path}`;
  if (!/^[a-z0-9-]+$/.test(entry.bucket) || entry.path.split('/').some(part => part === '..')) throw new Error('Invalid object path');
  const publicUrl = `${base}/storage/v1/object/public/${encodePath(key)}`;
  const prior = results.files[key];
  let bytes, contentType = entry.contentType;
  if (entry.localFile) bytes = readFileSync(entry.localFile);
  else if (!prior?.verified) {
    const source = await request(entry.url);
    if (!source.ok) throw new Error(`Source HTTP ${source.status}`);
    bytes = Buffer.from(await source.arrayBuffer());
    contentType ||= source.headers.get('content-type');
  }
  const expected = bytes ? hash(bytes) : prior.sha256;
  const present = await request(publicUrl, { method: 'HEAD' });
  if (present.ok) {
    const response = await request(publicUrl);
    if (!response.ok || hash(Buffer.from(await response.arrayBuffer())) !== expected) throw new Error('Destination exists with different bytes');
  } else {
    if (!bytes) {
      const source = await request(entry.url);
      if (!source.ok) throw new Error(`Source HTTP ${source.status}`);
      bytes = Buffer.from(await source.arrayBuffer());
      if (hash(bytes) !== expected) throw new Error('Source changed since previous copy');
      contentType ||= source.headers.get('content-type');
    }
    const uploaded = await request(`${base}/storage/v1/object/${encodePath(key)}`, {
      method: 'POST', headers: { ...auth, 'Content-Type': contentType || 'application/octet-stream', 'x-upsert': 'false' }, body: bytes,
    });
    if (!uploaded.ok) throw new Error(`Upload HTTP ${uploaded.status}: ${(await uploaded.text()).slice(0, 180)}`);
    const copied = await request(publicUrl);
    if (!copied.ok || hash(Buffer.from(await copied.arrayBuffer())) !== expected) throw new Error('Copied file failed SHA-256 verification');
  }
  results.files[key] = { verified: true, sha256: expected, bytes: bytes?.length ?? prior.bytes, from: entry.localFile ? 'original archive' : entry.url };
  save();
  console.log(JSON.stringify({ object: key, verified: true, bytes: results.files[key].bytes }));
}
const queue = [...manifest.objects];
await Promise.all(Array.from({ length: 2 }, async () => {
  while (queue.length) {
    const entry = queue.shift();
    try { await copy(entry); }
    catch (error) { results.failures.push({ object: `${entry.bucket}/${entry.path}`, error: error.message }); save(); console.error(JSON.stringify(results.failures.at(-1))); }
  }
}));
results.finishedAt = new Date().toISOString();
save();
console.log(JSON.stringify({ verifiedObjects: Object.keys(results.files).length, failures: results.failures.length }));
if (results.failures.length) process.exitCode = 1;
