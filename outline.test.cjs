const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { agenda, formatTime, renderAgenda, totalMinutes } = require("./outline.js");

test("speaker outline covers the full hour with contiguous, paced slides", () => {
  assert.ok(agenda.length >= 14, "expect a slide-by-slide outline, not nine topic summaries");
  assert.equal(agenda[0].start, 0);
  assert.equal(agenda.at(-1).end, 60);
  assert.equal(agenda.at(-1).start, 50, "reserve ten minutes for questions");
  assert.equal(totalMinutes(agenda), 60);
  for (let i = 1; i < agenda.length; i += 1) {
    assert.equal(agenda[i].start, agenda[i - 1].end);
  }
  for (const slide of agenda) {
    assert.ok(slide.title && slide.visual && slide.speaker && slide.transition, `${slide.title}: needs visual, narration, and transition`);
    assert.ok(slide.speaker.length > 180, `${slide.title}: needs actual speaker substance`);
    assert.ok(slide.points.length >= 2, `${slide.title}: needs specific arguments`);
  }
});

test("Jev demos include showable prompts, safe interpretation, and alternatives stay conceptual", () => {
  const demos = agenda.filter((slide) => slide.demo);
  assert.ok(demos.length >= 3);
  for (const slide of demos) {
    assert.match(slide.demo.input, /\S/);
    assert.match(slide.demo.reveal, /\S/);
    assert.match(slide.demo.caveat, /\S/);
  }
  const talk = agenda.map((slide) => [slide.title, slide.speaker, ...slide.points].join(" ")).join(" ");
  assert.match(talk, /clasificador tradicional/i);
  assert.match(talk, /LLM/i);
  assert.match(talk, /Jev/i);
  assert.match(talk, /KEV/i);
  assert.match(talk, /Laya/i);
  assert.doesNotMatch(talk, /head.to.head benchmark|train Jev/i);
});

test("HTML renders complete notes openly, concrete demo material, and sources", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(60), "1:00");
  const markup = renderAgenda(agenda);
  assert.equal((markup.match(/class="agenda-card"/g) || []).length, agenda.length);
  assert.match(markup, /0:00–0:02/);
  assert.match(markup, /<details open>/);
  assert.match(markup, /<h4>Notas/);
  assert.match(markup, /Entrada:/);
  assert.match(markup, /api\.typesafe\.ai\/v1\/systemone/);
  assert.match(markup, /github\.com\/jaredpalmer\/kev/);
  assert.match(markup, /brainfunctioncollapse\.com\/laya/);
  assert.match(markup, /<pre><code>/);
  assert.doesNotMatch(markup, /<script>/);
  const html = fs.readFileSync("outline.html", "utf8");
  assert.match(html, /<script defer src="outline\.js"><\/script>/);
  assert.match(html, /id="agenda"/);
});
