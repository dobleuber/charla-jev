// Fixed teaching fixtures: not live Jev outputs or an internal reasoning trace.
const DECISION_EXAMPLES = {
  catalog: {
    type: 'Choice', question: '¿Qué anuncio coincide o falta una opción adecuada?',
    context: 'Opciones: A · usada, ligera, portaequipaje, €350; B · sin portaequipaje, €500; C · portaequipaje, €390, peso desconocido.',
    routes: [['A', 'Mostrar anuncio A'], ['B', 'Mostrar anuncio B'], ['C', 'Mostrar anuncio C'], ['none', 'Ampliar búsqueda']],
    cases: {
      clear: { label: 'Coincidencia descrita', input: 'Bici urbana usada, ligera, portaequipaje, menos de €400.', answer: 'A', output: 'choice: A', policy: 'La aplicación muestra A. Debe comprobar disponibilidad, precio y datos del vendedor.' },
      unmatched: { label: 'Sin opción en presupuesto', input: 'La misma bici, ahora por menos de €300.', answer: 'none', output: 'choice: none', policy: 'La aplicación busca más opciones sin forzar una coincidencia. El precio también se filtra con código.' },
    },
  },
  review: {
    type: 'Noul', question: '¿El texto afirma que hubo un cobro duplicado?',
    context: 'Regla ilustrativa: Noul ≥ 0.8 → revisar movimientos; si no → pedir detalles. El corte no está calibrado.',
    routes: [['yes', 'Revisar movimientos'], ['no', 'Pedir detalles']],
    cases: {
      clear: { label: 'Afirma un cobro duplicado', input: 'Veo dos cobros del pedido 4411. Por favor revisen uno.', answer: 'yes', output: 'noul: 0.96', policy: 'La regla pide revisar movimientos, no hacer un reembolso automático. JEV no ha verificado los pagos.' },
      ambiguous: { label: 'Duda poco precisa', input: 'Mi último pago parece extraño. ¿Lo pueden revisar?', answer: 'no', output: 'noul: 0.14', policy: 'La regla pide más datos. Un valor bajo no demuestra que el pago sea correcto.' },
    },
  },
};

