// Pruebas de la versión 4.9.6: modelo mixto (rejilla + minutos de la noche del diario de consenso).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

async function loginDoctor(app) {
  app.doc.getElementById('luser').value = 'medico';
  app.doc.getElementById('lpass').value = 'clinica';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
async function pasarPrimerAcceso(app) {
  for (let i = 0; i < 20; i++) {
    const dev = app.doc.getElementById('devPriv');
    if (dev) { dev.click(); await app.sleep(50); }
    const chk = app.doc.getElementById('consentChk');
    if (chk) { chk.checked = true; chk.dispatchEvent(new app.win.Event('change')); app.doc.getElementById('consentYes').click(); await app.sleep(400); return true; }
    await app.sleep(60);
  }
  return false;
}
// diario de 21 noches: se acuesta a las 23:00 (slot 6), duerme de 23:30 a 06:30 con un despertar de 03:00 a 03:30
// y se levanta a las 07:00 (slot 22). Rejilla: latencia 30, 1 despertar, WASO 30, despertar terminal 30, TIB 480.
const DIARIO = `initState();for(let d=0;d<21;d++){for(let i=7;i<21;i++)state[d].slots[i]='s';state[d].slots[14]=null;state[d].downs=[6];state[d].ups=[22];}`;
const CAMPOS = (n, v) => `for(let d=0;d<21;d++){if(d<${n})state[d].mx=${JSON.stringify(v)};else delete state[d].mx;}`;

test('activación por paciente: el modo mixto añade la columna, se guarda en la ficha y el autoguardado lo conserva', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  assert.equal(app.ev('mxActivo()'), false);
  assert.equal(app.doc.querySelectorAll('th.mxhead').length, 0);
  assert.equal(app.doc.getElementById('mxBar').style.display, 'none');
  const sel = app.doc.getElementById('mxMode');
  sel.value = '1'; sel.dispatchEvent(new app.win.Event('change'));
  assert.equal(app.doc.querySelectorAll('th.mxhead').length, 1);
  assert.equal(app.doc.querySelectorAll('#gridBody td.mxtd').length, 21);
  assert.notEqual(app.doc.getElementById('mxBar').style.display, 'none');
  assert.match(app.doc.getElementById('savePatBtn').textContent, /\*/);          // ficha pendiente de guardar
  await app.ev('savePatientData()');
  assert.equal((await app.evj(`load('caso-normal')`)).mx, true);
  // un guardado del diario que no conoce el modo no lo borra
  await app.ev(`(async()=>{const r=await load('caso-normal');delete r.mx;await saveRec('caso-normal',r);})()`);
  assert.equal((await app.evj(`load('caso-normal')`)).mx, true);
  await app.ev(`selectPatient('caso-retraso-fase')`);
  assert.equal(app.doc.querySelectorAll('th.mxhead').length, 0);
  await app.ev(`selectPatient('caso-normal')`);
  assert.equal(app.doc.querySelectorAll('th.mxhead').length, 1);
  assert.equal(app.doc.getElementById('mxMode').value, '1');
  assert.deepEqual(app.errors, []);
});

