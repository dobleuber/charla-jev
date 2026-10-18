// Un solo comando para la charla: levanta Ollama si hace falta y el servidor de la
// presentación y las demos. Ctrl+C detiene lo que este script haya iniciado.
//   node start.mjs [--sin-jev] [opciones de demo-server.mjs]
//   node start.mjs modelos      descarga los modelos de las demos
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OLLAMA_URL = 'http://127.0.0.1:11434';
const DEDICATED = path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share'), 'charla-jev/ollama/bin/ollama');
const LOG = path.join(os.tmpdir(), 'charla-jev-ollama.log');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

const args = process.argv.slice(2);
const command = args[0] === 'modelos' ? args.shift() : 'start';
const option = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const models = [option('--local-model') ?? 'qwen3:1.7b', option('--vision-model') ?? 'qwen3-vl:2b-instruct'];

async function installedModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return response.ok ? (await response.json()).models.flatMap(model => [model.name, model.model]) : null;
  } catch { return null; }
}

// Reuses a running Ollama; otherwise starts the isolated one or the system binary.
async function ensureOllama() {
  if (await installedModels()) { console.log('· Ollama ya está corriendo en 127.0.0.1:11434; se reutiliza.'); return null; }
  const [program, programArgs, label] = fs.existsSync(DEDICATED) ? ['bash', [path.join(ROOT, 'start-ollama.sh')], 'Ollama aislado de la charla']
    : spawnSync('ollama', ['--version'], { stdio: 'ignore' }).status === 0 ? ['ollama', ['serve'], 'Ollama del sistema'] : [];
  if (!program) { console.log('· Ollama no está instalado: las demos solo podrán usar JEV.'); return null; }
  const log = fs.openSync(LOG, 'w');
  const child = spawn(program, programArgs, { cwd: ROOT, stdio: ['ignore', log, log], env: program === 'ollama' ? { ...process.env, OLLAMA_HOST: '127.0.0.1:11434' } : process.env });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await installedModels()) { console.log(`· ${label} iniciado (registro en ${LOG}).`); return child; }
    if (child.exitCode !== null) break;
    await pause(300);
  }
  child.kill();
  console.log(`· No se pudo iniciar Ollama; revisa ${LOG}. Las demos solo podrán usar JEV.`);
  return null;
}

async function pullModels() {
  const ollama = await ensureOllama();
  if (!(await installedModels())) process.exit(1);
  try {
    for (const model of models) {
      console.log(`· Descargando ${model}…`);
      const response = await fetch(`${OLLAMA_URL}/api/pull`, { method: 'POST', body: JSON.stringify({ model }) });
      let shown = '', buffer = '';
      for await (const chunk of response.body) {
        buffer += Buffer.from(chunk).toString();
        const lines = buffer.split('\n'); buffer = lines.pop();
        for (const line of lines.filter(Boolean)) {
          const event = JSON.parse(line);
          if (event.error) throw new Error(event.error);
          const percent = event.total ? ` ${Math.floor((event.completed ?? 0) / event.total * 10) * 10}%` : '';
          if (event.status + percent !== shown) { shown = event.status + percent; console.log(`  ${shown}`); }
        }
      }
    }
    console.log('· Modelos listos.');
  } catch (error) {
    console.error(`· Falló la descarga: ${error.message}`); process.exitCode = 1;
  } finally { ollama?.kill(); }
}

async function start() {
  const ollama = await ensureOllama();
  const installed = await installedModels();
  const missing = installed ? models.filter(model => !installed.includes(model)) : [];
  if (missing.length) console.log(`· Faltan modelos en Ollama: ${missing.join(', ')}. Descárgalos una vez con: npm run modelos`);
  const serverArgs = args.filter(arg => arg !== '--sin-jev');
  const jev = Boolean(process.env.TYPESAFE_API_KEY) && !args.includes('--sin-jev');
  if (jev && !serverArgs.includes('--enable-jev')) serverArgs.push('--enable-jev');
  console.log(jev ? '· JEV habilitado: cada vez que pulses Ejecutar se envía una petición que puede consumir créditos.'
    : '· JEV sin habilitar: exporta TYPESAFE_API_KEY antes de npm start para usarlo.');
  const port = option('--port') ?? '8000';
  const server = spawn(process.execPath, [path.join(ROOT, 'demo-server.mjs'), ...serverArgs], { cwd: ROOT, stdio: 'inherit' });
  const stop = () => { server.kill('SIGTERM'); ollama?.kill('SIGTERM'); };
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, stop);
  server.on('spawn', () => setTimeout(() => {
    if (server.exitCode === null) console.log(`\n  Presentación: http://127.0.0.1:${port}/index.html\n  Notas:        http://127.0.0.1:${port}/outline.html\n  Demos:        http://127.0.0.1:${port}/demos.html\n\n  Ctrl+C para detener todo.\n`);
  }, 400));
  server.on('exit', code => { ollama?.kill('SIGTERM'); process.exitCode = code ?? 0; });
}

await (command === 'modelos' ? pullModels() : start());
