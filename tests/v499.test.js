// Pruebas de la versión 4.9.9: el editor de la noche (pasos de 15 min) es la única forma de anotar una noche;
// la rejilla queda de consulta; pantalla del paciente nueva en el móvil (lista de noches, sin QR, Guardar y Enviar
// juntos); acontecimientos con su tipo y tratamiento en los datos, el CSV y los informes; sin registro guiado,
// factores, ventana de sueño ni hitos (los datos de diarios anteriores se conservan).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
async function loginDoctor(app) {
  app.doc.getElementById('luser').value = 'medico';
  app.doc.getElementById('lpass').value = 'clinica';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
async function pacienteMovil(opts = {}) {
  const app = await loadApp({ userAgent: IPHONE, ...opts });
  const code = app.ev('generarCodigoAcceso()');
  app.doc.getElementById('luser').value = code.slice(0, 4) + '-' + code.slice(4);
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
  for (let i = 0; i < 30; i++) {
    const dev = app.doc.getElementById('devPriv'); if (dev) { dev.click(); await app.sleep(50); }
    const chk = app.doc.getElementById('consentChk');
    if (chk) { chk.checked = true; chk.dispatchEvent(new app.win.Event('change')); app.doc.getElementById('consentYes').click(); await app.sleep(500); break; }
    await app.sleep(60);
  }
  assert.equal(app.ev('session&&session.role'), 'patient');
  return app;
}
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const rangos = (app, d) => app.ev(`slotsToRanges(state[${d}].slots,'s')`);
// una noche como la daría el editor (horas en HH:MM, acontecimientos con el nombre del tipo)
// Word del análisis (sin la librería docx, como .doc en HTML): devuelve el HTML y la descripción del documento
async function wordAnalisis(app) {
  let html = '', nombre = '';
  const B = app.win.Blob;
  app.win.Blob = function (parts, o) { html = parts.join(''); return new B(parts, o); };
  app.win.URL.createObjectURL = () => 'blob:x'; app.win.URL.revokeObjectURL = () => {};
  const clic = app.win.HTMLAnchorElement.prototype.click;
  app.win.HTMLAnchorElement.prototype.click = function () { nombre = this.download; };
  try { await app.ev('exportAnalysisWord()'); } finally { app.win.Blob = B; app.win.HTMLAnchorElement.prototype.click = clic; }
  return { html, nombre, D: app.evj('window._ultimoWordAnalisis') };
}
const textoBloques = bs => bs.map(b => b.t === 'p' ? b.runs.map(r => r.text || (r.br ? ' ' : '')).join('') : b.rows.map(r => r.cells.map(c => textoBloques(c.blocks || [])).join(' ')).join(' ')).join(' ');
const NOCHE = { gd: { b: '23:50', s: 30, w: [{ t: '03:00', d: 30 }, { t: '05:10', d: 10 }], f: '06:30', r: '07:00' }, tA: 'L', tB: 'L',
  ev: [{ t: '03:10', q: 'Ir al baño' }, { t: '05:10', q: 'Ruido' }], qs: 4, qd: 3, qe: 5, trat: 'Melatonina 1 mg a las 23:00', obs: 'Cena tarde' };

// ---------- puente entre la Agenda y el editor ----------
test('puente: guardar una noche pinta la rejilla con la regla común y conserva las respuestas, los acontecimientos y las notas', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');buildBody();`);
  assert.equal(app.ev(`AgendaPuente.guardar(4,${JSON.stringify(NOCHE)})`), true);
  assert.equal(rangos(app, 4), '00:30-03:00,03:30-06:30');
  assert.deepEqual(app.evj('[state[4].downs,state[4].ups]'), [[8], [22]]);
  assert.deepEqual(app.evj('state[4].gd'), NOCHE.gd);
  assert.deepEqual(app.evj('state[4].ev'), [{ t: '03:10', k: 'bano' }, { t: '05:10', k: 'ruido' }]);
  assert.deepEqual(app.evj('state[4].events'), [14, 18]);              // la ✕ de cada uno, en su media hora
  assert.deepEqual(app.evj('[state[4].qs,state[4].qd,state[4].qe,state[4].qsc]'), [4, 3, 5, 5]);
  assert.equal(app.ev('state[4].trat'), 'Melatonina 1 mg a las 23:00');
  assert.equal(app.ev('state[4].cmt'), 'Cena tarde');
  assert.ok(app.ev('_gdCoincide(4)'));
  // las notas de la fila juntan tratamiento, acontecimientos y observaciones
  assert.equal(app.ev(`document.querySelector('#gridBody .cmtv[data-cmtd="4"]').textContent`),
    'Tratamiento: Melatonina 1 mg a las 23:00 · Acontecimientos: 03:10 baño; 05:10 ruido · Cena tarde');
  // la rejilla muestra el emoji de cada acontecimiento
  assert.deepEqual(app.evj(`[...document.querySelectorAll('#gridBody tr[data-d="4"] .evx')].map(x=>x.textContent)`), ['🚽', '🔊']);
  // una noche imposible no se guarda ni cambia nada
  const antes = app.ev('JSON.stringify(state[5])');
  assert.equal(app.ev(`AgendaPuente.guardar(5,{...${JSON.stringify(NOCHE)},gd:{b:'23:00',s:600,w:[],f:'06:00',r:'07:00'}})`), false);
  assert.equal(app.ev('JSON.stringify(state[5])'), antes);
  // deshacer devuelve la noche anterior al guardado
  app.ev('undoLast()');
  assert.equal(app.ev('state[4].gd'), undefined);
  assert.equal(rangos(app, 4), '');
  assert.deepEqual(app.errors, []);
});

test('puente: el editor recibe la noche (a minuto si se anotó en él; desde la rejilla si es de una versión anterior)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  // una noche anotada en el editor (los casos de ejemplo se regeneraron con él) vuelve con sus respuestas a minuto
  assert.deepEqual(app.evj('AgendaPuente.noche(0).gd'), { b: '22:45', s: 25, w: [], f: '06:40', r: '06:45' });
  // noche pintada en la rejilla (diario de una versión anterior, sin respuestas): se deduce de ella
  app.ev('state.forEach(d=>{ delete d.gd; })');
  let n = app.evj('AgendaPuente.noche(0)');
  assert.deepEqual(n.gd, { b: '23:00', s: 30, w: [], f: '07:00', r: '07:00' });
  assert.equal(n.fecha, app.ev('isoDeFecha(dateFor(0))'));
  assert.deepEqual([n.tA, n.tB, n.prev], ['L', 'L', null]);
  assert.deepEqual([n.qs, n.qd, n.qe], [4, 4, 4]);
  // la noche siguiente propone la anterior
  assert.deepEqual(app.evj('AgendaPuente.noche(1).prev'), n.gd);
  // una noche anotada en el editor vuelve tal cual, con su tratamiento (y «Igual que ayer» lo ofrece la noche siguiente)
  app.ev(`AgendaPuente.guardar(2,${JSON.stringify(NOCHE)})`);
  n = app.evj('AgendaPuente.noche(2)');
  assert.deepEqual(n.gd, NOCHE.gd);
  assert.deepEqual(n.ev, NOCHE.ev);
  assert.equal(n.trat, NOCHE.trat); assert.equal(n.obs, NOCHE.obs);
  assert.equal(app.ev('AgendaPuente.tratAnterior(5)'), NOCHE.trat);
  // si alguien repinta la rejilla a mano (diario editado en otra versión), manda la rejilla
  app.ev(`state[2].slots[20]=null;`);
  assert.notDeepEqual(app.evj('AgendaPuente.noche(2).gd'), NOCHE.gd);
  assert.deepEqual(app.errors, []);
});

test('acontecimientos de diarios anteriores: la ✕ sin tipo es «Otro»; la de un despertar con motivo (v4.9.7) recupera su tipo y su hora', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');`);
  app.ev(`state[1].events=[10];`);
  assert.deepEqual(app.evj('evDelDia(state[1])'), [{ t: '01:00', k: 'otro' }]);
  app.ev(`state[2].gd={b:'23:00',s:20,w:[{t:'03:15',d:20,m:'bano'},{t:'04:40',d:15}],f:'06:30',r:'07:00'};state[2].events=[14,17];`);
  assert.deepEqual(app.evj('evDelDia(state[2])'), [{ t: '03:15', k: 'bano' }, { t: '04:30', k: 'otro' }]);
  // claves desconocidas o manipuladas pasan a «Otro»; horas imposibles se descartan
  assert.deepEqual(app.evj(`evDelDia({ev:[{t:'02:00',k:'<b>'},{t:'99:99',k:'bano'},{t:'2:05',k:'tos'}]})`), [{ t: '02:00', k: 'otro' }, { t: '02:05', k: 'tos' }]);
  assert.deepEqual(app.evj(`evDeCadena('03:00+bano, 04:15+zzz,,x+tos')`), [{ t: '03:00', k: 'bano' }, { t: '04:15', k: 'otro' }]);
  assert.equal(app.ev(`evACadena([{t:'03:00',k:'bano'},{t:'04:15',k:'tos'}])`), '03:00+bano,04:15+tos');
  // los factores de un diario v4.9.7 se siguen viendo en las notas
  app.ev(`state[3].tags=['cafe','estres'];state[3].cmt='Examen';`);
  assert.equal(app.ev('notasNoche(state[3])'), 'Factores: cafeína, estrés o preocupación · Examen');
  assert.deepEqual(app.errors, []);
});

// ---------- métricas a minuto ----------
test('métricas a minuto de una noche anotada en el editor (comprobadas a mano)', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');`);
  app.ev(`AgendaPuente.guardar(0,${JSON.stringify(NOCHE)})`);
  const m = app.evj('dayMetrics(0)');
  // en cama 23:50–07:00 = 430 min; se duerme a las 00:20; despierto 30 + 10 min; despertar final 06:30
  assert.equal(m.fuente, 'editor');
  assert.equal(m.tib, 430); assert.equal(m.sol, 30); assert.equal(m.waso, 40); assert.equal(m.nWake, 2);
  assert.equal(m.wakeLat, 30); assert.equal(m.tst, 370 - 40); assert.equal(m.twt, 30 + 40 + 30);
  assert.equal(Math.round(m.se * 10) / 10, Math.round(330 / 430 * 1000) / 10);
  assert.equal(app.ev(`fmtClock(${m.bedMin})`), '23:50'); assert.equal(app.ev(`fmtClock(${m.riseMin})`), '07:00');
  assert.equal(app.ev(`fmtClock(${m.sleepStart})`), '00:20'); assert.equal(app.ev(`fmtClock(${m.sleepEnd})`), '06:30');
  assert.equal(app.ev(`fmtClock(${m.midSleep})`), '03:25');          // mitad de 00:20–06:30
  assert.equal(m.nEvents, 2);
  // acostarse antes de las 20:00 (bebé): se mide igual
  app.ev(`AgendaPuente.guardar(1,{...${JSON.stringify(NOCHE)},gd:{b:'19:30',s:15,w:[],f:'06:00',r:'06:15'}})`);
  const b = app.evj('dayMetrics(1)');
  assert.deepEqual([b.tib, b.sol, b.tst, b.wakeLat], [645, 15, 615, 15]);
  // una noche de la rejilla (sin respuestas) sigue midiéndose por medias horas
  app.ev(`for(let i=6;i<22;i++)state[2].slots[i]='s';state[2].downs=[5];state[2].ups=[22];`);
  const g = app.evj('dayMetrics(2)');
  assert.notEqual(g.fuente, 'editor'); assert.equal(g.tib, 510); assert.equal(g.tst, 480);
  assert.deepEqual(app.errors, []);
});

