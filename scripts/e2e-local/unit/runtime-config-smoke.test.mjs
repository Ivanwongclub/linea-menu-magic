import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const script = pathToFileURL(path.join(repo, 'deploy/scripts/smoke.mjs')).href;
const base = 'https://smoke.example.test';
const publicKey = 'sb_publishable_smoke_fixture';
const privateKey = 'private-service-role-fixture';

function smoke({ wrongRuntimeKey = false, cachedRuntime = false } = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'wincyc-smoke-test-'));
  try {
    const envFile = path.join(dir, 'compose.env');
    writeFileSync(envFile, [
      ['SUPABASE_PUBLIC_URL', base], ['ANON_KEY', publicKey], ['SERVICE_ROLE_KEY', privateKey],
    ].map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n'));
    const fixture = `
      process.argv = [process.execPath, ${JSON.stringify(script)}, '--env', ${JSON.stringify(envFile)}];
      const origin = ${JSON.stringify(base)};
      const expectedKey = ${JSON.stringify(publicKey)};
      const config = {
        supabaseUrl: origin,
        supabasePublishableKey: ${JSON.stringify(wrongRuntimeKey ? 'sb_publishable_stale_fixture' : publicKey)}
      };
      globalThis.fetch = async function(input, options = {}) {
        const url = new URL(input);
        if (url.origin !== origin) throw Error('Unexpected origin; external networking is disabled in this test.');
        if (options.headers.apikey !== expectedKey) throw Error('Unexpected API key.');
        const route = url.pathname + url.search;
        const text = (body, status = 200, headers = {}) => new Response(body, {status, headers});
        if (route === '/healthz') return text('ok');
        if (route === '/auth/v1/health') return text('{}');
        if (route === '/designer-studio/editor/new') return text('<div id="root"></div><script src="/runtime-config.js"></script><script type="module" src="/assets/index-fixture.js"></script>');
        // A previously compiled URL may remain in JS; runtime config is authoritative.
        if (route === '/assets/index-fixture.js') return text('const oldBuildUrl = "https://old-project.example.test";');
        if (route === '/runtime-config.js') return text(
          'window.__WINCYC_PUBLIC_CONFIG__ = ' + JSON.stringify(config) + ';',
          200,
          {'cache-control': ${JSON.stringify(cachedRuntime ? 'public, max-age=31536000' : 'no-store')}}
        );
        if (route === '/index.html') return text('<div id="root"></div>', 200, {'cache-control':'no-store'});
        if (route === '/rest/v1/products?select=id&limit=1') return text('[]');
        if (route === '/rest/v1/designs?select=id&limit=1') return text('{}', 401);
        if (route === '/functions/v1/bootstrap-demo-user') return text('{}', 404);
        if (route === '/functions/v1/generate-product-images') return text('{}', 401);
        throw Error('Unexpected request; external networking is disabled in this test: ' + route);
      };
      await import(${JSON.stringify(script)});
    `;
    return spawnSync(process.execPath, ['--input-type=module'], {
      input: fixture,
      encoding: 'utf8',
      timeout: 10000,
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('deployment smoke passes with correct runtime config even when compiled JS has an old URL', () => {
  const result = smoke();
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.match(summary.frontend, /runtime URL\/key consistency/);
  assert.match(summary.database, /public catalogue API/);
  assert.ok(!result.stdout.includes(privateKey));
});

test('deployment smoke rejects a runtime key that differs from the gateway configuration', () => {
  const result = smoke({ wrongRuntimeKey: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /runtime public key must match the gateway ANON_KEY/);
  assert.ok(!result.stderr.includes(privateKey));
});

test('deployment smoke rejects cacheable runtime configuration that could keep a stale key', () => {
  const result = smoke({ cachedRuntime: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no-store/);
  assert.ok(!result.stderr.includes(privateKey));
});
