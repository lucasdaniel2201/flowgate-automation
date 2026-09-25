import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Sem timeout, um daemon Docker travado pendura a suíte inteira — e isso roda
// no carregamento do módulo, não dentro de um test().
const hasDocker =
  spawnSync('docker', ['compose', 'version'], { cwd: root, timeout: 10000 }).status === 0;

const resolveCompose = () => {
  // `--format json` is newer than `--json`; try both so the suite runs on
  // whatever Compose version the machine happens to ship.
  const attempts = [
    ['compose', '-f', 'docker-compose.yml', 'config', '--format', 'json'],
    ['compose', '-f', 'docker-compose.yml', 'config', '--json'],
  ];
  for (const args of attempts) {
    const result = spawnSync('docker', args, { cwd: root, encoding: 'utf-8', timeout: 30000 });
    if (result.status === 0) return JSON.parse(result.stdout);
  }
  assert.fail('docker compose config failed with both --format json and --json');
};

test('the compose file does not declare the obsolete "version" key', () => {
  const raw = readFileSync(join(root, 'docker-compose.yml'), 'utf-8');
  const lines = raw.split('\n').filter((line) => /^version\s*:/.test(line));
  // Compose v2 ignores it and warns on every single command.
  assert.deepEqual(lines, []);
});

test('the image version is pinned', { skip: !hasDocker && 'docker is not available' }, () => {
  const compose = resolveCompose();
  const image = compose.services.n8n.image;
  assert.match(image, /^n8nio\/n8n:\d+\.\d+\.\d+$/);
  assert.equal(image.endsWith(':latest'), false);
});

test('the healthcheck probes IPv4 explicitly', { skip: !hasDocker && 'docker is not available' }, () => {
  const compose = resolveCompose();
  const probe = compose.services.n8n.healthcheck.test.join(' ');
  // Inside the container "localhost" resolves to [::1] first while n8n listens
  // on IPv4 only, which left the container permanently unhealthy.
  assert.match(probe, /127\.0\.0\.1/);
  assert.equal(probe.includes('localhost'), false);
});

test('resource limits and restart policy are set', { skip: !hasDocker && 'docker is not available' }, () => {
  const compose = resolveCompose();
  const service = compose.services.n8n;
  assert.equal(service.restart, 'unless-stopped');
  assert.ok(service.deploy.resources.limits.cpus > 0);
  assert.ok(service.deploy.resources.limits.memory > 0);
  assert.ok(service.deploy.resources.reservations.memory > 0);
});

test('logs are rotated and state is on a named volume', { skip: !hasDocker && 'docker is not available' }, () => {
  const compose = resolveCompose();
  assert.equal(compose.services.n8n.logging.driver, 'json-file');
  assert.ok(compose.services.n8n.logging.options['max-size']);
  assert.ok(compose.services.n8n.logging.options['max-file']);
  assert.ok(compose.volumes.n8n_data);
  assert.ok(compose.networks.n8n_network);
});

test('execution history is pruned', { skip: !hasDocker && 'docker is not available' }, () => {
  const compose = resolveCompose();
  const env = compose.services.n8n.environment;
  assert.equal(env.EXECUTIONS_DATA_PRUNE, 'true');
  assert.ok(Number(env.EXECUTIONS_DATA_MAX_AGE) > 0);
});

test('the dev override binds the debugger to localhost', () => {
  const raw = readFileSync(join(root, 'docker-compose.override.yml'), 'utf-8');
  assert.match(raw, /127\.0\.0\.1:9229:9229/);
  assert.equal(/^\s*-\s*['"]?9229:9229/m.test(raw), false);
});
