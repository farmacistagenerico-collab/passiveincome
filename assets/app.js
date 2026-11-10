// PassiveZero — Aggregatore & Formulatore
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmt = n => '€ ' + Math.round(n).toLocaleString('it-IT');
const fmtK = n => n >= 1000 ? '€ ' + (n/1000).toFixed(1).replace('.',',') + 'k' : fmt(n);

let activeCat = 'Tutte';
let activeDiff = 'Tutte';
let searchQ = '';
let currentPlan = null;
let trackerData = JSON.parse(localStorage.getItem('pz_tracker') || '[]');
let trackerChart = null, simChart = null;

// ---------- HERO PREVIEW ----------
function renderHeroPreview() {
  const picks = ['etsy-digital','print-on-demand','affiliate-blog'];
  $('#heroPreview').innerHTML = picks.map(id => {
    const s = STREAMS.find(x => x.id === id);
    return `<div class="flex items-center gap-3 bg-panel border border-line rounded-2xl p-3">
      <div class="text-2xl">${s.icon}</div>
      <div class="flex-1 min-w-0"><div class="font-semibold text-sm truncate">${s.nome}</div><div class="text-xs text-white/40">${s.categoria} · ${s.tempoPrimoEuro}</div></div>
      <div class="text-right"><div class="font-bold text-mint text-sm">${fmtK(s.potenzialeMax)}</div><div class="text-[10px] text-white/40">potenziale/mese</div></div>
    </div>`;
  }).join('');
}

// ---------- AGGREGATORE ----------
const CATS = ['Tutte', ...new Set(STREAMS.map(s => s.categoria))];
function renderCatFilters() {
  $('#catFilters').innerHTML = CATS.map(c => `<button onclick="setCat('${c}')" class="chip ${c===activeCat?'active':''} px-3.5 py-1.5 rounded-full text-xs font-semibold">${c}</button>`).join('');
}
function renderDiffFilters() {
  const opts = ['Tutte','Facile (1-2)','Medio (3)','Avanzato (4-5)'];
  $('#diffFilters').innerHTML = `<span class="text-xs text-white/40 self-center mr-1">Difficoltà:</span>` + opts.map(o => `<button onclick="setDiff('${o}')" class="chip ${o===activeDiff?'active':''} px-3 py-1.5 rounded-full text-xs">${o}</button>`).join('');
}
function setCat(c){ activeCat = c; renderCatFilters(); renderGrid(); }
function setDiff(d){ activeDiff = d; renderDiffFilters(); renderGrid(); }
function resetFilters(){ activeCat='Tutte'; activeDiff='Tutte'; searchQ=''; $('#searchInput').value=''; renderCatFilters(); renderDiffFilters(); renderGrid(); }