test('análisis de un diario de 21 noches anotadas en el editor: medias, semanas, laborables y festivos (comprobado a mano)', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');`);   // lunes
  // laborables: 23:00 → 07:00, latencia 20, un despertar de 15, final 06:45; festivos (sáb y dom): 00:30 → 09:30, latencia 10, final 09:00
  // regla del MCTQ: la noche cuenta como el día en que te levantas (las del viernes y del sábado son libres)
  app.ev(`for(let d=0;d<21;d++) state[d].lf=[4,5].includes(d%7)?'F':'L';`);
  app.ev(`for(let d=0;d<21;d++){ const fe=state[d].lf==='F';
    AgendaPuente.guardar(d, fe?{gd:{b:'00:30',s:10,w:[],f:'09:00',r:'09:30'},tA:tipoFecha(d),tB:tipoFecha(d+1),ev:[],qs:5,qd:5,qe:5,trat:'',obs:''}
                             :{gd:{b:'23:00',s:20,w:[{t:'03:00',d:15}],f:'06:45',r:'07:00'},tA:tipoFecha(d),tB:tipoFecha(d+1),ev:[{t:'03:00',q:'Ir al baño'}],qs:3,qd:3,qe:3,trat:'',obs:''}); }`);
  const nF = app.ev(`state.filter(d=>d.lf==='F').length`);
  assert.equal(nF, 6);                                               // viernes y sábado de cada semana (MCTQ)
  const A = app.evj('analysisData()');
  assert.equal(A.total.n, 21);
  // laborable: TIB 480, TST (06:45 − 23:20) − 15 = 430; festivo: TIB 540, TST (09:00 − 00:40) = 500
  assert.equal(Math.round(A.lab.tst), 430); assert.equal(Math.round(A.fes.tst), 500);
  assert.equal(Math.round(A.total.tst * 100), Math.round((15 * 430 + 6 * 500) / 21 * 100));
  assert.equal(Math.round(A.total.tib * 100), Math.round((15 * 480 + 6 * 540) / 21 * 100));
  assert.equal(Math.round(A.lab.waso), 15); assert.equal(Math.round(A.fes.waso), 0);
  // punto medio: laborable 03:02,5 (23:20–06:45); festivo 04:50 (00:40–09:00); jet-lag social ≈ 107,5 min
  assert.equal(Math.round(A.lab.mid * 10), Math.round((3 * 60 + 2.5) * 10));
  assert.equal(Math.round(A.fes.mid), 4 * 60 + 50);
  assert.equal(Math.round(Math.abs(A.jetSocial) * 10), 1075);
  // los acontecimientos de la noche se comparan por tipo
  const F = app.evj('factoresResumen(analysisData().all)');
  assert.deepEqual(F.map(f => [f.k, f.n]), [['bano', 15]]);
  assert.equal(A.nGuiadas, 21);
  assert.equal(A.desv.lista.length, 0, 'sin noches fuera de su patrón');
  assert.deepEqual(app.errors, []);
});

// ---------- el editor en la Agenda ----------
test('editor: el profesional abre una noche con ✏️ o tocando la fila, la anota y la guarda; Cancelar no cambia nada', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  const ed = () => app.doc.getElementById('ed');
  assert.equal(ed().hidden, true);
  app.doc.querySelector('#gridBody button.dayedit[data-dayedit="6"]').click();
  assert.equal(ed().hidden, false);
  assert.equal(app.ev('EditorNoche.estado().i'), 6);
  assert.equal(app.ev(`document.getElementById('pasoNoche').hidden`), false);
  // cancelar: no cambia la noche
  const antes = app.ev('JSON.stringify(state[6])');
  app.doc.getElementById('edCancelar').click();
  assert.equal(ed().hidden, true);
  assert.equal(app.ev('JSON.stringify(state[6])'), antes);
  // tocar una hora de la rejilla abre esa noche (ya no pinta)
  const slots = app.ev('JSON.stringify(state[8].slots)');
  app.doc.querySelector('#gridBody tr[data-d="8"] td.hr[data-h="3"]').click();
  assert.equal(app.ev('EditorNoche.estado().i'), 8);
  assert.equal(app.ev('JSON.stringify(state[8].slots)'), slots);
  // un acontecimiento, un tratamiento y guardar
  app.ev(`EditorNoche.estado().ev.push({a:540,q:'Tos'});EditorNoche.estado().trat='Paracetamol';EditorNoche.irPaso('notas');`);
  app.doc.getElementById('edGuardar').click();
  assert.equal(ed().hidden, true);
  assert.deepEqual(app.evj('state[8].ev'), [{ t: '03:00', k: 'tos' }]);
  assert.equal(app.ev('state[8].trat'), 'Paracetamol');
  assert.equal(app.ev('dayMetrics(8).fuente'), 'editor');
  assert.match(app.ev(`document.querySelector('#gridBody .cmtv[data-cmtd="8"]').textContent`), /^Tratamiento: Paracetamol · Acontecimientos: 03:00 tos/);
  // la celda de notas abre el paso 3
  app.doc.querySelector('#gridBody .cmtv[data-cmtd="8"]').click();
  assert.equal(app.ev(`document.getElementById('pasoNotas').hidden`), false);
  assert.equal(app.ev(`document.getElementById('edTrat').value`), 'Paracetamol');
  assert.deepEqual(app.errors, []);
});

test('editor: sin fecha de inicio no se abre y lo pide; sin las tres valoraciones no se guarda', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=null;buildBody();`);
  app.ev('abrirEditorNoche(0)');
  assert.equal(app.doc.getElementById('ed').hidden, true);
  assert.match(app.doc.getElementById('toast').textContent, /fecha de inicio/);
  app.ev(`startDate=new Date('2026-03-02T00:00:00');buildBody();abrirEditorNoche(0);`);
  assert.equal(app.doc.getElementById('ed').hidden, false);
  app.ev("EditorNoche.irPaso('notas')");
  app.doc.getElementById('edGuardar').click();
  assert.equal(app.doc.getElementById('ed').hidden, false, 'sigue abierto');
  assert.equal(app.ev(`document.getElementById('pasoValor').hidden`), false, 'lleva a la valoración');
  assert.match(app.doc.getElementById('edValorEstado').textContent, /Falta valorar/);
  assert.equal(app.ev('_diaTieneDatos(state[0])'), false);
  ['qs', 'qd', 'qe'].forEach(k => app.doc.querySelector(`#edValor .vfila[data-k="${k}"] .vop[data-v="4"]`).click());
  app.doc.getElementById('edGuardar2').click();
  assert.equal(app.doc.getElementById('ed').hidden, true);
  assert.equal(app.ev('_diaTieneDatos(state[0])'), true);
  assert.equal(app.ev('state[0].gd.b').slice(-2) % 15, 0, 'acostarse en pasos de 15 min');
  assert.deepEqual(app.errors, []);
});

test('rejilla de consulta: sin herramientas de pintar, registro guiado, factores, plan ni ventana; con ✏️ para los dos perfiles', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  app.ev(`(()=>{ const k='agendasueno3:caso-tcci', r=JSON.parse(localStorage.getItem(k)); r.ventanas=[{desde:7,a:'00:30',l:'06:30'},{desde:14,a:'00:00',l:'06:30'}]; r.hitos=[{dia:7,txt:'Inicio de TCC-I'},{dia:14,txt:'Se amplía la ventana'}]; localStorage.setItem(k,JSON.stringify(r)); })()`);   // un diario de la v4.9.7 con su plan terapéutico
  await app.ev(`selectPatient('caso-tcci')`);
  const doc = app.doc;
  for (const id of ['toolSleep', 'toolNap', 'toolDown', 'toolUp', 'toolEvent', 'toolErase', 'halfHour', 'lockBtn', 'lockHint', 'planBox', 'patHeaderQR', 'legTw', 'legHito'])
    assert.equal(doc.getElementById(id), null, id);
  assert.equal(doc.querySelectorAll('#gridBody button.dayguide, #gridBody .tgcell, #gridBody .tw, #gridBody .hito').length, 0);
  assert.ok(doc.getElementById('gridBody').classList.contains('locked'));
  assert.equal(doc.querySelectorAll('#gridBody button.dayedit').length, 21);
  assert.match(doc.getElementById('helpOrder').textContent, /editor de la noche/);
  // los datos del plan del diario v4.9.7 se conservan (ficha y CSV), aunque no se muestran ni se analizan
  assert.deepEqual(app.evj('hitosValidos(loadedHitos).map(h=>h.dia)'), [7, 14]);
  assert.equal(app.evj('ventanasValidas(loadedVentanas).length'), 2);
  assert.match(app.ev('buildUnifiedCsv()'), /^ventanas_objetivo;.*00:30.*06:30/m);
  assert.equal(app.evj('periodosDiario().cortes.length'), 0);
  assert.equal(app.ev('adherenciaVentana(analysisData().all)'), null);
  app.ev('renderAnalysis()');
  assert.doesNotMatch(app.doc.querySelector('#analisis .trends').textContent, /ventana de sueño indicada/);
  // ajustes del profesional: ya no hay «Forma de rellenar»
  assert.equal(app.ev('gdPreferido()'), false);
  assert.deepEqual(app.errors, []);
});

