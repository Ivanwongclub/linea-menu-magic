import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { resolvePublicConfig } from '../../../src/integrations/supabase/publicConfig.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const script = path.join(repo, 'deploy/frontend/40-runtime-config.sh');
const publicUrl = 'https://stage.example.test';
const publicKey = 'sb_publishable_runtime_test_123';
const jwt = role => [
  { alg: 'HS256', typ: 'JWT' }, { role, iss: 'supabase' },
].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.') + '.dGVzdA';

function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'wincyc-runtime-test-'));
  const targetDir = path.join(dir, 'public assets');
  mkdirSync(targetDir);
  return { dir, targetDir, output: path.join(targetDir, 'runtime-config.js') };
}

function generate(f, overrides = {}) {
  return spawnSync('/bin/sh', [script], {
    encoding: 'utf8',
    env: {
      ...process.env,
      WINCYC_SUPABASE_URL: publicUrl,
      WINCYC_SUPABASE_PUBLISHABLE_KEY: publicKey,
      WINCYC_RUNTIME_CONFIG_PATH: f.output,
      SERVICE_ROLE_KEY: 'service-role-private-sentinel',
      JWT_SECRET: 'jwt-private-sentinel',
      POSTGRES_PASSWORD: 'database-private-sentinel',
      ...overrides,
    },
  });
}

function readPublicConfig(f) {
  const js = readFileSync(f.output, 'utf8');
  const context = { window: {} };
  vm.runInNewContext(js, context, { timeout: 1000 });
  return { js, config: JSON.parse(JSON.stringify(context.window.__WINCYC_PUBLIC_CONFIG__)) };
}

