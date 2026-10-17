const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('./single-request.js');
const { agenda } = require('./outline.js');
const { withBrowser } = require('./browser-test-helper.cjs');

test('one ticket request and response keep all three typed questions and notes consistent', () => {
  for (const key of ['clear','ambiguous']) {
    const request = D.buildTicketRequest(key), response = D.ticketResponse(key);
    assert.equal(request.model, 'jev-latest');
    assert.deepEqual(Object.keys(request.questions), ['category','frustration','urgency']);
    assert.deepEqual(Object.values(request.questions).map(q=>q.type), ['choice','score','noul']);
    assert.deepEqual(Object.keys(response.answers), Object.keys(request.questions));
    assert.equal(request.state.ticket.body,D.ticketCases[key].state.ticket.body);
    const f=response.answers.frustration;
    assert.ok(Math.abs(f.score-Object.entries(f.probabilities).reduce((sum,[level,p])=>sum+Number(level)*p,0))<1e-8);
    assert.ok(agenda[9].code.includes(JSON.stringify(response,null,2)), 'speaker response must match the visible fixture');
  }
  assert.ok(agenda[6].code.includes(JSON.stringify(D.buildTicketRequest(),null,2)));
  assert.equal(D.applyTicketPolicy(D.ticketResponse().answers).queue,'Technical queue');
  assert.equal(D.applyTicketPolicy(D.ticketResponse().answers).priority,'Priority review');
  assert.equal(D.applyTicketPolicy(D.ticketResponse('ambiguous').answers).queue,'Human triage');
  assert.equal(D.applyTicketPolicy(D.ticketResponse('ambiguous').answers).priority,'Routine review');
  assert.equal(D.applyTicketPolicy(undefined).queue,'Human triage');
});

test('one collection payload targets each email explicitly and groups every returned answer once', () => {
  const request=D.buildMailRequest(), response=D.mailResponse();
  const ids=Object.keys(request.state.emails);
  assert.equal(ids.length,5);
  assert.equal(Object.keys(request.questions).length,5);
  for(const id of ids) {
    const q=request.questions['spam_'+id];
    assert.equal(q.type,'noul');
    assert.ok(q.instructions.includes('`emails.'+id+'`'), 'question IDs alone must never stand in for target instructions');
    assert.ok(q.instructions.includes('Evalúa solo este correo'));
  }
  assert.deepEqual(D.groupMail(response.answers,0.5),{spam:['e01','e03','e04'],notSpam:['e02','e05']});
  assert.deepEqual(D.groupMail(response.answers,0.8),{spam:['e01','e03'],notSpam:['e02','e04','e05']});
  const boundary=structuredClone(response.answers);boundary.spam_e02.noul=0.5;
  assert.ok(D.groupMail(boundary,0.5).spam.includes('e02'));
  delete boundary.spam_e01;
  assert.throws(()=>D.groupMail(boundary,0.5),/Missing or invalid/);
  assert.throws(()=>D.groupMail(response.answers,NaN),/threshold/);
  assert.ok(agenda[10].code.includes(JSON.stringify(request,null,2)));
  assert.ok(agenda[11].code.includes(JSON.stringify(response,null,2)));
});

test('slides link to the dedicated real demos without initiating evaluations', {timeout:30000}, async () => {
  await withBrowser(async ({evaluate,go}) => {
    assert.equal(await evaluate('document.querySelectorAll(".slide").length'),17);
    for (const [number,hash] of [[11,'ticket'],[13,'correos']]) {
      await go(number);
      assert.equal(await evaluate(`document.querySelector('#slide-${number} .demo-launch').getAttribute('href')`),`demos.html#${hash}`);
      assert.equal(await evaluate(`document.querySelectorAll('#slide-${number} [data-action=play],#slide-${number} .comparison-dialog').length`),0);
    }
  });
});