// ---------- pantalla del paciente en el móvil ----------
test('paciente (móvil): cabecera sencilla, sin QR, fecha de inicio arriba y Guardar y Enviar juntos', async () => {
  const app = await pacienteMovil();
  const doc = app.doc;
  assert.ok(doc.body.classList.contains('patient-mode'));
  assert.equal(doc.getElementById('patHeaderQR'), null, 'sin QR en la pantalla');
  assert.equal(doc.querySelectorAll('#pacVista').length, 1);
  assert.equal(doc.getElementById('start2').parentElement.id, 'pacIni', 'la fecha de inicio, en la tarjeta de inicio');
  const acc = doc.getElementById('pacAcciones');
  assert.deepEqual([...acc.querySelectorAll('button')].map(b => b.id), ['pacGuardar', 'pacEnviar']);
  // empieza hoy (por defecto): las 21 noches están por llegar
  assert.equal(doc.querySelectorAll('#nochesPac .pn').length, 21);
  assert.ok([...doc.querySelectorAll('#nochesPac .pn')].every(b => b.disabled));
  // sin fecha de inicio, no hay lista de noches
  const s2 = doc.getElementById('start2'); s2.value = ''; s2.dispatchEvent(new app.win.Event('change'));
  assert.ok(doc.getElementById('nochesPac').classList.contains('sin-inicio'));
  assert.equal(doc.querySelectorAll('#nochesPac .pn').length, 0);
  // la rejilla y sus ayudas no se ven en el móvil del paciente (lo oculta la hoja de estilos)
  const css = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(css, /body\.patient-mode[^{]*#helpOrder/);
  assert.match(css, /body\.patient-mode[^{]*\.gridscroll/);
  // enlaces de ayuda, recordatorio y ajustes
  for (const id of ['pacComo', 'pacRecord', 'pacAjustes']) assert.ok(doc.getElementById(id), id);
  assert.deepEqual(app.errors, []);
});

test('paciente (móvil): la lista de las 21 noches por semanas; la de anoche, destacada; las futuras, desactivadas; tocar una la abre', async () => {
  const app = await pacienteMovil();
  const doc = app.doc;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(hoy); inicio.setDate(inicio.getDate() - 3);   // empezó hace 3 días: noches 0, 1 y 2 ya pasaron
  const s2 = doc.getElementById('start2'); s2.value = iso(inicio); s2.dispatchEvent(new app.win.Event('change'));
  await app.sleep(50);
  const pn = [...doc.querySelectorAll('#nochesPac .pn')];
  assert.equal(pn.length, 21);
  assert.deepEqual([...doc.querySelectorAll('#nochesPac .pacv-sem')].map(x => x.textContent), ['Semana 1', 'Semana 2', 'Semana 3']);
  assert.ok(pn[2].classList.contains('pend'), 'la noche de ayer, pendiente');
  assert.equal(pn[2].disabled, false);
  assert.ok(pn.slice(3).every(b => b.disabled), 'las noches que aún no han terminado no se pueden abrir');
  assert.match(pn[0].textContent, /lab\.|fest\./);
  // tocar la de ayer abre el editor en esa noche
  pn[2].click();
  assert.equal(doc.getElementById('ed').hidden, false);
  assert.equal(app.ev('EditorNoche.estado().i'), 2);
  app.ev("EditorNoche.irPaso('valor')");
  ['qs', 'qd', 'qe'].forEach(k => doc.querySelector(`#edValor .vfila[data-k="${k}"] .vop[data-v="5"]`).click());
  app.ev(`EditorNoche.estado().ev.push({a:450,q:'Atender a un niño'});`);
  doc.getElementById('edGuardar2').click();
  assert.equal(doc.getElementById('ed').hidden, true);
  // la noche anotada muestra sus horas, las tres caras y la barra con el acontecimiento
  const b = doc.querySelector('#nochesPac .pn[data-noche="2"]');
  assert.ok(b.classList.contains('anot')); assert.ok(!b.classList.contains('pend'));
  assert.match(b.querySelector('.pn-h').textContent, /^\d\d:\d\d–\d\d:\d\d$/);
  assert.equal(b.querySelectorAll('.pn-d svg').length, 3);
  assert.equal(b.querySelector('.nb-ev').textContent, '👶');
  assert.ok(b.querySelectorAll('.nb-sueno').length >= 1 && b.querySelector('.nb-cama'));
  assert.match(doc.getElementById('toast').textContent, /Noche guardada/);
  await app.sleep(1200);   // guardado automático en el móvil
  assert.equal(app.ev('state[2].ev[0].k'), 'ninos');
  assert.deepEqual(app.errors, []);
});

test('paciente (móvil): lo anotado en el editor sigue ahí al volver a abrir la app, y el profesional lo recibe por el enlace', async () => {
  const app = await pacienteMovil();
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0); const inicio = new Date(hoy); inicio.setDate(inicio.getDate() - 2);
  const s2 = app.doc.getElementById('start2'); s2.value = iso(inicio); s2.dispatchEvent(new app.win.Event('change'));
  app.ev(`AgendaPuente.guardar(1,${JSON.stringify(NOCHE)})`);
  await app.sleep(1500);
  const otra = await loadApp({ userAgent: IPHONE, storage: app.storage() });
  assert.equal(otra.ev('session&&session.role'), 'patient');
  assert.deepEqual(otra.evj('state[1].ev'), [{ t: '03:10', k: 'bano' }, { t: '05:10', k: 'ruido' }]);
  assert.equal(otra.ev('state[1].trat'), NOCHE.trat);
  assert.equal(otra.ev('dayMetrics(1).fuente'), 'editor');
  assert.ok(otra.doc.querySelector('#nochesPac .pn[data-noche="1"]').classList.contains('anot'));
  // el enlace que envía el paciente lleva la noche entera (respuestas, acontecimientos y tratamiento)
  const url = await otra.ev('buildDiaryLink()');
  const h = url.split('#')[1];
  const csv = await otra.ev(`(async()=>{ const h=${JSON.stringify(h)}; return h.startsWith('d=')?_b64ToUtf8(h.slice(2)):await _descomprimir(h.slice(2)); })()`);
  const st = otra.evj(`rawImportText(${JSON.stringify(csv)}).state`);
  assert.deepEqual(st[1].gd, NOCHE.gd); assert.equal(st[1].trat, NOCHE.trat); assert.equal(st[1].ev.length, 2);
  assert.deepEqual(otra.errors, []);
});

test('paciente (móvil): Guardar y Enviar usan las acciones del diario; Recordatorio sigue', async () => {
  const app = await pacienteMovil({ prompt: () => null });
  let enviado = 0, guardado = 0;
  app.ev(`window.__env=0;window.__gua=0;`);
  app.ev(`enviarDiarioPaciente=function(){window.__env++;};`);
  app.doc.getElementById('saveBtn').addEventListener('click', () => { guardado++; });
  app.doc.getElementById('pacGuardar').click();
  app.doc.getElementById('pacEnviar').click();
  enviado = app.ev('window.__env');
  assert.equal(guardado, 1); assert.equal(enviado, 1);
  assert.equal(app.ev(`typeof mostrarRecordatorio`), 'function');
  assert.equal(app.ev(`typeof icsRecordatorio`), 'function');
  assert.deepEqual(app.errors, []);
});

test('paciente: textos de la pantalla en catalán', async () => {
  const app = await pacienteMovil();
  app.ev(`setLang('ca')`);
  assert.equal(app.doc.getElementById('pacGuardar').textContent.trim(), '💾 Desar');
  assert.equal(app.doc.getElementById('pacEnviar').textContent.trim(), '📤 Enviar al meu metge');
  assert.match(app.doc.querySelector('#pacVista .pacv-intro').textContent, /Cada matí/);
  assert.equal(app.ev(`t('pac.semana',{n:2})`), 'Setmana 2');
  app.ev(`setLang('es')`);
  assert.equal(app.doc.getElementById('pacGuardar').textContent.trim(), '💾 Guardar');
  assert.deepEqual(app.errors, []);
});

// ---------- datos: CSV, copia de seguridad e importación ----------
test('CSV: los acontecimientos con su tipo y el tratamiento van y vuelven; un CSV de la v4.9.5 o la v4.9.8 se importa', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`AgendaPuente.guardar(3,${JSON.stringify({ ...NOCHE, trat: 'Zolpidem; «5 mg»', obs: '=1+1 sin dormir' })})`);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /;escala_calidad;etiquetas;guiado;acont_tipos;tratamiento;siestas_anotadas\n/);
  assert.match(csv, /^4;.*;03:10\+bano,05:10\+ruido;"Zolpidem; «5 mg»";$/m);
  const imp = app.evj(`rawImportText(${JSON.stringify(csv)})`);
  assert.deepEqual(imp.state[3].ev, [{ t: '03:10', k: 'bano' }, { t: '05:10', k: 'ruido' }]);
  assert.equal(imp.state[3].trat, 'Zolpidem; «5 mg»');
  assert.equal(imp.state[3].cmt, '=1+1 sin dormir');                    // fórmula neutralizada al exportar y recuperada
  assert.deepEqual(imp.state[3].gd, NOCHE.gd);
  assert.ok(imp.state.filter((d, i) => i !== 3).every(d => d.ev === undefined && d.trat === undefined));
  // formato de la v4.9.8: sin las dos columnas nuevas
  const v498 = csv.replace(/;acont_tipos;tratamiento;siestas_anotadas\n/, '\n').replace(/^(\d+;.*);[^;\n]*;("[^"\n]*"|[^;\n]*);[^;\n]*$/gm, '$1');
  const i8 = app.evj(`rawImportText(${JSON.stringify(v498)})`);
  assert.equal(i8.state[3].ev, undefined); assert.equal(i8.state[3].trat, undefined);
  assert.deepEqual(i8.state[3].gd, NOCHE.gd);
  assert.deepEqual(app.evj(`evDelDia(${JSON.stringify(i8.state[3])})`), [{ t: '03:00', k: 'otro' }, { t: '05:00', k: 'otro' }]);
  // formato de la v4.9.5: sin escala, etiquetas, guiado ni las nuevas
  const v495 = csv.replace(/;escala_calidad;etiquetas;guiado;acont_tipos;tratamiento;siestas_anotadas\n/, '\n')
    .replace(/^(\d+;.*);(5)?;[^;\n]*;[^;\n]*;[^;\n]*;("[^"\n]*"|[^;\n]*);[^;\n]*$/gm, '$1').replace(/^(ventanas_objetivo|hitos);.*\n/gm, '');
  const i5 = app.evj(`rawImportText(${JSON.stringify(v495)})`);
  assert.ok(i5.state.every(d => !d.gd && !d.ev && !d.tags));
  assert.equal(i5.state.filter(d => d.slots.some(Boolean)).length, 21);
  // la noche del editor, importada sin sus respuestas, conserva la rejilla y se mide por medias horas
  app.ev(`state=${JSON.stringify(i5.state)}`);
  assert.notEqual(app.ev('dayMetrics(3).fuente'), 'editor');
  assert.ok(app.ev('dayMetrics(3).tst') > 0);
  assert.deepEqual(app.errors, []);
});

test('copia de seguridad, «Guardar» y enlace con el diario: llevan los acontecimientos con su tipo y el tratamiento', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`AgendaPuente.guardar(3,${JSON.stringify(NOCHE)})`);
  app.doc.getElementById('saveBtn').click();
  await app.sleep(400);
  const rec = JSON.parse(await app.ev(`(async()=>JSON.stringify(await load('caso-normal')))()`));
  assert.deepEqual(rec.state[3].ev, [{ t: '03:10', k: 'bano' }, { t: '05:10', k: 'ruido' }]);
  assert.equal(rec.state[3].trat, NOCHE.trat);
  assert.deepEqual(rec.state[3].gd, NOCHE.gd);
  // enlace con el diario (el que envía el paciente): es el CSV, comprimido o en base64
  const url = await app.ev('buildDiaryLink()');
  const h = url.split('#')[1];
  const csv = await app.ev(`(async()=>{ const h=${JSON.stringify(h)}; return h.startsWith('d=')?_b64ToUtf8(h.slice(2)):await _descomprimir(h.slice(2)); })()`);
  const st = app.evj(`rawImportText(${JSON.stringify(csv)}).state`);
  assert.deepEqual(st[3].ev, rec.state[3].ev);
  assert.equal(st[3].trat, NOCHE.trat);
  assert.deepEqual(app.errors, []);
});

