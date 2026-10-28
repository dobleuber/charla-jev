(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const categories = { billing: 'Facturación', technical: 'Soporte técnico', review: 'Revisión humana' };
  const events = { preparing: 'Preparando envío', request_started: 'HTTP iniciado', waiting_response: 'Esperando respuesta', response_received: 'Respuesta recibida', schema_check: 'Validando estructura', schema_valid: 'Estructura válida', result: 'Resultados listos', error: 'No completado' };
  const hashes = { ticket: 'ticket', mail: 'correos', photo: 'foto' }, order = ['ticket', 'mail', 'photo'];
  const backSlides = { ticket: 11, mail: 13, photo: 14 };
  const damageTypes = { caja: 'Daño en la caja o el empaque', producto: 'Daño en el producto', no_visible: 'No se ve daño' };
  const routes = { review_with_evidence: 'Revisión prioritaria con la foto como evidencia', manual_review: 'Revisión manual', request_more_info: 'Pedir otra foto o más detalles' };
  let scenario = Object.keys(hashes).find(key => location.hash === '#' + hashes[key]) ?? 'ticket';
  // The photo demo runs on the multimodal model; text demos on the text model.
  const localInfo = () => scenario === 'photo' ? session?.local_vision ?? session?.local : session?.local;
  let catalog, session, planInfo, activeRun = null, channel, busy = true, codeTab = 'requests', codeDirty = true;
  let shownEvents = new Set(), clockTimer, lastResult, codeTimer;
  function markDirty() {
    codeDirty = true; planInfo = null;
    $('#code-content').textContent = 'La entrada cambió. Cargando las solicitudes actualizadas…';
    clearTimeout(codeTimer);
    if ($('#code-panel').open) codeTimer = setTimeout(loadCode, 400);
  }
  async function loadCode() {
    try { if (codeDirty) await prepare(); else showCode(); }
    catch (error) { $('#code-content').textContent = humanError(error.message); }
  }
  const formatMs = number => number == null ? 'No reportado' : `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(number)} ms`;
  const formatSeconds = number => `${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.max(0, number) / 1000)} s`;
  function text(parent, tag, value, className) { const node = document.createElement(tag); node.textContent = value; if (className) node.className = className; parent.append(node); return node; }
  function humanError(message) {
    const value = String(message ?? '');
    const translations = {
      'Jev paid calls disabled. Explicit --enable-jev and server-side key required.': 'JEV no está habilitado en este servidor. No se envió ninguna solicitud.',
      'Server environment lacks TYPESAFE_API_KEY': 'Falta la clave en el entorno del servidor. No se envió ninguna solicitud.',
      'Selected model is not installed': 'El modelo local no está instalado. No se envió ninguna solicitud.',
      'Ollama is not reachable at 127.0.0.1:11434': 'Ollama no está disponible en 127.0.0.1:11434. No se envió ninguna solicitud.',
      'Cloud model rejected': 'El modelo debe ser local.',
      'Incomplete output or unexpected model': 'La respuesta quedó incompleta o devolvió otro modelo.',
      'Missing assistant response': 'El proveedor no devolvió una respuesta válida.',
      'Response is not valid JSON': 'La respuesta no es JSON válido.',
      'Duplicate JSON key': 'La respuesta contiene una clave JSON duplicada.',
      'Unknown demo/case': 'El escenario o ejemplo no existe.',
      'Another run is in progress': 'Ya hay una ejecución en curso.',
      'JSON nesting exceeds limit': 'El JSON supera el límite de profundidad.',
      'Non-finite JSON value': 'El JSON contiene un número no finito.',
      'Not found': 'No se encontró ese recurso.',
      'No recorded result': 'No se encontró un resultado para ese identificador.',
      'Provider response exceeds limit': 'La respuesta del proveedor supera el límite permitido.',
      'Jev model or answer keys do not match': 'El modelo o las claves de respuesta de JEV no coinciden.',
      'Jev distribution does not match criteria': 'La distribución de JEV no coincide con los criterios.',
      'Jev probabilities do not sum to one': 'Las probabilidades de JEV no suman uno.',
      'Choice is not a highest-probability option': 'La opción elegida no tiene la mayor probabilidad.',
      'Score disagrees with its distribution': 'El puntaje no coincide con su distribución.',
      'Score legend does not match rubric': 'La leyenda del puntaje no coincide con la rúbrica.',
      'Invalid size or content type': 'Tamaño o tipo de contenido inválido.',
      'Request exceeds limit': 'La solicitud supera el tamaño permitido.',
      'Incomplete request': 'La solicitud está incompleta.',
      'Invalid request or local server error': 'Solicitud inválida o error del servidor local.',
      'Session token rejected': 'La sesión cambió. Actualiza la página.',
      'Origin/Host rejected': 'El servidor rechazó el origen de esta página.',
      'Runner response has invalid metadata; no retry performed': 'El modelo local devolvió metadatos inválidos. No se reintentó.',
      'Invalid Jev response; no retry performed': 'JEV devolvió una respuesta inválida. No se reintentó.',
      'Box edges are inverted': 'El recuadro devuelto tiene los bordes invertidos.',
    };
    if (translations[value]) return translations[value];
    if (/timeout|timed out|aborted due to timeout/i.test(value)) return 'Se agotó el tiempo de espera. El estado del servidor puede ser incierto; no se reintentó.';
    if (/Failed to fetch|fetch failed/i.test(value)) return 'No se pudo conectar. El estado del servidor puede ser incierto; no se reintentó.';
    return value.replace(/Jev answer type does not match (.*)/, 'El tipo de respuesta de JEV no coincide en $1').replace(/Provider HTTP (\d+); no retry performed/, 'El proveedor devolvió HTTP $1. No se reintentó.')
      .replace(/wrong type/g, 'tipo incompatible').replace(/missing field/g, 'campo obligatorio ausente')
      .replace(/unexpected field/g, 'campo no permitido').replace(/unknown category/g, 'categoría no permitida')
      .replace(/value outside range/g, 'valor fuera de rango');
  }
  async function api(url, body, renewed = false) {
    const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Demo-Token': session.token }, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(url === '/api/warmup' ? 100000 : 12000) });
    const value = await response.json();
    if (response.status === 403 && value.error === 'Session token rejected' && !renewed) {
      session = { ...session, ...await api('/api/session') };
      return api(url, body, true);
    }
    if (!response.ok) { const error = new Error(humanError(value.error)); error.httpStatus=response.status; throw error; }
    return value;
  }
  function setBusy(value) {
    busy = value;
    $('#execute').disabled = value || !session || (!localInfo().ready && !(session.jev_enabled && session.jev_key_present));
    $('#cancel').disabled = !value || !activeRun;
    if(value && activeRun) $('#execute').textContent='Ejecutando…';
    else if(session) $('#execute').textContent=executeLabel();
    $('#reset').disabled = value || !catalog; $('#warmup').disabled = value || !localInfo()?.ready; $('#view-code').disabled = !catalog;
    document.querySelectorAll('[data-scenario], #preset, #threshold, #editor input, #editor textarea').forEach(node => { node.disabled = value; });
  }
  function executeLabel() {
    const jev = session.jev_enabled && session.jev_key_present, local = localInfo().ready;
    return jev && local ? '▶ Ejecutar en ambos · 1 petición por proveedor' : local ? '▶ Ejecutar solo en LLM local' : jev ? '▶ Ejecutar solo en JEV remoto' : 'Ningún proveedor disponible';
  }
  function showAvailability() {
    const jev = session.jev_enabled && session.jev_key_present, local = localInfo();
    $('#jev-availability').textContent = jev ? 'JEV habilitado · se comprueba al ejecutar' : 'JEV sin habilitar';
    $('#jev-availability').classList.toggle('ready', jev);
    $('#local-availability').textContent = local.ready ? `Ollama · ${local.model} · CPU` : local.error === 'Selected model is not installed' ? `Ollama · falta ${local.model}` : 'Ollama no disponible';
    $('#local-availability').classList.toggle('ready', local.ready);
    $('#session-caption').textContent = `LLM: ${local.model} · sin reintentos automáticos`;
    $('#provider-local .provider-subtitle').textContent = scenario === 'photo' ? 'Booleanos, categoría y recuadro bbox_2d con JSON Schema' : 'Categoría · nivel ordinal · sí/no con JSON Schema';
    $('#provider-jev .provider-subtitle').textContent = scenario === 'photo' ? 'Probabilidades · Noul · recuadro Box con confianza' : 'Probabilidades · Score ponderado · Noul';
  }
  async function availability() {
    session = await api('/api/session');
    showAvailability();
    for (const provider of ['local','jev']) $(`#provider-${provider} [data-count]`).textContent = session.counters?.[provider] ?? 0;
    setBusy(busy);
  }
  function inputs() {
    const entries = [...document.querySelectorAll('[data-message-id]')].map(node => [node.dataset.messageId, { subject: node.querySelector('input').value, body: node.querySelector('textarea').value }]);
    if (scenario === 'photo') return { reclamo: entries[0][1], foto: catalog.photo[$('#preset').value].state.foto };
    return scenario === 'ticket' ? { ticket: entries[0][1] } : { emails: Object.fromEntries(entries) };
  }
  const photoFile = key => Object.values(catalog.photo[key].assets)[0].file;
  // The same photo goes to both providers; each draws its own box over it.
  function photoFigure(parent, key, boxes = []) {
    const figure = document.createElement('figure'); figure.className = 'photo-frame';
    const image = document.createElement('img'); image.src = '/' + photoFile(key); image.alt = 'Foto adjunta al reclamo'; figure.append(image);
    for (const { box, label } of boxes) {
      const mark = document.createElement('div'); mark.className = 'photo-box';
      Object.assign(mark.style, { left: `${box.left * 100}%`, top: `${box.top * 100}%`, width: `${(box.right - box.left) * 100}%`, height: `${(box.bottom - box.top) * 100}%` });
      text(mark, 'span', label); figure.append(mark);
    }
    parent.append(figure); return figure;
  }
  function renderEditor() {
    const key = $('#preset').value;
    const state = catalog[scenario][key].state;
    $('#editor').replaceChildren();
    if (scenario === 'photo') { photoFigure($('#editor'), key); text($('#editor'), 'p', `${photoFile(key)} · la misma imagen llega a ambos proveedores.`, 'helper'); }
    const messages = scenario === 'ticket' ? [['ticket', state.ticket]] : scenario === 'photo' ? [['reclamo', state.reclamo]] : Object.entries(state.emails);
    for (const [id, message] of messages) {
      const container = document.createElement(scenario === 'mail' ? 'details' : 'div');
      container.dataset.messageId = id;
      if (scenario === 'mail') { container.className = 'mail-editor'; container.open = id === 'e01'; text(container, 'summary', `${id} · ${message.subject}`); }
      const subject = text(container, 'label', 'Asunto', 'field'), input = document.createElement('input'); input.value = message.subject; input.maxLength = 160; subject.append(input);
      const body = text(container, 'label', 'Contenido', 'field'), textarea = document.createElement('textarea'); textarea.value = message.body; textarea.maxLength = 1200; body.append(textarea);
      for (const node of [input, textarea]) node.addEventListener('input', markDirty);
      $('#editor').append(container);
    }
    markDirty();
  }
  function switchScenario(next) {
    if (busy) return;
    scenario = next; location.hash = hashes[next];
    document.querySelectorAll('[data-scenario]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.scenario === scenario)));
    $('#back-link').href = `index.html#slide-${backSlides[scenario]}`;
    $('#preset').replaceChildren();
    const labels = { clear: scenario === 'ticket' ? 'Problema claro y urgente' : 'Bandeja mixta', ambiguous: scenario === 'ticket' ? 'Mensaje poco preciso' : 'Promoción o conversación', billing: 'Cobro que necesita revisión', damaged: 'Caja golpeada', intact: 'Caja intacta', slight: 'Daño leve' };
    for (const key of Object.keys(catalog[scenario])) { const option = document.createElement('option'); option.value = key; option.textContent = labels[key] ?? key; $('#preset').append(option); }
    $('#task-title').textContent = scenario === 'ticket' ? 'Tres preguntas, una respuesta' : scenario === 'photo' ? 'Cuatro preguntas sobre una foto' : 'Cinco preguntas, una respuesta';
    $('#task-description').replaceChildren();
    const questions = scenario === 'ticket' ? [['Categoría · Choice','Facturación, soporte técnico o revisión.'],['Frustración · Score','La misma rúbrica ordenada de 0 a 2.'],['Urgencia · Noul','¿Necesita atención hoy?']]
      : scenario === 'photo' ? [['¿Hay daño visible? · Noul','Sobre la imagen adjunta.'],['Tipo de daño · Choice','Caja, producto o no se ve.'],['¿Coincide con el reclamo? · Noul','La foto frente al texto del cliente.'],['¿Dónde está el daño? · Box','Un recuadro sobre la imagen.']]
      : [['Cinco correos, una entrada','e01–e05 comparten el mismo estado.'],['Una pregunta por correo','Cada instrucción apunta a su identificador.'],['Un envío por proveedor','Las cinco respuestas llegan juntas.']];
    for (const [title, description] of questions) { const row = document.createElement('div'); row.className = 'task-question'; text(row,'strong',title); text(row,'span',description); $('#task-description').append(row); }
    $('#threshold-label').hidden = scenario !== 'mail'; $('#threshold-note').hidden = scenario !== 'mail';
    $('#photo-note').hidden = scenario !== 'photo';
    if (session) { showAvailability(); setBusy(busy); }
    renderEditor(); clearResults();
  }
  function clearResults() {
    if (busy) return;
    activeRun = null; lastResult = null; channel?.close(); clearInterval(clockTimer); shownEvents = new Set();
    for (const provider of ['local','jev']) {
      const card = $(`#provider-${provider}`); card.classList.remove('waiting'); card.querySelector('[data-state]').textContent = 'Sin enviar'; card.querySelector('[data-state]').className = 'state-chip'; card.querySelector('[data-clock]').textContent = '0,00 s'; card.querySelector('.event-list').replaceChildren(); card.querySelector('.wait-indicator').hidden = true; card.querySelector('.provider-result').replaceChildren(); text(card.querySelector('.provider-result'),'p','Pulsa Ejecutar para ver una respuesta real.','empty-state');
    }
    $('#arrival-order').textContent = 'El orden de llegada aparecerá con los tiempos observados.';
    $('#run-status').textContent = 'Aquí comienza la ejecución real. No se envía nada hasta pulsar Ejecutar.';
    $('#cancel-note').hidden = true;
  }
  async function prepare() {
    planInfo = await api('/api/plan', { demo: scenario, case: $('#preset').value, state: inputs() });
    codeDirty = false; showCode();
    return planInfo.plan;
  }
  function rawFor(provider) {
    const item = lastResult?.providers?.[provider];
    if (!item) return '// Pulsa Ejecutar para ver aquí la respuesta original.';
    const raw = structuredClone(item.raw ?? { error: item.error ?? 'Sin respuesta' });
    if (typeof raw.message?.content === 'string') { try { raw.message.content = JSON.parse(raw.message.content); } catch {} }
    return JSON.stringify(raw, null, 2);
  }
  function showCode() {
    if (!planInfo) return;
    document.querySelectorAll('[data-code-tab]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.codeTab === codeTab)));
    const plan = planInfo.plan;
    const responses = codeTab === 'responses';
    $('#code-block').hidden = responses; $('#code-responses').hidden = !responses;
    if (responses) { $('#response-jev').textContent = rawFor('jev'); $('#response-local').textContent = rawFor('local'); return; }
    $('#code-content').textContent = codeTab === 'implementation' ? planInfo.javascript_code : codeTab === 'schema' ? `// JSON Schema real enviado a Ollama\nconst schema = ${JSON.stringify(plan.local_request.format,null,2)};\n\n// Preguntas y rúbrica compartidas\nconst questions = ${JSON.stringify(plan.jev_request.questions,null,2)};` : `// Solicitudes que el servidor envía a cada proveedor.\nconst jevRequest = ${JSON.stringify(plan.jev_request,null,2)};\n\nconst localRequest = ${JSON.stringify(plan.local_request,null,2)};`;
  }
  function clocks() {
    if (!lastResult) return;
    for (const provider of ['local','jev']) {
      const card = $(`#provider-${provider}`), start = lastResult.events.find(event => event.provider === provider && event.type === 'request_started');
      const final = lastResult.providers[provider];
      const elapsed = final?.wall_ms ?? (start ? Date.now() - Date.parse(lastResult.started_at) - start.elapsed_ms : 0);
      card.querySelector('[data-clock]').textContent = formatSeconds(elapsed);
    }
  }
  function distributions(parent, probabilities, labels = {}) {
    for (const [key, number] of Object.entries(probabilities)) {
      const row = document.createElement('div'); row.className = 'distribution-row'; text(row,'span',labels[key] ?? key); const track = document.createElement('div'); track.className = 'distribution-track'; const fill = document.createElement('div'); fill.className = 'distribution-fill'; fill.style.width = `${number*100}%`; track.append(fill); row.append(track); text(row,'strong',number.toFixed(2).replace('.',',')); parent.append(row);
    }
  }
  function output(provider, item) {
    const container = $(`#provider-${provider} .provider-result`); container.replaceChildren();
    if (!item.ok) { const box = text(container,'div', item.generation_requests ? 'La solicitud no se completó.' : 'No se envió una evaluación.', 'provider-error'); text(box,'p',humanError(item.error)); if (item.raw) rawResponse(container,item.raw); return; }
    text(container,'div','✓ Forma validada · esto no demuestra acierto','validation-badge');
    const answers = item.validated;
    if (lastResult.demo === 'ticket') {
      const fields = [['category','Categoría'],['frustration','Frustración'],['urgency','Urgencia']];
      for (const [key, label] of fields) {
        const section = document.createElement('section'); section.className = 'answer-card'; text(section,'h3',label);
        if (provider === 'jev') {
          const answer = answers[key];
          text(section,'div',key === 'category' ? categories[answer.choice] : key === 'frustration' ? `${answer.score.toFixed(2).replace('.',',')} / 2` : `P(sí) = ${answer.noul.toFixed(2).replace('.',',')}`,'answer-main');
          if (answer.probabilities) distributions(section,answer.probabilities,key === 'category' ? categories : answer.legend ?? planInfo?.plan?.jev_request.questions.frustration.criteria);
          text(section,'p',key === 'frustration' ? 'Media ponderada sobre la rúbrica; no es un nivel entero elegido.' : key === 'urgency' ? 'Valor Noul devuelto por el proveedor, no progreso de ejecución.' : `Confianza reportada: ${answer.confidence.toFixed(2).replace('.',',')}`,'sub');
        } else {
          text(section,'div',key === 'category' ? categories[answers[key]] : key === 'frustration' ? `Nivel ${answers[key]} de 2` : answers[key] ? 'Sí: atender hoy' : 'No: atención habitual','answer-main');
          text(section,'p',key === 'frustration' ? `Nivel ordinal: ${planInfo?.plan?.jev_request.questions.frustration.criteria[answers[key]] ?? answers[key]}. No es una media ponderada.` : 'Valor único. No reporta probabilidades ni confianza.','sub');
        }
        container.append(section);
      }
    } else if (lastResult.demo === 'photo') {
      const show = item.application.show_box, box = provider === 'jev' ? answers.ubicacion_danio.box : answers.ubicacion_danio;
      photoFigure(container, lastResult.case, show ? [{ box, label: provider === 'jev' ? (answers.ubicacion_danio.confidence === null ? 'JEV · sin confianza' : `JEV · confianza ${answers.ubicacion_danio.confidence.toFixed(2).replace('.',',')}`) : 'LLM · bbox_2d' }] : []);
      if (!show) text(container,'p','El recuadro no se dibuja: este proveedor no ve daño en la foto.','helper');
      for (const [key, label] of [['danio_visible','¿Daño visible?'],['tipo_danio','Tipo de daño'],['coincide_con_reclamo','¿Coincide con el reclamo?'],['ubicacion_danio','Ubicación del daño']]) {
        const section = document.createElement('section'); section.className = 'answer-card'; text(section,'h3',label);
        const answer = answers[key];
        if (provider === 'jev') {
          if (key === 'tipo_danio') { text(section,'div',damageTypes[answer.choice],'answer-main'); distributions(section,answer.probabilities,damageTypes); text(section,'p',`Confianza reportada: ${answer.confidence.toFixed(2).replace('.',',')}`,'sub'); }
          else if (key === 'ubicacion_danio') { const b = answer.box; text(section,'div',`izq ${b.left.toFixed(2)} · der ${b.right.toFixed(2)} · arriba ${b.top.toFixed(2)} · abajo ${b.bottom.toFixed(2)}`.replaceAll('.',','),'answer-main'); text(section,'p',`Bordes normalizados de 0 a 1. Confianza: ${answer.confidence === null ? 'no informada' : answer.confidence.toFixed(2).replace('.',',')}. Box siempre devuelve un recuadro, aunque no haya daño.`,'sub'); }
          else { text(section,'div',`P(sí) = ${answer.noul.toFixed(2).replace('.',',')}`,'answer-main'); text(section,'p','Valor Noul devuelto por el proveedor.','sub'); }
        } else {
          if (key === 'tipo_danio') text(section,'div',damageTypes[answer],'answer-main');
          else if (key === 'ubicacion_danio') { text(section,'div',`bbox_2d [${answer.bbox_2d.join(', ')}]`,'answer-main'); text(section,'p','Coordenadas de 0 a 1000, el formato nativo de Qwen-VL; el servidor las normaliza para dibujarlas. Sin confianza.','sub'); }
          else text(section,'div',answer ? 'Sí' : 'No','answer-main');
          if (key !== 'ubicacion_danio') text(section,'p','Valor único. No reporta probabilidades ni confianza.','sub');
        }
        container.append(section);
      }
    } else {
      for (const [key, answer] of Object.entries(answers)) {
        const id = key.replace('spam_',''), spam = provider === 'jev' ? answer.noul >= Number($('#threshold').value) : answer;
        const row = document.createElement('div'); row.className = 'mail-result-row'; text(row,'b',id); text(row,'span',provider === 'jev' ? `P(spam) ${answer.noul.toFixed(2).replace('.',',')}` : answer ? 'Es spam' : 'No es spam'); text(row,'span',spam ? 'Spam' : 'No spam',`group-tag ${spam ? 'spam' : 'clean'}`); container.append(row);
      }
    }
    const decision = document.createElement('div'); decision.className = 'decision-box'; text(decision,'strong','Lo que decide el código');
    let app = item.application;
    if(provider==='jev' && lastResult.demo==='mail') { const threshold=Number($('#threshold').value); app={spam:[],not_spam:[],interpretation:`Corte aplicado: ${threshold.toFixed(2).replace('.',',')}. Reagrupación de la misma respuesta; no se envió otra petición.`};for(const[key,answer]of Object.entries(answers))app[answer.noul>=threshold?'spam':'not_spam'].push(key.replace('spam_','')); }
    if (lastResult.demo === 'photo') text(decision,'p',`${routes[app.route]}. Nunca se aprueba un reembolso automático.`);
    else if (lastResult.demo === 'ticket') text(decision,'p',`${categories[app.queue] ?? 'Revisión humana'} · ${app.priority === 'priority_review' ? 'atención prioritaria' : 'atención habitual'} · ${app.followup === 'assign_owner' ? 'asignar responsable' : 'seguimiento habitual'}.`);
    else text(decision,'p',`Spam: ${app.spam.join(', ') || 'ninguno'}. No spam: ${app.not_spam.join(', ') || 'ninguno'}.`);
    if(app.interpretation) text(decision,'p',app.interpretation,'helper');
    container.append(decision);
    if (provider === 'local') { const timing = document.createElement('div'); timing.className = 'timings'; for (const [label,key] of [['Carga','load_ms'],['Entrada','prompt_ms'],['Generación','generation_ms']]) { const cell = document.createElement('div'); text(cell,'span',label); text(cell,'strong',formatMs(item[key])); timing.append(cell); } container.append(timing); }
    else text(container,'p','El tiempo HTTP incluye red. No observamos carga ni inferencia del servidor remoto.','helper');
    if (item.raw?.usage) text(container,'p',`Consumo informado: ${item.raw.usage.input_tokens} tokens de entrada · ${item.raw.usage.output_tokens} de salida. La API no informa aquí importe monetario.`,'helper');
    text(container,'p',`Modelo: ${item.model}${item.model_digest ? ' · huella '+item.model_digest : ''}`,'metadata'); rawResponse(container,item.raw);
  }
  function rawResponse(parent, raw) { const details = document.createElement('details'); details.className = 'raw'; text(details,'summary','Ver JSON original · sin razonamiento interno'); text(details,'pre',JSON.stringify(raw,null,2)); parent.append(details); }
  function update(result) {
    lastResult = result;
    if (codeTab === 'responses' && planInfo) showCode();
    for (const provider of ['jev','local']) {
      const card = $(`#provider-${provider}`), timeline = card.querySelector('.event-list');
      const entries = result.events.filter(event => event.provider === provider);
      for (const event of entries) if (!shownEvents.has(event.sequence)) { const li = text(timeline,'li',events[event.type] ?? event.type,'new-event'); text(li,'time',formatSeconds(event.elapsed_ms)+(event.http_status ? ` · HTTP ${event.http_status}` : '')); shownEvents.add(event.sequence); }
      const final = result.providers[provider], last = entries.at(-1);
      const waiting = !final && entries.some(event => event.type === 'request_started') && result.status === 'running';
      card.classList.toggle('waiting',waiting); card.querySelector('.wait-indicator').hidden = !waiting;
      if(waiting) card.querySelector('.empty-state').textContent = 'Solicitud enviada. El resultado aparecerá cuando llegue.';
      card.querySelector('[data-count]').textContent = result.counters?.[provider] ?? session.counters?.[provider] ?? 0;
      const badge = card.querySelector('[data-state]'); badge.textContent = final ? final.ok ? 'Estructura válida' : final.generation_requests ? result.cancel_requested ? 'Cancelado' : 'Error' : 'Sin envío' : events[last?.type] ?? 'Preparando'; badge.className = `state-chip ${final?.ok ? 'valid' : final?.generation_requests ? 'failed' : ''}`;
      if (final && !card.dataset.rendered) { output(provider,final); card.dataset.rendered = 'true'; }
    }
    const arrivals = result.events.filter(event => event.type === 'response_received').sort((a,b)=>a.elapsed_ms-b.elapsed_ms);
    if (arrivals.length) $('#arrival-order').textContent = arrivals.map((event,index)=>`${index ? 'Después' : 'Llegó primero'}: ${event.provider === 'jev' ? 'JEV remoto' : 'LLM local'} a los ${formatSeconds(event.elapsed_ms)}${event.http_status !== 200 ? ' · HTTP '+event.http_status : ''}`).join('. ')+'. Es orden de llegada, no calidad.';
    clocks();
    if (result.status !== 'running') {
      channel?.close(); clearInterval(clockTimer); setBusy(false);
      $('#run-status').textContent = result.status === 'cancelled' ? 'Espera cancelada. Lo enviado puede haber sido procesado o cobrado; no se reintentó.' : 'Ejecución terminada. Estos son los datos reales recibidos, no ejemplos preparados.';
    }
  }
  function subscribe(runId) {
    channel?.close(); channel = new EventSource('/api/events?run_id='+encodeURIComponent(runId));
    channel.onmessage = event => update(JSON.parse(event.data));
    channel.onerror = async () => {
      channel.close();
      try { const result = await api('/api/result?run_id='+encodeURIComponent(runId)); update(result); if (result.status === 'running') $('#run-status').textContent = 'Se cortó la conexión de eventos. La ejecución puede seguir: no se reenviará la petición. Usa Actualizar para consultar su estado.'; }
      catch { $('#run-status').textContent = 'Conexión interrumpida; resultado incierto. No se reenviará una evaluación. Usa Actualizar para consultar este identificador.'; }
    };
  }
  $('#execute').addEventListener('click', async () => {
    if (busy) return;
    clearResults(); document.querySelectorAll('.provider-card').forEach(card => delete card.dataset.rendered); setBusy(true);
    $('#run-status').textContent = 'Preparando la misma entrada para ambos proveedores…';
    try {
      const plan = await prepare(); activeRun = crypto.randomUUID(); $('#execute').textContent='Ejecutando…';
      const body = { demo: scenario, case: $('#preset').value, threshold: Number($('#threshold').value), state: inputs(), plan_id: plan.plan_id, run_id: activeRun };
      const result = await api('/api/start',body);
      $('#cancel').disabled = false;
      $('#run-status').textContent = 'Ejecución real iniciada. Las solicitudes HTTP a los proveedores disponibles salen en paralelo. No observamos sus decisiones internas.';
      $('#cancel-note').hidden = false; update(result); subscribe(activeRun); clockTimer = setInterval(clocks,100);
    } catch (error) {
      if(error.httpStatus>=400 && error.httpStatus<500) { activeRun=null; setBusy(false); }
      $('#run-status').textContent = humanError(error.message)+(activeRun ? ` El estado puede ser incierto. Actualizar consulta ${activeRun} sin reenviar.` : ' No se inició una evaluación.');
      if (!activeRun) setBusy(false);
      else { $('#cancel').disabled = false; }
    }
  });
  $('#cancel').addEventListener('click', async () => { if (!activeRun || !busy) return; $('#cancel').disabled = true; try { update(await api('/api/cancel',{run_id:activeRun})); } catch (error) { $('#run-status').textContent = humanError(error.message); } });
  $('#reset').addEventListener('click', () => { if (!busy) { renderEditor(); clearResults(); document.querySelectorAll('.provider-card').forEach(card=>delete card.dataset.rendered); } });
  $('#preset').addEventListener('change', () => { renderEditor(); clearResults(); document.querySelectorAll('.provider-card').forEach(card=>delete card.dataset.rendered); });
  $('#threshold').addEventListener('change',()=>{markDirty();if(lastResult?.demo==='mail' && lastResult.providers.jev?.ok)output('jev',lastResult.providers.jev);});
  $('#view-code').addEventListener('click', async () => { try { if (codeDirty) await prepare(); $('#code-panel').open=true; $('#code-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); } catch(error) { $('#run-status').textContent=humanError(error.message); } });
  document.querySelectorAll('[data-code-tab]').forEach(node=>node.addEventListener('click',()=>{codeTab=node.dataset.codeTab;loadCode();}));
  $('#code-panel').addEventListener('toggle', () => { if ($('#code-panel').open && codeDirty) loadCode(); });
  document.querySelectorAll('[data-scenario]').forEach(node=>{node.addEventListener('click',()=>switchScenario(node.dataset.scenario));node.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=order[(order.indexOf(scenario)+(event.key==='ArrowRight'?1:order.length-1))%order.length];switchScenario(next);$(`[data-scenario=${next}]`).focus();}});});
  $('#refresh').addEventListener('click',async()=>{ try { await availability(); if(activeRun)update(await api('/api/result?run_id='+encodeURIComponent(activeRun))); }catch(error){$('#run-status').textContent=humanError(error.message);} });
  $('#warmup').addEventListener('click',async()=>{if(busy)return;setBusy(true);$('#cancel').disabled=true;$('#run-status').textContent='Precargando el LLM local. No se envía ninguna evaluación a JEV.';try{const result=await api('/api/warmup',scenario==='photo'?{demo:'photo'}:{});$('#run-status').textContent=`Precarga local: ${formatMs(result.wall_ms)} de tiempo total. Carga del proveedor: ${formatMs(result.load_ms)}. No cuenta como solicitud de evaluación.`;}catch(error){$('#run-status').textContent=humanError(error.message);}finally{setBusy(false);} });
  async function init() {
    setBusy(true);
    if(location.protocol==='file:') {
      const url=`http://127.0.0.1:8000/demos.html#${hashes[scenario]}`;
      const notice=$('#connection-notice');notice.hidden=false;text(notice,'strong','Esta demo necesita el servidor local.');text(notice,'p','Desde la carpeta de la charla ejecuta: npm start. Levanta el servidor y el LLM local.');const link=text(notice,'a','Abrir la demo por HTTP');link.href=url;$('#run-status').textContent='Abriste file://. No se puede ejecutar ni consultar el backend desde esta vista.';$('#refresh').disabled=true;$('#jev-availability').textContent='JEV: requiere servidor HTTP';$('#local-availability').textContent='LLM: requiere servidor HTTP';return;
    }
    try { await availability(); catalog=await api('/api/examples'); setBusy(false); switchScenario(scenario); }
    catch { const notice=$('#connection-notice');notice.hidden=false;text(notice,'strong','No se pudo conectar al servidor local.');text(notice,'p','Ejecuta npm start desde la carpeta de la charla y abre http://127.0.0.1:8000/demos.html.');$('#run-status').textContent='No se enviaron solicitudes a los proveedores.'; }
  }
  init();
})();
