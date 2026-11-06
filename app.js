'use strict';
/* La Cova: l'app del fundador. Llegeix fotos que puja el motor i escriu accions que el motor aplica.
   Els diners es desen directament a la base de dades de l'app. */
const SB = { url: 'https://qignyblztyevwugzlmvc.supabase.co', key: 'sb_publishable_fvsh8ZK5Ft778Yos27bB9Q_KPdZWw1M' };
const $ = (id) => document.getElementById(id);
const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const coma = (n) => String(n).replace('.', ',');
const num = (n) => new Intl.NumberFormat('ca-ES').format(n || 0);
const euros = (n) => new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
const desa = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sense emmagatzematge */ } };
const recull = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

// Sessió
let ses = recull('cova-ses');
async function token(cos, tipus) {
  const r = await fetch(`${SB.url}/auth/v1/token?grant_type=${tipus}`, { method: 'POST', headers: { apikey: SB.key, 'Content-Type': 'application/json' }, body: JSON.stringify(cos) });
  if (!r.ok) throw new Error(r.status === 400 ? 'Correu o contrasenya incorrectes.' : 'No s\'ha pogut entrar. Torna-ho a provar.');
  const j = await r.json(); ses = { a: j.access_token, r: j.refresh_token, fins: Date.now() + j.expires_in * 1000 }; desa('cova-ses', ses);
}
async function clau() {
  if (!ses) throw new Error('sense sessió');
  if (Date.now() > ses.fins - 60000) await token({ refresh_token: ses.r }, 'refresh_token');
  return ses.a;
}
async function api(ruta, op = {}) {
  const r = await fetch(SB.url + ruta, { ...op, headers: { apikey: SB.key, Authorization: 'Bearer ' + await clau(), 'Content-Type': 'application/json', ...(op.headers || {}) } });
  if (r.status === 401) { ses = null; desa('cova-ses', null); location.reload(); }
  if (!r.ok) throw new Error('error ' + r.status);
  return r.status === 204 ? null : r.json();
}

// Dades
let D = null, T = [], informes = 0, lliures = [], webOk = true, G = null, obert = null, TR = null, DOCS = null, MOV = null, vista = null, objectiu = 0;
const SALES = [
  { id: 'marqueting', nom: 'Màrqueting', c: '#7C5CFF', L: [-1.6, -10.4], P: [0, -14.5] },
  { id: 'enginyeria', nom: 'Enginyeria', c: '#2F7BFF', L: [15.4, -3.9], P: [4.7, -6.3] },
  { id: 'vendes', nom: 'Vendes', c: '#FE8500', L: [11.5, 5.6], P: [5, 6] },
  { id: 'operacions', nom: 'Operacions', c: '#19B8A0', L: [-14.6, -2.8], P: [-6.4, -4.8] },
  { id: 'direccio', nom: 'Direcció', c: '#D8B25A', L: [-8.9, 4.3], P: [-6, 6.2] },
];
const CAFE = { id: 'cafe', nom: 'Cafeteria', c: '#C98A4B', ag: [], L: [1.2, 9.9], P: [0, 13.2] };
const CERV = { id: 'cervell', nom: 'El Cervell', c: '#7FA9FF' };
const AVUI = { id: 'avui', nom: 'Avui' };
const sala = (id) => SALES.find((s) => s.id === id);

function prepara(d) {
  D = d; T = D.despatxos.filter((x) => x.la != null); informes = D.embut.informes;
  for (const s of SALES) { s.ag = D.agents.filter((a) => a.s === s.id); s.taula = s.ag.filter((a) => a.st > 0).length; }
  lliures = D.agents.filter((a) => a.st === 0); CAFE.ag = lliures;
  webOk = Object.values(D.web).every((v) => v === 200);
  const seg = T.findIndex((x) => !x.e); objectiu = seg < 0 ? 0 : seg;
}
async function foto(id) { const r = await api(`/rest/v1/foto?id=eq.${id}&select=dades,actualitzat`); return r[0] || null; }
async function carrega() {
  const f = await foto('cova');
  if (!f) return null;
  const pend = await api('/rest/v1/accions?aplicat=is.null&select=tipus,dades&order=creat');
  const d = f.dades; d._quan = f.actualitzat; prepara(d); pend.forEach(local);
  desa('cova-foto', d); return d;
}

// El que fas a l'app es veu a l'instant; el motor ho porta a La Cova a la volta següent
function local(a) {
  const d = a.dades || {};
  if (a.tipus === 'tasca_fet') D.tasques = D.tasques.filter((t) => t.id !== d.id);
  if (a.tipus === 'tasca_pas') { const t = D.tasques.find((x) => x.id === d.id); if (t) t.f = d.fets; }
  if (a.tipus === 'decisio') { const q = D.decisions.find((x) => x.id === d.id); if (q) { D.decisions = D.decisions.filter((x) => x !== q); D.dec.unshift({ t: q.t, r: (q.o.find((o) => o.id === d.opcio) || {}).t || d.opcio }); } }
  if (a.tipus === 'trucada') { const x = D.despatxos.find((t) => t.id === d.id); if (x) { if (!x.e) D.embut.trucats++; if (d.estat === 'demo') D.embut.demos++; x.e = d.estat; } }
  if (a.tipus === 'post_marca') { D.xarxes.marques = D.xarxes.marques || {}; D.xarxes.marques[d.id] = d.v; }
  if (a.tipus === 'ordre') D.miss.cua.unshift({ t: String(d.text).slice(0, 80), a: 'Enviat al motor' });
}
async function accio(tipus, dades) {
  local({ tipus, dades }); pinta();
  try { await api('/rest/v1/accions', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ tipus, dades }) }); }
  catch (e) { avis('No s\'ha pogut desar. Mira la connexió.'); }
}

let toastT = 0;
function avis(t) { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { e.hidden = true; }, 2800); }