test('panel de minutos: 4 preguntas, «0 despertares» fija 0 minutos despierto y la suma incoherente no se usa', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-ins-mantenimiento')`);
  app.ev(`editLocked=false;updateEditLock();buildBody();delete state[3].mx;buildBody();`);
  const cell = () => app.doc.querySelector('#gridBody tr[data-d="3"] .mxcell');
  assert.ok(cell().classList.contains('vacio'));
  cell().click();
  const P = app.doc.getElementById('mxPop');
  assert.equal(P.style.display, 'block');
  assert.equal(P.querySelectorAll('.mxq').length, 4);
  assert.match(P.textContent, /tardaste en dormirte/);
  P.querySelector('.mxq[data-k="sol"] .mxchip[data-v="20"]').click();
  assert.equal(app.evj('state[3].mx.sol'), 20);
  assert.match(P.querySelector('.mxwarn').textContent, /Faltan respuestas/);
  assert.ok(cell().classList.contains('parcial'));
  P.querySelector('.mxq[data-k="nw"] .mxchip[data-v="0"]').click();
  assert.deepEqual(app.evj('state[3].mx'), { sol: 20, nw: 0, waso: 0 });
  assert.ok(P.querySelector('.mxq[data-k="waso"]').classList.contains('off'));
  // con despertares, el 0 automático vuelve a preguntarse
  P.querySelector('.mxq[data-k="nw"] .mxchip[data-v="2"]').click();
  assert.deepEqual(app.evj('state[3].mx'), { sol: 20, nw: 2 });
  const inp = P.querySelector('input[data-k="waso"]'); inp.value = '35'; inp.dispatchEvent(new app.win.Event('input', { bubbles: true }));
  P.querySelector('.mxq[data-k="tfa"] .mxchip[data-v="10"]').click();
  assert.deepEqual(app.evj('state[3].mx'), { sol: 20, nw: 2, waso: 35, tfa: 10 });
  assert.equal(app.ev('mxEvaluar(3).estado'), 'completo');
  assert.match(cell().textContent, /20′·2×35′·10′/);
  // una suma que no cabe en el tiempo en cama se marca y no se usa
  const w = P.querySelector('input[data-k="waso"]'); w.value = '700'; w.dispatchEvent(new app.win.Event('input', { bubbles: true }));
  assert.equal(app.ev('mxEvaluar(3).estado'), 'incoherente');
  assert.match(P.querySelector('.mxwarn').textContent, /no caben en el tiempo en cama/);
  assert.ok(cell().classList.contains('incoh'));
  P.querySelector('.mxclear').click();
  assert.equal(app.ev('state[3].mx'), undefined);
  P.dispatchEvent(new app.win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(P.style.display, 'none');
  // con la rejilla bloqueada no se abre
  app.ev(`editLocked=true;updateEditLock();`);
  cell().click();
  assert.notEqual(P.style.display, 'block');
  assert.deepEqual(app.errors, []);
});

test('recálculo: con campos en ≥ 75 % de las noches, TST = TIB − latencia − WASO − tiempo final en cama y SE sobre el TIB', async () => {
  const app = await loadApp();
  app.ev(DIARIO);
  app.ev('loadedMx=true;');
  const g = app.evj('dayMetricsRejilla(0)');
  assert.deepEqual([g.sol, g.nWake, g.waso, g.wakeLat, g.tib, g.tst], [30, 1, 30, 30, 480, 390]);
  app.ev(CAMPOS(16, { sol: 20, nw: 3, waso: 45, tfa: 10 }));        // 16 de 21 = 76 %
  const E = app.evj('mxEstado()');
  assert.deepEqual([E.noches, E.completas, E.pct, E.usa], [21, 16, 76, true]);
  const m = app.evj('dayMetrics(0)');
  assert.equal(m.mx, true);
  assert.deepEqual([m.sol, m.nWake, m.waso, m.wakeLat, m.twt], [20, 3, 45, 10, 75]);
  assert.equal(m.tst, 480 - 20 - 45 - 10);
  assert.equal(Math.round(m.se * 100) / 100, Math.round((405 / 480) * 10000) / 100);
  assert.equal(m.rejilla.tst, 390);
  // las noches sin campos siguen con la rejilla; los horarios salen siempre de la rejilla
  const m20 = app.evj('dayMetrics(20)');
  assert.equal(m20.mx, undefined); assert.equal(m20.tst, 390);
  assert.equal(m.bedMin, g.bedMin); assert.equal(m.midSleep, g.midSleep);
  const A = app.evj('analysisData()');
  assert.equal(Math.round(A.total.tst * 100) / 100, Math.round(((16 * 405 + 5 * 390) / 21) * 100) / 100);
  assert.equal(A.mx.usa, true);
  // sin el modo activo, los campos se ignoran
  app.ev('loadedMx=false;');
  assert.equal(app.evj('dayMetrics(0)').tst, 390);
});