test('CSV: filas del resumen sin las del registro guiado ni la ventana; acontecimientos por tipo', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /^noches_editor;21;/m);
  assert.match(csv, /^acontecimientos_por_tipo;/m);
  assert.doesNotMatch(csv, /^(guiado_|ventana_objetivo_|factores_anotados|noches_modo_guiado)/m);
  assert.deepEqual(app.errors, []);
});

test('cambios por día: los acontecimientos y el tratamiento sellan la noche y viajan en la fusión', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');`);
  const c0 = app.ev('_contenidoDia(state[2])');
  app.ev(`state[2].trat='Melatonina';`);
  assert.notEqual(app.ev('_contenidoDia(state[2])'), c0);
  assert.equal(app.ev('_diaTieneDatos(state[2])'), true);
  app.ev(`state[2].trat='';state[2].ev=[{t:'03:00',k:'tos'}];`);
  assert.notEqual(app.ev('_contenidoDia(state[2])'), c0);
  assert.equal(app.ev('_diaTieneDatos(state[2])'), true);
  assert.deepEqual(app.errors, []);
});

// ---------- informes ----------
test('informes: análisis en pantalla, PDF, Word y Excel con los acontecimientos por tipo y sin ventana ni hitos', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev('state.forEach(d=>{ delete d.gd; delete d.ev; delete d.sie; })');   // como un diario de una versión anterior
  [2, 5, 9].forEach(d => app.ev(`AgendaPuente.guardar(${d},${JSON.stringify(NOCHE)})`));
  app.ev('renderAnalysis()');
  const an = app.doc.getElementById('analisisContent');
  assert.match(an.textContent, /Acontecimientos anotados/);
  assert.match(an.textContent, /🚽 Baño/);
  assert.match(an.textContent, /Acontecimientos reportados/);
  assert.match(an.textContent, /03:10.*🚽 Baño — Cena tarde/s);
  assert.doesNotMatch(an.textContent, /Ventana de sueño objetivo|Hitos del tratamiento|Factores anotados|registro guiado/i);
  const res = app.doc.getElementById('resConsulta').textContent;
  assert.match(res, /Más anotados: 🚽 Baño \(3\) · 🔊 Ruido \(3\)/);
  assert.match(res, /Tratamiento: Melatonina 1 mg a las 23:00 \(3 noches\)/);
  assert.match(res, /18 de una versión anterior/);
  // Word (v4.9.9, noviembre): lo mismo que el PDF del análisis completo, con todos los apartados desplegados
  app.ev(`document.querySelectorAll('#analisisContent details.secblock').forEach(d=>{ secOpenState[d.dataset.sectitle]=true; }); renderAnalysis()`);
  const { html, D } = await wordAnalisis(app);
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  assert.match(txt, /Tratamiento: Melatonina 1 mg a las 23:00 \(3 noches\)/);
  assert.match(txt, /Más anotados: 🚽 Baño \(3\) · 🔊 Ruido \(3\)/);
  assert.match(txt, /Acontecimientos anotados.*🚽 Baño/);
  assert.match(txt, /03:10 .*🚽 Baño — Cena tarde/);
  assert.doesNotMatch(txt, /Ventana de sueño objetivo|Hitos:|Modo guiado/);
  assert.equal(D.secciones.length, 2);
  // Excel
  const hojas = {};
  app.win.XLSX = { utils: { book_new: () => ({}), aoa_to_sheet: a => a, book_append_sheet: (wb, ws, n) => { hojas[n] = ws; } }, writeFile: () => {} };
  app.ev('exportExcel()');
  const ev = hojas['Acontecimientos'];
  assert.deepEqual([...ev[0]], ['Día', 'Fecha', 'Hora', 'Acontecimiento', 'Observaciones de la noche']);
  assert.deepEqual([...ev[1]].slice(2), ['03:10', 'Baño', 'Cena tarde']);
  const dia = hojas['Diario'], h = [...dia[0]];
  const fila = dia[3];
  assert.equal(fila[h.indexOf('Tratamiento')], NOCHE.trat);
  assert.equal(fila[h.indexOf('Observaciones')], 'Cena tarde');
  assert.equal(fila[h.indexOf('Acontecimientos (hora y tipo)')], '03:10 Baño · 05:10 Ruido');
  assert.equal(fila[h.indexOf('Fuente')], 'Editor (a minuto)');
  assert.equal(dia[1][h.indexOf('Fuente')], 'Rejilla (media hora)');
  assert.equal(fila[h.indexOf('TST (min)')], 330);
  assert.deepEqual(app.errors, []);
});

test('impresión: la tabla diaria del PDF lleva el emoji de los acontecimientos y las instrucciones explican el editor', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`AgendaPuente.guardar(2,${JSON.stringify(NOCHE)})`);
  app.ev('renderAnalysis()');
  assert.match(app.doc.getElementById('analisisContent').innerHTML, /title="03:10 Baño, 05:10 Ruido">🚽🔊</);
  const pi = app.doc.getElementById('agendaPrintInstructions').innerHTML;
  assert.match(pi, /toca la noche en tu diario/);
  assert.doesNotMatch(pi, /🧭|pinta las horas|✓<\/b> para terminar/);
  app.ev(`setLang('ca')`);
  assert.match(app.doc.getElementById('agendaPrintInstructions').innerHTML, /toca la nit al teu diari/);
  assert.match(app.ev(`t('print.gridNote')`), /icona: esdeveniment/);
  assert.deepEqual(app.errors, []);
});

// ---------- casos de ejemplo ----------
test('casos de ejemplo: todos se abren en el editor sin errores y guardarlos sin cambios no altera su análisis', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const ids = app.evj('DEMO_CASES.index.map(c=>c.id)');
  assert.equal(ids.length, 17);
  for (const id of ids) {
    await app.ev(`selectPatient('${id}')`);
    const n = app.ev('state.length');
    for (let d = 0; d < n; d++) {
      const r = app.evj(`(()=>{ if(!_diaTieneDatos(state[${d}])) return null; const x=AgendaPuente.noche(${d}); return {ok:!!x.gd&&!gdPintar(x.gd).errores.length}; })()`);
      if (r) assert.ok(r.ok, `${id}, noche ${d + 1}: la rejilla se lee como una noche válida`);
    }
    // abrir y guardar la noche 1 tal cual: la rejilla no cambia
    if (app.ev('_diaTieneDatos(state[0])&&qDiaValorado(state[0])')) {
      const antes = app.ev(`slotsToRanges(state[0].slots,'s')`);
      app.ev('abrirEditorNoche(0)'); app.ev("EditorNoche.irPaso('valor')");
      app.doc.getElementById('edGuardar2').click();
      assert.equal(app.ev(`slotsToRanges(state[0].slots,'s')`), antes, id + ': rejilla');
    }
  }
  assert.deepEqual(app.errors, []);
});

// ---------- 2.ª parte de la v4.9.9: siestas, eje desde las 18:00, catalán y una versión por diario ----------
const valorarYGuardar = (app, v = 4) => { app.ev("EditorNoche.irPaso('valor')");
  ['qs', 'qd', 'qe'].forEach(k => app.doc.querySelector(`#edValor .vfila[data-k="${k}"] .vop[data-v="${v}"]`).click());
  app.doc.getElementById('edGuardar2').click(); };
const sieClick = (app, i, c, d) => app.doc.querySelector(`#edSies .sfila[data-s="${i}"] .bt[data-c="${c}"]${d ? `[data-d="${d}"]` : ''}`).click();

test('siestas (paso 2): se añaden, cambian y quitan; se pintan en su hora (fila anterior) y cuentan con su noche', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');buildBody();`);
  app.ev('abrirEditorNoche(1)');
  assert.deepEqual(app.evj(`[...document.querySelectorAll('#edPasos [data-ir] span')].map(x=>x.textContent)`), ['Noche', 'Siestas', 'Valoración', 'Notas']);
  app.doc.getElementById('edSiguiente').click();                       // «Siguiente» lleva a las siestas
  assert.equal(app.ev(`document.getElementById('pasoSiestas').hidden`), false);
  assert.match(app.doc.getElementById('edSies').textContent, /siesta el martes 3 de marzo, antes de esta noche/);
  assert.match(app.doc.getElementById('edSiesEstado').textContent, /Sin siestas/);
  app.doc.getElementById('sAdd').click();                              // 15:00, 30 min
  sieClick(app, 0, 'd', '1'); sieClick(app, 0, 'd', '1');              // 45 → 60 min
  sieClick(app, 0, 'a', '1');                                          // 15:15
  assert.deepEqual(app.evj('EditorNoche.estado().sie'), [{ a: 915, d: 60 }]);
  assert.match(app.doc.getElementById('edSiesEstado').textContent, /1 siesta · 1 h/);
  app.doc.getElementById('sAdd').click();                              // la segunda, dos horas después de la primera
  assert.deepEqual(app.evj('EditorNoche.estado().sie.map(x=>x.a)'), [915, 1095]);
  sieClick(app, 1, 'x');
  valorarYGuardar(app);
  assert.deepEqual(app.evj('state[1].sie'), [{ t: '15:15', d: 60 }]);
  assert.equal(app.ev(`slotsToRanges(state[0].slots,'n')`), '15:30-16:30');   // en su hora, al final de la fila del día anterior
  assert.equal(app.ev('dayMetrics(1).napMin'), 60);                    // cuenta con su noche
  assert.equal(app.ev('dayMetrics(0).napMin'), 0);                     // y no con la anterior
  // se quita la siesta: se borra también de la rejilla
  app.ev("abrirEditorNoche(1,'siestas')"); sieClick(app, 0, 'x'); valorarYGuardar(app);
  assert.deepEqual(app.evj('state[1].sie'), []);
  assert.equal(app.ev(`slotsToRanges(state[0].slots,'n')`), '');
  // no puede pasar de la hora de acostarse
  app.ev(`AgendaPuente.guardar(2,{gd:{b:'19:00',s:15,w:[],f:'06:00',r:'06:15'},tA:'L',tB:'L',ev:[],qs:3,qd:3,qe:3,trat:'',obs:''})`);
  app.ev("abrirEditorNoche(2,'siestas')"); app.doc.getElementById('sAdd').click();
  app.ev('EditorNoche.estado().sie[0].a=1080;'); sieClick(app, 0, 'd', '1');   // 18:00: no cabe más rato antes de las 19:00
  assert.ok(app.ev('EditorNoche.estado().sie[0].a+EditorNoche.estado().sie[0].d') <= 19 * 60 - 15);
  assert.deepEqual(app.errors, []);
});

test('siestas de diarios anteriores: el editor las lee de la rejilla y, si no se tocan, se quedan como estaban', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`state[3].slots[38]='n';state[3].slots[39]='n';buildBody();`);   // siesta pintada de 15:00 a 16:00 (día 5)
  const n = app.evj('AgendaPuente.noche(4)');
  assert.equal(n.sie, null);
  assert.deepEqual(n.sieRejilla, [{ t: '15:00', d: 60 }]);
  app.ev("abrirEditorNoche(4,'siestas')");
  assert.match(app.doc.getElementById('edSies').textContent, /15:00.*1 h/);
  valorarYGuardar(app);
  assert.equal(app.ev('state[4].sie'), undefined, 'sin tocar: sigue como siesta de la rejilla');
  assert.equal(app.ev(`slotsToRanges(state[3].slots,'n')`), '15:00-16:00');
  assert.equal(app.ev('dayMetrics(3).napMin'), 60);
  assert.deepEqual(app.errors, []);
});

