import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { DemoError, Engine, buildPlan, createDemoServer, strictJson, validate, validateJev, redact, durationMs, executedJavaScript, providerJson } from './demo-server.mjs';

function fakeProvider() {
  const calls = []; let release = null;
  const transport = async (url, payload, options = {}) => {
    calls.push({ url, payload });
    if (url.endsWith('/api/tags')) return { models: [{ name: 'qwen3:1.7b', digest: 'test-digest', size: 1400000000 }] };
    if (url.endsWith('/api/generate')) return { model: 'qwen3:1.7b' };
    if (url.endsWith('/api/chat')) {
      options.onEvent?.('request_started'); options.onEvent?.('waiting_response');
      if (transport.block) await new Promise(resolve => { release = resolve; });
      options.onEvent?.('response_received', { http_status: 200 });
      const answers = Object.fromEntries(Object.entries(payload.format.properties).map(([key, schema]) => [key,
        schema.type === 'string' ? 'technical' : schema.type === 'integer' ? 2 : ['urgency', 'spam_e01', 'spam_e03'].includes(key)]));
      if (transport.invalid) answers[Object.keys(answers)[0]] = null;
      return { model: 'qwen3:1.7b', done: true, done_reason: 'stop', message: { content: JSON.stringify(answers), thinking: 'test-only private trace' }, load_duration: 1000000, prompt_eval_duration: 2000000, eval_duration: 3000000 };
    }
    throw new Error('Unexpected transport target: paid traffic forbidden in test');
  };
  return { calls, transport, release: () => release?.() };
}
const runBody = plan => ({ demo: plan.demo, case: plan.case, threshold: 0.5, plan_id: plan.plan_id, run_id: randomUUID() });

test('same state and questions, actual constrained schema, JavaScript source and plan binding', async () => {
  for (const demo of ['ticket', 'mail']) {
    const plan = await buildPlan(demo, 'clear');
    const input = strictJson(plan.local_request.messages[1].content);
    assert.deepEqual(input.state, plan.jev_request.state);
    assert.deepEqual(input.questions, plan.jev_request.questions);
    assert.deepEqual(plan.local_request.format.required, Object.keys(plan.jev_request.questions));
    assert.equal(plan.local_request.think, false);
    assert.match(executedJavaScript(), /async executeLocal/);
    assert.doesNotMatch(executedJavaScript(), /Python|def execute/);
    const fake = fakeProvider(), engine = new Engine({ transport: fake.transport });
    const body = runBody(plan); body.plan_id = 'changed code or payload';
    await assert.rejects(engine.run(body), DemoError);
    assert.equal(fake.calls.length, 0);
  }
});

test('one local generation per example, default paid path off, duplicate IDs read cached result', async () => {
  for (const demo of ['ticket', 'mail']) {
    const fake = fakeProvider(), engine = new Engine({ transport: fake.transport });
    const body = runBody(await buildPlan(demo, 'clear'));
    const first = await engine.run(body), second = await engine.run(body);
    assert.equal(first, second);
    assert.equal(first.status, 'finished');
    assert.equal(first.providers.local.ok, true);
    assert.equal(first.providers.local.generation_ms, 3);
    assert.equal(first.providers.jev.generation_requests, 0);
    assert.equal(fake.calls.filter(call => call.url.endsWith('/api/chat')).length, 1);
    assert.equal(JSON.stringify(first).includes('test-only private trace'), false);
    await assert.rejects(engine.run({ ...body, threshold: 0.8 }), /otra solicitud/);
  }
});

test('global gate prevents concurrent generations; invalid output stays an error', async () => {
  const fake = fakeProvider(), engine = new Engine({ transport: fake.transport });
  const plan = await buildPlan('ticket', 'clear');
  fake.transport.block = true;
  const first = engine.run(runBody(plan));
  while (!fake.calls.some(call => call.url.endsWith('/api/chat'))) await new Promise(resolve => setImmediate(resolve));
  await assert.rejects(engine.run(runBody(plan)), /curso|in progress/);
  await assert.rejects(engine.warmup(), /curso|in progress/);
  fake.release(); await first;
  fake.transport.block = false; fake.transport.invalid = true;
  const invalid = await engine.run(runBody(plan));
  assert.equal(invalid.providers.local.ok, false);
  assert.equal('validated' in invalid.providers.local, false);
  assert.equal(invalid.providers.jev.generation_requests, 0);
});

