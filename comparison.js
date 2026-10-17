(function () {
  'use strict';
  let busy = false, lastRun = null;
  const dialog = document.createElement('dialog');
  dialog.className = 'comparison-dialog';
  dialog.innerHTML = `<div class="comparison-heading"><h2>MedellínJS · JavaScript comparison</h2><button type="button" data-close>Close ×</button></div>
    <p class="comparison-status" role="status" aria-live="polite"></p>
    <p class="comparison-semantics">Jev returns probabilities and a weighted Score. The local LLM returns categorical decisions and an ordinal level, without probabilities or confidence.</p>
    <div class="comparison-actions"><button type="button" data-warmup>Warm up local</button><button type="button" data-recover>Read last result</button></div>
    <section class="comparison-results" aria-label="Provider results"></section>
    <details class="comparison-code"><summary>Exact request bodies and executed JavaScript</summary><pre><code></code></pre></details>
    <p class="comparison-note">A single example is not a general benchmark. Model load, prompt processing and generation are reported separately where available. The prepared slide walkthrough remains explicitly illustrative.</p>`;
  document.body.append(dialog);
  const status = dialog.querySelector('.comparison-status');
  const results = dialog.querySelector('.comparison-results');
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  async function json(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),190000);
    try {
      const response = await fetch(url,{...options,signal:controller.signal,cache:'no-store'});
      const value = await response.json();
      if(!response.ok)throw new Error(value.error || 'Local server request failed');
      return value;
    } finally { clearTimeout(timer); }
  }
  function lock(value) {
    busy=value;
    document.querySelectorAll('[data-run-comparison], [data-warmup]').forEach(button=>{button.disabled=value;});
  }
  function addText(parent, tag, content) { const node=document.createElement(tag);node.textContent=content;parent.append(node);return node; }
  function duration(value) { return value == null ? 'not reported' : value+' ms'; }
  function displayResult(result) {
    results.replaceChildren();
    addText(results,'p',(result.demo?result.demo+' / '+result.case+' · ':'')+result.mode+' · '+result.warning);
    for(const [provider,item] of Object.entries(result.providers || {})) {
      const article=document.createElement('article');article.className='comparison-provider';results.append(article);
      addText(article,'h3',provider==='jev'?'Jev':'Local LLM');
      addText(article,'p',(item.ok?'Validated real response':'Unavailable / error')+' · generation requests: '+item.generation_requests);
      if(item.model)addText(article,'p','Exact returned model: '+item.model+(item.model_digest?' · digest '+item.model_digest:''));
      if(item.wall_ms !== undefined)addText(article,'p','HTTP wall: '+item.wall_ms+' ms');
      if(item.load_ms !== undefined)addText(article,'p','Runner model load: '+duration(item.load_ms)+' · prompt: '+duration(item.prompt_ms)+' · generation: '+duration(item.generation_ms));
      if(item.timing_note)addText(article,'p',item.timing_note);
      if(item.error)addText(article,'p',item.error);
      if(item.application){addText(article,'h4','Application decision');addText(article,'pre',JSON.stringify(item.application,null,2));}
      if(item.validated){addText(article,'h4','Validated values');addText(article,'pre',JSON.stringify(item.validated,null,2));}
      if(item.raw){const details=document.createElement('details');article.append(details);addText(details,'summary','Raw provider response (private thinking omitted)');addText(details,'pre',JSON.stringify(item.raw,null,2));}
    }
  }
  async function prepare(root) {
    const demo=root.dataset.singleRequestDemo;
    const caseName=demo==='ticket'?root.querySelector('select').value:'clear';
    const threshold=demo==='mail'?Number(root.querySelector('select').value):0.5;
    const session=await json('/api/session');
    const info=await json('/api/plan?demo='+encodeURIComponent(demo)+'&case='+encodeURIComponent(caseName));
    dialog.querySelector('.comparison-code code').textContent = '// Jev POST /v1/systemone\nconst jevRequest = '+JSON.stringify(info.plan.jev_request,null,2)+';\n\n// Ollama POST /api/chat\nconst localRequest = '+JSON.stringify(info.plan.local_request,null,2)+';\n\n// Mail: the threshold applies to Jev; local LLM uses booleans.\nconst applicationThreshold = '+threshold+';\n\n// Actual server-side JavaScript functions\n'+info.javascript_code;
    status.textContent=(session.local.ready?'Local model ready: ':'Local model unavailable: ')+session.local.model+'. '+(session.jev_enabled&&session.jev_key_present?'Jev paid calls enabled by server operator.':'Jev paid calls disabled or server key absent.');
    return {session,plan:info.plan,demo,caseName,threshold};
  }
  function show() { if(!dialog.open)dialog.showModal(); }
  function failure(error) { status.textContent='No automatic retry. '+(error.name==='AbortError'?'Timed out; a provider call may have reached the service. Use Read last result.':error.message)+'. Run node demo-server.mjs and open this deck through its loopback URL if the local backend is unavailable.'; }
  for(const root of document.querySelectorAll('[data-single-request-demo]')) {
    const toolbar=root.querySelector('.demo-buttons');
    const code=document.createElement('button');code.type='button';code.textContent='Ver código';code.dataset.viewCode='';toolbar.append(code);
    const run=document.createElement('button');run.type='button';run.textContent='Ejecutar';run.dataset.runComparison='';toolbar.append(run);
    code.addEventListener('click',async()=>{show();results.replaceChildren();dialog.querySelector('.comparison-code').open=true;try{await prepare(root);}catch(error){failure(error);}});
    run.addEventListener('click',async()=>{
      if(busy)return;
      lock(true);show();results.replaceChildren();status.textContent='Preparing exact request bodies…';
      try {
        const {session,plan,demo,caseName,threshold}=await prepare(root);
        if(!session.local.ready){status.textContent+=' No generation request sent.';return;}
        const runId=crypto.randomUUID();lastRun=runId;
        status.textContent='Executing once per enabled provider. Do not click again; there are no automatic retries.';
        const result=await json('/api/run',{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Token':session.token},body:JSON.stringify({demo,case:caseName,threshold,plan_id:plan.plan_id,run_id:runId})});
        displayResult(result);status.textContent='Run finished. Real responses and errors are shown below; no prepared result was substituted.';
      } catch(error) {failure(error);} finally {lock(false);}
    });
  }
  dialog.querySelector('[data-recover]').addEventListener('click',async()=>{
    if(!lastRun){status.textContent='No run ID recorded in this page session.';return;}
    try{displayResult(await json('/api/result?run_id='+encodeURIComponent(lastRun)));status.textContent='Read stored result only; no new generation request.';}catch(error){failure(error);}
  });
  dialog.querySelector('[data-warmup]').addEventListener('click',async()=>{
    if(busy)return;lock(true);
    try {
      const session=await json('/api/session');
      const result=await json('/api/warmup',{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Token':session.token},body:'{}'});
      status.textContent='Local warmup only: '+result.model+' · load '+duration(result.load_ms)+' · wall '+result.wall_ms+' ms. No Jev call.';
    }catch(error){failure(error);}finally{lock(false);}
  });
})();