test('siestas: viajan en el CSV (siestas_anotadas) y se ven en la lista del paciente', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`AgendaPuente.guardar(5,{...${JSON.stringify(NOCHE)},sie:[{t:'14:30',d:45},{t:'17:00',d:20}]})`);
  app.ev(`AgendaPuente.guardar(6,{...${JSON.stringify(NOCHE)},sie:[]})`);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /;siestas_anotadas\n/);
  assert.match(csv, /^6;.*;14:30\+45,17:00\+20$/m);
  assert.match(csv, /^7;.*;-$/m);
  const st = app.evj(`rawImportText(${JSON.stringify(csv)}).state`);
  assert.deepEqual(st[5].sie, [{ t: '14:30', d: 45 }, { t: '17:00', d: 20 }]);
  assert.deepEqual(st[6].sie, []);
  assert.equal(st[7].sie, undefined);
  assert.equal(app.ev('dayMetrics(5).napMin'), 65);
  // lista del paciente: «+ siesta 1 h 05»
  app.ev(`session={role:'patient'};pintarNochesPac();`);
  assert.equal(app.doc.querySelector('#nochesPac .pn[data-noche="5"] .pn-s').textContent, '+ siesta 1 h 05');
  assert.deepEqual(app.errors, []);
});

test('eje desde las 18:00: la noche de un bebé que se acuesta a las 19:00 se ve, se cambia y se guarda bien', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');buildBody();`);
  app.ev(`AgendaPuente.guardar(1,{gd:{b:'19:00',s:15,w:[{t:'01:00',d:30}],f:'06:00',r:'06:15'},tA:'L',tB:'L',ev:[{t:'01:00',q:'Dar el pecho o el biberón'}],qs:4,qd:4,qe:4,trat:'',obs:''})`);
  assert.equal(app.ev('dayMetrics(1).tib'), 675); assert.equal(app.ev('dayMetrics(1).tst'), 615);
  app.ev('abrirEditorNoche(1)');
  const E = app.evj('EditorNoche.estado()');
  assert.equal(E.m.B, 60); assert.equal(E.m.S, 75); assert.equal(E.m.R, 735);   // minutos desde las 18:00
  assert.equal(E.v0, 30, 'el horario visible empieza media hora antes de acostarse (18:30), no a las 20:00');
  assert.equal(app.ev(`document.querySelectorAll('#edBanda .db').length`), 2);   // el día de la tarde y el de la mañana
  assert.deepEqual(E.ev.map(x => x.a), [420]);
  // guardar sin tocar no cambia nada
  valorarYGuardar(app);
  assert.equal(app.ev('state[1].gd.b'), '19:00');
  // adelantarla a las 18:30
  app.ev('abrirEditorNoche(1)'); app.doc.getElementById('edMenos').click(); app.doc.getElementById('edMenos').click();
  assert.equal(app.ev('EditorNoche.estado().m.B'), 30);
  valorarYGuardar(app);
  assert.equal(app.ev('state[1].gd.b'), '18:30');
  assert.equal(app.ev('dayMetrics(1).tib'), 705);
  assert.equal(app.ev(`fmtClock(dayMetrics(1).bedMin)`), '18:30');
  // y no antes de las 18:00
  app.ev('abrirEditorNoche(1)'); for (let i = 0; i < 6; i++) app.doc.getElementById('edMenos').click();
  assert.equal(app.ev('EditorNoche.estado().m.B'), 0);
  app.ev('EditorNoche.cerrar(false)');
  // una noche normal se abre encuadrada (v4.9.9, noviembre): de media hora antes de acostarse (23:50 → 23:00) a media hora después de levantarse (07:30)
  app.ev(`AgendaPuente.guardar(2,${JSON.stringify(NOCHE)})`); app.ev('abrirEditorNoche(2)');
  assert.deepEqual(app.evj('[EditorNoche.estado().v0,EditorNoche.estado().v1]'), [300, 810]);
  app.doc.getElementById('z2008').click();   // «20–08» vuelve al horario habitual
  assert.deepEqual(app.evj('[EditorNoche.estado().v0,EditorNoche.estado().v1]'), [120, 840]);
  assert.deepEqual(app.errors, []);
});

test('catalán: el editor entero en catalán (pasos, días, valoración, siestas, acontecimientos y botones)', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-04-06T00:00:00');buildBody();setLang('ca');`);
  app.ev('abrirEditorNoche(0)');
  const txt = id => app.ev(`document.getElementById('${id}').textContent`);
  assert.deepEqual(app.evj(`[...document.querySelectorAll('#edPasos [data-ir] span')].map(x=>x.textContent)`), ['Nit', 'Migdiades', 'Valoració', 'Notes']);
  assert.equal(txt('edTitulo'), 'Nit del dilluns 6 al dimarts 7 d’abril');
  assert.match(txt('edDiaA'), /dl\. 6 abr\./); assert.match(txt('edDiaA'), /Laborable/);
  assert.match(txt('edTrans'), /Entrelaborables/);
  assert.equal(txt('edCancelar'), 'Cancel·lar'); assert.equal(txt('edSiguiente'), 'Següent ▸');
  assert.match(app.ev(`document.getElementById('edCats').textContent`), /Anar al llit.*Latència.*Despertars.*Llevar-se/);
  assert.match(txt('lecQ'), /Anar al llit · cap a les/);
  app.ev("EditorNoche.irPaso('siestas')");
  assert.match(txt('edSies'), /Vas fer alguna migdiada el dilluns 6 d’abril/);
  assert.match(txt('edSiesEstado'), /Sense migdiades/);
  app.ev("EditorNoche.irPaso('valor')");
  assert.match(txt('edValor'), /Qualitat del son.*Com de descansat\/da et vas llevar\?.*Molt malament/);
  app.ev("EditorNoche.irPaso('noche')"); app.doc.querySelector('#edCats [data-cat="X"]').click(); app.doc.getElementById('eAdd').click();
  assert.equal(txt('edEvT'), 'Què va passar?');
  assert.deepEqual(app.evj(`[...document.querySelectorAll('#edEvGrid .evop span:last-child')].map(x=>x.textContent)`),
    ['Lavabo', 'Dolor', 'Soroll', 'Calor/fred', 'Preocupació', 'Tos', 'Nen', 'Presa', 'Altre']);
  app.doc.querySelector('#edEvGrid .evop[data-tipo="0"]').click();
  app.ev("EditorNoche.irPaso('notas')");
  assert.equal(txt('edGuardar'), 'Desar');
  assert.equal(app.ev(`document.getElementById('edTrat').placeholder`), 'Medicació de la nit o del dia: nom i, més o menys, quan');
  assert.match(txt('edEvLista'), /Esdeveniments.*Lavabo · cap a les/);
  // las notas de la fila, en el idioma de la pantalla; los informes del profesional, en castellano
  valorarYGuardar(app);
  assert.match(app.ev('notasNoche(state[0])'), /^Esdeveniments: \d\d:\d\d lavabo$/);
  assert.equal(app.ev(`evInfo('bano').nom`), 'Baño');
  // y otra vez en castellano
  app.ev(`setLang('es')`); app.ev('abrirEditorNoche(0)');
  assert.equal(txt('edTitulo'), 'Noche del lunes 6 al martes 7 de abril');
  assert.equal(txt('edCancelar'), 'Cancelar');
  assert.deepEqual(app.errors, []);
});

test('una sola versión por diario: la v4.9.9 guarda su versión y una versión anterior no sobrescribe ese diario', { skip: !require('fs').existsSync(require('path').join(__dirname, '..', 'v4.9.5', 'index.html')) }, async () => {
  const path = require('path');
  const app = await loadApp();
  await loginDoctor(app);
  const st0 = app.storage();
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`AgendaPuente.guardar(3,${JSON.stringify(NOCHE)})`);
  app.doc.getElementById('saveBtn').click(); await app.sleep(400);
  const rec = () => JSON.parse(app.storage()['agendasueno3:caso-normal']);
  assert.equal(rec().ver, '4.9.9');
  for (const v of ['v4.9.5', 'v4.9.6', 'v4.9.7']) {
    const vieja = await loadApp({ file: path.join(__dirname, '..', v, 'index.html'), storage: app.storage() });
    // al cargar sus casos de ejemplo (que ahora son de la v4.9.9) no los sobrescribe ni avisa
    const limpia = await loadApp({ file: path.join(__dirname, '..', v, 'index.html'), storage: st0 });
    await loginDoctor(limpia);
    assert.equal(limpia.ev('window._sembrandoDemo'), false);
    assert.equal(JSON.parse(limpia.storage()['agendasueno3:caso-tcci']).ver, '4.9.9', v + ': casos de la v4.9.9 intactos');
    assert.ok(JSON.parse(limpia.storage()['agendasueno3:caso-tcci']).state.some(d => Array.isArray(d.ev) && d.ev.length), v + ': con sus acontecimientos');
    // el aviso es del diario abierto: se quita al abrir uno que no es de una versión posterior
    limpia.ev(`(()=>{ const r=JSON.parse(localStorage.getItem('agendasueno3:caso-menopausia')); delete r.ver; localStorage.setItem('agendasueno3:caso-menopausia',JSON.stringify(r)); })()`);
    await limpia.ev(`selectPatient('caso-tcci')`);
    assert.ok(limpia.doc.getElementById('avisoVersion'), v + ': aviso en un diario de la v4.9.9');
    await limpia.ev(`selectPatient('caso-menopausia')`);
    assert.equal(limpia.doc.getElementById('avisoVersion'), null, v + ': sin aviso en un diario sin versión');
    await loginDoctor(vieja);
    await vieja.ev(`selectPatient('caso-normal')`);
    assert.ok(vieja.doc.getElementById('avisoVersion'), v + ': aviso');
    assert.match(vieja.doc.getElementById('avisoVersion').textContent, /versión 4\.9\.9/);
    vieja.ev(`state[10].cmt='editado en ${v}';`); vieja.doc.getElementById('saveBtn').click(); await vieja.sleep(400);
    const r = JSON.parse(vieja.storage()['agendasueno3:caso-normal']);
    assert.equal(r.ver, '4.9.9', v + ': no lo sobrescribe');
    assert.deepEqual(r.state[3].ev, [{ t: '03:10', k: 'bano' }, { t: '05:10', k: 'ruido' }]);
    assert.notEqual(r.state[10].cmt, `editado en ${v}`);
    // los diarios que no son de la v4.9.9 se siguen guardando
    await vieja.ev(`selectPatient('caso-pseudoinsomnio')`);
    assert.equal(JSON.parse(vieja.storage()['agendasueno3:caso-pseudoinsomnio'] || '{}').ver === '4.9.9', true);
  }
  // la v4.9.9 tampoco sobrescribe un diario de una versión posterior
  app.ev(`localStorage.setItem('agendasueno3:caso-normal',JSON.stringify({...JSON.parse(localStorage.getItem('agendasueno3:caso-normal')),ver:'5.0.0'}))`);
  await app.ev(`selectPatient('caso-normal')`);
  app.doc.getElementById('saveBtn').click(); await app.sleep(400);
  assert.equal(rec().ver, '5.0.0');
  assert.ok(app.doc.getElementById('avisoVersion'));
});

