const test = require('node:test');
const assert = require('node:assert/strict');
const { withBrowser } = require('./browser-test-helper.cjs');

test('flow paths animate while reduced-motion and print preserve complete information', { timeout: 30000 }, async () => {
  await withBrowser(async ({ command, evaluate, go }) => {
    assert.equal(await evaluate('document.querySelectorAll(".time").length'), 0);
    assert.equal(await evaluate('/\\b\\d{1,2}:\\d{2}\\b/.test(document.querySelector("#deck").textContent)'), false);
    await go(9);
    const step = () => evaluate('document.querySelector("#slide-9 [data-action=step]").click()');
    await step();
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#slide-9 [data-edge=\\"1\\"]")).animationName'), 'trace-path');
    await step(); await step();
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#slide-9 .branch-edge.is-selected")).animationName'), 'trace-path');
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#slide-9 .branch-edge.is-selected")).animationName'), 'none');
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#slide-9 .branch-edge.is-selected")).transitionDuration'), '0s');
    await step();
    assert.equal(await evaluate('document.querySelector("#slide-9 .outcome.is-selected").dataset.key'), 'A');
    await command('Emulation.setEmulatedMedia', { media: 'print', features: [] });
    assert.equal(await evaluate('[...document.querySelectorAll(".slide")].filter(el => getComputedStyle(el).display !== "none").length'), 17);
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#slide-9 .decision-action")).visibility'), 'visible');
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#slide-9 .demo-toolbar")).display'), 'none');
  });
});