function demoEscape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function svgLines(text, x, y, limit, className, lineHeight = 19) {
  const lines = [];
  for (const word of text.split(' ')) {
    if (!lines.length || lines.at(-1).length + word.length + 1 > limit) lines.push(word);
    else lines[lines.length - 1] += ' ' + word;
  }
  return `<text class="${className}" x="${x}" y="${y}">${lines.map((line, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${demoEscape(line)}</tspan>`).join('')}</text>`;
}

function mountDecisionDemo(root, example) {
  const phases = ['Entrada', 'Evaluar pregunta', 'Devolver respuesta', 'Elegir ruta', 'Derivar'];
  const captions = [
    'Llega la entrada de ejemplo: solo el estado y la pregunta proporcionados.',
    'Este nodo representa la frontera de la API, no pasos internos del modelo.',
    'Aparece una respuesta preparada. El modelo no ha ejecutado una acción.',
    example.type === 'Noul' ? 'El código aplica el corte ilustrativo y resalta una ruta.' : 'El código relaciona la etiqueta con una ruta y atenúa las demás.',
    'La aplicación deriva el caso por la ruta resaltada. JEV no autoriza la acción.',
  ];
  const mobile = window.matchMedia('(max-width: 800px)');
  const slide = root.closest('.slide');
  const id = slide.id;
  let selectedCase = Object.keys(example.cases)[0];
  let stage = 0;
  let playing = false;
  let timer;
  root.innerHTML = `<div class="demo-toolbar">
    <label for="${id}-case">Elegir ejemplo <select id="${id}-case">${Object.entries(example.cases).map(([key, item]) => `<option value="${key}">${demoEscape(item.label)}</option>`).join('')}</select></label>
    <div class="demo-buttons"><button type="button" data-action="play">▶ Reproducir</button><button type="button" data-action="step">Siguiente paso →</button><button type="button" data-action="reset">Restablecer</button></div>
    </div>
    <ol class="demo-phases">${phases.map((phase, i) => `<li data-phase="${i}"><span>${i + 1}</span>${phase}</li>`).join('')}</ol>
    <div class="chart-host"></div>
    <p class="flow-context"></p>
    <p class="decision-action" aria-hidden="true"></p>
    <p class="demo-caption" role="status" aria-live="polite"></p>`;
  const query = selector => root.querySelector(selector);

  function drawChart() {
    const item = example.cases[selectedCase];
    const narrow = mobile.matches;
    const count = example.routes.length;
    // Wide layout: 1240×276 canvas sized for 19px node text; narrow layout is unchanged.
    const height = narrow ? 558 + count * 86 : 276;
    const positions = narrow
      ? [[20, 58, 350, 90], [20, 180, 350, 92], [20, 307, 350, 68]]
      : [[14, 81, 252, 140], [300, 81, 276, 140], [610, 109, 210, 84]];
    const cx = narrow ? 195 : 915, cy = narrow ? 460 : 151, r = narrow ? 45 : 48;
    const pad = narrow ? 12 : 14, labelY = narrow ? 21 : 25, textY = narrow ? 45 : 53, lineHeight = narrow ? 19 : 23;
    const edgePaths = narrow ? ['M195 148 V180', 'M195 272 V307', 'M195 375 V415'] : ['M266 151 H300', 'M576 151 H610', 'M820 151 H867'];
    const marker = `${id}-arrow`;
    const edge = (d, attributes) => `<path d="${d}" class="chart-edge ${attributes.className || ''}" ${attributes.extra || ''} marker-end="url(#${marker})" pathLength="1"/>`;
    const nodes = positions.map(([x, y, w, h], i) => {
      const label = ['ENTRADA', 'JEV · ' + example.type.toUpperCase(), 'RESPUESTA'][i];
      const content = [item.input, example.question, item.output][i];
      const limit = narrow ? 37 : [20, 23, 18][i];
      return `<g class="chart-node ${i === 2 ? 'answer-node' : ''}" data-node="${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${narrow ? 12 : 8}"/>
        ${svgLines(label, x + pad, y + labelY, 50, 'node-label')}
        <g ${i === 2 ? 'class="returned-answer" aria-hidden="true"' : ''}>${svgLines(content, x + pad, y + textY, limit, i === 2 ? 'node-answer' : 'node-text', lineHeight)}</g></g>`;
    }).join('');
    const branches = example.routes.map(([key, action], i) => {
      const y = narrow ? 540 + i * 86 : (count === 2 ? 68 + i * 114 : count === 3 ? 39 + i * 86 : 32 + i * 62);
      const x = narrow ? 20 : 1008, w = narrow ? 310 : 222, h = narrow ? 58 : 52;
      const destinationY = y + h / 2;
      const path = narrow ? `M${cx + r} ${cy} H375 V${destinationY} H330` : `M${cx + r} ${cy} H985 V${destinationY} H1008`;
      const branchLabel = example.type === 'Noul' ? (key === 'yes' ? 'noul ≥ 0.8' : 'noul < 0.8') : `choice = ${key}`;
      return `${edge(path, { className: 'branch-edge', extra: `data-key="${demoEscape(key)}"` })}
        <g class="chart-node outcome" data-key="${demoEscape(key)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${narrow ? 12 : 8}"/>
        ${svgLines(branchLabel, x + pad, y + 20, 35, 'node-label')}${svgLines(action, x + pad, y + (narrow ? 43 : 41), 30, 'node-text')}</g>`;
    }).join('');
    const boundary = narrow
      ? '<path class="ownership-line" d="M10 397 H380"/><text class="ownership-label" x="20" y="390">RESPUESTA JEV ↑</text><text class="ownership-label" x="220" y="417">↓ REGLAS DEL CÓDIGO</text>'
      : '<path class="ownership-line" d="M843 4 V272"/><text class="ownership-label" x="14" y="18">JEV: ESTADO + PREGUNTA → RESPUESTA</text><text class="ownership-label" x="859" y="18">CÓDIGO: RESPUESTA → RUTA</text>';
    query('.chart-host').innerHTML = `<svg class="flowchart" viewBox="0 0 ${narrow ? 390 : 1240} ${height}" role="img" aria-labelledby="${id}-chart-title ${id}-chart-description">
      <title id="${id}-chart-title">Flujo ilustrativo: entrada, JEV, respuesta y ruta del código</title>
      <desc id="${id}-chart-description">Ejemplo preparado, no razonamiento interno. El selector cambia la ruta.</desc>
      <defs><marker id="${marker}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L8 4 L0 8 Z" fill="context-stroke"/></marker></defs>
      ${boundary}${edgePaths.map((d, i) => edge(d, { extra: `data-edge="${i + 1}"` })).join('')}
      ${branches}${nodes}
      <g class="rule-node"><path d="M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z"/><text x="${cx}" y="${cy - 4}" text-anchor="middle">Regla</text><text x="${cx}" y="${cy + 14}" text-anchor="middle">${example.type === 'Noul' ? '≥ 0.8?' : '¿Etiqueta?'}</text></g>
    </svg>`;
    query('.flow-context').textContent = example.context || 'Etiquetas permitidas: billing, technical o review. El código asigna la cola.';
    query('.decision-action').textContent = item.policy;
    render();
  }
  function stop() {
    clearTimeout(timer);
    playing = false;
    query('[data-action=play]').textContent = stage === 4 ? '↻ Repetir' : '▶ Reproducir';
    query('[data-action=play]').setAttribute('aria-pressed', 'false');
  }
  function render() {
    const item = example.cases[selectedCase];
    root.dataset.stage = String(stage);
    root.querySelectorAll('[data-phase]').forEach((phase, index) => {
      phase.classList.toggle('is-current', index === stage);
      phase.classList.toggle('is-complete', index < stage);
      if (index === stage) phase.setAttribute('aria-current', 'step'); else phase.removeAttribute('aria-current');
    });
    root.querySelectorAll('[data-node]').forEach(node => node.classList.toggle('is-active', Number(node.dataset.node) <= stage));
    root.querySelectorAll('[data-edge]').forEach(path => path.classList.toggle('is-active', Number(path.dataset.edge) <= stage));
    query('.returned-answer').setAttribute('aria-hidden', String(stage < 2));
    query('.rule-node').classList.toggle('is-active', stage >= 3);
    root.querySelectorAll('.branch-edge,.outcome').forEach(element => {
      const chosen = element.dataset.key === item.answer;
      element.classList.toggle('is-selected', chosen && stage >= (element.classList.contains('outcome') ? 4 : 3));
      element.classList.toggle('is-dimmed', !chosen && stage >= 3);
    });
    query('.decision-action').setAttribute('aria-hidden', String(stage < 4));
    query('.demo-caption').textContent = `${stage + 1}/5 · ${captions[stage]}`;
    query('svg desc').textContent = `${phases[stage]}. ${stage >= 2 ? item.output + '. ' : ''}${stage >= 3 ? 'Ruta elegida por el código: ' + example.routes.find(([key]) => key === item.answer)[1] + '. ' : ''}Ejemplo ilustrativo; no razonamiento interno.`;
    query('[data-action=step]').disabled = stage === 4;
    if (!playing) query('[data-action=play]').textContent = stage === 4 ? '↻ Repetir' : '▶ Reproducir';
  }
  function loadCase() { stop(); stage = 0; drawChart(); }
  function schedule() {
    timer = setTimeout(() => {
      if (slide.hidden || document.hidden) { stop(); return; }
      stage = Math.min(4, stage + 1); render();
      if (stage === 4) stop(); else schedule();
    }, 1500);
  }
  query('select').addEventListener('change', event => { selectedCase = event.target.value; loadCase(); });
  query('[data-action=reset]').addEventListener('click', loadCase);
  query('[data-action=step]').addEventListener('click', () => { stop(); stage = Math.min(4, stage + 1); render(); });
  query('[data-action=play]').addEventListener('click', () => {
    if (playing) { stop(); return; }
    if (stage === 4) loadCase();
    playing = true;
    query('[data-action=play]').textContent = 'Ⅱ Pausar';
    query('[data-action=play]').setAttribute('aria-pressed', 'true');
    schedule();
  });
  mobile.addEventListener('change', drawChart);
  document.addEventListener('deckchange', () => { if (slide.hidden) stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  loadCase();
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-decision-demo]').forEach(root => mountDecisionDemo(root, DECISION_EXAMPLES[root.dataset.decisionDemo]));
}
