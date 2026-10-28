const test = require('node:test');
const assert = require('node:assert/strict');
const { withBrowser } = require('./browser-test-helper.cjs');

test('all slides fit horizontally at desktop, tablet and narrow mobile widths', { timeout: 30000 }, async () => {
  await withBrowser(async ({ command, evaluate, resize, go }) => {
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const problems = [];
    for (const [width, height] of [[1365, 768], [1024, 768], [390, 844], [320, 740]]) {
      await resize(width, height);
      for (let number = 1; number <= 21; number++) {
        await go(number);
        const result = await evaluate(`(() => {
          const slide = document.querySelector('.slide:not([hidden])');
          return { documentOverflow: document.documentElement.scrollWidth - innerWidth, slideOverflow: slide.scrollWidth - slide.clientWidth };
        })()`);
        if (result.documentOverflow > 1 || result.slideOverflow > 1) problems.push({ width, number, ...result });
      }
    }
    assert.deepEqual(problems, [], 'horizontal overflow must be fixed at its source, including slide scroll containers');
    for (const [width, height] of [[1365, 768], [1024, 768], [390, 844]]) {
      await resize(width, height);
      for (const number of [10, 11]) {
        await go(number);
        const cases = await evaluate(`[...document.querySelector('#slide-${number} select').options].map(option => option.value)`);
        for (const key of cases) {
          await evaluate(`(()=>{const select=document.querySelector('#slide-${number} select');select.value=${JSON.stringify(key)};select.dispatchEvent(new Event('change'));})()`);
          await evaluate(`document.querySelector('#slide-${number} [data-action=reset]').click()`);
          for (let stage = 0; stage <= 4; stage++) {
            const geometry = await evaluate(`(()=>{
              const slide=document.querySelector('#slide-${number}');
              return { overflow:slide.scrollWidth-slide.clientWidth, overlaps:slide.querySelector('.decision-demo').getBoundingClientRect().bottom > slide.querySelector('.bottom').getBoundingClientRect().top + 1 };
            })()`);
            assert.ok(geometry.overflow <= 1, `slide ${number}/${key}/${stage} at ${width}px must fit horizontally`);
            assert.equal(geometry.overlaps, false, `slide ${number}/${key}/${stage} at ${width}px must not cover the footer`);
            if (stage < 4) await evaluate(`document.querySelector('#slide-${number} [data-action=step]').click()`);
          }
        }
      }
    }
  });
});
