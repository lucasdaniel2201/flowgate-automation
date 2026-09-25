import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = JSON.parse(
  readFileSync(new URL('../workflows/workflow_user_sync.json', import.meta.url), 'utf-8'),
);

const nodeByName = (name) => workflow.nodes.find((node) => node.name === name);

// Highest typeVersion available in the pinned image (n8n 1.94.1). Declaring a
// version the image does not ship makes n8n fail to activate the workflow with
// "Cannot read properties of undefined (reading 'execute')".
const MAX_TYPE_VERSION = {
  'n8n-nodes-base.webhook': 2,
  'n8n-nodes-base.httpRequest': 4.2,
  'n8n-nodes-base.code': 2,
  'n8n-nodes-base.respondToWebhook': 1.3,
};

const walkParameters = (value, visit, path = []) => {
  if (typeof value === 'string') {
    visit(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkParameters(entry, visit, [...path, index]));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => walkParameters(entry, visit, [...path, key]));
  }
};

test('workflow declares the fields n8n requires', () => {
  for (const key of ['name', 'nodes', 'connections', 'settings']) {
    assert.ok(workflow[key], `missing top-level "${key}"`);
  }
  assert.equal(workflow.nodes.length, 6);
});

test('every node carries the fields n8n requires', () => {
  for (const node of workflow.nodes) {
    for (const key of ['id', 'name', 'type', 'typeVersion', 'position', 'parameters']) {
      assert.ok(node[key] !== undefined, `node ${node.name} is missing "${key}"`);
    }
    assert.equal(node.position.length, 2);
  }
});

test('node ids and names are unique', () => {
  const ids = workflow.nodes.map((node) => node.id);
  const names = workflow.nodes.map((node) => node.name);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(names).size, names.length);
});

test('typeVersion stays within what the pinned n8n image supports', () => {
  for (const node of workflow.nodes) {
    const max = MAX_TYPE_VERSION[node.type];
    assert.ok(max !== undefined, `no known max typeVersion for ${node.type}`);
    assert.ok(
      node.typeVersion <= max,
      `${node.name} declares typeVersion ${node.typeVersion} but ${node.type} tops out at ${max}. ` +
        `Se a imagem do n8n foi atualizada, confirme a versão máxima real e ajuste MAX_TYPE_VERSION.`,
    );
  }
});

test('parameters are either literals or real expressions', () => {
  // n8n only evaluates a string parameter as an expression when it starts with
  // "=". Without it, "{{ ... }}" is sent verbatim — which is how the HTTP
  // Request nodes ended up requesting a literal "{{ $env.USERS_API_URL }}" URL.
  for (const node of workflow.nodes) {
    walkParameters(node.parameters, (value, path) => {
      if (!value.includes('{{')) return;
      assert.ok(
        value.startsWith('='),
        `${node.name}.${path.join('.')} contains an expression but does not start with "="`,
      );
    });
  }
});

test('the pipeline is one connected chain of six nodes', () => {
  const names = new Set(workflow.nodes.map((node) => node.name));
  for (const [source, targets] of Object.entries(workflow.connections)) {
    assert.ok(names.has(source), `connection from unknown node "${source}"`);
    for (const branch of targets.main) {
      for (const target of branch) {
        assert.ok(names.has(target.node), `connection to unknown node "${target.node}"`);
      }
    }
  }

  const expectsOutgoing = {
    'Webhook (Trigger)': 'Buscar Usuários (GET)',
    'Buscar Usuários (GET)': 'Filtrar Domínios',
    'Filtrar Domínios': 'Transformar para Schema CRM',
    'Transformar para Schema CRM': 'Cadastrar Usuário (POST)',
    'Cadastrar Usuário (POST)': 'Retornar Sumário de Execução',
  };
  for (const [source, target] of Object.entries(expectsOutgoing)) {
    const next = workflow.connections[source]?.main?.[0]?.[0]?.node;
    assert.equal(next, target, `${source} should flow into ${target}`);
  }
});

test('the webhook accepts POST on /iniciar', () => {
  const webhook = nodeByName('Webhook (Trigger)');
  // n8n defaults the method to GET; without httpMethod the documented
  // "POST /webhook/iniciar" call answers 404.
  assert.equal(webhook.parameters.httpMethod, 'POST');
  assert.equal(webhook.parameters.path, 'iniciar');
  assert.equal(webhook.parameters.responseMode, 'responseNode');
  assert.match(webhook.webhookId, /^[0-9a-f-]{36}$/);
});

test('the extract step retries on failure', () => {
  const fetchNode = nodeByName('Buscar Usuários (GET)');
  assert.equal(fetchNode.type, 'n8n-nodes-base.httpRequest');
  assert.equal(fetchNode.parameters.method ?? 'GET', 'GET');
  assert.match(fetchNode.parameters.url, /^=\{\{.*\$env\.USERS_API_URL.*\}\}$/);
  assert.equal(fetchNode.retryOnFail, true);
  assert.equal(fetchNode.maxTries, 5);
  assert.equal(fetchNode.waitBetweenTries, 5000);
});

test('the load step batches, retries and tolerates partial failure', () => {
  const postNode = nodeByName('Cadastrar Usuário (POST)');
  assert.equal(postNode.parameters.method, 'POST');
  assert.match(postNode.parameters.url, /^=\{\{.*\$env\.CRM_WEBHOOK_URL.*\}\}$/);
  assert.equal(postNode.parameters.options.batching.batch.batchSize, 1);
  assert.equal(postNode.parameters.options.batching.batch.batchInterval, 2000);
  assert.equal(postNode.retryOnFail, true);
  assert.equal(postNode.maxTries, 5);
  assert.equal(postNode.waitBetweenTries, 5000);
  assert.equal(postNode.onError, 'continueRegularOutput');
});

test('the filter keeps .net and .org emails', () => {
  const code = nodeByName('Filtrar Domínios').parameters.jsCode;
  assert.match(code, /\.net/);
  assert.match(code, /\.org/);
});

test('the transform attaches one correlationId per execution', () => {
  const transform = nodeByName('Transformar para Schema CRM');
  // A random id per item would give every user its own "correlation", which
  // defeats the point of correlating a batch.
  assert.equal(transform.parameters.jsCode.includes('$execution.id'), true);
  assert.equal(transform.parameters.jsCode.includes('randomUUID'), false);
});

test('the response node returns the execution summary', () => {
  const respond = nodeByName('Retornar Sumário de Execução');
  assert.equal(respond.parameters.respondWith, 'json');
  for (const field of ['executionTime', 'correlationId', 'totalItemsProcessed', 'message']) {
    assert.ok(respond.parameters.responseBody.includes(field), `response is missing ${field}`);
  }
});