test('startup emits executable public-only runtime config, including output paths with spaces', () => {
  const f = fixture();
  try {
    const result = generate(f);
    assert.equal(result.status, 0, result.stderr);
    const { js, config } = readPublicConfig(f);
    assert.deepEqual(config, { supabaseUrl: publicUrl, supabasePublishableKey: publicKey });
    assert.equal(statSync(f.output).mode & 0o777, 0o644, 'Nginx workers can read the generated public file');
    for (const secret of ['service-role-private-sentinel', 'jwt-private-sentinel', 'database-private-sentinel']) {
      assert.ok(!js.includes(secret));
      assert.ok(!result.stdout.includes(secret));
      assert.ok(!result.stderr.includes(secret));
    }
    assert.deepEqual(readdirSync(f.targetDir), ['runtime-config.js']);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test('startup accepts the legacy anonymous JWT used by the current AWS deployment', () => {
  const f = fixture();
  try {
    const key = jwt('anon');
    const result = generate(f, { WINCYC_SUPABASE_PUBLISHABLE_KEY: key });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readPublicConfig(f).config.supabasePublishableKey, key);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test('HTML bootstrap fails closed when runtime loading fails and uses startup config when it succeeds', () => {
  const html = readFileSync(path.join(repo, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  const runtimeIndex = scripts.findIndex(([, attrs]) => /src=["']\/runtime-config\.js["']/.test(attrs));
  const moduleIndex = scripts.findIndex(([, attrs]) => /type=["']module["']/.test(attrs));
  assert.ok(runtimeIndex >= 0 && runtimeIndex < moduleIndex, 'startup config loads before the application module');
  assert.ok(!/\b(?:async|defer)\b/.test(scripts[runtimeIndex][1]), 'runtime config must load synchronously');
  const sentinelIndex = scripts.findIndex(([, attrs, body]) => !/\bsrc=/.test(attrs) && body.includes('__WINCYC_PUBLIC_CONFIG__'));
  assert.ok(sentinelIndex >= 0 && sentinelIndex < runtimeIndex);
  const context = { window: {} };
  vm.runInNewContext(scripts[sentinelIndex][2], context);
  const staleBuild = { supabaseUrl: 'https://old-project.example.test', supabasePublishableKey: jwt('anon') };
  assert.throws(() => resolvePublicConfig(context.window.__WINCYC_PUBLIC_CONFIG__, staleBuild));
  const f = fixture();
  try {
    assert.equal(generate(f).status, 0);
    vm.runInNewContext(readFileSync(f.output, 'utf8'), context);
    assert.deepEqual(resolvePublicConfig(context.window.__WINCYC_PUBLIC_CONFIG__, staleBuild), {
      supabaseUrl: publicUrl,
      supabasePublishableKey: publicKey,
    });
    const developmentPlaceholder = readFileSync(path.join(repo, 'public/runtime-config.js'), 'utf8');
    vm.runInNewContext(developmentPlaceholder, context);
    assert.equal(context.window.__WINCYC_PUBLIC_CONFIG__.supabaseUrl, publicUrl, 'development placeholder cannot erase a valid runtime config');
    vm.runInNewContext(scripts[sentinelIndex][2], context);
    vm.runInNewContext(developmentPlaceholder, context);
    assert.deepEqual(resolvePublicConfig(context.window.__WINCYC_PUBLIC_CONFIG__, staleBuild), staleBuild);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});

test('missing runtime inputs abort startup and preserve the last complete config', () => {
  for (const overrides of [{ WINCYC_SUPABASE_URL: '' }, { WINCYC_SUPABASE_PUBLISHABLE_KEY: '' }]) {
    const f = fixture();
    try {
      writeFileSync(f.output, 'last-complete-config');
      const result = generate(f, overrides);
      assert.notEqual(result.status, 0);
      assert.equal(readFileSync(f.output, 'utf8'), 'last-complete-config');
      assert.deepEqual(readdirSync(f.targetDir), ['runtime-config.js']);
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});

test('invalid origins and injection characters cannot reach runtime JavaScript', () => {
  for (const overrides of [
    { WINCYC_SUPABASE_URL: 'https://example.test/";alert(1)//' },
    { WINCYC_SUPABASE_URL: 'https://example.test\\other' },
    { WINCYC_SUPABASE_URL: 'https://example.test\nother' },
    { WINCYC_SUPABASE_URL: 'https://example.test:invalid' },
    { WINCYC_SUPABASE_URL: 'https://example.test:99999' },
    { WINCYC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_";alert(1)//' },
    { WINCYC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test\nwindow.bad=true' },
  ]) {
    const f = fixture();
    try {
      writeFileSync(f.output, 'last-complete-config');
      const result = generate(f, overrides);
      assert.notEqual(result.status, 0);
      assert.equal(readFileSync(f.output, 'utf8'), 'last-complete-config');
      assert.deepEqual(readdirSync(f.targetDir), ['runtime-config.js']);
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});

test('privileged keys are refused before a browser-readable file can expose them', () => {
  for (const key of ['sb_secret_private-key-sentinel', jwt('service_role'), jwt('authenticated')]) {
    const f = fixture();
    try {
      writeFileSync(f.output, 'last-complete-config');
      const result = generate(f, { WINCYC_SUPABASE_PUBLISHABLE_KEY: key });
      assert.notEqual(result.status, 0);
      assert.equal(readFileSync(f.output, 'utf8'), 'last-complete-config');
      assert.ok(!result.stdout.includes(key));
      assert.ok(!result.stderr.includes(key));
    } finally { rmSync(f.dir, { recursive: true, force: true }); }
  }
});

test('rewriting config replaces the complete value without leaving temporary artifacts', () => {
  const f = fixture();
  try {
    assert.equal(generate(f).status, 0);
    const next = { WINCYC_SUPABASE_URL: 'https://new.example.test', WINCYC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_new_456' };
    const result = generate(f, next);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(readPublicConfig(f).config, {
      supabaseUrl: next.WINCYC_SUPABASE_URL,
      supabasePublishableKey: next.WINCYC_SUPABASE_PUBLISHABLE_KEY,
    });
    assert.deepEqual(readdirSync(f.targetDir), ['runtime-config.js']);
  } finally { rmSync(f.dir, { recursive: true, force: true }); }
});
