import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envExample = readFileSync(join(root, '.env.example'), 'utf-8');
const compose = readFileSync(join(root, 'docker-compose.yml'), 'utf-8');

const declaredVars = new Set(
  envExample
    .split('\n')
    .map((line) => line.match(/^([A-Z0-9_]+)=/)?.[1])
    .filter(Boolean),
);

test('every variable the compose file consumes is documented', () => {
  const referenced = [...compose.matchAll(/\$\{([A-Z0-9_]+)/g)].map((match) => match[1]);
  const undocumented = [...new Set(referenced)].filter((name) => !declaredVars.has(name));
  assert.deepEqual(undocumented, [], `missing from .env.example: ${undocumented.join(', ')}`);
});

test('the dead basic-auth variables are gone', () => {
  // n8n dropped N8N_BASIC_AUTH_* before 1.0: the variables are ignored, so the
  // instance answered 200 with no credentials while the docs claimed auth.
  assert.equal(compose.includes('N8N_BASIC_AUTH_'), false);
  assert.equal(envExample.includes('N8N_BASIC_AUTH_'), false);
});

test('the pipeline endpoints are configurable and point at public defaults', () => {
  assert.ok(declaredVars.has('USERS_API_URL'));
  assert.ok(declaredVars.has('CRM_WEBHOOK_URL'));
  assert.match(envExample, /^CRM_WEBHOOK_URL=https:\/\/jsonplaceholder\.typicode\.com\/posts$/m);
  assert.match(envExample, /^USERS_API_URL=https:\/\/jsonplaceholder\.typicode\.com\/users$/m);
});

test('the flags n8n 1.9x warns about are set', () => {
  assert.match(envExample, /^N8N_RUNNERS_ENABLED=true$/m);
  assert.match(envExample, /^N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true$/m);
});
