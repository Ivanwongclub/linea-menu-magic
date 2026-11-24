import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePublicConfig } from '../../../src/integrations/supabase/publicConfig.ts';

const jwt = (role) => [
  { alg: 'HS256', typ: 'JWT' },
  { role, iss: 'supabase' },
].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.') + '.dGVzdA';

const oldBuild = {
  supabaseUrl: 'https://old-project.example.test',
  supabasePublishableKey: jwt('anon'),
};
const runtime = {
  supabaseUrl: 'https://aws.example.test',
  supabasePublishableKey: 'sb_publishable_runtime_test_123',
};

test('runtime AWS configuration replaces both stale build URL and public key', () => {
  assert.deepEqual(resolvePublicConfig(runtime, oldBuild), runtime);
});

test('development without a runtime config retains validated build configuration', () => {
  assert.deepEqual(resolvePublicConfig(undefined, oldBuild), oldBuild);
  assert.deepEqual(resolvePublicConfig(null, oldBuild), oldBuild);
  const localFixture = { supabaseUrl: 'http://127.0.0.1:5190', supabasePublishableKey: 'local-read-only-preview' };
  assert.deepEqual(resolvePublicConfig(undefined, localFixture), localFixture);
});

test('present incomplete runtime configuration never falls back to a working stale build', () => {
  for (const invalid of [{}, { supabaseUrl: runtime.supabaseUrl }, { supabasePublishableKey: runtime.supabasePublishableKey }]) {
    assert.throws(() => resolvePublicConfig(invalid, oldBuild));
  }
});

test('malformed runtime objects fail closed despite valid build defaults', () => {
  for (const invalid of ['', 7, [], true, { ...runtime, supabaseUrl: 7 }, { ...runtime, supabasePublishableKey: null }]) {
    assert.throws(() => resolvePublicConfig(invalid, oldBuild));
  }
});

test('runtime does not need build defaults and normalizes an origin trailing slash', () => {
  assert.deepEqual(resolvePublicConfig({ ...runtime, supabaseUrl: runtime.supabaseUrl + '/' }, {}), runtime);
});

test('non-HTTP or non-origin URLs cannot redirect Auth credentials elsewhere', () => {
  for (const url of [
    'javascript:alert(1)', 'not-a-url',
    'https://username:private-url-sentinel@example.test',
    'https://example.test/auth/v1',
    'https://example.test:invalid',
    'https://example.test:99999',
    'https://example.test?project=other',
    'https://example.test#fragment',
  ]) {
    assert.throws(() => resolvePublicConfig({ ...runtime, supabaseUrl: url }, oldBuild), error => {
      assert.ok(!String(error).includes('private-url-sentinel'));
      return true;
    });
  }
});

test('valid anonymous JWTs remain supported alongside publishable keys', () => {
  const config = { ...runtime, supabasePublishableKey: jwt('anon') };
  assert.deepEqual(resolvePublicConfig(config, {}), config);
});

test('service-role, user JWTs and secret keys are rejected without printing credentials', () => {
  for (const key of [jwt('service_role'), jwt('authenticated'), 'sb_secret_private-key-sentinel']) {
    assert.throws(() => resolvePublicConfig({ ...runtime, supabasePublishableKey: key }, oldBuild), error => {
      assert.ok(!String(error).includes(key));
      return true;
    });
  }
});

test('malformed keys and missing build configuration fail before a client is constructed', () => {
  for (const key of ['', 'sb_publishable_', 'eyJ.bad.signature']) {
    assert.throws(() => resolvePublicConfig({ ...runtime, supabasePublishableKey: key }, oldBuild));
  }
  assert.throws(() => resolvePublicConfig(undefined, {}));
  assert.throws(() => resolvePublicConfig(undefined, { ...oldBuild, supabasePublishableKey: jwt('service_role') }));
});