test('márgenes: Análisis y Pacientes van en la columna centrada; «Exportar e importar», dentro de la Agenda', async () => {
  const app = await loadApp();
  const d = app.doc;
  for (const id of ['agenda', 'analisis', 'pacientes']) assert.equal(d.getElementById(id).parentElement.className, 'wrap', id);
  assert.equal(d.getElementById('ioModule').parentElement.id, 'agenda');
  // en pantallas anchas, la cabecera y las pestañas se alinean con la columna (solo en pantalla, no al imprimir)
  const css = [...d.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(css, /@media screen and \(min-width:1313px\)\{\s*header\.app,nav\.tabs\{padding-left:calc\(\(100% - 1280px\) \/ 2 \+ 16px\)/);
  assert.deepEqual(app.errors, []);
});

// ---------- cambios de noviembre de 2026 (misma v4.9.9) ----------
async function primerAcceso(app) {
  for (let i = 0; i < 40; i++) {
    const dev = app.doc.getElementById('devPriv'); if (dev) { dev.click(); await app.sleep(50); }
    const chk = app.doc.getElementById('consentChk');
    if (chk) { chk.checked = true; chk.dispatchEvent(new app.win.Event('change')); app.doc.getElementById('consentYes').click(); await app.sleep(600); return true; }
    await app.sleep(60);
  }
  return false;
}
const ACC = ['ABCD2345', '2099-01-01T00:00:00.000Z', 'pac-instala', 'Paciente Instala', 'F', '1985-05-05', '2026-10-01'].map(encodeURIComponent).join('~');
const BASE = 'https://rcilveti.github.io/Agenda-Sueno-AdSalutem/';

test('A · añadir a la pantalla de inicio desde el enlace: la app recibe lo anotado en el navegador y una copia antigua no lo pisa', async () => {
  const blobs = [];
  const nav = await loadApp({ userAgent: IPHONE, url: BASE + '#acc=' + ACC, beforeParse(w) { w.URL.createObjectURL = b => { blobs.push(b); return 'blob:m' + blobs.length; }; } });
  assert.ok(await primerAcceso(nav));
  assert.equal(nav.ev('session.patientId'), 'pac-instala');
  nav.ev(`AgendaPuente.guardar(0,${JSON.stringify(NOCHE)})`); nav.ev(`AgendaPuente.guardar(1,${JSON.stringify(NOCHE)})`);
  await nav.sleep(1600);
  const url = nav.win.location.href;
  assert.match(url, /#acc=[^&]+&sn=[A-Za-z0-9_-]+$/, 'la dirección lleva el acceso y la copia del diario');
  // el manifiesto (lo que usa Android al instalar) lleva la misma dirección
  // (se lee con FileReader: Blob.text() no existe en jsdom 24, el de las pruebas en GitHub)
  const leer = blob => new Promise((ok, mal) => { const fr = new nav.win.FileReader(); fr.onload = () => ok(fr.result); fr.onerror = mal; fr.readAsText(blob); });
  const man = JSON.parse(await leer(blobs[blobs.length - 1]));
  assert.equal(man.start_url, url);
  // la app instalada (otro almacenamiento, como en iOS) abre esa dirección: entra sola y recupera las dos noches
  const app = await loadApp({ userAgent: IPHONE, standalone: true, url });
  assert.ok(await primerAcceso(app));
  await app.sleep(1200);
  assert.equal(app.ev('session.patientId'), 'pac-instala');
  assert.equal(app.ev('_diasConDatos(state)'), 2);
  assert.deepEqual(app.evj('state[1].gd'), nav.evj('state[1].gd'));
  assert.equal(app.ev('startDate&&getStartInput().value'), '2026-10-01');
  assert.equal(app.win.location.hash, '', 'en la app, la dirección se limpia');
  assert.ok(app.dialogs.every(d => d[0] !== 'confirm'), 'sin preguntas');
  // en la app se anota otra noche; al volver a abrir el icono (con la copia antigua) no se pierde nada
  app.ev(`AgendaPuente.guardar(2,${JSON.stringify(Object.assign({}, NOCHE, { qs: 2 }))})`);
  await app.sleep(1200);
  const otra = await loadApp({ userAgent: IPHONE, standalone: true, url, storage: app.storage() });
  await otra.sleep(1200);
  assert.equal(otra.ev('session&&session.patientId'), 'pac-instala');
  assert.equal(otra.ev('_diasConDatos(state)'), 3);
  assert.equal(otra.ev('state[2].qs'), 2);
  // una copia de otro paciente no se mezcla
  assert.equal(await otra.ev(`(async()=>{ const z=await _comprimir(buildUnifiedCsv().replace(/\\nid;pac-instala/,'\\nid;otro-paciente')); return _aplicarInstantanea(z); })()`), false);
  assert.deepEqual(nav.errors.concat(app.errors, otra.errors), []);
});

test('A · en el ordenador y en la app instalada la dirección no lleva el diario', async () => {
  const pc = await loadApp({ url: BASE + '#acc=' + ACC });
  assert.ok(await primerAcceso(pc));
  pc.ev(`AgendaPuente.guardar(0,${JSON.stringify(NOCHE)})`); await pc.sleep(1300);
  assert.doesNotMatch(pc.win.location.href, /sn=/);
  const app = await loadApp({ userAgent: IPHONE, standalone: true, url: BASE + '#acc=' + ACC });
  assert.ok(await primerAcceso(app));
  app.ev(`AgendaPuente.guardar(0,${JSON.stringify(NOCHE)})`); await app.sleep(1300);
  assert.doesNotMatch(app.win.location.href, /sn=/);
});

test('B · PDF del análisis: código del paciente en la cabecera y un solo logo', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  app.ev('renderAnalysis()');
  let ph = app.doc.querySelector('#analisisContent .print-head');
  assert.equal(ph.querySelector('img'), null, 'sin el segundo logo');
  assert.match(ph.textContent, /Paciente: Caso · Mujer 57a \(insomnio en TCC-I\) · Código: sin asignar/);
  const pin = await app.ev(`(async()=>{ const c=await crearCredencialPaciente('caso-tcci','TCC-I'); return c.pin||c.code||c; })()`);
  app.ev('renderAnalysis()');
  ph = app.doc.querySelector('#analisisContent .print-head');
  assert.match(ph.textContent, new RegExp('Código: ' + app.ev(`_fmtCodigo(${JSON.stringify(String(pin))})`)));
  // la cabecera de la aplicación (con el logo) sigue saliendo en el PDF
  assert.ok(app.doc.querySelector('#brandHeader img'));
});

test('C · editor: se abre ajustado, escala con el color del día, «Despertar final», tos 😷 y el estado del día previo', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  const n = Object.assign({}, NOCHE, { gd: { b: '23:15', s: 20, w: [], f: '06:45', r: '07:00' }, ev: [], tA: 'L', tB: 'F' });
  app.ev(`AgendaPuente.guardar(4,${JSON.stringify(n)})`);
  app.ev('abrirEditorNoche(4)');
  const E = app.evj('EditorNoche.estado()');
  assert.deepEqual([E.v0, E.v1], [270, 810], 'de 22:30 a 07:30: la noche encuadrada');
  const fondo = app.doc.getElementById('edHoras').getAttribute('style');
  assert.match(fondo, /var\(--labor\)/); assert.match(fondo, /var\(--festiu\)/);
  assert.match(app.doc.getElementById('edCats').textContent, /Despertar final/);
  assert.doesNotMatch(app.doc.getElementById('edCats').textContent, /Final en cama/);
  // los botones de acostarse, latencia, despertar final y levantarse llevan el icono de su tirador
  assert.deepEqual(app.evj(`['B','S','F','R','W','X'].map(k=>{ const i=document.querySelector('#edCats [data-cat="'+k+'"] i.ic'); return i?i.textContent:null; })`), ['↓', 'z', '☀', '↑', null, null]);
  // los despertares, del color del fondo de la escala (sin sueño), no del ámbar de los festivos
  const cssEd = [...app.doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(cssEd, /#ed \.hueco\{[^}]*background:var\(--labor\);border:2px solid var\(--wake\)/);
  assert.match(cssEd, /--wake:#2f7a4d;/, 'borde de los despertares en verde oscuro, no en naranja');
  assert.match(app.doc.querySelector('#edCats [data-cat="W"] i').getAttribute('style'), /#2f7a4d/);
  app.ev(`document.querySelector('#edCats [data-cat="F"]').click()`);
  assert.match(app.doc.getElementById('lecQ').textContent, /Despertar final · hacia las/);
  assert.equal(app.doc.getElementById('lecH').textContent, '06:45');
  assert.match(app.doc.getElementById('lecE').textContent, /15 min en la cama antes de levantarte/);
  assert.equal(app.ev(`EditorNoche.EV['Tos'].e`), '😷');
  assert.equal(app.ev(`EditorNoche.icoEv('Tos')`).includes('😷'), true);
  app.ev(`EditorNoche.irPaso('valor')`);
  const dA = app.ev(`(()=>{ const d=dateFor(4); return ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][d.getDay()]+' '+d.getDate(); })()`);
  const qe = app.doc.querySelector('#edValor .vfila[data-k="qe"]').textContent;
  assert.ok(qe.includes('Estado durante el día · ' + dA), qe);
  assert.match(qe, new RegExp('¿Cómo te encontraste el ' + dA + ' de \\S+, durante el día\\?'));
  // en catalán
  app.ev(`EditorNoche.cerrar(false); setLang('ca'); abrirEditorNoche(4); EditorNoche.irPaso('valor')`);
  assert.match(app.doc.querySelector('#edValor .vfila[data-k="qe"]').textContent, /Estat durant el dia · \S+ \d+/);
  app.ev(`EditorNoche.irPaso('noche')`);
  assert.match(app.doc.getElementById('edCats').textContent, /Despertar final/);
  app.ev(`EditorNoche.cerrar(false); setLang('es')`);
  assert.deepEqual(app.errors, []);
});

test('C · siestas: el bloque se arrastra hacia su hora y su borde derecho cambia la duración', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev('abrirEditorNoche(3); EditorNoche.irPaso("siestas")');
  app.ev(`document.getElementById('sAdd').click()`);
  // la barra va de 06:00 a 22:00: con 960 px, 1 px = 1 min
  app.ev(`Element.prototype.getBoundingClientRect=function(){ return this.classList&&this.classList.contains('sbar')?{left:0,top:0,width:960,height:46,right:960,bottom:46}:{left:0,top:0,width:0,height:0,right:0,bottom:0}; }`);
  const ptr = (tipo, el, x) => app.ev(`(()=>{ const e=new MouseEvent(${JSON.stringify(tipo)},{bubbles:true,cancelable:true,clientX:${x}}); Object.defineProperty(e,'pointerId',{value:1}); (${el}).dispatchEvent(e); })()`);
  const s0 = app.evj('EditorNoche.estado().sie[0]');
  assert.equal(s0.d, 30);
  ptr('pointerdown', `document.querySelector('#edSies .sb-s[data-s="0"]')`, 100);
  ptr('pointermove', `document.getElementById('edSies')`, 147);   // +47 min → +45 (de 15 en 15)
  assert.equal(app.ev(`document.querySelector('#edSies .sb-guia').textContent`), app.ev(`(${s0.a}+45)`) >= 0 ? String(Math.floor((s0.a + 45) / 60)).padStart(2, '0') + ':' + String((s0.a + 45) % 60).padStart(2, '0') : '');
  ptr('pointerup', `document.getElementById('edSies')`, 147);
  let s1 = app.evj('EditorNoche.estado().sie[0]');
  assert.deepEqual([s1.a, s1.d], [s0.a + 45, 30]);
  ptr('pointerdown', `document.querySelector('#edSies .sb-s[data-s="0"] .sb-fin')`, 300);
  ptr('pointermove', `document.getElementById('edSies')`, 328);   // 30 + 28 → 60 (escalón más próximo)
  ptr('pointerup', `document.getElementById('edSies')`, 328);
  s1 = app.evj('EditorNoche.estado().sie[0]');
  assert.deepEqual([s1.a, s1.d], [s0.a + 45, 60]);
  assert.match(app.doc.querySelector('#edSies .slista').textContent, /1 h/);
  // no se sale de su sitio: arrastrarla muy pronto la deja a las 06:00
  ptr('pointerdown', `document.querySelector('#edSies .sb-s[data-s="0"]')`, 500);
  ptr('pointermove', `document.getElementById('edSies')`, -900);
  ptr('pointerup', `document.getElementById('edSies')`, -900);
  assert.equal(app.ev('EditorNoche.estado().sie[0].a'), 360);
  assert.deepEqual(app.errors, []);
});

test('C · pantalla del paciente: «Cómo se anota», «Recordatorio» y «Ajustes» en una sola fila', async () => {
  const app = await loadApp();
  const css = [...app.doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(css, /\.pacv-links\{display:flex;gap:6px;flex-wrap:nowrap\}/);
  assert.equal(app.doc.querySelectorAll('.pacv-links button').length, 3);
});

// ---------- más cambios de noviembre (misma v4.9.9) ----------
test('D · despertar final → levantarse: saltos de 5, 10, 15, 20 y 30 minutos y luego de 30 en 30', async () => {
  const app = await loadApp();
  const esperado = [0, 5, 10, 15, 20]; for (let v = 30; v <= 720; v += 30) esperado.push(v);
  assert.deepEqual(app.evj('EditorNoche.ESC_F'), esperado);
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');buildBody();`);
  app.ev(`AgendaPuente.guardar(1,{gd:{b:'23:00',s:15,w:[],f:'06:45',r:'07:00'},tA:'L',tB:'L',ev:[],qs:4,qd:4,qe:4,trat:'',obs:''})`);
  app.ev('abrirEditorNoche(1)'); app.ev(`document.querySelector('#edCats [data-cat="F"]').click()`);
  const tfa = () => app.ev('EditorNoche.estado().m.R-EditorNoche.estado().m.F');
  assert.equal(tfa(), 15);
  const vistos = [];
  for (let i = 0; i < 6; i++) { app.doc.getElementById('edMas').click(); vistos.push(tfa()); }
  assert.deepEqual(vistos, [20, 30, 60, 90, 120, 150], 'después de 30 min, de 30 en 30 (sin 45)');
  for (let i = 0; i < 9; i++) app.doc.getElementById('edMenos').click();
  assert.equal(tfa(), 0);
  // la latencia sigue con sus escalones (45 incluido)
  app.ev(`document.querySelector('#edCats [data-cat="S"]').click()`);
  const lat = () => app.ev('EditorNoche.estado().m.S-EditorNoche.estado().m.B'), l = [];
  for (let i = 0; i < 5; i++) { app.doc.getElementById('edMas').click(); l.push(lat()); }
  assert.deepEqual(l, [20, 25, 30, 45, 60]);
  app.ev('EditorNoche.cerrar(false)');
  // una noche anterior con 40 o 50 minutos se propone con el escalón más próximo; sin tocarla, se guarda como estaba
  app.ev(`AgendaPuente.guardar(2,{gd:{b:'23:00',s:15,w:[],f:'06:10',r:'07:00'},tA:'L',tB:'L',ev:[],qs:4,qd:4,qe:4,trat:'',obs:''})`);
  app.ev('abrirEditorNoche(2)'); assert.equal(tfa(), 60);
  valorarYGuardar(app);
  assert.equal(app.ev('state[2].gd.f'), '06:10');
  assert.deepEqual(app.errors, []);
});

test('D · cabecera del editor: si no cabe, se compacta por niveles y el texto de la noche no pisa los pasos', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  // jsdom no maqueta: se simula una fila de días que solo cabe a partir del nivel 4 (más juntos)
  app.ev(`(()=>{ const P=HTMLElement.prototype, cab=()=>document.querySelector('#ed .ed-cab');
    Object.defineProperty(P,'offsetWidth',{configurable:true,get(){ return 10; }});
    Object.defineProperty(P,'clientWidth',{configurable:true,get(){ return this.id==='edDias'?400:100; }});
    Object.defineProperty(P,'scrollWidth',{configurable:true,get(){ return this.id==='edDias'?(cab().classList.contains('k4')?390:520):100; }}); })()`);
  app.ev('abrirEditorNoche(3)');
  assert.equal(app.ev(`document.querySelector('#ed .ed-cab').className`), 'ed-cab k1 k2 k3 k4');
  // con sitio de sobra, sin niveles
  app.ev(`Object.defineProperty(HTMLElement.prototype,'scrollWidth',{configurable:true,get(){ return 100; }})`);
  app.ev(`EditorNoche.irPaso('siestas')`);
  assert.equal(app.ev(`document.querySelector('#ed .ed-cab').className`), 'ed-cab');
  const css = [...app.doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(css, /#ed \.ed-cab\.k1 \.dchip \.cam\{display:none\}/);
  assert.match(css, /#ed \.ed-cab\.k3 \.pasos button span\{display:none\}/);
  assert.match(css, /#ed \.ed-cab\.k5 \.dtrans\{display:none\}/);
  assert.match(css, /#ed \.ed-cab\.k7\{flex-wrap:wrap/);
  // el texto de la noche sigue en la ayuda de los días aunque se oculte
  assert.match(app.doc.getElementById('edDias').getAttribute('title'), /laborable|festivo/i);
  app.ev('EditorNoche.cerrar(false)');
  assert.deepEqual(app.errors, []);
});

test('D · notas con el móvil en vertical (caja girada): al escribir, la caja se pone derecha como el teclado y luego vuelve', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`Object.defineProperty(window,'innerWidth',{configurable:true,value:390}); Object.defineProperty(window,'innerHeight',{configurable:true,value:664});`);
  app.ev('abrirEditorNoche(3)'); await app.sleep(100);   // (al abrir, el foco va al tirador seleccionado)
  const caja = () => app.doc.getElementById('edCaja');
  assert.ok(caja().classList.contains('girada'));
  app.ev(`EditorNoche.irPaso('notas')`);
  assert.match(app.doc.getElementById('edGiroNota').textContent, /teclado sale en vertical/);
  const css = [...app.doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(css, /#ed \.ed-caja\.vertical \.giro-nota\{display:block\}/);
  app.doc.getElementById('edTrat').focus();
  assert.ok(!caja().classList.contains('girada') && caja().classList.contains('escribe'), 'mientras escribe, derecha');
  assert.equal(caja().style.transform, '');
  // pasar al otro campo no la gira
  app.doc.getElementById('edObs').focus(); await app.sleep(450);
  assert.ok(caja().classList.contains('escribe'));
  // al dejar de escribir, vuelve a girarse (con una pequeña espera)
  app.doc.getElementById('edObs').blur();
  assert.ok(caja().classList.contains('escribe'), 'no se mueve bajo el dedo al instante');
  await app.sleep(450);
  assert.ok(caja().classList.contains('girada') && !caja().classList.contains('escribe'));
  // escribir y guardar: se guarda y se cierra; al volver a abrir, girada otra vez
  app.doc.getElementById('edTrat').focus();
  app.ev(`EditorNoche.estado().trat='Melatonina 1 mg'; EditorNoche.estado().q={qs:4,qd:4,qe:4};`);
  app.doc.getElementById('edGuardar').click();
  assert.equal(app.doc.getElementById('ed').hidden, true);
  assert.equal(app.ev('state[3].trat'), 'Melatonina 1 mg');
  app.ev('abrirEditorNoche(3)');
  assert.ok(caja().classList.contains('girada'));
  // en horizontal no se gira nunca, tampoco al escribir
  app.ev(`EditorNoche.cerrar(false); Object.defineProperty(window,'innerWidth',{configurable:true,value:844}); Object.defineProperty(window,'innerHeight',{configurable:true,value:390}); abrirEditorNoche(3); EditorNoche.irPaso('notas')`); await app.sleep(100);
  app.doc.getElementById('edTrat').focus();
  assert.ok(!caja().classList.contains('girada') && !caja().classList.contains('escribe') && !caja().classList.contains('vertical'));
  // en catalán
  app.ev(`EditorNoche.cerrar(false); setLang('ca'); abrirEditorNoche(3); EditorNoche.irPaso('notas')`);
  assert.match(app.doc.getElementById('edGiroNota').textContent, /teclat surt en vertical/);
  app.ev(`EditorNoche.cerrar(false); setLang('es')`);
  assert.deepEqual(app.errors, []);
});

test('D · paciente (móvil): el fondo de cada noche lleva el color de sus dos días, también sin anotar', async () => {
  const app = await pacienteMovil();
  const doc = app.doc;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(hoy); inicio.setDate(inicio.getDate() - 3);
  const s2 = doc.getElementById('start2'); s2.value = iso(inicio); s2.dispatchEvent(new app.win.Event('change'));
  await app.sleep(50);
  app.ev(`state[1].lf='F'; AgendaPuente.guardar(1,${JSON.stringify(Object.assign({}, NOCHE, { tA: 'L', tB: 'F' }))})`);
  await app.sleep(50);
  const pn = [...doc.querySelectorAll('#nochesPac .pn')];
  const fondo = i => pn[i].querySelector('.nbar').getAttribute('style');
  // la barra va de 18:00 a 14:00: la medianoche, al 30 %
  assert.equal(fondo(1), 'background:linear-gradient(to right,#e3ecf4 0 30%,#fdeccf 30% 100%)');
  assert.equal(fondo(2), 'background:linear-gradient(to right,#fdeccf 0 30%,#e3ecf4 30% 100%)', 'sin anotar: la tarde, festivo; la mañana, laborable');
  assert.ok(pn[2].querySelector('.nbar.vacia .pn-vacia'));
  assert.equal(fondo(5), 'background:linear-gradient(to right,#e3ecf4 0 30%,#e3ecf4 30% 100%)');
  assert.deepEqual([...pn[1].querySelectorAll('.pn-t i')].map(x => x.className + ':' + x.textContent), ['L:lab.', 'F:fest.']);
  const css = [...doc.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert.match(css, /\.pn-t i\.F\{background:#fdeccf/);
  assert.deepEqual(app.errors, []);
});

test('E · análisis: los anillos de la calidad percibida, de 0 a 10 (media y mediana) y la leyenda sin numerar; la valoración sigue en 1–5', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`renderAnalysis()`);
  const sec = app.doc.querySelector('#analisisContent details[data-sectitle="Calidad percibida"]');
  assert.ok(sec, 'sección Calidad percibida');
  const svgs = [...sec.querySelectorAll('svg')].filter(s => s.querySelectorAll('circle').length);
  assert.equal(svgs.length, 3);
  ['qs', 'qd', 'qe'].forEach((k, i) => {
    const R = app.evj(`qResumen('${k}')`);
    const t = [...svgs[i].querySelectorAll('text')].map(x => x.textContent);
    const diez = String(Math.round((R.avg - 1) / (R.esc - 1) * 100) / 10).replace('.', ',');
    assert.deepEqual(t, [diez, 'de 10'], k);
    assert.equal(R.esc, 5);
    assert.ok(+diez.replace(',', '.') >= 0 && +diez.replace(',', '.') <= 10);
  });
  assert.match(sec.textContent, /La media \(en el centro de cada anillo\) y la mediana se expresan de 0 a 10/);
  // una sola escala en los anillos: la mediana también de 0 a 10 y la leyenda sin numerar
  ['qs', 'qd', 'qe'].forEach((k, i) => {
    const R = app.evj(`qResumen('${k}')`);
    const med = String(Math.round((R.med - 1) / (R.esc - 1) * 100) / 10).replace('.', ',');
    const bloque = svgs[i].parentElement.textContent;
    assert.ok(bloque.includes('Mediana: ' + med + ' de 10'), bloque);
    assert.doesNotMatch(bloque, /de 5\b|\(1–2\)|\b[1-5] (Muy|Mala|Mal|Regular|Buena|Bien|Nada|Poco|Algo)\b/);
  });
  assert.match(sec.textContent, /● Muy buena \d+ \(\d+%\)/, 'cada categoría, con su nombre, sin número');
  assert.match(sec.textContent, /días malos \(muy mala o mala\)/);
  assert.equal(sec.querySelector('svg circle title').textContent.match(/^\d/), null);
  assert.deepEqual(app.errors, []);
});

test('F · casos de ejemplo al día: ninguna noche fuera de los saltos del despertar final y se vuelven a cargar sobre los de la marca 16', async () => {
  // un navegador que ya tenía los casos de la primera v4.9.9 (marca 16), con una noche antigua de 45 min
  const viejo = { patient: 'caso-normal', name: 'Caso · Sueño normal', start: '2026-01-05', ver: '4.9.9',
    state: [{ gd: { b: '23:00', s: 15, w: [], f: '06:15', r: '07:00' } }] };
  const app = await loadApp({ storage: { agenda_demo_seeded16: '1', 'agendasueno3:caso-normal': JSON.stringify(viejo),
    agenda_patient_index3: JSON.stringify([{ id: 'caso-normal', name: 'Caso · Sueño normal' }]) } });
  await loginDoctor(app);
  assert.equal(app.ev(`localStorage.getItem('agenda_demo_seeded17')`), '1');
  assert.equal(app.ev(`JSON.parse(localStorage.getItem('agendasueno3:caso-normal')).start`), app.ev(`DEMO_CASES.records['caso-normal'].start`));
  const fuera = app.evj(`(()=>{ const F=EditorNoche.ESC_F, u=t=>+t.slice(0,2)*60+ +t.slice(3), r=[];
    DEMO_CASES.index.forEach(({id})=>DEMO_CASES.records[id].state.forEach((d,i)=>{ if(d&&d.gd){ const t=((u(d.gd.r)-u(d.gd.f))%1440+1440)%1440; if(!F.includes(t)) r.push(id+' '+i+' '+t); } }));
    return r; })()`);
  assert.deepEqual(fuera, []);
  assert.equal(app.ev('DEMO_CASES.index.length'), 17);
  assert.deepEqual(app.errors, []);
});

// ---------- PDF del análisis completo y Word (v4.9.9, noviembre) ----------
test('G · calidades de 0 a 10 en todo el análisis: RU-SATED, comparativa, acontecimientos, resumen por día e informe clínico', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  app.ev('renderAnalysis()');
  const sec = t => app.doc.querySelector(`#analisisContent details[data-sectitle="${t}"]`).textContent.replace(/\s+/g, ' ');
  const T = app.evj(`(()=>{ const A=analysisData(); return {qs:A.total.qs,qe:A.total.qe}; })()`);
  const diez = v => String(Math.round((v - 1) / 4 * 100) / 10).replace('.', ',');
  const rus = sec('Salud del sueño (índice compuesto RU-SATED)');
  assert.ok(rus.includes(diez(T.qs) + '/10') && rus.includes(diez(T.qe) + '/10'), rus);
  assert.doesNotMatch(rus, /\/5\b/);
  assert.match(sec('Comparativa laborables vs. festivos'), /Calidad del sueño\s*\d+(,\d)?\/10 \(regular\)\s*\d+(,\d)?\/10 \(regular\)\s*[+−]\d+,\d/);
  assert.match(sec('Resumen por día, semana y total'), /en las filas de media, la media de 0 a 10/);
  assert.match(sec('Acontecimientos anotados'), /C\. sueño \(0–10\)/);
  const inf = sec('Informe clínico provisional');
  assert.ok(inf.includes('Valoración media (de 0 a 10): calidad del sueño'), inf);
  assert.ok(inf.includes('(' + diez(T.qs) + '/10)'));
  assert.match(inf, /Mediana: sueño \S+ \(\d+(,\d)?\/10\)/);
  assert.doesNotMatch(inf, /\(1–2\)|\/5\)/);
  assert.deepEqual(app.errors, []);
});

test('G · Word del análisis = PDF del análisis completo: mismos apartados, en el mismo orden, solo los desplegados, y la rejilla como anexo apaisado', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-ins-mantenimiento')`);
  // como en el PDF: con todos los apartados desplegados…
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click(); renderAnalysis();
    document.querySelectorAll('#analisisContent details.secblock').forEach(d=>{ secOpenState[d.dataset.sectitle]=true; }); renderAnalysis()`);
  // el orden del PDF (la misma maquetación que imprime «PDF del análisis completo»)
  app.win.print = () => {};
  app.ev(`printView('analisis')`);
  const ordenPdf = app.evj(`[...document.querySelectorAll('#analisisContent>*')].filter(e=>e.tagName!=='DETAILS'||e.open)
    .map(e=>e.dataset.sectitle==='__resumen__'?'Resumen para la consulta':e.dataset.sectitle||((e.querySelector('.kgh')||{}).textContent)||(e.id==='annexGrid'?'Anexo · Diario de sueño':null)).filter(Boolean)`);
  app.win.dispatchEvent(new app.win.Event('afterprint'));
  const { html, nombre, D } = await wordAnalisis(app);
  assert.match(nombre, /_analisis_completo_v4_9_9\.doc$/);
  const txt = textoBloques(D.secciones[0].bloques) + ' ' + textoBloques(D.secciones[1].bloques);
  let pos = -1;
  for (const t of ['Agenda de Sueño — Informe de análisis', ...ordenPdf]) {
    const i = txt.indexOf(t, pos + 1);
    assert.ok(i > pos, `«${t}» en el Word, después del apartado anterior (${i} > ${pos})`);
    pos = i;
  }
  assert.ok(ordenPdf.includes('Informe clínico provisional') && ordenPdf.includes('Referencias') && ordenPdf.length >= 16, JSON.stringify(ordenPdf));
  // la rejilla del diario, en una sección apaisada aparte
  assert.equal(D.secciones.length, 2); assert.equal(D.secciones[1].apaisada, true);
  assert.match(textoBloques(D.secciones[1].bloques), /Anexo · Diario de sueño/);
  // saltos de página donde el PDF empieza hoja (grupos de apartados y conclusiones del informe)
  const saltos = JSON.stringify(D).match(/"salto":true/g) || [];
  assert.ok(saltos.length >= 8, 'saltos: ' + saltos.length);
  // lo que no se imprime tampoco va al Word (botones, notas de pantalla)
  assert.doesNotMatch(txt, /Desplegar todos|🖨 Imprimir resumen/);
  assert.match(html, /Section2/);   // .doc: la sección apaisada
  assert.match(txt, /© 2026 AdSalutem|/);
  assert.equal(D.pie, app.ev('APP_COPYRIGHT'));
  // el mismo .docx con la librería docx (la de la página, en Node): dos secciones, la segunda apaisada, y el pie
  const docx = require('docx'), JSZip = require('jszip');
  const src = ['_wdOrdena', '_wdDocx'].map(n => app.win[n].toString()).join('\n');
  const crea = new Function('docx', '_WD_A4', '_WD_MV', '_WD_MA', src + '\nreturn _wdDocx;')(docx, app.evj('_WD_A4'), app.ev('_WD_MV'), app.ev('_WD_MA'));
  const z = await JSZip.loadAsync(await docx.Packer.toBuffer(crea(D)));
  const xml = await z.file('word/document.xml').async('string');
  assert.equal((xml.match(/<w:sectPr/g) || []).length, 2);
  assert.equal((xml.match(/w:orient="landscape"/g) || []).length, 1);
  assert.ok((xml.match(/<w:pageBreakBefore/g) || []).length >= 8);
  const xtxt = xml.replace(/<[^>]+>/g, '');
  assert.ok(xtxt.indexOf('Informe clínico provisional') > xtxt.indexOf('Calidad percibida'));
  assert.match(await z.file('word/footer1.xml').async('string'), /AdSalutem/);
  // …y solo con «Calidad percibida» desplegado: el Word lleva lo mismo que ese PDF (las métricas, ese apartado y el anexo)
  app.ev(`document.querySelectorAll('#analisisContent details.secblock').forEach(d=>{ secOpenState[d.dataset.sectitle]=d.dataset.sectitle==='Calidad percibida'; }); renderAnalysis()`);
  const W2 = await wordAnalisis(app), t2 = textoBloques(W2.D.secciones[0].bloques);
  assert.match(t2, /Calidad percibida/); assert.match(t2, /Duración y continuidad del sueño/i);
  assert.doesNotMatch(t2, /Tendencias a lo largo del registro|Informe clínico provisional|Referencias/);
  assert.equal(W2.D.secciones[1].apaisada, true);
  // después, el análisis vuelve a la pantalla tal cual (sin anexo ni estilos de impresión)
  assert.equal(app.doc.getElementById('annexGrid'), null);
  assert.equal(app.doc.getElementById('wdImpresion'), null);
  assert.equal(app.doc.body.getAttribute('data-print'), null);
  assert.deepEqual(app.errors, []);
});