test('regla del 75 %: por debajo se usa la rejilla y el análisis y el informe avisan; por encima, marca ⏱', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(DIARIO); app.ev('loadedMx=true;buildHead();buildBody();');
  app.ev(CAMPOS(15, { sol: 20, nw: 3, waso: 45, tfa: 10 }));        // 15 de 21 = 71 %
  let E = app.evj('mxEstado()');
  assert.equal(E.usa, false); assert.equal(E.pct, 71);
  assert.equal(app.evj('dayMetrics(0)').tst, 390);
  app.ev('mxActualizarBarra();');
  assert.match(app.doc.getElementById('mxBar').textContent, /15 de 21 noches.*Por debajo del 75 %/);
  assert.ok(app.doc.getElementById('mxBar').classList.contains('bajo'));
  app.ev('renderAnalysis()');
  let h = app.doc.getElementById('analisis').innerHTML;
  assert.match(h, /solo 15 de 21 noches con los 4 campos \(71 %\), por debajo del 75 %/);
  assert.match(h, /pueden estar <b>infraestimados<\/b>/);
  assert.doesNotMatch(h, /class="mxk"/);
  app.ev(CAMPOS(16, { sol: 20, nw: 3, waso: 45, tfa: 10 }));
  app.ev('renderAnalysis()');
  h = app.doc.getElementById('analisis').innerHTML;
  assert.match(h, /16 de 21 noches con los 4 campos \(76 %\)/);
  assert.match(h, /Se ha usado el <b>modelo mixto<\/b>/);
  assert.match(h, /class="mxk"/);
  assert.deepEqual(app.errors, []);
});

test('CSV y JSON: el modo y los minutos viajan; un CSV antiguo se importa sin minutos', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-menopausia')`);
  assert.equal(app.ev('mxActivo()'), true);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /^modo_registro;mixto$/m);
  assert.match(csv, /;escala_calidad;min_latencia;min_despertares;min_despierto;min_final\n/);
  assert.match(csv, /^minutos_cumplimentacion;\d+;/m);
  const imp = app.evj(`rawImportText(${JSON.stringify(csv)})`);
  assert.equal(imp.meta.modo_registro, 'mixto');
  assert.deepEqual(imp.state.map(d => d.mx || null), app.evj('state.map(d=>d.mx||null)'));
  // archivo de la v4.9.5 (esquema 3): sin modo ni columnas de minutos
  const viejo = csv.split('\n').filter(l => !/^modo_registro;/.test(l))
    .map(l => /^dia;/.test(l) ? l.replace(/;min_latencia;min_despertares;min_despierto;min_final$/, '') : (/^\d+;/.test(l) && l.split(';').length >= 20 ? l.split(';').slice(0, -4).join(';') : l)).join('\n');
  const imp2 = app.evj(`rawImportText(${JSON.stringify(viejo)})`);
  assert.equal(imp2.meta.modo_registro, undefined);
  assert.ok(imp2.state.every(d => !d.mx));
  assert.deepEqual(app.errors, []);
});

test('enlace de acceso: el modo mixto viaja en el 8.º campo; los enlaces anteriores no lo cambian', async () => {
  const app = await loadApp();
  const A = app.evj(`_parseAcc('ABCD2345~2026-12-31~caso-x~Ana~F~1970-01-01~2026-10-01~1')`);
  assert.equal(A.mx, true);
  const B = app.evj(`_parseAcc('ABCD2345~2026-12-31~caso-x~Ana~F~1970-01-01~2026-10-01')`);
  assert.equal(B.mx, undefined);
  assert.equal(app.evj(`_parseAcc('ABCD2345~~caso-x~Ana~F~~~0')`).mx, false);
});

