const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function withBrowser(run) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'jev-browser-'));
  const browser = spawn('chromium', ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let socket;
  const pending = new Map();
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await pause(50);
    assert.ok(fs.existsSync(portFile), 'browser debugging port ready');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
    let id = 0;
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const item = pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timer);
      pending.delete(message.id);
      message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
    });
    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id;
      const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timed out: ${method}`)); }, 5000);
      pending.set(key, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: key, method, params }));
    });
    const evaluate = async expression => {
      const output = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      assert.ok(!output.exceptionDetails, JSON.stringify(output.exceptionDetails));
      return output.result.value;
    };
    const resize = (width, height) => command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await resize(1365, 768);
    await command('Page.navigate', { url: 'http://127.0.0.1:8000/' });
    for (let i = 0; i < 60; i++) {
      if (await evaluate('document.readyState === "complete" && !!document.querySelector("#next")')) break;
      await pause(50);
    }
    const go = async number => {
      await evaluate(`location.hash = '#slide-${number}'`);
      for (let i = 0; i < 40; i++) {
        if (await evaluate(`!document.querySelector('#slide-${number}').hidden`)) return;
        await pause(25);
      }
      throw new Error(`Slide ${number} did not activate`);
    };
    await run({ command, evaluate, resize, go, pause });
  } finally {
    for (const item of pending.values()) clearTimeout(item.timer);
    socket?.close();
    browser.kill();
    await new Promise(resolve => browser.exitCode !== null ? resolve() : browser.once('exit', resolve));
    // Chromium child processes may finish writing shortly after the main process exits.
    await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  }
}
module.exports = { withBrowser };