test('strict parsing and closed schema reject duplicates, overflow, missing and extra fields', () => {
  for (const text of ['{"x":1,"x":2}', '{"x":1,"\\u0078":2}', '{"x":1e309}', '{"x":NaN}']) assert.throws(() => strictJson(text), DemoError);
  assert.deepEqual(strictJson('{"a":[true,{"x":"escaped \\\" quote"}],"n":2}'), { a: [true, { x: 'escaped " quote' }], n: 2 });
  for (const value of [true, -1, 3, NaN, Infinity]) assert.throws(() => validate(value, { type: 'number', minimum: 0, maximum: 2 }), DemoError);
  assert.throws(() => validate({ x: 1, extra: 1 }, { type: 'object', properties: { x: { type: 'integer' } }, required: ['x'], additionalProperties: false }), /unexpected/);
  assert.throws(() => validate({}, { type: 'object', properties: {}, required: ['missing'] }), /missing/);
  assert.throws(() => validate('x', { type: 'string', pattern: 'x' }), /Unsupported/);
});

test('Jev wire schema and credential echo redaction tested with synthetic data only', async () => {
  const plan = await buildPlan('ticket', 'clear');
  const raw = { model: 'unit-test-model', answers: {
    category: { type: 'choice', choice: 'technical', confidence: 0.7, probabilities: { billing: 0.1, technical: 0.8, review: 0.1 } },
    frustration: { type: 'score', score: 1.8, confidence: 0.7, probabilities: { 0: 0, 1: 0.2, 2: 0.8 }, legend: Object.fromEntries(plan.jev_request.questions.frustration.criteria.map((text, index) => [String(index), text])) },
    urgency: { type: 'noul', noul: 0.9 },
  } };
  assert.equal(validateJev(raw, plan.jev_request), raw.answers);
  raw.answers.frustration.score = 0;
  assert.throws(() => validateJev(raw, plan.jev_request), /distribution/);
  assert.equal(JSON.stringify(redact({ 'unit-test-secret': ['unit-test-secret'] }, 'unit-test-secret')).includes('unit-test-secret'), false);
});

test('empty preload is separate; unknown durations are null rather than invented zero', async () => {
  const fake = fakeProvider(), result = await new Engine({ transport: fake.transport }).warmup();
  assert.equal(result.load_ms, null);
  assert.equal(fake.calls.filter(call => call.url.endsWith('/api/generate')).length, 1);
  assert.equal(fake.calls.some(call => call.url.endsWith('/api/chat')), false);
  assert.equal(durationMs({ load_duration: 0 }, 'load_duration'), 0);
});

test('HTTP loopback origin/token guards, private paths, plan source and read-only recovery', async t => {
  const fake = fakeProvider(), engine = new Engine({ transport: fake.transport }), server = createDemoServer({ engine });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.close(); server.closeAllConnections(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const session = await (await fetch(`${base}/api/session`)).json();
  const info = await (await fetch(`${base}/api/plan?demo=mail&case=clear`)).json();
  assert.equal(info.javascript_code, executedJavaScript());
  assert.equal('python_code' in info, false);
  for (const name of ['.env', 'demo-server.mjs', 'demo-inputs.json', 'demo_server.py']) assert.equal((await fetch(`${base}/${name}`)).status, 404);
  const body = JSON.stringify(runBody(info.plan));
  assert.equal((await fetch(`${base}/api/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 403);
  const headers = { 'Content-Type': 'application/json', 'X-Demo-Token': session.token, Origin: 'https://example.invalid' };
  assert.equal((await fetch(`${base}/api/run`, { method: 'POST', headers, body })).status, 403);
  delete headers.Origin;
  const result = await (await fetch(`${base}/api/run`, { method: 'POST', headers, body })).json();
  assert.equal(result.providers.local.ok, true);
  assert.equal((await fetch(`${base}/api/result?run_id=${result.run_id}`)).status, 200);
  assert.equal(fake.calls.filter(call => call.url.endsWith('/api/chat')).length, 1);
});

test('native transport does not follow redirects or retry provider errors', async t => {
  let requests = 0;
  const server = (await import('node:http')).createServer((request, response) => { requests++; response.writeHead(302, { Location: '/private' }); response.end(); });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.close(); server.closeAllConnections(); });
  await assert.rejects(providerJson(`http://127.0.0.1:${server.address().port}/`, { state: 'synthetic' }), DemoError);
  assert.equal(requests, 1);
});