test('casos de ejemplo: modo mixto en los de sueño fragmentado o insomnio, y la anciana por debajo del 75 %', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const mixtos = ['caso-ins-conciliacion', 'caso-ins-mantenimiento', 'caso-pseudoinsomnio', 'caso-menopausia', 'caso-anciana-80',
    'caso-apnea-insomnio', 'caso-spi-plmd', 'caso-tcsr-rem', 'caso-bebe-hierro', 'caso-nino-tea'];
  for (const id of app.ev('DEMO_CASES.index.map(x=>x.id)')) {
    await app.ev(`selectPatient(${JSON.stringify(id)})`);
    const E = app.evj('mxEstado()');
    assert.equal(E.activo, mixtos.includes(id), `modo de ${id}`);
    if (!E.activo) { assert.ok(app.ev('state.every(d=>!d.mx)'), `${id} sin minutos`); continue; }
    assert.equal(E.incoherentes, 0, `noches incoherentes en ${id}`);
    assert.equal(E.usa, id !== 'caso-anciana-80', `regla del 75 % en ${id}`);
  }
  await app.ev(`selectPatient('caso-anciana-80')`);
  assert.deepEqual(app.evj('(({completas,noches,pct})=>[completas,noches,pct])(mxEstado())'), [13, 21, 62]);
  await app.ev(`selectPatient('caso-menopausia')`);
  assert.equal(app.evj('mxEstado()').parciales, 1);
  assert.deepEqual(app.errors, []);
});

test('impresión y catalán: la columna vacía lleva cuatro huecos rotulados y el panel se traduce', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-anciana-80')`);
  const vacia = [...app.doc.querySelectorAll('#gridBody .mxcell')].find(c => c.classList.contains('vacio'));
  assert.ok(vacia);
  assert.equal(vacia.querySelector('.mxpaper').textContent, 'TardéVecesDesp.Cama');
  assert.ok(app.doc.body.classList.contains('mx-on'));
  assert.match(app.doc.getElementById('helpOrder').innerHTML, /Minutos de la noche/);
  app.ev(`setLang('ca')`);
  assert.match(app.doc.querySelector('th.mxhead').innerHTML, /Minuts/);
  app.ev(`editLocked=false;updateEditLock();`);
  app.doc.querySelector('#gridBody tr[data-d="0"] .mxcell').click();
  assert.match(app.doc.getElementById('mxPop').textContent, /Quant vas trigar a adormir-te/);
  app.ev(`setLang('es')`);
  assert.deepEqual(app.errors, []);
});

test('paciente: ve la columna si su profesional activó el modo mixto; solo edita el día abierto con ✏️', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const cred = await app.ev(`crearCredencialPaciente('mixta','Paciente mixta')`);
  await app.ev(`saveRec('mixta',{patient:'mixta',name:'Paciente mixta',mx:true,state:Array.from({length:21},blankDay)})`);
  app.doc.getElementById('logoutBtn').click(); await app.sleep(200);
  app.doc.getElementById('luser').value = cred.pin; app.doc.getElementById('lpass').value = '';
  app.doc.getElementById('loginBtn').click(); await app.sleep(300);
  assert.ok(await pasarPrimerAcceso(app));
  assert.equal(app.ev('session.role'), 'patient');
  assert.equal(app.ev('mxActivo()'), true);
  assert.equal(app.doc.querySelectorAll('th.mxhead').length, 1);
  assert.match(app.doc.getElementById('mxBar').textContent, /cuando marques una noche/);
  assert.match(app.doc.getElementById('helpOrder').innerHTML, /Minutos de la noche/);
  app.ev(`for(let i=6;i<22;i++)state[0].slots[i]='s';state[0].downs=[6];state[0].ups=[22];buildBody();`);
  const cell = () => app.doc.querySelector('#gridBody tr[data-d="0"] .mxcell');
  cell().click();
  const P0 = app.doc.getElementById('mxPop');
  assert.ok(!P0 || P0.style.display !== 'block', 'sin abrir el día no se edita');
  app.doc.querySelector('#gridBody tr[data-d="0"] button.dayedit').click();
  cell().click();
  const P = app.doc.getElementById('mxPop');
  assert.equal(P.style.display, 'block');
  for (const [k, v] of [['sol', 15], ['nw', 1], ['waso', 20], ['tfa', 5]]) P.querySelector(`.mxq[data-k="${k}"] .mxchip[data-v="${v}"]`).click();
  assert.deepEqual(app.evj('state[0].mx'), { sol: 15, nw: 1, waso: 20, tfa: 5 });
  assert.match(app.doc.getElementById('mxBar').textContent, /anotados en 1 de 1 noches/);
  await app.sleep(1200);   // autoguardado
  const rec = await app.evj(`load('mixta')`);
  assert.deepEqual(rec.state[0].mx, { sol: 15, nw: 1, waso: 20, tfa: 5 });
  assert.equal(rec.mx, true);
  assert.match(app.ev('buildUnifiedCsv()'), /^modo_registro;mixto$/m);
  assert.deepEqual(app.errors, []);
});

