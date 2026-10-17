(function () {
  'use strict';
  const ticketCases = {
    clear: {
      label: 'Cliente frustrado y urgente',
      state: { ticket: { subject: 'La compra no funciona', body: "La compra lleva tres días fallando. Estamos perdiendo ventas. Estoy furioso. Por favor ayúdennos hoy." } },
      answers: {
        category: { type: 'choice', choice: 'technical', probabilities: { billing: 0.03, technical: 0.90, review: 0.07 }, confidence: 0.85 },
        frustration: { type: 'score', score: 1.8, probabilities: { '0': 0, '1': 0.2, '2': 0.8 }, confidence: 0.7, legend: { '0': 'Tranquilo, solo describe hechos', '1': 'Frustrado pero cordial', '2': 'Muy enojado, usa expresiones intensas' } },
        urgency: { type: 'noul', noul: 0.98 },
      },
    },
    ambiguous: {
      label: 'Mensaje tranquilo y poco preciso',
      state: { ticket: { subject: 'Duda sobre un pago', body: 'Mi pago parece extraño. Algo en mi cuenta no funciona. ¿Lo pueden revisar cuando haya tiempo?' } },
      answers: {
        category: { type: 'choice', choice: 'review', probabilities: { billing: 0.2, technical: 0.2, review: 0.6 }, confidence: 0.4 },
        frustration: { type: 'score', score: 0.35, probabilities: { '0': 0.65, '1': 0.35, '2': 0 }, confidence: 0.475, legend: { '0': 'Tranquilo, solo describe hechos', '1': 'Frustrado pero cordial', '2': 'Muy enojado, usa expresiones intensas' } },
        urgency: { type: 'noul', noul: 0.25 },
      },
    },
  };
  const ticketQuestions = {
    category: { type: 'choice', instructions: '¿Qué categoría describe mejor el problema de `ticket`?', criteria: { billing: 'Cobros, reembolsos o pagos de suscripción', technical: 'Errores de software o fallas de integración', review: 'Responsabilidad poco clara; una persona debe aclarar el problema' } },
    frustration: { type: 'score', instructions: '¿Qué tan frustrado suena el cliente en `ticket.body`?', criteria: ['Tranquilo, solo describe hechos', 'Frustrado pero cordial', 'Muy enojado, usa expresiones intensas'] },
    urgency: { type: 'noul', instructions: '¿`ticket.body` describe un problema actual que necesita atención hoy?' },
  };
  const emails = {
    e01: { subject: '¡Ganaste un bono!', body: 'Premio no solicitado: reclama un bono de un concurso en el que no participaste. Primero paga una tarifa.' },
    e02: { subject: '¿Almorzamos mañana?', body: 'Como hablamos, ¿nos vemos a almorzar mañana al mediodía?' },
    e03: { subject: 'Aviso sobre tu cuenta', body: 'Aviso no solicitado: cerraremos tu cuenta. Envía tu contraseña para verificar el acceso de inmediato.' },
    e04: { subject: 'Oferta de servicio no solicitada', body: 'Encontramos tu sitio y queremos ofrecerte un rediseño. ¿Podemos enviarte una cotización?' },
    e05: { subject: 'Notas del proyecto solicitadas', body: 'Aquí están las notas del proyecto que me pediste después de nuestra reunión.' },
  };
  const mailAnswers = Object.fromEntries(['e01','e02','e03','e04','e05'].map((id, i) => ['spam_' + id, { type: 'noul', noul: [0.98,0.04,0.96,0.55,0.08][i] }]));
  const clone = value => JSON.parse(JSON.stringify(value));
  function buildTicketRequest(key = 'clear') {
    if (!ticketCases[key]) throw new Error('Unknown ticket case');
    return { model: 'jev-latest', state: clone(ticketCases[key].state), questions: clone(ticketQuestions) };
  }
  function buildMailRequest() {
    return { model: 'jev-latest', state: { emails: clone(emails) }, questions: Object.fromEntries(Object.keys(emails).map(id => ['spam_' + id, {
      type: 'noul', instructions: '¿El correo en `emails.' + id + '` es spam (promoción no solicitada, estafa o intento de obtener credenciales)? Evalúa solo este correo, no los demás.',
    }])) };
  }
  function ticketResponse(key = 'clear') { return { answers: clone(ticketCases[key].answers) }; }
  function mailResponse() { return { answers: clone(mailAnswers) }; }
  function applyTicketPolicy(answers) {
    const c = answers?.category, f = answers?.frustration, u = answers?.urgency;
    if (!c || !['billing','technical','review'].includes(c.choice) || !Number.isFinite(c.confidence) || c.confidence < 0 || c.confidence > 1 || !Number.isFinite(f?.score) || f.score < 0 || f.score > 2 || !Number.isFinite(u?.noul) || u.noul < 0 || u.noul > 1) {
      return { queue: 'Human triage', priority: 'Review missing or invalid answers', followup: 'Ask for clarification' };
    }
    return { queue: c.choice === 'review' || c.confidence < 0.7 ? 'Human triage' : c.choice === 'technical' ? 'Technical queue' : 'Billing queue', priority: u.noul >= 0.8 ? 'Priority review' : 'Routine review', followup: f.score >= 1.5 ? 'Assign a support owner' : 'Normal follow-up' };
  }
  function groupMail(answers, threshold = 0.5) {
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error('Invalid threshold');
    const groups = { spam: [], notSpam: [] };
    for (const id of Object.keys(emails)) {
      const answer = answers?.['spam_' + id];
      if (answer?.type !== 'noul' || !Number.isFinite(answer.noul) || answer.noul < 0 || answer.noul > 1) throw new Error('Missing or invalid answer for ' + id);
      groups[answer.noul >= threshold ? 'spam' : 'notSpam'].push(id);
    }
    return groups;
  }
  const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
  function ticketMarkup(key) {
    const item = ticketCases[key], policy = applyTicketPolicy(item.answers);
    return `<p class="request-count">1 request · 1 ticket · 3 typed questions · 1 response</p>
      <blockquote class="request-state">${escape(item.state.ticket.body)}</blockquote>
      <div class="single-columns">
        <section class="question-answers"><h3>Questions and returned answers</h3><table><thead><tr><th scope="col">Question key / type</th><th scope="col">Illustrative answer</th></tr></thead><tbody>
          <tr><th scope="row"><code>category</code><small>Choice · issue category</small></th><td class="answer-value returned-answer" aria-hidden="true"><code>${escape(item.answers.category.choice)}</code><small>confidence ${item.answers.category.confidence.toFixed(2)}</small></td></tr>
          <tr><th scope="row"><code>frustration</code><small>Score · rubric 0–2</small></th><td class="answer-value returned-answer" aria-hidden="true"><code>${item.answers.frustration.score.toFixed(2)}</code><small>probability-weighted level</small></td></tr>
          <tr><th scope="row"><code>urgency</code><small>Noul · attention today?</small></th><td class="answer-value returned-answer" aria-hidden="true"><code>${item.answers.urgency.noul.toFixed(2)}</code><small>P(yes), not severity</small></td></tr>
        </tbody></table></section>
        <section class="application-panel"><h3>Application code</h3><div class="application-rules" aria-hidden="true"><p><code>category.choice</code> selects the queue.<br>Low confidence or <code>review</code> goes to a person.</p><p><code>urgency.noul ≥ 0.8</code> sets priority.</p><p><code>frustration.score ≥ 1.5</code> assigns a support owner.</p></div>
          <div class="decision-action single-outcome" aria-hidden="true"><strong>${escape(policy.queue)}</strong><span>${escape(policy.priority)} · ${escape(policy.followup)}</span></div>
        </section>
      </div><p class="single-caveat">One response contains all three answers. These example cutoffs are not validated deployment settings.</p>`;
  }
  function mailMarkup(threshold) {
    const groups = groupMail(mailAnswers, threshold);
    return `<p class="request-count">1 request · 5 synthetic emails · 5 explicitly targeted Noul questions</p>
      <table class="mail-table"><thead><tr><th scope="col">Email in state</th><th scope="col">Question key</th><th scope="col">P(spam)</th><th scope="col">Code group</th></tr></thead><tbody>${Object.entries(emails).map(([id,email]) => `<tr data-mail-id="${id}"><th scope="row"><code>${id}</code> ${escape(email.subject)}</th><td><code>spam_${id}</code></td><td class="returned-answer answer-value" aria-hidden="true">${mailAnswers['spam_'+id].noul.toFixed(2)}</td><td class="mail-group" aria-hidden="true">${groups.spam.includes(id) ? 'Spam' : 'Not spam'}</td></tr>`).join('')}</tbody></table>
      <div class="application-rules mail-rule" aria-hidden="true"><code>answers["spam_" + id].noul ≥ ${threshold.toFixed(2)}</code> places the email in Spam; otherwise in Not spam.</div>
      <div class="decision-action mail-buckets" aria-hidden="true"><div><strong>Spam</strong><span>${groups.spam.join(', ') || 'None'}</span></div><div><strong>Not spam</strong><span>${groups.notSpam.join(', ') || 'None'}</span></div></div>
      <p class="single-caveat">All questions see the shared state; each instruction names its email path. A group is a code decision, not proof that an email is safe.</p>`;
  }
  function mount(root) {
    const mail = root.dataset.singleRequestDemo === 'mail';
    const slide = root.closest('.slide');
    const id = slide.id;
    const phases = ['Build one request','Send once','Read one response','Apply code','Derivar results'];
    let key = 'clear', threshold = 0.5, stage = 0, timer, playing = false;
    root.innerHTML = `<div class="demo-toolbar">${mail ? `<label for="${id}-threshold">Code threshold <select id="${id}-threshold"><option value="0.5">0.50</option><option value="0.8">0.80</option></select></label>` : `<label for="${id}-case">Try a ticket <select id="${id}-case">${Object.entries(ticketCases).map(([k,v]) => `<option value="${k}">${escape(v.label)}</option>`).join('')}</select></label>`}<div class="demo-buttons"><button type="button" data-action="play" aria-pressed="false">▶ Reproducir</button><button type="button" data-action="step">Siguiente paso →</button><button type="button" data-action="reset">Restablecer</button></div></div>
      <ol class="demo-phases">${phases.map((p,i)=>`<li data-phase="${i}"><span>${i+1}</span>${p}</li>`).join('')}</ol><p class="demo-caption" role="status" aria-live="polite"></p><div class="single-content"></div>
      <p class="demo-disclaimer">Illustrative outputs · not a live Jev call. This walkthrough shows the documented state + questions interface, not an internal reasoning trace. No speed or cost savings measured.</p>`;
    const query = selector => root.querySelector(selector);
    function stop() { clearTimeout(timer); playing=false; query('[data-action=play]').textContent=stage===4?'↻ Repetir':'▶ Reproducir'; query('[data-action=play]').setAttribute('aria-pressed','false'); }
    function render() {
      root.dataset.stage = String(stage);
      root.querySelectorAll('[data-phase]').forEach((el,i)=>{el.classList.toggle('is-current',i===stage);el.classList.toggle('is-complete',i<stage);if(i===stage)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
      root.querySelectorAll('.returned-answer').forEach(el=>el.setAttribute('aria-hidden',String(stage<2)));
      root.querySelectorAll('.application-rules,.mail-group').forEach(el=>el.setAttribute('aria-hidden',String(stage<3)));
      root.querySelectorAll('.decision-action').forEach(el=>el.setAttribute('aria-hidden',String(stage<4)));
      query('.demo-caption').textContent = `${stage+1}/5 · ${[
        mail?'Five identified emails and five targeted questions share one state.':'One ticket is the state; category, frustration and urgency are three questions.',
        'Send the complete state and questions in one POST /v1/systemone request.',
        mail?'One response returns all five Noul values under their question keys.':'One response returns Choice, Score and Noul together under their question keys.',
        'The application reads the returned values and applies its own illustrative rules.',
        mail?'Code groups the five emails. Changing the threshold reuses the same prepared answers.':'Code routes the ticket, sets priority and assigns follow-up. Jev has not executed an action.',
      ][stage]}`;
      query('[data-action=step]').disabled = stage===4;
      if(!playing)query('[data-action=play]').textContent=stage===4?'↻ Repetir':'▶ Reproducir';
    }
    function load() { stop();stage=0;query('.single-content').innerHTML=mail?mailMarkup(threshold):ticketMarkup(key);render(); }
    function schedule() { timer=setTimeout(()=>{if(slide.hidden||document.hidden){stop();return;}stage=Math.min(4,stage+1);render();if(stage===4)stop();else schedule();},1500); }
    query('select').addEventListener('change',event=>{if(mail){threshold=Number(event.target.value);stop();query('.single-content').innerHTML=mailMarkup(threshold);render();}else{key=event.target.value;load();}});
    query('[data-action=step]').addEventListener('click',()=>{stop();stage=Math.min(4,stage+1);render();});
    query('[data-action=reset]').addEventListener('click',load);
    query('[data-action=play]').addEventListener('click',()=>{if(playing){stop();return;}if(stage===4)load();playing=true;query('[data-action=play]').textContent='Ⅱ Pausar';query('[data-action=play]').setAttribute('aria-pressed','true');schedule();});
    document.addEventListener('deckchange',()=>{if(slide.hidden)stop();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    load();
  }
  const api = { ticketCases, ticketQuestions, emails, buildTicketRequest, buildMailRequest, ticketResponse, mailResponse, applyTicketPolicy, groupMail };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SingleRequestDemos = api;
  if (typeof document !== 'undefined') document.querySelectorAll('[data-single-request-demo]').forEach(mount);
})();
