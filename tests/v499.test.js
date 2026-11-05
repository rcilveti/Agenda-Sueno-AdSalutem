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
  // noche pintada en la rejilla: se deduce de ella
  let n = app.evj('AgendaPuente.noche(0)');
  assert.deepEqual(n.gd, { b: '22:30', s: 30, w: [], f: '07:00', r: '07:00' });
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
  app.ev(`EditorNoche.estado().ev.push({a:420,q:'Tos'});EditorNoche.estado().trat='Paracetamol';EditorNoche.irPaso(2);`);
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
  app.ev('EditorNoche.irPaso(2)');
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
  app.ev('EditorNoche.irPaso(1)');
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
  assert.match(csv, /;escala_calidad;etiquetas;guiado;acont_tipos;tratamiento\n/);
  assert.match(csv, /^4;.*;03:10\+bano,05:10\+ruido;"Zolpidem; «5 mg»"$/m);
  const imp = app.evj(`rawImportText(${JSON.stringify(csv)})`);
  assert.deepEqual(imp.state[3].ev, [{ t: '03:10', k: 'bano' }, { t: '05:10', k: 'ruido' }]);
  assert.equal(imp.state[3].trat, 'Zolpidem; «5 mg»');
  assert.equal(imp.state[3].cmt, '=1+1 sin dormir');                    // fórmula neutralizada al exportar y recuperada
  assert.deepEqual(imp.state[3].gd, NOCHE.gd);
  assert.ok(imp.state.filter((d, i) => i !== 3).every(d => d.ev === undefined && d.trat === undefined));
  // formato de la v4.9.8: sin las dos columnas nuevas
  const v498 = csv.replace(/;acont_tipos;tratamiento\n/, '\n').replace(/^(\d+;.*);[^;\n]*;("[^"\n]*"|[^;\n]*)$/gm, '$1');
  const i8 = app.evj(`rawImportText(${JSON.stringify(v498)})`);
  assert.equal(i8.state[3].ev, undefined); assert.equal(i8.state[3].trat, undefined);
  assert.deepEqual(i8.state[3].gd, NOCHE.gd);
  assert.deepEqual(app.evj(`evDelDia(${JSON.stringify(i8.state[3])})`), [{ t: '03:00', k: 'otro' }, { t: '05:00', k: 'otro' }]);
  // formato de la v4.9.5: sin escala, etiquetas, guiado ni las nuevas
  const v495 = csv.replace(/;escala_calidad;etiquetas;guiado;acont_tipos;tratamiento\n/, '\n')
    .replace(/^(\d+;.*);(5)?;[^;\n]*;[^;\n]*;[^;\n]*;("[^"\n]*"|[^;\n]*)$/gm, '$1').replace(/^(ventanas_objetivo|hitos);.*\n/gm, '');
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
  // Word
  let html = '';
  const B = app.win.Blob;
  app.win.Blob = function (parts, o) { html = parts.join(''); return new B(parts, o); };
  app.win.URL.createObjectURL = () => 'blob:x'; app.win.URL.revokeObjectURL = () => {};
  await app.ev('exportAnalysisWord()');
  app.win.Blob = B;
  assert.match(html, /Patrón propio, acontecimientos y tratamiento/);
  assert.match(html, /<b>Tratamiento anotado por el paciente:<\/b> Melatonina 1 mg a las 23:00 \(3 noches\)/);
  assert.match(html, /<b>Acontecimientos anotados:<\/b> Baño 3/);
  assert.doesNotMatch(html, /Ventana de sueño objetivo|Hitos:|Modo guiado/);
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
      app.ev('abrirEditorNoche(0)'); app.ev('EditorNoche.irPaso(1)');
      app.doc.getElementById('edGuardar2').click();
      assert.equal(app.ev(`slotsToRanges(state[0].slots,'s')`), antes, id + ': rejilla');
    }
  }
  assert.deepEqual(app.errors, []);
});
