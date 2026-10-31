import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from '../../../src/lib/uuid.ts';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('UUIDs keep the persisted UUID v4 format', () => {
  assert.match(randomUUID(), UUID_V4);
});

test('HTTP contexts can create distinct UUIDs without crypto.randomUUID', () => {
  const descriptor = Object.getOwnPropertyDescriptor(crypto, 'randomUUID');
  Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
  try {
    const ids = new Set(Array.from({ length: 32 }, () => randomUUID()));
    assert.equal(ids.size, 32);
    for (const id of ids) assert.match(id, UUID_V4);
  } finally {
    if (descriptor) Object.defineProperty(crypto, 'randomUUID', descriptor);
    else delete crypto.randomUUID;
  }
});