// Text amb enllaços i valors per copiar: [[valor]]
function ric(t) {
  return esc(t).replace(/\[\[(.+?)\]\]/g, (m, v) => `<button class="cp" data-cp="${v}" type="button">${v}</button>`)
    .replace(/https?:\/\/[^\s«»)<"]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '').slice(0, 44)}</a>`);
}
function md(s) {
  return esc(s).split(/\n{2,}/).map((b) => {
    if (/^\|/.test(b)) return '';
    if (/^#+\s/.test(b)) return `<h4>${b.replace(/^#+\s/, '')}</h4>`;
    if (/^[-*]\s/.test(b)) return '<ul>' + b.split('\n').map((l) => `<li>${l.replace(/^[-*]\s/, '')}</li>`).join('') + '</ul>';
    return `<p>${b.replace(/\n/g, '<br>')}</p>`;
  }).join('').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
const kpi = (v, l) => `<div class="k"><b>${v}</b><span>${l}</span></div>`;
const quan = { avui: 'Avui', setmana: 'Aquesta setmana', quan: 'Quan puguis' };

// Avui
function htmlAvui() {
  const ara = new Date(), dia = ara.getDay(), cap = dia === 0 || dia === 6;
  const pla = cap ? 'Cap de setmana' : dia === 4 ? 'Trucades de 9:00 a 13:30 · Demos a les 16:30' : 'Trucades de 9:00 a 13:30 · Classe a les 14:45';
  const fila = (t) => `<button class="li" data-tasca="${esc(t.id)}">${esc(t.t)}<small>${t.tm ? esc(t.tm) + ' · ' : ''}${t.p.length} passos${t.f.length ? ` · ${t.f.length} fets` : ''}</small></button>`;
  const grup = (k) => { const l = D.tasques.filter((t) => (t.q || 'quan') === k); return l.length ? `<h4>${quan[k]} · ${l.length}</h4>${l.map(fila).join('')}` : ''; };
  const dies = (d) => Math.ceil((new Date(d) - ara) / 864e5);
  return `<h3>${esc(ara.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase()))}</h3><p class="m">${pla}</p>
  <div class="ks t3">${D.fites.map((f) => kpi(dies(f.d) + ' dies', esc(f.t))).join('')}</div>
  ${D.tasques.length ? grup('avui') + grup('setmana') + grup('quan') : '<p class="cw">Res pendent. Bona feina.</p>'}
  <h4>Tota l'empresa</h4>
  <button class="li" data-sala="operacions">Diners<small>Ingressos, despeses i el que pagues cada mes</small></button>
  <button class="li" data-sala="enginyeria">Producte<small>Web, Verifactu i el que s'està construint</small></button>
  <button class="li" data-sala="cervell">Memòria<small>Busca qualsevol document o decisió</small></button>
  <button class="li" data-sala="cafe">Equip<small>${D.agents.length - lliures.length} amb feina · ${lliures.length} a la cafeteria</small></button>
  <button class="li" data-conn>Connexions<small>${(D.connexions || []).filter((c) => c.ok).length} de ${(D.connexions || []).length} a punt</small></button>
  ${D.miss.curs.length ? `<h4>En marxa ara · ${D.miss.curs.length}</h4>${D.miss.curs.map((m) => `<div class="li">${esc(m.t)}<small>${esc(m.a)}</small></div>`).join('')}` : ''}
  ${D.miss.fet.length ? `<h4>Fet avui per l'equip · ${D.miss.fet.length}</h4>${D.miss.fet.map((m) => `<div class="li">${esc(m.t)}<small>${esc(m.a)}</small></div>`).join('')}` : ''}
  <p class="n" style="margin-top:18px"><button class="bt sm" data-surt>Tanca la sessió</button></p>`;
}
function htmlTasca(id) {
  const t = D.tasques.find((x) => x.id === id);
  if (!t) return '<p class="cw">Aquesta tasca ja està feta.</p>';
  return `<h3>${esc(t.t)}</h3><p class="m">${t.tm ? esc(t.tm) + ' · ' : ''}${quan[t.q] || ''}</p>
  ${t.d ? `<h4>Per què</h4><p class="cw">${ric(t.d)}</p>` : ''}${t.des ? `<h4>Què desbloqueja</h4><p class="cw">${ric(t.des)}</p>` : ''}
  <h4>Pas a pas</h4><ol class="passos">${t.p.map((p, i) => `<li class="${t.f.includes(i) ? 'fet' : ''}"><label><input type="checkbox" data-pas="${i}" ${t.f.includes(i) ? 'checked' : ''}><span>${ric(p)}</span></label></li>`).join('')}</ol>
  ${t.id === 'trucades-alfred' && !D.pont ? `<h4>Enganxa aquí les claus de Twilio</h4><form class="grup" id="fclaus" autocomplete="off"><input class="camp" id="c-sid" placeholder="Account SID (comença per AC)" required aria-label="Account SID" autocapitalize="off" spellcheck="false"><input class="camp" id="c-tok" type="password" placeholder="Auth Token" required aria-label="Auth Token" autocomplete="off"><input class="camp" id="c-mob" inputmode="tel" placeholder="El teu mòbil" required aria-label="El teu mòbil"><button class="bt p" type="submit" style="width:100%">Connecta</button><p class="n" id="c-msg" role="alert">Es comproven amb Twilio i es desen a la base de dades de l'app. No tornen a sortir enlloc.</p></form>` : ''}
  <div class="bts"><button class="bt p" data-fet="${esc(t.id)}">Ja està fet</button><button class="bt" data-ajuda>No ho entenc</button></div>
  <div id="ajuda" hidden><textarea class="camp" id="ajuda-t" placeholder="Digues en quin pas t'has encallat" aria-label="Dubte"></textarea><div class="bts" style="margin-top:8px"><button class="bt p" data-ajuda-envia="${esc(t.id)}">Envia-ho a l'equip</button></div></div>`;
}

// Decisions
function htmlDecisions() {
  const l = D.decisions;
  return `<h3>Decisions</h3><p class="m">${l.length ? `${l.length} esperen que triïs` : 'No n\'hi ha cap de pendent'}</p>
  ${l.map((q) => { const r = q.r || {}; const o = q.o.find((x) => x.id === q.rec); return `<button class="li" data-dec="${esc(q.id)}">${esc(q.t)}<small>${o ? 'Recomanació: ' + esc(o.t) : ''}</small></button>`; }).join('')}
  <h4>Demana un informe</h4><p class="n">Digues sobre què vols decidir i l'equip te'l prepara.</p>
  <div class="bts"><input class="camp" id="dec-tema" placeholder="Per exemple: contractar un gestor" aria-label="Tema de l'informe" style="flex:1 1 200px"><button class="bt p sm" data-informe style="min-height:48px">Demana'l</button></div>
  <details class="plec"><summary>Ja decidit · ${D.dec.length}</summary>${D.dec.map((d) => `<div class="li">${esc(d.t)}<small>${esc(d.r)}</small></div>`).join('')}</details>
  ${seccioFinal(sala('direccio'))}`;
}
function htmlInforme(id) {
  const q = D.decisions.find((x) => x.id === id);
  if (!q) return '<p class="cw">Aquesta decisió ja està presa.</p>';
  const r = q.r || {}, ops = r.opcions || [];
  return `<h3>${esc(r.titol || q.t)}</h3><p class="cw"><b>${esc(r.pregunta || '')}</b></p><div class="doc">${md(r.resum || q.ctx)}</div>
  ${r.per_que_ara ? `<h4>Per què ara</h4><p class="m">${esc(r.per_que_ara)}</p>` : ''}
  <h4>Opcions</h4>${ops.map((o) => `<div class="grup ${o.id === q.rec ? 'reco' : ''}">${o.id === q.rec ? '<span class="xip">Recomanada</span>' : ''}<h5>${esc(o.titol)}</h5><p class="m">${esc(o.que_implica)}</p><p class="m"><b>Cost:</b> ${esc(o.cost)}</p><p class="m"><b>A favor:</b> ${esc(o.a_favor)}</p><p class="m"><b>En contra:</b> ${esc(o.en_contra)}</p><button class="bt ${o.id === q.rec ? 'p' : ''}" data-tria="${esc(o.id)}" data-q="${esc(q.id)}">Trio això</button></div>`).join('')}
  ${r.recomanacio ? `<h4>Per què ho recomano</h4><p class="cw">${esc(r.recomanacio.motiu)}</p>` : ''}
  ${r.si_no_decideixes ? `<h4>Si no decideixes</h4><p class="m">${esc(r.si_no_decideixes)}</p>` : ''}
  ${r.limit ? `<h4>Límits</h4><div class="doc">${md(r.limit)}</div>` : ''}
  ${r.falta ? `<h4>El que encara no sabem</h4><p class="m">${esc(r.falta)}</p>` : ''}
  ${(r.fonts || []).length ? `<details class="plec"><summary>Fonts · ${r.fonts.length}</summary>${r.fonts.map((f) => `<p class="n">${ric(f)}</p>`).join('')}</details>` : ''}`;
}

// Xarxes
function htmlXarxes() {
  const x = D.xarxes || {}, k = x.kpi || {}, a = x.analisi || {}, p = x.per || {}, mq = x.marques || {};
  const net = { linkedin: 'LinkedIn', instagram: 'Instagram', twitter: 'X' };
  const met = (m) => [['impressions', 'impressions'], ['reach', 'abast'], ['reactions', 'reaccions'], ['comments', 'comentaris'], ['shares', 'compartits'], ['saves', 'desats']].filter(([c]) => m && m[c]).map(([c, l]) => `<span><b>${num(m[c])}</b> ${l}</span>`).join('');
  const lim = x.limits || {}, lin = lim.linkedin || {}, ins = lim.instagram || {};
  return `<h3>Xarxes</h3><p class="m">Últims ${k.dies || 30} dies · dades de Buffer</p>
  <div class="ks">${kpi(num(k.posts), 'posts')}${kpi(num(k.reac), 'reaccions')}${kpi(num(k.com), 'comentaris')}${kpi(coma(k.eng || 0) + ' %', 'interacció')}</div>
  <div class="ks">${p.linkedin ? kpi(num(p.linkedin.imp), 'impressions a LinkedIn') : ''}${p.instagram ? kpi(num(p.instagram.abast), 'abast a Instagram') : ''}</div>
  ${a.resum ? `<h4>Què diuen les xifres</h4><p class="cw">${esc(a.resum)}</p>` : ''}
  ${(a.accions || []).length ? `<h4>Què fer aquesta setmana</h4>${a.accions.map((c) => `<div class="grup"><h5>${esc(c.titol)}</h5><p class="m">${esc(c.com)}</p></div>`).join('')}` : ''}
  ${(a.funciona || []).length ? `<h4>El que funciona</h4>${a.funciona.map((c) => `<div class="li">${esc(c.titol)}<small>${esc(c.dada)}</small></div>`).join('')}` : ''}
  ${(a.no_funciona || []).length ? `<details class="plec"><summary>El que no funciona · ${a.no_funciona.length}</summary>${a.no_funciona.map((c) => `<div class="li">${esc(c.titol)}<small>${esc(c.dada)}</small></div>`).join('')}</details>` : ''}
  <h4>Els millors posts</h4><p class="n">Marca el que t'agrada: l'equip en farà més.</p>
  ${(x.top || []).map((t) => `<div class="post"><div class="mx"><span>${esc(net[t.xarxa] || t.xarxa)} · ${esc(t.data)}</span>${met(t.m)}</div><p>${esc(t.text)}</p><div class="bts"><button class="bt sm ${mq[t.id] === 'si' ? 'on' : ''}" data-post="${esc(t.id)}" data-v="si">Funciona</button><button class="bt sm ${mq[t.id] === 'no' ? 'off' : ''}" data-post="${esc(t.id)}" data-v="no">No en vull més</button></div></div>`).join('')}
  ${(x.prog || []).length ? `<h4>Programats · ${x.prog.length}</h4>${x.prog.map((t) => `<div class="li">${esc(t.text)}<small>${esc(net[t.xarxa] || t.xarxa)} · ${esc(t.data)}</small></div>`).join('')}` : ''}
  <h4>DM i comentaris</h4>
  <div class="grup"><h5>LinkedIn</h5><p class="m">Límit diari: ${lin.connect || 0} invitacions, ${lin.dm || 0} missatges i ${lin.comment || 0} comentaris, des del Chrome de SailOS.</p></div>
  <div class="grup"><h5>Instagram</h5><p class="m">Límit diari: ${ins.dm || 0} missatges i ${ins.comment || 0} comentaris. Les respostes automàtiques esperen dues tasques teves de Meta.</p></div>
  <a class="li" style="display:block;text-decoration:none;color:var(--fg)" href="https://claude.ai/artifact/4Pqf9UffUmZgTooCCaCrho" target="_blank" rel="noopener">Obre la cua de DM i comentaris<small>De moment viu al panell antic: aviat serà aquí</small></a>
  <button class="li" data-dec-id="dec-dm">Fins on ho automatitzem?<small>Llegeix l'informe: hi ha risc de perdre el compte de LinkedIn</small></button>
  ${seccioFinal(sala('marqueting'))}`;
}

// Vendes
function embut() {
  const e = D.embut, v = [['Despatxos', e.despatxos], ['Amb informe', e.informes], ['Trucats', e.trucats], ['Demos', e.demos], ['Clients', e.clients]];
  return `<div role="img" aria-label="Embut de vendes: ${v.map((x) => x[0] + ' ' + x[1]).join(', ')}">${v.map(([l, n]) => `<div class="fb"><span>${l}</span><div>${n ? `<i style="width:${n / e.despatxos * 100}%"></i>` : '<i class="z"></i>'}</div><b>${n}</b></div>`).join('')}</div>`;
}
function segHtml() {
  const d = T[objectiu]; if (!d) return '';
  const i = TR && TR.inf && TR.inf[d.id], g = (i && i.g) || {};
  return `<h5>${esc(d.n)}</h5><p class="m">${esc(d.c)}${d.per ? ' · ' + esc(d.per) : ''}${d.p ? ' · ' + d.p + ' punts' : ''}</p><div class="tel">${esc(d.t)}</div>
  <div class="bts"><button class="bt p" data-truca="${esc(d.t)}" ${D.pont ? '' : 'disabled'}>${D.pont ? 'Truca des del fix' : 'Truca (falta connectar el fix)'}</button><button class="bt" data-seg>Següent</button></div>
  ${i ? `<details class="plec"><summary>Guió de la trucada</summary><div class="doc"><p><b>Obertura.</b> ${esc(g.obertura)}</p><p><b>Ganxo.</b> ${esc(g.ganxo)}</p>${(g.preguntes || []).length ? `<ul>${g.preguntes.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}<p><b>Tancament.</b> ${esc(g.tancament)}</p>${(i.o || []).map((o) => `<p><b>«${esc(o.objeccio)}»</b> ${esc(o.resposta)}</p>`).join('')}</div></details>` : ''}
  <p class="n">Com ha anat?</p><div class="bts">${[['no_agafa', 'No agafa'], ['truca_mes_tard', 'Més tard'], ['interessat', 'Interessat'], ['demo', 'Demo'], ['no_vol', 'No vol']].map(([v, l]) => `<button class="bt sm" data-res="${v}" data-id="${esc(d.id)}">${l}</button>`).join('')}</div>`;
}
function htmlVendes() {
  return `<h3>Vendes</h3><p class="m">Objectiu: 3 clients abans del 30-11</p>${embut()}<p class="cw">${D.embut.trucats ? '' : 'El coll d\'ampolla és trucar.'}</p>
  <h4>Següent trucada</h4><div class="grup" id="seg">${segHtml()}</div><p class="n">Trucades en fred, sempre des del fix: des del mòbil la llei no ho permet.</p>
  <canvas id="c1"></canvas><p class="n">Toca un punt del mapa per triar el despatx.</p>${seccioFinal(sala('vendes'))}`;
}
let c1 = null, mapa = null;
function prepMapa() {
  if (!$('c1') || !TR || !TR.sil || !TR.sil.length) return;
  const c = $('c1'), w = c.clientWidth || 340, h = 270, r = Math.min(devicePixelRatio || 1, 2); c.width = w * r; c.height = h * r; c.style.height = h + 'px'; const x = c.getContext('2d'); x.setTransform(r, 0, 0, r, 0, 0); c1 = { x, w, h };
  const ys = TR.sil.map((p) => p[0]), xs = TR.sil.map((p) => p[1]), k = Math.cos(41.7 * Math.PI / 180), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const e = Math.min((w - 12) / ((x1 - x0) * k), (h - 12) / (y1 - y0)), ox = (w - (x1 - x0) * k * e) / 2, oy = (h - (y1 - y0) * e) / 2, P = (la, lo) => [ox + (lo - x0) * k * e, h - oy - (la - y0) * e], per = {};
  mapa = { sil: TR.sil.map((p) => P(p[0], p[1])), punts: T.map((d) => { const n = (per[d.c] = (per[d.c] || 0) + 1), [px, py] = P(d.la, d.lo), a = n * 2.4, q = 2.4 * Math.sqrt(n - 1); return { d, x: px + Math.cos(a) * q, y: py + Math.sin(a) * q }; }) };
  pintaMapa(performance.now());
}
function pintaMapa(t) {
  if (!c1 || !$('c1')) return;
  const { x, w, h } = c1; x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(143,178,255,.3)'; for (const p of mapa.sil) x.fillRect(p[0], p[1], 1.5, 1.5);
  for (const p of mapa.punts) { const f = p.d.i ? .55 + p.d.p / 180 : .3, r = p.d.i ? 1.5 + p.d.p / 44 : 1.3; x.fillStyle = p.d.i ? `rgba(130,180,255,${f})` : `rgba(180,190,210,${f})`; x.beginPath(); x.arc(p.x, p.y, r, 0, 6.283); x.fill(); }
  const o = mapa.punts[objectiu]; if (o) { const pul = (t % 1800) / 1800; x.strokeStyle = `rgba(254,133,0,${1 - pul})`; x.lineWidth = 1.5; x.beginPath(); x.arc(o.x, o.y, 6 + pul * 18, 0, 6.283); x.stroke(); x.fillStyle = '#FE8500'; x.beginPath(); x.arc(o.x, o.y, 3.6, 0, 6.283); x.fill(); }
  if (!quiet) requestAnimationFrame(pintaMapa);
}

// Diners
const CATS = { despesa: ['Eines', 'Telèfon', 'Anuncis', 'Legal i gestoria', 'Impostos', 'Altres'], ingres: ['Clients', 'Altres'] };
const FALTEN = ['ChatGPT', 'Claude', 'ElevenLabs', 'Twilio', 'Hostinger', 'Buffer', 'Resend', 'Firecrawl'];
let tipusMov = 'despesa';
const mesDe = (d) => String(d).slice(0, 7);
function delMes(m) {
  const l = (MOV || []).filter((x) => mesDe(x.data) === m), fixos = (MOV || []).filter((x) => x.recurrent && x.tipus === 'despesa' && mesDe(x.data) < m);
  return { l, fixos };
}
function htmlDiners() {
  if (!MOV) return '<h3>Diners</h3><p class="m">Carregant…</p>';
  const avui = new Date().toISOString().slice(0, 10), m = avui.slice(0, 7), { l, fixos } = delMes(m), sum = (a) => a.reduce((s, x) => s + Number(x.import), 0);
  const ing = sum(l.filter((x) => x.tipus === 'ingres')), des = sum(l.filter((x) => x.tipus === 'despesa')) + sum(fixos);
  const fix = sum((MOV || []).filter((x) => x.recurrent && x.tipus === 'despesa')), total = sum((MOV || []).filter((x) => x.tipus === 'ingres'));
  const cat = {}; [...l.filter((x) => x.tipus === 'despesa'), ...fixos].forEach((x) => { cat[x.categoria] = (cat[x.categoria] || 0) + Number(x.import); });
  const max = Math.max(1, ...Object.values(cat)), tenen = new Set((MOV || []).map((x) => x.concepte.toLowerCase())), falten = FALTEN.filter((f) => !tenen.has(f.toLowerCase()));
  const fila = (x, fix2) => `<div class="li"><div class="bts" style="justify-content:space-between;flex-wrap:nowrap"><span>${esc(x.concepte)}<small>${fix2 ? 'Cada mes' : esc(String(x.data).slice(8, 10) + '-' + String(x.data).slice(5, 7))} · ${esc(x.categoria)}${x.recurrent && !fix2 ? ' · cada mes' : ''}</small></span><span style="text-align:right;flex:none"><b style="font-family:var(--num);font-weight:500;color:var(--${x.tipus === 'ingres' ? 'ok' : 'fg'})">${x.tipus === 'ingres' ? '+' : '−'}${euros(x.import)}</b><br>${fix2 ? '' : `<button class="x" style="display:inline;min-height:0;padding:0;font-size:12px;color:var(--mut)" data-esborra="${esc(x.id)}">Esborra</button>`}</span></div></div>`;
  const mes = new Date().toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  return `<h3>Diners</h3><p class="m">${esc(mes.replace(/^./, (c) => c.toUpperCase()))}</p>
  <div class="ks">${kpi(euros(ing), 'ingressos del mes')}${kpi(euros(des), 'despeses del mes')}${kpi(euros(ing - des), 'resultat del mes')}${kpi(euros(fix), 'pagues fix cada mes')}</div>
  <h4>Afegeix un moviment</h4>
  <form class="grup" id="fmov" autocomplete="off">
    <div class="bts"><button type="button" class="bt sm ${tipusMov === 'despesa' ? 'on' : ''}" data-tipus="despesa">Despesa</button><button type="button" class="bt sm ${tipusMov === 'ingres' ? 'on' : ''}" data-tipus="ingres">Ingrés</button></div>
    <input class="camp" id="m-con" placeholder="${tipusMov === 'despesa' ? 'Què has pagat' : 'De qui has cobrat'}" required maxlength="120" aria-label="Concepte">
    <div class="bts"><input class="camp" id="m-imp" inputmode="decimal" placeholder="Import €" required aria-label="Import" style="flex:1 1 110px"><input class="camp" id="m-dat" type="date" value="${avui}" required aria-label="Data" style="flex:1 1 140px"></div>
    <select class="camp" id="m-cat" aria-label="Categoria">${CATS[tipusMov].map((c) => `<option>${c}</option>`).join('')}</select>
    <label class="m" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="m-rec" style="width:18px;height:18px;accent-color:var(--ok)"> Es repeteix cada mes</label>
    <button class="bt p" type="submit" style="width:100%">Desa</button>
  </form>
  ${falten.length ? `<h4>Quotes que encara no has posat</h4><div class="bts">${falten.map((f) => `<button class="bt sm" data-quota="${esc(f)}">${esc(f)}</button>`).join('')}</div>` : ''}
  ${Object.keys(cat).length ? `<h4>On va el que gastes</h4>${Object.entries(cat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<div class="fb"><span>${esc(c)}</span><div><i style="width:${v / max * 100}%"></i></div><b style="font-size:12px">${Math.round(v)}€</b></div>`).join('')}` : ''}
  <h4>Moviments d'aquest mes</h4>${l.length + fixos.length ? [...l.map((x) => fila(x)), ...fixos.map((x) => fila(x, true))].join('') : '<p class="n">Encara no n\'hi ha cap.</p>'}
  <details class="plec"><summary>Tot l'històric · ${(MOV || []).length}</summary>${(MOV || []).map((x) => fila(x)).join('') || '<p class="n">Buit.</p>'}<p class="m" style="margin-top:8px">Ingressos totals: <b>${euros(total)}</b></p></details>
  ${seccioFinal(sala('operacions'))}`;
}
async function carregaMov() { try { MOV = await api('/rest/v1/moviments?select=*&order=data.desc,creat.desc&limit=500'); } catch (e) { MOV = []; avis('No s\'han pogut carregar els diners.'); } }

// Producte, memòria i equip
function htmlProducte() {
  const c = D.miss.curs, q = D.miss.cua;
  return `<h3>Producte</h3><p class="m">Web, Verifactu i el que s'està construint</p>
  <div class="ks">${kpi(webOk ? 'En línia' : 'Caiguda', 'web · ' + esc(D.hora))}${kpi(q.length, 'encàrrecs a la cua')}</div>
  ${c.length ? `<h4>En curs</h4>${c.map((m) => `<div class="li">${esc(m.t)}<small>${esc(m.a)}</small></div>`).join('')}` : ''}
  ${q.length ? `<details class="plec"><summary>A la cua · ${q.length}</summary>${q.map((m) => `<div class="li">${esc(m.t)}<small>${esc(m.a)}</small></div>`).join('')}</details>` : ''}
  ${seccioFinal(sala('enginyeria'))}`;
}
function htmlCervell() {
  return `<h3>Memòria</h3><p class="m">${D.docs} documents i ${D.dec.length} decisions</p>
  <input class="camp" id="busca" placeholder="Busca: SL, preu, Verifactu…" aria-label="Busca a la memòria"><div id="troba"></div>
  <details class="plec"><summary>Què has decidit · ${D.dec.length}</summary>${D.dec.map((d) => `<div class="li">${esc(d.t)}<small>${esc(d.r)}</small></div>`).join('')}</details>`;
}
function equip(l) {
  return l.map((a) => { const c = a.st === 2 ? ' a' : a.st === 1 ? ' w' : '', e = a.st === 2 ? 'Treballant' : a.st === 1 ? 'A la taula' : 'Cafeteria'; return `<details class="ag${c}"><summary><i></i><div>${esc(a.n)}<small>${esc(a.r)}</small></div><em>${e}</em></summary><p>${a.j ? `<b>${esc(a.j)}</b><br>` : ''}${esc(a.f)}${a.e ? `<br>Eines: ${esc(a.e)}` : ''}</p></details>`; }).join('');
}
function htmlCafe() { return `<h3>Equip</h3><p class="m">${lliures.length} agents sense feina oberta avui</p><p class="cw">Parla amb l'Alfred i dona'ls feina.</p><h4>A la cafeteria</h4>${equip(lliures)}`; }
function seccioFinal(s) {
  const l = (D.lliu && D.lliu[s.id]) || [];
  return `${l.length ? `<h4>Últims lliuraments</h4>${l.map((d) => `<button class="li" data-doc="${esc(d.k)}">${esc(d.t)}<small>${esc(d.a)}</small></button>`).join('')}` : ''}
  <details class="plec"><summary>Equip · ${s.ag.length} agents, ${s.taula} a la taula</summary>${equip(s.ag)}</details>`;
}
function htmlConn() {
  const l = D.connexions || [];
  return `<h3>Connexions</h3><p class="m">${l.filter((c) => c.ok).length} de ${l.length} a punt</p>
  ${l.map((c) => `<${c.f && !c.ok ? `button data-tasca="${esc(c.f)}"` : 'div'} class="li"><span style="color:var(--${c.ok ? 'ok' : c.f ? 'ambre' : 'mut'})">${c.ok ? 'Connectat' : c.f ? 'Falta' : 'Més endavant'}</span> · ${esc(c.n)}${c.e ? `<small>${esc(c.e)}</small>` : ''}${c.f && !c.ok ? '<small>Toca per veure el pas a pas</small>' : ''}</${c.f && !c.ok ? 'button' : 'div'}>`).join('')}`;
}
function htmlDoc(k) {
  const d = DOCS && DOCS[k]; if (!d) return '<p class="m">Carregant…</p>';
  return `<h3>${esc(d.t)}</h3><p class="m">${esc(d.a)}</p><div class="doc">${md(d.md)}</div><div class="bts"><button class="bt p" data-ok="${esc(k)}">Aprovar</button><button class="bt" data-canvis>Demanar canvis</button></div><div id="canvis" hidden><textarea class="camp" id="canvis-t" placeholder="Què vols que canviïn?" aria-label="Canvis"></textarea><div class="bts" style="margin-top:8px"><button class="bt p" data-canvis-envia="${esc(k)}">Envia</button></div></div>`;
}

// Calaix
const PANELLS = { avui: htmlAvui, direccio: htmlDecisions, marqueting: htmlXarxes, vendes: htmlVendes, operacions: htmlDiners, enginyeria: htmlProducte, cervell: htmlCervell, cafe: htmlCafe };
function pinta() {
  const n = D.tasques.length; $('n-avui').textContent = n || ''; $('n-dec').textContent = D.decisions.length || '';
  const a = $('ara'), t = D.tasques[0];
  a.hidden = !t; if (t) a.innerHTML = `<b>Ara toca</b><span>${esc(t.t)}</span>${t.tm ? `<em>${esc(t.tm)}</em>` : ''}`;
  if (obert) omple();
}
function omple() {
  const p = $('pan'), top = p.scrollTop; let h = '';
  if (vista) { const f = { tasca: htmlTasca, informe: htmlInforme, doc: htmlDoc, conn: htmlConn }[vista.t]; h = `<button class="x" data-torna>Enrere</button>${f(vista.id)}`; }
  else h = `<button class="x" data-tanca>Tornar a l'oficina</button>${PANELLS[obert.id]()}`;
  p.innerHTML = h; p.scrollTop = top; if ($('c1')) prepMapa();
}
function marca() { for (const b of document.querySelectorAll('#moll [data-p]')) b.setAttribute('aria-current', b.dataset.p === (obert && ({ avui: 'avui', direccio: 'dec', marqueting: 'xarxes', vendes: 'vendes' }[obert.id]))); }
async function obre(s, v) {
  obert = s; vista = v || null; $('hq').classList.add('obert'); $('hq').classList.toggle('gran', ['avui', 'direccio', 'operacions'].includes(s.id) || !!v); $('pan').hidden = false; $('pan').scrollTop = 0; omple(); marca(); if (G) G.centra(s.pts ? s : null);
  if (s.id === 'vendes' && !TR) { const f = await foto('trucades'); TR = f ? f.dades : {}; if (obert === s) { omple(); } }
  if (s.id === 'operacions' && !MOV) { await carregaMov(); if (obert === s) omple(); }
}
function tanca() { obert = null; vista = null; $('hq').classList.remove('obert', 'gran'); $('pan').hidden = true; marca(); if (G) G.centra(null); }
async function docs() { if (!DOCS) { const f = await foto('docs'); DOCS = f ? f.dades : {}; } return DOCS; }

$('pan').addEventListener('click', async (e) => {
  const q = (a) => e.target.closest(a); let b;
  if ((b = q('[data-cp]'))) { e.preventDefault(); try { await navigator.clipboard.writeText(b.dataset.cp); avis('Copiat'); } catch (x) { avis(b.dataset.cp); } return; }
  if (q('[data-tanca]')) return tanca();
  if (q('[data-conn]')) { vista = { t: 'conn' }; $('hq').classList.add('gran'); $('pan').scrollTop = 0; return omple(); }
  if (q('[data-torna]')) { vista = null; $('hq').classList.toggle('gran', ['avui', 'direccio', 'operacions'].includes(obert.id)); $('pan').scrollTop = 0; return omple(); }
  if ((b = q('[data-sala]'))) { const id = b.dataset.sala; return obre(sala(id) || (id === 'cervell' ? CERV : id === 'cafe' ? CAFE : AVUI)); }
  if ((b = q('[data-tasca]'))) { vista = { t: 'tasca', id: b.dataset.tasca }; $('hq').classList.add('gran'); $('pan').scrollTop = 0; return omple(); }
  if ((b = q('[data-fet]'))) { await accio('tasca_fet', { id: b.dataset.fet }); vista = null; avis('Fet. Una menys.'); return omple(); }
  if (q('[data-ajuda]')) { $('ajuda').hidden = false; return $('ajuda-t').focus(); }
  if ((b = q('[data-ajuda-envia]'))) { await accio('tasca_ajuda', { id: b.dataset.ajudaEnvia, text: $('ajuda-t').value }); $('ajuda').hidden = true; return avis('Enviat. L\'equip t\'ho reescriurà.'); }
  if ((b = q('[data-dec]')) || (b = q('[data-dec-id]'))) { const id = b.dataset.dec || b.dataset.decId; if (!D.decisions.find((x) => x.id === id)) return avis('Aquesta decisió ja està presa.'); vista = { t: 'informe', id }; $('hq').classList.add('gran'); $('pan').scrollTop = 0; return omple(); }
  if ((b = q('[data-tria]'))) { await accio('decisio', { id: b.dataset.q, opcio: b.dataset.tria }); vista = null; avis('Decidit. L\'equip ja ho té.'); return omple(); }
  if (q('[data-informe]')) { const v = $('dec-tema').value.trim(); if (!v) return; await accio('informe', { text: v }); $('dec-tema').value = ''; return avis('Encarregat. Sortirà aquí quan estigui fet.'); }
  if ((b = q('[data-post]'))) { await accio('post_marca', { id: b.dataset.post, v: b.dataset.v }); return avis('Apuntat.'); }
  if (q('[data-seg]')) { objectiu = (objectiu + 1) % T.length; $('seg').innerHTML = segHtml(); return; }
  if ((b = q('[data-res]'))) { await accio('trucada', { id: b.dataset.id, estat: b.dataset.res }); objectiu = (objectiu + 1) % T.length; return avis('Apuntat.'); }
  if ((b = q('[data-truca]'))) { b.disabled = true; try { const r = await fetch(`${SB.url}/functions/v1/trucar`, { method: 'POST', headers: { apikey: SB.key, Authorization: 'Bearer ' + await clau(), 'Content-Type': 'application/json' }, body: JSON.stringify({ a: b.dataset.truca }) }); if (!r.ok) throw new Error(); avis('Et sona el mòbil: despenja i connecta amb el despatx.'); } catch (x) { avis('No s\'ha pogut trucar.'); } b.disabled = false; return; }
  if ((b = q('[data-doc]'))) { vista = { t: 'doc', id: b.dataset.doc }; $('hq').classList.add('gran'); $('pan').scrollTop = 0; omple(); await docs(); return omple(); }
  if ((b = q('[data-ok]'))) { await accio('doc_ok', { k: b.dataset.ok }); return avis('Aprovat.'); }
  if (q('[data-canvis]')) { $('canvis').hidden = false; return $('canvis-t').focus(); }
  if ((b = q('[data-canvis-envia]'))) { await accio('doc_canvis', { k: b.dataset.canvisEnvia, text: $('canvis-t').value }); $('canvis').hidden = true; return avis('Enviat a l\'equip.'); }
  if ((b = q('[data-tipus]'))) { tipusMov = b.dataset.tipus; return omple(); }
  if ((b = q('[data-quota]'))) { tipusMov = 'despesa'; omple(); $('m-con').value = b.dataset.quota; $('m-rec').checked = true; $('m-cat').value = 'Eines'; return $('m-imp').focus(); }
  if ((b = q('[data-esborra]'))) { MOV = MOV.filter((x) => x.id !== b.dataset.esborra); omple(); try { await api(`/rest/v1/moviments?id=eq.${b.dataset.esborra}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); } catch (x) { avis('No s\'ha pogut esborrar.'); await carregaMov(); omple(); } return; }
  if (q('[data-surt]')) { ses = null; desa('cova-ses', null); desa('cova-foto', null); location.reload(); return; }
  if (e.target.id === 'c1' && mapa) { const r = e.target.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top; let m = 1e9, k = 0; mapa.punts.forEach((p, i) => { const d = (p.x - mx) ** 2 + (p.y - my) ** 2; if (d < m) { m = d; k = i; } }); objectiu = k; $('seg').innerHTML = segHtml(); }
});
$('pan').addEventListener('change', (e) => {
  const c = e.target.closest('[data-pas]'); if (!c || !vista) return;
  const t = D.tasques.find((x) => x.id === vista.id), i = +c.dataset.pas; t.f = c.checked ? [...new Set([...t.f, i])] : t.f.filter((x) => x !== i); c.closest('li').classList.toggle('fet', c.checked); accio('tasca_pas', { id: t.id, fets: t.f });
});
$('pan').addEventListener('submit', async (e) => {
  if (e.target.id === 'fclaus') {
    e.preventDefault(); const m = $('c-msg'), b = e.target.querySelector('button'); b.disabled = true; m.textContent = 'Comprovant amb Twilio…'; m.className = 'n';
    try {
      const r = await fetch(`${SB.url}/functions/v1/connecta`, { method: 'POST', headers: { apikey: SB.key, Authorization: 'Bearer ' + await clau(), 'Content-Type': 'application/json' }, body: JSON.stringify({ sid: $('c-sid').value, token: $('c-tok').value, mobil: $('c-mob').value }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      D.pont = true; (D.connexions || []).forEach((c) => { if (c.n === 'Claus de Twilio') c.ok = true; }); omple(); avis('Claus desades. Ja pots trucar des del fix.');
    } catch (x) { m.textContent = x.message || "No s'ha pogut connectar."; m.className = 'n err'; b.disabled = false; }
    return;
  }
  if (e.target.id !== 'fmov') return; e.preventDefault();
  const imp = parseFloat($('m-imp').value.replace(',', '.'));
  if (!(imp >= 0)) return avis('Escriu l\'import amb números.');
  const m = { data: $('m-dat').value, tipus: tipusMov, concepte: $('m-con').value.trim(), import: imp, categoria: $('m-cat').value, recurrent: $('m-rec').checked };
  try { const r = await api('/rest/v1/moviments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(m) }); MOV.unshift(r[0]); MOV.sort((a, b) => String(b.data).localeCompare(String(a.data))); omple(); avis('Desat.'); } catch (x) { avis('No s\'ha pogut desar.'); }
});
$('pan').addEventListener('input', async (e) => {
  if (e.target.id !== 'busca') return;
  const q = e.target.value.trim().toLowerCase(); if (q.length < 2) { $('troba').innerHTML = ''; return; }
  const d = await docs(), r = Object.entries(d).filter(([, x]) => (x.t + ' ' + x.md).toLowerCase().includes(q)).slice(0, 12);
  $('troba').innerHTML = r.map(([k, x]) => `<button class="li" data-doc="${esc(k)}">${esc(x.t)}<small>${esc(x.a)}</small></button>`).join('') || '<p class="n">No he trobat res.</p>';
});
$('moll').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]'); if (!b) return;
  const s = { avui: AVUI, dec: sala('direccio'), xarxes: sala('marqueting'), vendes: sala('vendes') }[b.dataset.p];
  if (obert === s && !vista) tanca(); else obre(s);
});
$('ara').onclick = () => { const t = D.tasques[0]; if (t) obre(AVUI, { t: 'tasca', id: t.id }); };
addEventListener('keydown', (e) => { if (e.key === 'Escape' && obert) { if (vista) { vista = null; omple(); } else tanca(); } });

// L'Alfred
const VEU_LIB = 'https://cdn.jsdelivr.net/npm/@elevenlabs/client@1.29.0/+esm';
let conv = null, veuObert = false;
function pintaVeu(t, s) {
  $('veu').hidden = false;
  $('veu').innerHTML = `<p id="veu-t">${esc(t)}</p><small id="veu-s">${esc(s || '')}</small><div class="fila"><input class="camp" id="veu-i" placeholder="O escriu una ordre per a l'equip" aria-label="Ordre per a l'equip" autocomplete="off"><button class="bt p sm" id="veu-e" style="min-height:44px">Envia</button><button class="bt sm" id="veu-x" style="min-height:44px">Tanca</button></div>`;
  $('veu-e').onclick = enviaOrdre; $('veu-x').onclick = tancaVeu; $('veu-i').onkeydown = (e) => { if (e.key === 'Enter') enviaOrdre(); };
}
async function enviaOrdre() { const v = $('veu-i').value.trim(); if (!v) return; await accio('ordre', { text: v }); $('veu-i').value = ''; avis('Enviat a l\'equip.'); if (G) { const s = /post|xarxes|contingut|anunci/i.test(v) ? 'marqueting' : /truc|despatx|client|venda/i.test(v) ? 'vendes' : /web|error|app|demo/i.test(v) ? 'enginyeria' : 'operacions'; G.ordre({ s }, () => {}); } }
async function tancaVeu() { veuObert = false; $('veu').hidden = true; $('mic').classList.remove('on'); if (G) G.escolta(false); if (conv) { const c = conv; conv = null; try { await c.endSession(); } catch (e) { /* ja tancada */ } } }
async function obreVeu() {
  if (veuObert) return tancaVeu();
  veuObert = true; $('mic').classList.add('on'); if (G) G.escolta(true); pintaVeu('Connectant amb l\'Alfred…', '');
  try {
    const { Conversation } = await import(VEU_LIB);
    conv = await Conversation.startSession({
      agentId: D.alfred, connectionType: 'websocket',
      onConnect: () => { if ($('veu-s')) $('veu-s').textContent = 'En línia. Parla quan vulguis.'; },
      onDisconnect: () => { if (veuObert && conv) tancaVeu(); },
      onModeChange: (m) => { if ($('veu-s')) $('veu-s').textContent = m.mode === 'speaking' ? 'L\'Alfred parla' : 'T\'escolto'; },
      onMessage: (m) => { if ($('veu-t') && m.message) $('veu-t').textContent = m.message; },
      onError: () => { if ($('veu-s')) $('veu-s').textContent = 'S\'ha perdut la connexió.'; },
    });
  } catch (e) {
    if (G) G.escolta(false);
    pintaVeu('No he pogut obrir el micròfon.', 'Dona permís al micròfon o escriu l\'ordre aquí sota.');
  }
}
$('mic').addEventListener('click', obreVeu);

// Arrencada
async function engega() {
  $('entra').hidden = true; $('nova').hidden = true; $('carrega').hidden = false;
  try {
    const d = await carrega();
    if (!d) { $('carrega').textContent = 'L\'equip encara no ha pujat la primera foto. Torna en uns minuts.'; return; }
  } catch (e) {
    const v = recull('cova-foto');
    if (!v) { $('carrega').textContent = 'No hi ha connexió.'; return; }
    prepara(v); avis('Sense connexió: veus l\'última foto.');
  }
  $('carrega').hidden = true; $('hq').hidden = false;
  $('hora').textContent = `Dades de les ${D.hora}`;
  $('viu').classList.toggle('vell', Date.now() - D.ts > 3 * 36e5);
  try { oficina(); } catch (e) { $('lbs').innerHTML = ''; }
  pinta();
}
$('fentra').addEventListener('submit', async (e) => {
  e.preventDefault(); $('e-msg').textContent = ''; $('e-msg').className = '';
  try { await token({ email: $('e-mail').value.trim(), password: $('e-pass').value }, 'password'); engega(); } catch (x) { $('e-msg').textContent = x.message; $('e-msg').className = 'err'; }
});
$('fnova').addEventListener('submit', async (e) => {
  e.preventDefault();
  try { const r = await fetch(`${SB.url}/auth/v1/user`, { method: 'PUT', headers: { apikey: SB.key, Authorization: 'Bearer ' + await clau(), 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('n-pass').value }) }); if (!r.ok) throw new Error(); engega(); }
  catch (x) { $('n-msg').textContent = 'No s\'ha pogut desar. Prova\'n una altra.'; $('n-msg').className = 'err'; }
});
addEventListener('visibilitychange', async () => {
  if (document.hidden || !D) return;
  try { const f = await api('/rest/v1/foto?id=eq.cova&select=actualitzat'); if (f[0] && f[0].actualitzat !== D._quan) { await carrega(); $('hora').textContent = `Dades de les ${D.hora}`; pinta(); } } catch (e) { /* segueix amb el que té */ }
});
(async () => {
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('e') && h.get('p')) {
    history.replaceState(null, '', location.pathname);
    try { await token({ email: h.get('e'), password: h.get('p') }, 'password'); $('carrega').hidden = true; $('nova').hidden = false; return; } catch (x) { /* enllaç gastat: demana la contrasenya */ }
  }
  if (ses) return engega();
  $('carrega').hidden = true; $('entra').hidden = false;
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
