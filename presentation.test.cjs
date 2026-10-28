const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { indexForHash, nextIndex } = require('./script.js');

function browserDom(hash = '') {
  return execFileSync('chromium', [
    '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--dump-dom', `http://127.0.0.1:8000/${hash}`,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 });
}

function slideTag(dom, id) {
  const tag = dom.match(new RegExp(`<section[^>]*id="slide-${id}"[^>]*>`))?.[0];
  assert.ok(tag, `slide-${id} should be in the rendered deck`);
  return tag;
}

test('hash-based navigation accepts only in-range slide numbers', () => {
  assert.equal(indexForHash('#slide-8', 17), 7);
  assert.equal(indexForHash('#slide-0', 17), 0);
  assert.equal(indexForHash('#slide-18', 17), 0);
  assert.equal(indexForHash('#slide-nope', 17), 0);
  assert.equal(nextIndex(16, 1, 17), 16);
  assert.equal(nextIndex(0, -1, 17), 0);
  assert.equal(nextIndex(0, 1, 17), 1);
});

test('browser renders a deck, displaying one audience-facing slide at a time', () => {
  const dom = browserDom();
  assert.equal((dom.match(/<section[^>]*class="slide(?: [^"]*)?"/g) || []).length, 21);
  assert.doesNotMatch(slideTag(dom, 1), /\shidden(?:[\s=>]|$)/);
  assert.match(slideTag(dom, 2), /\shidden(?:[\s=>]|$)/);
  assert.match(dom, /id="slide-counter"[^>]*>\s*01 \/ 21/);
  assert.match(dom, /id="progress"/);
});

test('opening a deep link displays that slide and updates the counter', () => {
  const dom = browserDom('#slide-9');
  assert.match(slideTag(dom, 1), /\shidden(?:[\s=>]|$)/);
  assert.doesNotMatch(slideTag(dom, 9), /\shidden(?:[\s=>]|$)/);
  assert.match(dom, /id="slide-counter"[^>]*>\s*09 \/ 21/);
});

test('notes button links to the matching detailed outline topic', () => {
  const requestSlide = browserDom('#slide-9');
  const searchSlide = browserDom('#slide-10');
  assert.match(requestSlide, /id="speaker-notes" href="outline\.html#slide-7"/);
  assert.match(searchSlide, /id="speaker-notes" href="outline\.html#slide-8"/);
});