test('lectura de consenso: una noche en dos tramos no duplica el sueño y los avisos comparan con el tiempo en cama', async () => {
  const app = await loadApp();
  // ↓ 23:00 · duerme 23:30–03:00 y 06:00–07:00 · ↑ 07:00 (la rejilla toma 23:30–03:00 como periodo principal)
  app.ev(`initState();for(let i=7;i<14;i++)state[0].slots[i]='s';state[0].slots[20]='s';state[0].slots[21]='s';state[0].downs=[6];state[0].ups=[22];loadedMx=true;`);
  const g = app.evj('dayMetricsRejilla(0)');
  assert.equal(g.wakeLat, 240);                                       // periodo principal: despertar terminal de 4 h
  assert.deepEqual(g.csd, { sol: 30, nw: 1, waso: 180, tfa: 0, sueno: 270 });
  app.ev(`state[0].mx={sol:30,nw:1,waso:180,tfa:0};`);
  const ev = app.evj('mxEvaluar(0)');
  assert.equal(ev.estado, 'completo'); assert.deepEqual(ev.avisos, []);
  app.ev(`state[0].mx={sol:30,nw:1,waso:170,tfa:5};`);
  const m = app.evj('dayMetrics(0)');
  assert.equal(m.mx, true);
  assert.equal(m.tst, 480 - 30 - 170 - 5);                             // sin sumar dos veces el tramo de 06:00–07:00
  assert.equal(Math.round(m.se), Math.round(275 / 480 * 100));
});

test('acceso: el mensaje de «Enviar» lleva el enlace directo, que abre el diario con la ficha', async () => {
  let mensaje = null;
  const doc = await loadApp({ prompt: (m, d) => { mensaje = d; return null; } });
  await loginDoctor(doc);
  await doc.ev(`selectPatient('caso-menopausia')`);
  await doc.ev(`(async()=>{const c=await crearCredencialPaciente('caso-menopausia','Menopausia');mostrarCredencialNueva('Menopausia',c.pin,c.expires);})()`);
  doc.doc.getElementById('credMsgBtn').click();
  for (let i = 0; i < 40 && !mensaje; i++) await doc.sleep(50);
  assert.ok(mensaje, 'mensaje preparado');
  const url = (mensaje.match(/https?:\/\/\S+#acc=\S+/) || [])[0];
  assert.ok(url, 'el mensaje lleva el enlace de acceso directo');
  assert.match(mensaje, /Código de acceso: [A-Z0-9]{4}-[A-Z0-9]{4}/);
  const pac = await loadApp({ url, bootDelay: 1500 });
  assert.ok(await pasarPrimerAcceso(pac));
  assert.equal(pac.ev('session&&session.role'), 'patient');
  assert.equal(pac.ev('getBirthInput().value'), '1973-05-08');
  assert.equal(pac.ev('getStartInput().value'), '2025-06-02');
  assert.deepEqual(pac.errors, []);
});
