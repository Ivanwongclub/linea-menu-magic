// Run on the server with the official Node image; never print credentials.
// Read-only by default. --write also creates and removes isolated QA records.
import { readFileSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const settings = Object.fromEntries(readFileSync(option('--env', 'deploy/compose.env'), 'utf8')
  .split('\n').filter((line) => /^[A-Z_][A-Z_0-9]*=/.test(line)).map((line) => {
    const split = line.indexOf('=');
    const value = line.slice(split + 1).trim();
    return [line.slice(0, split), value.startsWith('"') ? JSON.parse(value) : value];
  }));
const base = option('--url', settings.SUPABASE_PUBLIC_URL).replace(/\/$/, '');
const anon = settings.ANON_KEY;
const service = settings.SERVICE_ROLE_KEY;
const results = {};
async function request(path, { token = anon, method = 'GET', json, body, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { apikey: anon, Authorization: `Bearer ${token}`, ...headers,
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: json !== undefined ? JSON.stringify(json) : body,
    signal: AbortSignal.timeout(60000),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, headers: response.headers, data, text };
}
function ok(response, label) {
  assert.ok(response.status >= 200 && response.status < 300, `${label}: HTTP ${response.status}`);
  return response.data;
}

ok(await request('/healthz'), 'frontend health');
ok(await request('/auth/v1/health'), 'Auth health');
const html = await request('/designer-studio/editor/new');
ok(html, 'SPA route');
assert.match(html.text, /<div id="root">/);
const bundlePath = html.text.match(/src="([^\"]*\/assets\/index-[^\"]+\.js)"/)?.[1];
assert.ok(bundlePath, 'frontend entry bundle');
const bundle = await request(bundlePath);
ok(bundle, 'frontend bundle');
assert.ok(bundle.text.includes(settings.SUPABASE_PUBLIC_URL), 'frontend must point to this VPS');
assert.ok(!bundle.text.includes(service), 'service key must not be shipped to browsers');
assert.match((await request('/index.html')).headers.get('cache-control'), /no-store/);
results.frontend = 'health, SPA routing, VPS URL and public-only browser configuration passed';
ok(await request('/rest/v1/products?select=id&limit=1'), 'catalogue API');
const privateRead = await request('/rest/v1/designs?select=id&limit=1');
assert.ok([401, 403].includes(privateRead.status), 'anonymous design access must be denied');
results.database = 'public catalogue API and private design permissions passed';
const bootstrap = await request('/functions/v1/bootstrap-demo-user', { token: service, method: 'POST', json: {} });
assert.equal(bootstrap.status, 404, 'demo administrator bootstrap must not be deployed');
const aiAnon = await request('/functions/v1/generate-product-images', { method: 'POST', json: {} });
assert.equal(aiAnon.status, 401, 'anonymous requests must not run privileged image generation');
results.functions = 'production function running; anonymous writes denied; demo bootstrap absent';

if (args.includes('--write')) {
  const users = [];
  let designId;
  let assetPath;
  try {
    const sessions = [];
    for (let i = 0; i < 2; i++) {
      const email = `deploy-${randomUUID()}@local.test`;
      const password = randomBytes(24).toString('base64url');
      const user = ok(await request('/auth/v1/admin/users', {
        token: service, method: 'POST', json: { email, password, email_confirm: true },
      }), 'create isolated QA account');
      users.push(user.id);
      const session = ok(await request('/auth/v1/token?grant_type=password', {
        method: 'POST', json: { email, password },
      }), 'password login');
      sessions.push(session.access_token);
    }
    const [owner, other] = sessions;
    const recipe = { recipe_version: 2, layers: [], zones: [], view: { ruler: false } };
    const created = ok(await request('/rest/v1/designs?select=id,draft_recipe', {
      token: owner, method: 'POST', headers: { Prefer: 'return=representation' },
      json: { owner_id: users[0], name: 'Deployment smoke — temporary', status: 'draft', draft_recipe: recipe },
    }), 'create private design');
    designId = created[0].id;
    assert.deepEqual(created[0].draft_recipe, recipe);
    const hidden = ok(await request(`/rest/v1/designs?id=eq.${designId}&select=id`, { token: other }), 'other account design query');
    assert.deepEqual(hidden, [], 'a different account must not see the design');
    const version = ok(await request('/rest/v1/design_versions?select=id', {
      token: owner, method: 'POST', headers: { Prefer: 'return=representation' },
      json: { design_id: designId, version_number: 1, recipe, snapshot: { snapshot_version: 1 }, author_kind: 'buyer', created_by: users[0] },
    }), 'save design version');
    ok(await request(`/rest/v1/designs?id=eq.${designId}`, {
      token: owner, method: 'PATCH', json: { current_version_id: version[0].id },
    }), 'update current design version');
    results.designs = 'private create/read and version save passed; cross-account access denied';

    assetPath = `${users[0]}/logos/deployment-smoke.svg`;
    const artwork = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M0 0H10V10H0Z"/></svg>';
    ok(await request(`/storage/v1/object/design-uploads/${assetPath}`, {
      token: owner, method: 'POST', body: artwork, headers: { 'Content-Type': 'image/svg+xml' },
    }), 'private Logo upload');
    const downloaded = await request(`/storage/v1/object/authenticated/design-uploads/${assetPath}`, { token: owner });
    ok(downloaded, 'private Logo download');
    assert.equal(downloaded.text, artwork, 'file bytes must round-trip unchanged');
    const publicDownload = await request(`/storage/v1/object/public/design-uploads/${assetPath}`);
    assert.notEqual(publicDownload.status, 200, 'private artwork must not have a public URL');
    const otherDownload = await request(`/storage/v1/object/authenticated/design-uploads/${assetPath}`, { token: other });
    assert.notEqual(otherDownload.status, 200, 'a different account must not download the artwork');
    results.storage = 'private file upload/download bytes passed; public and cross-account access denied';
    const denied = await request('/functions/v1/generate-product-images', { token: owner, method: 'POST', json: {} });
    assert.equal(denied.status, 403, 'a regular account must not run catalogue editor operations');
    results.auth = 'two password logins and catalogue-editor permission enforcement passed';
  } finally {
    if (assetPath) ok(await request('/storage/v1/object/design-uploads', {
      token: service, method: 'DELETE', json: { prefixes: [assetPath] },
    }), 'remove temporary file');
    if (designId) ok(await request(`/rest/v1/designs?id=eq.${designId}`, {
      token: service, method: 'DELETE',
    }), 'remove temporary design and versions');
    for (const id of users) ok(await request(`/auth/v1/admin/users/${id}`, {
      token: service, method: 'DELETE',
    }), 'remove temporary account');
  }
  results.cleanup = 'temporary accounts, design, version and artwork removed';
}
console.log(JSON.stringify(results, null, 2));
