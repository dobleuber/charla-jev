const test = require('node:test');
const assert = require('node:assert/strict');
const { withBrowser } = require('./browser-test-helper.cjs');

test('connected flowcharts reveal model answers then highlight only the selected app branch', { timeout: 30000 }, async () => {
  await withBrowser(async ({ evaluate, go, command }) => {
    for (const [number, first, alternate, second] of [[10, 'A', 'unmatched', 'none'], [11, 'yes', 'ambiguous', 'no']]) {
      await go(number);
      const step = () => evaluate(`document.querySelector('#slide-${number} [data-action=step]').click()`);
      assert.equal(await evaluate(`document.querySelectorAll('#slide-${number} svg.flowchart path').length >= 4`), true, 'connected SVG paths must exist');
      assert.equal(await evaluate(`document.querySelectorAll('#slide-${number} .prob-row').length`), 0);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .returned-answer').getAttribute('aria-hidden')`), 'true');
      await step(); await step();
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .returned-answer').getAttribute('aria-hidden')`), 'false');
      assert.equal(await evaluate(`document.querySelectorAll('#slide-${number} .branch-edge.is-selected').length`), 0);
      await step();
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .branch-edge.is-selected').dataset.key`), first);
      assert.equal(await evaluate(`document.querySelectorAll('#slide-${number} .branch-edge:not(.is-selected):not(.is-dimmed)').length`), 0);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .decision-action').getAttribute('aria-hidden')`), 'true');
      await step();
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .outcome.is-selected').dataset.key`), first);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .decision-action').getAttribute('aria-hidden')`), 'false');
      await evaluate(`(()=>{const s=document.querySelector('#slide-${number} select');s.value='${alternate}';s.dispatchEvent(new Event('change'));})()`);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .decision-demo').dataset.stage`), '0');
      assert.equal(await evaluate(`document.querySelectorAll('#slide-${number} .branch-edge.is-selected').length`), 0);
      for(let i=0;i<4;i++) await step();
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .branch-edge.is-selected').dataset.key`), second);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .outcome.is-selected').dataset.key`), second);
    }
  });
});

test('flowchart playback pauses, replays, and stops when leaving the slide', { timeout: 30000 }, async () => {
  await withBrowser(async ({ evaluate, go, pause }) => {
    for (const number of [10,11]) {
      await go(number);
      for(let i=0;i<4;i++) await evaluate(`document.querySelector('#slide-${number} [data-action=step]').click()`);
      await evaluate(`document.querySelector('#slide-${number} [data-action=play]').click()`);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .decision-demo').dataset.stage`), '0');
      await evaluate(`document.querySelector('#slide-${number} [data-action=play]').click()`);
      await pause(1650);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .decision-demo').dataset.stage`), '0');
    }
    await go(10); await evaluate('document.querySelector("#slide-10 [data-action=play]").click()');
    await pause(1650);
    assert.equal(await evaluate('document.querySelector("#slide-10 .decision-demo").dataset.stage'), '1');
    await go(11); await pause(1650);
    assert.equal(await evaluate('document.querySelector("#slide-10 .decision-demo").dataset.stage'), '1');
  });
});