function diffLabel(d){ return d<=2 ? ['Facile','#34D399'] : d===3 ? ['Medio','#FBBF24'] : ['Avanzato','#F87171']; }
function filteredStreams() {
  let list = STREAMS.filter(s => {
    if (activeCat !== 'Tutte' && s.categoria !== activeCat) return false;
    if (activeDiff === 'Facile (1-2)' && s.difficolta > 2) return false;
    if (activeDiff === 'Medio (3)' && s.difficolta !== 3) return false;
    if (activeDiff === 'Avanzato (4-5)' && s.difficolta < 4) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      const hay = (s.nome+' '+s.desc+' '+s.categoria+' '+s.skill.join(' ')+' '+s.tools.join(' ')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const sort = $('#sortSelect').value;
  if (sort === 'potenziale') list.sort((a,b)=>b.potenzialeMax-a.potenzialeMax);
  if (sort === 'facile') list.sort((a,b)=>a.difficolta-b.difficolta);
  if (sort === 'veloce') list.sort((a,b)=>a.tempoSetup-b.tempoSetup);
  if (sort === 'passivo') list.sort((a,b)=>b.automazione-a.automazione);
  return list;
}

function renderGrid() {
  const list = filteredStreams();
  $('#countLabel').textContent = list.length;
  $('#emptyState').classList.toggle('hidden', list.length > 0);
  $('#grid').innerHTML = list.map(s => {
    const [dl, dc] = diffLabel(s.difficolta);
    return `<article class="glass rounded-3xl p-5 card-hover cursor-pointer flex flex-col" onclick="openModal('${s.id}')">
      <div class="flex items-start justify-between gap-2">
        <div class="w-12 h-12 rounded-2xl bg-panel border border-line flex items-center justify-center text-2xl">${s.icon}</div>
        <span class="text-[11px] font-bold px-2 py-1 rounded-full border" style="color:${dc};border-color:${dc}44;background:${dc}11">${dl}</span>
      </div>
      <h3 class="font-bold mt-3 leading-snug">${s.nome}</h3>
      <p class="text-xs text-white/50 mt-1.5 leading-relaxed flex-1">${s.desc}</p>
      <div class="mt-4 space-y-2 text-xs">
        <div class="flex justify-between"><span class="text-white/40">Potenziale</span><span class="font-bold text-mint">${fmt(s.potenzialeMin)}–${fmtK(s.potenzialeMax)}/mese</span></div>
        <div class="flex justify-between"><span class="text-white/40">Setup</span><span>${s.tempoSetup} ore</span></div>
        <div class="flex justify-between"><span class="text-white/40">Primo euro</span><span>${s.tempoPrimoEuro}</span></div>
        <div class="flex justify-between"><span class="text-white/40">Automazione</span><span>${s.automazione}%</span></div>
      </div>
      <div class="bar mt-3"><div class="bar-fill grad" style="width:${s.automazione}%"></div></div>
      <div class="mt-4 flex items-center justify-between">
        <span class="text-[11px] px-2 py-1 rounded-full border border-line text-white/50">${s.categoria}</span>
        <span class="text-xs font-bold text-mint">Guida →</span>
      </div>
    </article>`;
  }).join('');
}

// ---------- MODAL ----------
function openModal(id) {
  const s = STREAMS.find(x => x.id === id);
  const [dl, dc] = diffLabel(s.difficolta);
  $('#modalBody').innerHTML = `
  <div class="p-6 sm:p-8">
    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-panel border border-line flex items-center justify-center text-3xl">${s.icon}</div>
        <div><h3 class="font-display font-bold text-2xl leading-tight">${s.nome}</h3><div class="text-sm text-white/50">${s.categoria} · Rischio: ${s.rischio}</div></div>
      </div>
      <button onclick="closeModal()" class="w-9 h-9 rounded-full border border-line hover:border-white/40 flex items-center justify-center shrink-0">✕</button>
    </div>
    <p class="text-white/60 mt-4 leading-relaxed">${s.desc}</p>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
      <div class="bg-panel border border-line rounded-2xl p-3 text-center"><div class="text-lg font-black text-mint">${fmtK(s.potenzialeMax)}</div><div class="text-[11px] text-white/40">potenziale/mese</div></div>
      <div class="bg-panel border border-line rounded-2xl p-3 text-center"><div class="text-lg font-black">${s.tempoSetup}h</div><div class="text-[11px] text-white/40">setup</div></div>
      <div class="bg-panel border border-line rounded-2xl p-3 text-center"><div class="text-lg font-black">${s.manutenzione}h/mese</div><div class="text-[11px] text-white/40">manutenzione</div></div>
      <div class="bg-panel border border-line rounded-2xl p-3 text-center"><div class="text-lg font-black" style="color:${dc}">${dl}</div><div class="text-[11px] text-white/40">difficoltà</div></div>
    </div>

    <div class="mt-6">
      <div class="flex justify-between text-xs mb-1.5"><span class="text-white/50">Automazione / passività</span><span class="font-bold">${s.automazione}%</span></div>
      <div class="bar"><div class="bar-fill grad" style="width:${s.automazione}%"></div></div>
      <div class="flex justify-between text-xs mt-1.5"><span class="text-white/50">Scalabilità</span><span class="font-bold">${s.scalabilita}/5</span></div>
      <div class="bar"><div class="bar-fill" style="width:${s.scalabilita*20}%;background:#A3E635"></div></div>
    </div>

    <div class="grid sm:grid-cols-2 gap-5 mt-6">
      <div class="bg-panel border border-line rounded-2xl p-4">
        <div class="font-bold text-sm mb-2">🛠️ Tool gratuiti</div>
        <ul class="text-sm text-white/60 space-y-1.5">${s.tools.map(t=>`<li>• ${t}</li>`).join('')}</ul>
      </div>
      <div class="bg-panel border border-line rounded-2xl p-4">
        <div class="font-bold text-sm mb-2">🎯 Skill richieste</div>
        <div class="flex flex-wrap gap-1.5">${s.skill.map(k=>`<span class="text-xs px-2.5 py-1 rounded-full border border-mint/30 text-mint">${k}</span>`).join('')}</div>
        <div class="text-xs text-white/40 mt-3">Primo euro: <strong class="text-white">${s.tempoPrimoEuro}</strong></div>
      </div>
    </div>

    <div class="mt-6">
      <div class="font-bold mb-3">📋 Guida step-by-step</div>
      <ol class="space-y-2.5">${s.steps.map((st,i)=>`<li class="flex gap-3 bg-panel border border-line rounded-xl p-3"><span class="step-dot done shrink-0" style="width:28px;height:28px;font-size:12px">${i+1}</span><span class="text-sm text-white/70">${st}</span></li>`).join('')}</ol>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 mt-6">
      <div class="rounded-2xl p-4 border border-mint/20 bg-mint/5"><div class="font-bold text-sm text-mint mb-2">✅ Pro</div><ul class="text-sm text-white/60 space-y-1.5">${s.pro.map(p=>`<li>• ${p}</li>`).join('')}</ul></div>
      <div class="rounded-2xl p-4 border border-red-400/20 bg-red-400/5"><div class="font-bold text-sm text-red-300 mb-2">⚠️ Contro</div><ul class="text-sm text-white/60 space-y-1.5">${s.contro.map(p=>`<li>• ${p}</li>`).join('')}</ul></div>
    </div>

    <div class="mt-6 flex flex-wrap gap-3">
      <button onclick="closeModal();document.getElementById('formulatore').scrollIntoView()" class="bg-mint text-[#0B0F0E] font-bold px-5 py-3 rounded-xl text-sm hover:bg-lime">✨ Inserisci nel mio piano</button>
      <button onclick="closeModal();selectSimSource('${s.id}');document.getElementById('simulatore').scrollIntoView()" class="glass font-semibold px-5 py-3 rounded-xl text-sm hover:border-mint/50">Simula guadagni</button>
    </div>
  </div>`;
  $('#modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal(){ $('#modal').classList.add('hidden'); document.body.style.overflow=''; }

// ---------- FORMULATORE ----------
const QUESTIONS = [
  { id:'tempo', title:'Quante ore a settimana puoi dedicare?', sub:'Anche solo 2-3 ore bastano per iniziare.', options:[
    {v:'2-3', label:'2–3 ore / settimana', desc:'Poco tempo, cerco il massimo passivo', icon:'🌱'},
    {v:'5-7', label:'5–7 ore / settimana', desc:'Tempo moderato e costante', icon:'⚖️'},
    {v:'10-15', label:'10–15 ore / settimana', desc:'Impegno serio, voglio crescere', icon:'🔥'},
    {v:'20+', label:'20+ ore / settimana', desc:'Full-time, voglio risultati veloci', icon:'🚀'} ]},
  { id:'skill', title:'Quali skill hai (o vuoi usare)?', sub:'Puoi sceglierne una. Se non hai skill, scegli "Nessuna".', options:[
    {v:'scrittura', label:'Scrittura & contenuti', desc:'Blog, newsletter, ebook, script', icon:'✍️'},
    {v:'video', label:'Video & social', desc:'YouTube, TikTok, Reels, podcast', icon:'🎬'},
    {v:'design', label:'Design & creatività', desc:'Canva, foto, musica, arte', icon:'🎨'},
    {v:'tech', label:'Tech & programmazione', desc:'Siti, app, automazioni, AI', icon:'💻'},
    {v:'nessuna', label:'Nessuna skill specifica', desc:'Voglio qualcosa di semplice e guidato', icon:'🙂'} ]},
  { id:'obiettivo', title:'Qual è il tuo obiettivo mensile?', sub:'A regime, dopo 6-12 mesi di lavoro.', options:[
    {v:'100', label:'€ 100 / mese', desc:'Primi soldi extra', icon:'💵'},
    {v:'500', label:'€ 500 / mese', desc:'Buona integrazione', icon:'💰'},
    {v:'1000', label:'€ 1.000 / mese', desc:'Entrata significativa', icon:'🏦'},
    {v:'3000', label:'€ 3.000+ / mese', desc:'Obiettivo ambizioso', icon:'👑'} ]},
  { id:'stile', title:'Che tipo di entrata preferisci?', sub:'Tutte sono a costo zero.', options:[
    {v:'passivo', label:'Il più passivo possibile', desc:'Setup una volta, poi quasi zero tempo', icon:'😴'},
    {v:'creativo', label:'Creativo', desc:'Creare contenuti e prodotti', icon:'🎨'},
    {v:'tecnico', label:'Tecnico / automatizzato', desc:'Sistemi, AI, automazioni', icon:'🤖'},
    {v:'veloce', label:'Primo euro velocissimo', desc:'Soldi in 1-2 settimane', icon:'⚡'} ]},
  { id:'velocita', title:'Quando vuoi il primo euro?', sub:'Sii realistico: più veloce = fonti più semplici.', options:[
    {v:'1sett', label:'In 1 settimana', desc:'Priorità assoluta alla velocità', icon:'⚡'},
    {v:'1mese', label:'In 1 mese', desc:'Bilancio tra velocità e potenziale', icon:'📅'},
    {v:'3mesi', label:'In 3 mesi', desc:'Costruisco qualcosa di solido', icon:'🏗️'},
    {v:'6mesi', label:'In 6 mesi', desc:'Massimo potenziale a lungo termine', icon:'🌳'} ]}
];

let wizStep = 0;
let wizAnswers = {};

function renderWizard() {
  $('#stepDots').innerHTML = QUESTIONS.map((q,i) => `<div class="step-dot ${i===wizStep?'active':i<wizStep?'done':''}">${i<wizStep?'✓':i+1}</div>`).join('');
  $('#stepLabel').textContent = `Domanda ${wizStep+1} di ${QUESTIONS.length}`;
  const q = QUESTIONS[wizStep];
  $('#wizardBody').innerHTML = `
    <h3 class="font-display font-bold text-xl sm:text-2xl">${q.title}</h3>
    <p class="text-white/50 text-sm mt-1 mb-5">${q.sub}</p>
    <div class="grid sm:grid-cols-2 gap-3">
      ${q.options.map(o => `<div class="opt ${wizAnswers[q.id]===o.v?'selected':''} rounded-2xl p-4 flex items-start gap-3" onclick="pickOption('${q.id}','${o.v}')">
        <div class="text-2xl">${o.icon}</div>
        <div class="flex-1"><div class="font-bold text-sm">${o.label}</div><div class="text-xs text-white/50 mt-0.5">${o.desc}</div></div>
        <div class="opt-check">${wizAnswers[q.id]===o.v?'✓':''}</div>
      </div>`).join('')}
    </div>`;
  $('#btnBack').disabled = wizStep === 0;
  const last = wizStep === QUESTIONS.length - 1;
  $('#btnNext').textContent = last ? '✨ Genera il mio piano' : 'Avanti →';
  $('#btnNext').disabled = !wizAnswers[q.id];
}
function pickOption(qid, val){ wizAnswers[qid] = val; renderWizard(); }
function wizardBack(){ if (wizStep > 0){ wizStep--; renderWizard(); } }
function wizardNext(){
  if (!wizAnswers[QUESTIONS[wizStep].id]) return;
  if (wizStep < QUESTIONS.length - 1){ wizStep++; renderWizard(); }
  else generatePlan();
}

function scoreStream(s, a) {
  let score = 0;
  const hours = parseInt(a.tempo);
  // tempo: se poche ore, premia automazione e bassa manutenzione
  if (hours <= 3) { score += s.automazione * 0.6 + (10 - s.manutenzione) * 2; }
  else if (hours <= 7) { score += s.automazione * 0.3 + s.scalabilita * 5; }
  else { score += s.scalabilita * 8 + s.potenzialeMax / 500; }
  // skill match
  const skillMap = {
    scrittura: ['affiliate-blog','newsletter','gumroad-ebook','podcast','adsense-site','ai-content'],
    video: ['youtube-faceless','tiktok-faceless','podcast','course-udemy'],
    design: ['print-on-demand','etsy-digital','stock-photo','digital-art','notion-templates','prompt-pack','amazon-kdp'],
    tech: ['ai-content','github-sponsors','bug-bounty','app-free','affiliate-blog'],
    nessuna: ['referral','print-on-demand','etsy-digital','prompt-pack','amazon-kdp','stock-photo']
  };
  if ((skillMap[a.skill]||[]).includes(s.id)) score += 40;
  // obiettivo
  const target = parseInt(a.obiettivo);
  if (s.potenzialeMax >= target) score += 25; else score += s.potenzialeMax / target * 15;
  // stile
  if (a.stile === 'passivo') score += s.automazione * 0.5;
  if (a.stile === 'creativo' && ['Creativo','Digitale','Contenuti'].includes(s.categoria)) score += 20;
  if (a.stile === 'tecnico' && s.categoria === 'Tech') score += 25;
  if (a.stile === 'veloce' && s.tempoSetup <= 6) score += 30;
  // velocità
  if (a.velocita === '1sett' && s.tempoSetup <= 4) score += 25;
  if (a.velocita === '1mese' && s.tempoSetup <= 10) score += 15;
  if (a.velocita === '3mesi' && s.scalabilita >= 4) score += 10;
  if (a.velocita === '6mesi') score += s.scalabilita * 4;
  // difficoltà: se poche ore o nessuna skill, penalizza difficile
  if ((hours <= 3 || a.skill === 'nessuna') && s.difficolta >= 4) score -= 20;
  return score;
}

function generatePlan() {
  const scored = STREAMS.map(s => ({ s, score: scoreStream(s, wizAnswers) })).sort((a,b)=>b.score-a.score);
  const top = scored.slice(0, 4).map(x => x.s);
  const totalSetup = top.reduce((t,s)=>t+s.tempoSetup,0);
  const target = parseInt(wizAnswers.obiettivo);
  // stime prudenziali: % del potenziale a 3/6/12 mesi
  const m3 = Math.round(top.reduce((t,s)=>t+s.potenzialeMin*0.4,0));
  const m6 = Math.round(top.reduce((t,s)=>t+(s.potenzialeMin+s.potenzialeMax)/2*0.6,0));
  const m12 = Math.min(Math.round(top.reduce((t,s)=>t+(s.potenzialeMin+s.potenzialeMax)/2*0.9,0)), target*1.4);
  currentPlan = { top, totalSetup, m3, m6, m12, answers: {...wizAnswers} };
  localStorage.setItem('pz_plan', JSON.stringify(currentPlan));

  const weights = [40, 30, 20, 10];
  $('#formResult').innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="font-bold">🎯 Il tuo piano formulato</div>
      <span class="text-xs px-2 py-1 rounded-full bg-mint/15 text-mint border border-mint/30">4 fonti</span>
    </div>
    <div class="space-y-3">
      ${top.map((s,i)=>`<div class="bg-panel border border-line rounded-2xl p-3.5 cursor-pointer hover:border-mint/40 transition" onclick="openModal('${s.id}')">
        <div class="flex items-center gap-3">
          <div class="text-2xl">${s.icon}</div>
          <div class="flex-1 min-w-0"><div class="font-bold text-sm truncate">${s.nome}</div><div class="text-xs text-white/40">${s.categoria} · ${s.tempoPrimoEuro}</div></div>
          <div class="text-right"><div class="font-black text-mint">${weights[i]}%</div><div class="text-[10px] text-white/40">tempo</div></div>
        </div>
        <div class="bar mt-2.5"><div class="bar-fill grad" style="width:${weights[i]}%"></div></div>
      </div>`).join('')}
    </div>
    <div class="grid grid-cols-3 gap-2 mt-4 text-center">
      <div class="bg-panel border border-line rounded-xl p-3"><div class="text-xs text-white/40">Mese 3</div><div class="font-black text-sm mt-0.5">${fmt(m3)}</div></div>
      <div class="bg-panel border border-line rounded-xl p-3"><div class="text-xs text-white/40">Mese 6</div><div class="font-black text-sm mt-0.5 text-mint">${fmt(m6)}</div></div>
      <div class="bg-panel border border-line rounded-xl p-3"><div class="text-xs text-white/40">Mese 12</div><div class="font-black text-sm mt-0.5 text-lime">${fmt(m12)}</div></div>
    </div>
    <div class="flex justify-between text-xs text-white/50 mt-3 px-1"><span>Setup totale: <strong class="text-white">~${totalSetup} ore</strong></span><span>Obiettivo: <strong class="text-white">${fmt(target)}/mese</strong></span></div>
    <div class="flex gap-2 mt-4">
      <a href="#roadmap" class="flex-1 text-center bg-mint text-[#0B0F0E] font-bold py-2.5 rounded-xl text-sm hover:bg-lime">Vedi roadmap 90 giorni</a>
      <button onclick="resetWizard()" class="glass px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-mint/50">↺ Rifai</button>
    </div>
    <p class="text-[11px] text-white/30 mt-3">Stime prudenziali basate sui range delle fonti. Non sono promesse di guadagno.</p>`;
  renderRoadmap();
  toast('✨ Piano generato! 4 fonti selezionate per te.');
  document.getElementById('formResult').scrollIntoView({behavior:'smooth', block:'center'});
}
function resetWizard(){ wizStep = 0; wizAnswers = {}; renderWizard(); }

// ---------- SIMULATORE ----------
function initSim() {
  $('#simSource').innerHTML = STREAMS.map(s=>`<option value="${s.id}">${s.icon} ${s.nome}</option>`).join('');
  ['simTraffic','simConv','simPrice','simMonths'].forEach(id => $('#'+id).addEventListener('input', updateSim));
  $('#simSource').addEventListener('change', updateSim);
  updateSim();
}
function selectSimSource(id){ $('#simSource').value = id; updateSim(); }
function updateSim() {
  const traffic = +$('#simTraffic').value, conv = +$('#simConv').value, price = +$('#simPrice').value, months = +$('#simMonths').value;
  const s = STREAMS.find(x => x.id === $('#simSource').value);
  $('#simTrafficLabel').textContent = traffic.toLocaleString('it-IT');
  $('#simConvLabel').textContent = conv.toFixed(1).replace('.',',') + '%';
  $('#simPriceLabel').textContent = '€ ' + price.toFixed(2).replace('.',',');
  $('#simMonthsLabel').textContent = months + ' mesi';
  const sales = Math.round(traffic * conv / 100);
  const monthly = sales * price;
  const total = monthly * months;
  $('#simMonthly').textContent = fmt(monthly);
  $('#simTotal').textContent = fmt(total);
  $('#simSales').textContent = sales.toLocaleString('it-IT');
  $('#simHours').textContent = s.tempoSetup + 'h';
  const labels = [], data = [];
  for (let m = 1; m <= months; m++){ labels.push('M' + m); data.push(Math.round(monthly * (0.4 + 0.6 * m / months))); }
  if (simChart) simChart.destroy();
  simChart = new Chart($('#simChart'), { type:'line', data:{ labels, datasets:[{ label:'Entrata stimata', data, borderColor:'#34D399', backgroundColor:'rgba(52,211,153,.12)', fill:true, tension:.4, pointRadius:3, pointBackgroundColor:'#34D399' }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#ffffff66', font:{size:10} }, grid:{ color:'#ffffff11' } }, y:{ ticks:{ color:'#ffffff66', font:{size:10}, callback: v=>'€'+v }, grid:{ color:'#ffffff11' } } } } });
}

// ---------- TRACKER ----------
function initTracker() {
  $('#tSource').innerHTML = STREAMS.map(s=>`<option value="${s.id}">${s.icon} ${s.nome}</option>`).join('') + '<option value="altro">Altro</option>';
  $('#tDate').valueAsDate = new Date();
  $('#trackerForm').addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat($('#tAmount').value);
    if (!amount || amount <= 0) return;
    trackerData.unshift({ id: Date.now(), source: $('#tSource').value, amount, date: $('#tDate').value, note: $('#tNote').value.trim() });
    localStorage.setItem('pz_tracker', JSON.stringify(trackerData));
    $('#tAmount').value = ''; $('#tNote').value = '';
    renderTracker();
    toast('💰 Entrata registrata!');
  });
  renderTracker();
}
function renderTracker() {
  const total = trackerData.reduce((t,e)=>t+e.amount,0);
  const now = new Date();
  const thisMonth = trackerData.filter(e => { const d = new Date(e.date); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }).reduce((t,e)=>t+e.amount,0);
  const sources = new Set(trackerData.map(e=>e.source)).size;
  const monthsActive = new Set(trackerData.map(e=>e.date.slice(0,7))).size || 1;
  $('#tTotal').textContent = fmt(total);
  $('#tMonth').textContent = fmt(thisMonth);
  $('#tSources').textContent = sources;
  $('#tAvg').textContent = fmt(total / monthsActive);

  // chart ultimi 12 mesi
  const labels = [], data = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().slice(0,7);
    labels.push(d.toLocaleDateString('it-IT',{month:'short'}));
    data.push(Math.round(trackerData.filter(e=>e.date.slice(0,7)===key).reduce((t,e)=>t+e.amount,0)));
  }
  if (trackerChart) trackerChart.destroy();
  trackerChart = new Chart($('#trackerChart'), { type:'bar', data:{ labels, datasets:[{ label:'Entrate', data, backgroundColor:'#34D399', borderRadius:6, maxBarThickness:28 }] },
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#ffffff66', font:{size:10} }, grid:{ display:false } }, y:{ ticks:{ color:'#ffffff66', font:{size:10}, callback: v=>'€'+v }, grid:{ color:'#ffffff11' } } } } });

  $('#trackerList').innerHTML = trackerData.length ? trackerData.slice(0,30).map(e => {
    const s = STREAMS.find(x=>x.id===e.source);
    return `<div class="flex items-center gap-3 bg-panel border border-line rounded-xl px-3 py-2.5">
      <div class="text-xl">${s ? s.icon : '💵'}</div>
      <div class="flex-1 min-w-0"><div class="text-sm font-semibold truncate">${s ? s.nome : 'Altro'}</div><div class="text-xs text-white/40">${new Date(e.date).toLocaleDateString('it-IT')} ${e.note ? '· '+e.note : ''}</div></div>
      <div class="font-bold text-mint text-sm">+${fmt(e.amount)}</div>
      <button onclick="delEntry(${e.id})" class="text-white/30 hover:text-red-300 text-sm px-1">✕</button>
    </div>`;
  }).join('') : `<div class="text-center text-white/40 text-sm py-8">Nessuna entrata ancora. Aggiungi la prima! 🎉</div>`;
}
function delEntry(id){ trackerData = trackerData.filter(e=>e.id!==id); localStorage.setItem('pz_tracker', JSON.stringify(trackerData)); renderTracker(); }
function clearTracker(){ if (confirm('Azzerare tutte le entrate registrate?')){ trackerData = []; localStorage.setItem('pz_tracker','[]'); renderTracker(); toast('Tracker azzerato.'); } }
function exportCSV(){
  if (!trackerData.length){ toast('Nessun dato da esportare.'); return; }
  const rows = [['Data','Fonte','Importo','Nota'], ...trackerData.map(e=>{ const s = STREAMS.find(x=>x.id===e.source); return [e.date, s?s.nome:'Altro', e.amount.toFixed(2), e.note||'']; })];
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff'+csv], {type:'text/csv'}));
  a.download = 'passivezero-entrate.csv'; a.click();
  toast('⬇ CSV esportato!');
}

// ---------- ROADMAP ----------
function renderRoadmap() {
  const plan = currentPlan || JSON.parse(localStorage.getItem('pz_plan') || 'null');
  const sources = plan ? plan.top : STREAMS.filter(s=>['referral','print-on-demand','etsy-digital','prompt-pack'].includes(s.id));
  const phases = [
    { title:'Settimane 1–2 · Fondamenta', color:'#34D399', items:[
      `Scegli la fonte principale: <strong>${sources[0].nome}</strong>`,
      `Crea account gratuiti: ${sources[0].tools.slice(0,3).join(', ')}`,
      'Definisci la nicchia e l\'obiettivo dei primi 30 giorni',
      'Crea i primi 3 contenuti / prodotti (non devono essere perfetti)']},
    { title:'Settimane 3–4 · Lancio', color:'#A3E635', items:[
      `Pubblica / carica i primi contenuti di <strong>${sources[0].nome}</strong>`,
      sources[1] ? `Avvia la seconda fonte: <strong>${sources[1].nome}</strong>` : 'Prepara la seconda fonte',
      'Condividi su 2 canali gratuiti (social, forum, community)',
      'Registra tutto nel Tracker appena arriva il primo euro']},
    { title:'Mesi 2 · Crescita', color:'#FBBF24', items:[
      'Raddoppia la produzione sulla fonte migliore',
      sources[2] ? `Aggiungi: <strong>${sources[2].nome}</strong>` : 'Ottimizza SEO / titoli / thumbnail',
      'Analizza cosa funziona (dati, non opinioni) e replica',
      'Costruisci un\'audience: email list, follower, community']},
    { title:'Mese 3 · Scala & automatizza', color:'#F87171', items:[
      'Automatizza ciò che è ripetitivo (template, AI, batch)',
      sources[3] ? `Valuta: <strong>${sources[3].nome}</strong> come quarta fonte` : 'Crea bundle / upsell / versioni premium',
      'Rivedi il piano: taglia ciò che non rende, scala ciò che rende',
      'Festeggia e imposta l\'obiettivo per i prossimi 90 giorni 🎉']}
  ];
  $('#roadmapBody').innerHTML = `<div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">` + phases.map((p,i)=>`
    <div class="glass rounded-3xl p-5">
      <div class="flex items-center gap-2 mb-4"><span class="w-3 h-3 rounded-full" style="background:${p.color}"></span><span class="font-bold text-sm">${p.title}</span></div>
      <ul class="space-y-3">${p.items.map(it=>`<li class="flex gap-2.5 text-sm text-white/60"><span class="mt-0.5 shrink-0 w-5 h-5 rounded-md border border-line flex items-center justify-center text-[10px] text-mint">○</span><span>${it}</span></li>`).join('')}</ul>
    </div>`).join('') + `</div>
    <div class="glass rounded-3xl p-5 mt-4 flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-white/60">💡 <strong class="text-white">Regola d'oro:</strong> meglio 1 fonte fatta bene per 90 giorni che 4 fonti abbandonate dopo 1 settimana.</div>
      <a href="#formulatore" class="bg-mint text-[#0B0F0E] font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-lime">Formula il mio piano →</a>
    </div>`;
}

// ---------- UTILS ----------
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.add('hidden'), 2600);
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  renderHeroPreview();
  renderCatFilters();
  renderDiffFilters();
  renderGrid();
  renderWizard();
  initSim();
  initTracker();
  renderRoadmap();
  $('#searchInput').addEventListener('input', e => { searchQ = e.target.value; renderGrid(); });
  $('#sortSelect').addEventListener('change', renderGrid);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
});
