import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { DemoError, Engine, applicationResult, buildPlan, createDemoServer, displayPlan, imageInfo, validateJev, validateState } from './demo-server.mjs';

// Synthetic images only: a real PNG encoded with zlib and minimal JPEG headers.
function png(width, height, { animated = false } = {}) {
  const chunk = (type, data) => { const body = Buffer.concat([Buffer.from(type, 'latin1'), data]); const length = Buffer.alloc(4), crc = Buffer.alloc(4); length.writeUInt32BE(data.length); crc.writeUInt32BE(zlib.crc32(body)); return Buffer.concat([length, body, crc]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const rows = Buffer.alloc((width * 3 + 1) * height, 200);
  for (let row = 0; row < height; row++) rows[row * (width * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), ...(animated ? [chunk('acTL', Buffer.alloc(8))] : []), chunk('IDAT', zlib.deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}
function jpeg(width, height, orientation) {
  const parts = [Buffer.from([0xff, 0xd8])];
  if (orientation) {
    const tiff = Buffer.from([0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0]);
    const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]), length = Buffer.alloc(2); length.writeUInt16BE(app1.length + 2);
    parts.push(Buffer.from([0xff, 0xe1]), length, app1);
  }
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, 0, 0, 0, 0, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  sof.writeUInt16BE(height, 5); sof.writeUInt16BE(width, 7);
  return Buffer.concat([...parts, sof, Buffer.from([0xff, 0xd9])]);
}
async function photoRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jev-photo-'));
  await fs.copyFile(new URL('./demo-inputs.json', import.meta.url), path.join(root, 'demo-inputs.json'));
  await fs.mkdir(path.join(root, 'fotos'));
  for (const name of ['caja-golpeada.jpg', 'caja-intacta.jpg', 'foto-poco-clara.jpg']) await fs.writeFile(path.join(root, 'fotos', name), jpeg(1024, 768));
  return root;
}
const jevBox = { type: 'box', box: { top: 0.4, bottom: 0.55, left: 0.55, right: 0.65 }, confidence: 0.9 };
const jevAnswers = { danio_visible: { type: 'noul', noul: 0.92 }, tipo_danio: { type: 'choice', choice: 'caja', confidence: 0.8, probabilities: { caja: 0.8, producto: 0.15, no_visible: 0.05 } }, coincide_con_reclamo: { type: 'noul', noul: 0.88 }, ubicacion_danio: jevBox };
function fakeProviders({ bbox = [548, 388, 655, 552] } = {}) {
  const calls = [];
  const transport = async (url, payload, options = {}) => {
    calls.push({ url, payload, options });
    if (url.endsWith('/api/tags')) return { models: [{ name: 'qwen3:1.7b', digest: 'text' }, { name: 'qwen3-vl:2b-instruct', digest: 'vision' }] };
    if (url.endsWith('/api/chat')) return { model: payload.model, done: true, done_reason: 'stop', message: { content: JSON.stringify({ danio_visible: true, tipo_danio: 'caja', coincide_con_reclamo: true, ubicacion_danio: { bbox_2d: bbox } }) } };
    if (url.startsWith('https://api.typesafe.ai/')) return { model: 'jev-1.14.0', answers: jevAnswers, usage: { input_tokens: 900, output_tokens: 40 } };
    throw new Error('Unexpected transport target');
  };
  return { calls, transport };
}

test('image checks accept JEV-sized PNG and JPEG and reject animation, rotation and bad sizes', () => {
  assert.deepEqual(imageInfo(png(320, 300)), { format: 'png', width: 320, height: 300 });
  assert.deepEqual(imageInfo(jpeg(1024, 768)), { format: 'jpg', width: 1024, height: 768 });
  assert.deepEqual(imageInfo(jpeg(1024, 768, 1)), { format: 'jpg', width: 1024, height: 768 });
  assert.throws(() => imageInfo(png(320, 300, { animated: true })), /animado/);
  assert.throws(() => imageInfo(jpeg(1024, 768, 6)), /rotación EXIF/);
  assert.throws(() => imageInfo(png(200, 300)), /entre 280 y 1568/);
  assert.throws(() => imageInfo(jpeg(2000, 900)), /entre 280 y 1568/);
  assert.throws(() => imageInfo(Buffer.from('GIF89a----------------------')), /PNG o JPEG/);
});

test('photo plan sends the same bytes to both providers and the browser sees only a summary', async () => {
  const root = await photoRoot(), photo = await fs.readFile(path.join(root, 'fotos', 'caja-golpeada.jpg'));
  const plan = await buildPlan('photo', 'damaged', 'qwen3-vl:2b-instruct', root);
  const asset = plan.jev_request.assets[plan.jev_request.state.foto];
  assert.equal(plan.jev_request.model, 'jev-1.14.0');
  assert.deepEqual(asset, { type: 'image', format: 'jpg', data_base64: photo.toString('base64') });
  assert.deepEqual(plan.local_request.messages[1].images, [photo.toString('base64')]);
  assert.equal(plan.local_request.model, 'qwen3-vl:2b-instruct');
  assert.deepEqual(plan.local_request.format.properties.ubicacion_danio.properties.bbox_2d, { type: 'array', items: { type: 'integer', minimum: 0, maximum: 1000 }, minItems: 4, maxItems: 4 });
  const shown = JSON.stringify(displayPlan(plan));
  assert.doesNotMatch(shown, new RegExp(photo.toString('base64').slice(0, 24).replace(/[+/]/g, '\\$&')));
  assert.match(shown, /base64 omitido · fotos\/caja-golpeada\.jpg/);
  assert.notEqual(plan.plan_id, (await buildPlan('photo', 'intact', 'qwen3-vl:2b-instruct', root)).plan_id);
  assert.throws(() => validateState('photo', { ...plan.jev_request.state, foto: 'otra-imagen' }, plan.jev_request.state), DemoError);
  await fs.rm(path.join(root, 'fotos', 'caja-intacta.jpg'));
  await assert.rejects(buildPlan('photo', 'intact', 'qwen3-vl:2b-instruct', root), /Falta la foto fotos\/caja-intacta\.jpg/);
});

test('JEV gets the image header; the local bbox_2d is normalized and policy never refunds', async () => {
  const root = await photoRoot(), fake = fakeProviders(), engine = new Engine({ transport: fake.transport, root, enableJev: true });
  process.env.TYPESAFE_API_KEY = 'unit-test-key';
  try {
    const plan = await buildPlan('photo', 'damaged', engine.modelFor('photo'), root);
    const result = await engine.run({ demo: 'photo', case: 'damaged', threshold: 0.5, plan_id: plan.plan_id, run_id: randomUUID() });
    const jevCall = fake.calls.find(call => call.url.startsWith('https://api.typesafe.ai/'));
    assert.equal(jevCall.options.headers['TypeSafe-Danger-Zone-Images'], 'true');
    assert.equal(fake.calls.find(call => call.url.endsWith('/api/chat')).payload.model, 'qwen3-vl:2b-instruct');
    assert.equal(result.providers.local.ok, true);
    assert.deepEqual(result.providers.local.validated.ubicacion_danio, { top: 0.388, bottom: 0.552, left: 0.548, right: 0.655, bbox_2d: [548, 388, 655, 552] });
    assert.equal(result.providers.jev.application.route, 'review_with_evidence');
    assert.equal(result.providers.local.application.refund, 'never_automatic');
  } finally { delete process.env.TYPESAFE_API_KEY; }
  const inverted = new Engine({ transport: fakeProviders({ bbox: [700, 388, 655, 552] }).transport, root });
  const plan = await buildPlan('photo', 'damaged', inverted.modelFor('photo'), root);
  const result = await inverted.run({ demo: 'photo', case: 'damaged', threshold: 0.5, plan_id: plan.plan_id, run_id: randomUUID() });
  assert.equal(result.providers.local.ok, false);
  assert.match(result.providers.local.error, /inverted/);
});

test('Box answers must keep ordered edges and confidence; routes follow the illustrative cut-offs', async () => {
  const request = (await buildPlan('photo', 'damaged', 'qwen3-vl:2b-instruct', await photoRoot())).jev_request;
  assert.ok(validateJev({ model: 'jev-1.14.0', answers: jevAnswers }, request));
  for (const box of [{ ...jevBox.box, left: 0.7 }, { ...jevBox.box, extra: 1 }, { ...jevBox.box, bottom: 1.2 }]) assert.throws(() => validateJev({ model: 'jev-1.14.0', answers: { ...jevAnswers, ubicacion_danio: { ...jevBox, box } } }, request), DemoError);
  const noul = (danio, coincide) => ({ ...jevAnswers, danio_visible: { noul: danio }, coincide_con_reclamo: { noul: coincide } });
  assert.equal(applicationResult('photo', noul(0.9, 0.9), false).route, 'review_with_evidence');
  assert.equal(applicationResult('photo', noul(0.9, 0.3), false).route, 'request_more_info');
  assert.equal(applicationResult('photo', noul(0.3, 0.6), false).show_box, false);
  assert.equal(applicationResult('photo', { danio_visible: false, coincide_con_reclamo: true }, true).route, 'manual_review');
});

test('photos are served only from fotos/ and the warmup can target the vision model', async () => {
  const root = await photoRoot(), fake = fakeProviders();
  const engine = new Engine({ root, transport: async (url, payload, options) => url.endsWith('/api/generate') ? { model: payload.model } : fake.transport(url, payload, options) });
  const server = createDemoServer({ engine, root }); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const photo = await fetch(`${base}/fotos/caja-golpeada.jpg`);
    assert.equal(photo.status, 200); assert.equal(photo.headers.get('content-type'), 'image/jpeg');
    for (const bad of ['/fotos/../demo-inputs.json', '/fotos/%2e%2e%2fdemo-inputs.json', '/fotos/nota.txt']) assert.equal((await fetch(base + bad)).status, 404);
    const { token, local_vision } = await (await fetch(`${base}/api/session`)).json();
    assert.equal(local_vision.model, 'qwen3-vl:2b-instruct');
    const warm = await fetch(`${base}/api/warmup`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Demo-Token': token }, body: JSON.stringify({ demo: 'photo' }) });
    assert.equal((await warm.json()).model, 'qwen3-vl:2b-instruct');
  } finally { server.close(); }
});
