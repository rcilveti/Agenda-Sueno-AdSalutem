// Pruebas de las correcciones de la auditoría total de la v5.0.0 (noviembre de 2026):
//  A1 dos ventanas con el mismo paciente · A2 restaurar una copia anterior a un diario · M1 fechas solapadas ·
//  M2 remisión sin datos · M3 diario guardado en el móvil del paciente · M4 accesibilidad · B1 cuantil de la t ·
//  B2 copias mal formadas · B3 colores · B6 avisos en catalán.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
async function loginDoctor(app) {
  app.doc.getElementById('luser').value = 'medico'; app.doc.getElementById('lpass').value = 'clinica';
  app.doc.getElementById('loginBtn').click(); await app.sleep(1200);
}
async function llenar(app, opts = {}) {
  app.ev(`(()=>{ const salta=${JSON.stringify(opts.salta || [])};
    for(let d=0; d<DAYS; d++){ if(salta.includes(d)) continue;
      AgendaPuente.guardar(d,{gd:{b:'23:30',s:${opts.lat || 30}+(d%3)*5,w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:3,qd:3,qe:3,trat:'',obs:''}); } })()`);
  await app.sleep(50); app.ev('flushAutoSave()'); await app.sleep(150);
}
async function paciente(app, id, inicio, opts = {}) {
  await app.ev(`(async()=>{ patient=${JSON.stringify(id)}; await upsertIndex(patient,'Prueba ${id}');
    await saveRec(patient,{patient,name:'Prueba ${id}',start:${JSON.stringify(inicio)},birth:'1980-01-01',sex:'F',cat:'demo',state:Array.from({length:DAYS},blankDay)});
    await populatePatients(); await selectPatient(patient); })()`);
  if (!opts.vacio) await llenar(app, opts);
}
const rec = (app, id) => JSON.parse(app.storage()['agendasueno3:' + id] || 'null');
const lat = st => st.filter(d => d && d.gd).map(d => d.gd.s).slice(0, 3);
const noches = st => st.filter(d => d && d.gd).length;
const toast = app => app.doc.getElementById('toast').textContent;
const restaurar = async (app, copia) => { await app.ev(`restoreBackup({text:async()=>${JSON.stringify(typeof copia === 'string' ? copia : JSON.stringify(copia))}})`); await app.sleep(400); };
const copiaDe = async (app, ids) => { app.ev(`window.__dls=[]; dl=(c,n)=>{ window.__dls.push([n,c]); }`); await app.ev(`exportBackup(${JSON.stringify(ids)})`); await app.sleep(200); return app.ev(`window.__dls[window.__dls.length-1][1]`); };

test('A1 · dos ventanas con el mismo paciente: lo anotado se guarda en su diario y no pisa el que se abrió en la otra', async () => {
  const A = await loadApp(); await loginDoctor(A);
  await paciente(A, 'dosv', '2026-01-05', { lat: 60 });
  await A.ev(`crearDiarioNuevo({inicio:'2026-03-02',etiqueta:'Post'})`); await llenar(A, { lat: 10 });
  // ventana B (misma memoria del navegador): abre el diario basal
  const B = await loadApp({ storage: A.storage() }); await loginDoctor(B); await B.ev(`selectPatient('dosv')`);
  assert.ok(await B.ev(`abrirDiario(diariosPac[0].id)`)); await B.sleep(200);
  A.win.localStorage.setItem('agendasueno3:dosv', B.storage()['agendasueno3:dosv']);
  // ventana A: sigue viendo «Post» y corrige su primera noche
  A.ev(`AgendaPuente.guardar(0,{gd:{b:'23:00',s:5,w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:5,qd:5,qe:5,trat:'',obs:''})`);
  await A.sleep(60); A.ev('flushAutoSave()'); await A.sleep(300);
  let R = rec(A, 'dosv');
  const todos = [{ et: R.diario.etiqueta, inicio: R.start, s: lat(R.state) }].concat(R.diarios.map(d => ({ et: d.etiqueta, inicio: d.inicio, s: lat(d.state) })));
  assert.equal(todos.length, 2);
  assert.deepEqual(todos.find(d => d.inicio === '2026-01-05').s, [60, 65, 70], 'las noches del basal siguen ahí');
  assert.deepEqual(todos.find(d => d.inicio === '2026-03-02').s, [5, 15, 20], 'el cambio va al diario «Post»');
  assert.equal(todos.find(d => d.inicio === '2026-03-02').et, 'Post');
  assert.equal(R.start, '2026-01-05', 'el diario abierto sigue siendo el que abrió la otra ventana');
  // la ventana A avisa y pasa a mostrar el diario que está abierto ahora
  assert.match(toast(A), /otra ventana/);
  assert.equal(A.doc.getElementById('start').value, '2026-01-05');
  assert.deepEqual(A.evj(`state.filter(d=>d.gd).map(d=>d.gd.s).slice(0,3)`), [60, 65, 70]);
  // «Guardar datos del diario» tampoco pisa: B vuelve a cambiar de diario y A guarda a mano
  B.win.localStorage.setItem('agendasueno3:dosv', A.storage()['agendasueno3:dosv']); await B.ev(`selectPatient('dosv')`);
  assert.ok(await B.ev(`abrirDiario(diariosPac[0].id)`)); await B.sleep(200);
  A.win.localStorage.setItem('agendasueno3:dosv', B.storage()['agendasueno3:dosv']);
  A.doc.getElementById('saveBtn').click(); await A.sleep(400);
  R = rec(A, 'dosv');
  assert.equal(R.start, '2026-03-02'); assert.deepEqual(lat(R.state), [5, 15, 20]);
  assert.deepEqual(lat(R.diarios[0].state), [60, 65, 70]); assert.equal(R.diarios.length, 1);
  // cambiar de diario desde una ventana atrasada usa lo guardado, no su copia en memoria
  B.win.localStorage.setItem('agendasueno3:dosv', A.storage()['agendasueno3:dosv']); await B.ev(`selectPatient('dosv')`);
  A.ev(`AgendaPuente.guardar(1,{gd:{b:'23:00',s:45,w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:5,qd:5,qe:5,trat:'',obs:''})`);
  await A.sleep(60); A.ev('flushAutoSave()'); await A.sleep(300);
  B.win.localStorage.setItem('agendasueno3:dosv', A.storage()['agendasueno3:dosv']);   // B no se entera (sin aviso del navegador)
  assert.ok(await B.ev(`abrirDiario(diariosPac[0].id)`)); await B.sleep(200);
  R = rec(B, 'dosv');
  const post = R.start === '2026-03-02' ? R.state : R.diarios.find(d => d.inicio === '2026-03-02').state;
  assert.deepEqual(lat(post), [5, 45, 20], 'no se pierde lo anotado en la otra ventana');
  // el navegador avisa del cambio hecho en otra ventana: se recarga el paciente abierto
  A.win.localStorage.setItem('agendasueno3:dosv', B.storage()['agendasueno3:dosv']);
  A.ev(`window.dispatchEvent(new StorageEvent('storage',{key:'agendasueno3:dosv'}))`); await A.sleep(300);
  assert.equal(A.doc.getElementById('start').value, rec(A, 'dosv').start);
  assert.deepEqual(A.errors, []); assert.deepEqual(B.errors, []);
});

test('A2 · restaurar una copia anterior al segundo diario no borra sus noches ni duplica el basal', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await paciente(app, 'rest', '2026-01-05', { lat: 60 });
  const vieja = await copiaDe(app, ['rest']);
  await app.ev(`crearDiarioNuevo({inicio:'2026-03-02',etiqueta:'Post',intervencion:'TCC-I'})`); await llenar(app, { lat: 10 });
  // el basal se corrige después de la copia
  const nueva = await copiaDe(app, ['rest']);
  await restaurar(app, vieja);
  let R = rec(app, 'rest');
  assert.equal(R.start, '2026-03-02'); assert.equal(R.diario.etiqueta, 'Post'); assert.deepEqual(lat(R.state), [10, 15, 20]);
  assert.equal(R.diarios.length, 1); assert.equal(R.diarios[0].inicio, '2026-01-05'); assert.deepEqual(lat(R.diarios[0].state), [60, 65, 70]);
  assert.equal(R.ver, '5.0.0');
  const aviso = app.dialogs.filter(d => d[0] === 'confirm').pop()[1];
  assert.doesNotMatch(aviso, /sin borrar nada/); assert.match(aviso, /mismas fechas/);
  // un diario que solo está en la copia se añade; los de las mismas fechas se sustituyen por los de la copia
  const C = JSON.parse(nueva); const r = C.records.rest;
  r.state[0].gd.s = 99; r.diarios.push({ id: 'dx', inicio: '2026-06-01', etiqueta: 'Seguimiento', intervencion: '', state: JSON.parse(JSON.stringify(r.state)) });
  await restaurar(app, C);
  R = rec(app, 'rest');
  assert.equal(R.start, '2026-03-02'); assert.equal(R.state[0].gd.s, 99);
  assert.deepEqual(R.diarios.map(d => d.inicio).sort(), ['2026-01-05', '2026-06-01']);
  assert.equal(app.doc.querySelectorAll('#diarioSel option').length, 3);
  // en un navegador limpio, la copia se restaura tal cual
  const otro = await loadApp(); await loginDoctor(otro); await restaurar(otro, nueva);
  const R2 = rec(otro, 'rest');
  assert.equal(R2.diarios.length, 1); assert.deepEqual(lat(R2.state), [10, 15, 20]); assert.deepEqual(lat(R2.diarios[0].state), [60, 65, 70]);
  // un paciente de un solo diario: la copia sustituye su diario, como siempre
  await paciente(app, 'uno', '2026-01-05', { lat: 60 }); const c1 = await copiaDe(app, ['uno']);
  app.ev(`AgendaPuente.guardar(0,{gd:{b:'23:00',s:5,w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:5,qd:5,qe:5,trat:'',obs:''})`); await app.sleep(60); app.ev('flushAutoSave()'); await app.sleep(200);
  await restaurar(app, c1);
  assert.equal(rec(app, 'uno').state[0].gd.s, 60); assert.ok(!rec(app, 'uno').diarios || !rec(app, 'uno').diarios.length); assert.equal(rec(app, 'uno').ver, '4.9.9');
  assert.deepEqual(app.errors, []);
});

test('B2 · una copia con diarios mal formados (fecha imposible, estados raros) no impide abrir al paciente', async () => {
  const app = await loadApp(); await loginDoctor(app);
  assert.equal(app.ev(`_diaISO('2026-13-45')`), null); assert.equal(app.ev(`_diaISO('2026-02-30')`), null); assert.equal(app.ev(`_diaISO('2024-02-29')`), '2024-02-29');
  await paciente(app, 'base', '2026-01-05'); const st = rec(app, 'base').state;
  const mala = { app: 'agenda-sueno', type: 'backup', schema: 2, version: '5.0.0', exported: '2026-11-10', index: [{ id: 'mal', name: 'Mal' }], keyring: {},
    records: { mal: { patient: 'mal', name: 'Mal', start: '2026-01-05', state: st, diario: { id: { a: 1 }, etiqueta: { a: 1 }, intervencion: ['x'] },
      diarios: [null, 7, 'x', { state: 'no' }, { id: 'a', inicio: '2026-13-45', etiqueta: 12345, state: [null, { slots: 'x', gd: { b: '99:99', s: '<i>', w: 'x', f: null, r: {} } }, { gd: 7 }] },
        { id: 'ok', inicio: '2026-03-02', etiqueta: 'Post', state: st, ventanas: 'x', hitos: {} }, { id: 'ok', inicio: '2026-06-01', state: st }, { inicio: '2026-09-01', state: Array(500).fill({}) }] } } };
  await restaurar(app, mala);
  await app.ev(`selectPatient('mal')`); await app.sleep(200);
  const R = rec(app, 'mal');
  assert.equal(typeof R.diario.etiqueta, 'string'); assert.equal(typeof R.diario.id, 'string');
  assert.ok(R.diarios.every(d => Array.isArray(d.state) && d.state.length === 21 && typeof d.etiqueta === 'string'));
  assert.equal(new Set([R.diario.id, ...R.diarios.map(d => d.id)]).size, R.diarios.length + 1, 'identificadores únicos');
  assert.ok(R.diarios.every(d => d.inicio === null || /^\d{4}-\d{2}-\d{2}$/.test(d.inicio)));
  assert.ok(!R.diarios.some(d => d.inicio === '2026-13-45'));
  // se pueden abrir todos y el análisis se dibuja
  for (const id of app.evj('diariosPac.map(d=>d.id)')) { assert.ok(await app.ev(`abrirDiario(${JSON.stringify(id)})`)); await app.sleep(120); }
  // con un diario con noches abierto (el último de la lista está vacío), el análisis se dibuja con la comparación
  assert.ok(await app.ev(`abrirDiario(diariosPac.find(d=>_diasConDatos(d.state)>0).id)`)); await app.sleep(120);
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click(); secOpenState['Comparación de diarios']=true; renderAnalysis()`); await app.sleep(200);
  assert.ok(app.doc.querySelector('#cmpBlock .cmp-diarios'));
  assert.deepEqual(app.errors, []);
});

test('M1 · «Inicio del registro» no deja solapar el diario abierto con otro diario del paciente', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await paciente(app, 'sol', '2026-01-05');
  await app.ev(`crearDiarioNuevo({inicio:'2026-03-02',etiqueta:'Post'})`); await llenar(app, { lat: 10 });
  const pon = async v => { app.ev(`(()=>{ const i=$('start'); i.value=${JSON.stringify(v)}; i.dispatchEvent(new Event('change',{bubbles:true})); })()`); await app.sleep(50); };
  await pon('2026-01-20');   // a 15 días del basal: se solapa
  assert.equal(app.doc.getElementById('start').value, '2026-03-02');
  assert.match(toast(app), /se solapa con el diario que empieza el 05\/01\/2026/);
  app.doc.getElementById('saveBtn').click(); await app.sleep(300);
  assert.equal(rec(app, 'sol').start, '2026-03-02');
  await pon('2026-01-26');   // a 21 días justos: vale
  assert.equal(app.doc.getElementById('start').value, '2026-01-26');
  app.doc.getElementById('saveBtn').click(); await app.sleep(300);
  assert.equal(rec(app, 'sol').start, '2026-01-26');
  // con un solo diario, cualquier fecha
  await paciente(app, 'sol1', '2026-01-05'); await pon('2026-01-10');
  assert.equal(app.doc.getElementById('start').value, '2026-01-10');
  assert.deepEqual(app.errors, []);
});

test('M2 · remisión por diario: sin latencia, WASO o eficiencia no se valora («—»)', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await paciente(app, 'rej', '2026-01-05', { vacio: true });
  app.ev(`(()=>{ for(let d=0;d<DAYS;d++){ const day=blankDay(); for(let c=8;c<20;c++) day.slots[c]='s'; state[d]=day; } scheduleAutoSave(); flushAutoSave(); })()`); await app.sleep(200);
  const p = app.evj(`(()=>{ const p=perfilDiario(diariosDelPaciente()[0]); return {noches:p.noches,sol:p.media('sol'),rem:p.remision}; })()`);
  assert.equal(p.noches, 21); assert.equal(p.sol, null); assert.equal(p.rem, null);
  await app.ev(`crearDiarioNuevo({inicio:'2026-03-02',etiqueta:'Post'})`); await llenar(app, { lat: 10 });
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click(); secOpenState['Comparación de diarios']=true; renderAnalysis()`); await app.sleep(200);
  const filas = [...app.doc.querySelectorAll('#cmpBlock .cmp-diarios tbody tr')].map(tr => tr.children[tr.children.length - 2].textContent.trim());
  assert.deepEqual(filas, ['—', 'Sí']);
  assert.equal(app.evj(`perfilDiario(diariosDelPaciente()[1]).remision.ok`), true);
  assert.deepEqual(app.errors, []);
});

test('M3 · móvil del paciente: un diario anterior guardado se ve y se puede enviar', async () => {
  const app = await loadApp({ userAgent: IPHONE });
  const code = app.ev('generarCodigoAcceso()');
  app.doc.getElementById('luser').value = code.slice(0, 4) + '-' + code.slice(4); app.doc.getElementById('loginBtn').click(); await app.sleep(1200);
  for (let i = 0; i < 30; i++) { const dev = app.doc.getElementById('devPriv'); if (dev) { dev.click(); await app.sleep(50); }
    const chk = app.doc.getElementById('consentChk'); if (chk) { chk.checked = true; chk.dispatchEvent(new app.win.Event('change')); app.doc.getElementById('consentYes').click(); await app.sleep(500); break; } await app.sleep(60); }
  assert.equal(app.ev('session.role'), 'patient');
  const id = app.ev('patient');
  // sin diarios guardados no hay aviso
  assert.ok(!app.doc.getElementById('pacDiariosPrev') || app.doc.getElementById('pacDiariosPrev').hidden);
  // 10 noches anotadas y, después, un acceso con otra fecha (el profesional corrigió el mes): diario nuevo en blanco
  await app.ev(`(async()=>{ $('start2').value='2025-03-03'; $('start2').dispatchEvent(new Event('change',{bubbles:true}));
    for(let d=0;d<10;d++) AgendaPuente.guardar(d,{gd:{b:'23:30',s:30,w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:3,qd:3,qe:3,trat:'',obs:''}); })()`);
  await app.sleep(60); app.ev('flushAutoSave()'); await app.sleep(300);
  await app.ev(`(async()=>{ const r=await load(patient); await saveRec(patient,Object.assign({},r,{start:'2025-04-28',state:Array.from({length:DAYS},blankDay),
    diario:{id:_idDiario(),etiqueta:'',intervencion:''},diarios:[_diarioDeRec(r)]})); await loadPatient(patient); })()`); await app.sleep(300);
  const R = rec(app, id);
  assert.equal(R.diarios.length, 1); assert.equal(noches(R.diarios[0].state), 10);
  const av = app.doc.getElementById('pacDiariosPrev');
  assert.ok(av && !av.hidden, 'aviso del diario anterior en la pantalla del paciente');
  assert.match(av.textContent, /03\/03\/2025/); assert.match(av.textContent, /10 noches/);
  const idG = R.diarios[0].id;
  assert.ok(av.querySelector(`button[data-id="${idG}"]`));
  // el archivo de ese diario lleva sus fechas y sus noches; lo que hay en pantalla no cambia
  const csv = app.ev(`csvDeDiarioGuardado(${JSON.stringify(idG)})`);
  assert.match(csv, /\ninicio_registro;2025-03-03\r?\n/);
  assert.equal(csv.split('\n').filter(l => /^\d+;/.test(l) && /23:30/.test(l)).length, 10);
  assert.equal(app.doc.getElementById('start2').value, '2025-04-28'); assert.equal(app.ev('_diasConDatos(state)'), 0);
  // al enviarlo (aquí, descarga) queda anotado y el aviso lo dice
  app.ev(`window.__dls=[]; dl=(c,n)=>{ window.__dls.push([n,c]); }`);
  av.querySelector('button').click(); await app.sleep(400);
  assert.equal(app.evj('window.__dls.length'), 1); assert.match(app.ev('window.__dls[0][1]'), /inicio_registro;2025-03-03/);
  assert.ok(rec(app, id).diarios[0].enviado);
  assert.match(app.doc.getElementById('pacDiariosPrev').textContent, /enviado/i);
  // en catalán
  app.ev(`setLang('ca')`); await app.sleep(100);
  assert.match(app.doc.getElementById('pacDiariosPrev').textContent, /diari anterior/i);
  assert.deepEqual(app.errors, []);
});

test('M4 · accesibilidad: ventana de diario (Escape, foco), umbrales con nombre, cajas con desplazamiento y contraste del texto secundario', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await app.ev(`selectPatient('caso-seg-tcci')`);
  const btn = app.doc.getElementById('nuevoDiarioBtn'); btn.focus(); btn.click(); await app.sleep(80);
  assert.ok(app.doc.getElementById('diarioOverlay')); assert.equal(app.doc.activeElement.id, 'dlgInicio');
  const tecla = (k, shift) => app.doc.activeElement.dispatchEvent(new app.win.KeyboardEvent('keydown', { key: k, shiftKey: !!shift, bubbles: true, cancelable: true }));
  // el tabulador no sale de la ventana: del último control vuelve al primero y al revés
  app.doc.getElementById('dlgOk').focus(); tecla('Tab'); assert.equal(app.doc.activeElement.id, 'dlgInicio');
  tecla('Tab', true); assert.equal(app.doc.activeElement.id, 'dlgOk');
  tecla('Escape'); await app.sleep(30);
  assert.equal(app.doc.getElementById('diarioOverlay'), null); assert.equal(app.doc.activeElement.id, 'nuevoDiarioBtn');
  // umbrales: cada campo dice de qué métrica es
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click(); secOpenState['Comparación de diarios']=true; cmpVerDetalle=true; renderAnalysis()`); await app.sleep(200);
  const campos = [...app.doc.querySelectorAll('#cmpUmbrales input')];
  assert.equal(campos.length, 16); assert.ok(campos.every(i => (i.getAttribute('aria-label') || '').length > 8));
  assert.match(app.doc.querySelector('#cmpUmbrales .cmp-u[data-k="sol"]').getAttribute('aria-label'), /Umbral.*latencia/i);
  assert.match(app.doc.querySelector('#cmpUmbrales .cmp-d[data-k="sol"]').getAttribute('aria-label'), /cuenta para la respuesta/i);
  // las cajas con desplazamiento lateral se pueden recorrer con el teclado
  const cajas = [...app.doc.querySelectorAll('#cmpBlock .scroll')];
  assert.ok(cajas.length >= 4); assert.ok(cajas.every(c => c.getAttribute('tabindex') === '0' && c.getAttribute('role') === 'region' && c.getAttribute('aria-label')));
  // contraste del texto secundario (--mist) sobre blanco y sobre los fondos claros: al menos 4,5:1
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const mist = app.win.getComputedStyle(app.doc.documentElement).getPropertyValue('--mist').trim();
  for (const fondo of ['#ffffff', '#f7f9fb', '#eef4fa']) assert.ok(cr(mist, fondo) >= 4.5, `${mist} sobre ${fondo}: ${cr(mist, fondo).toFixed(2)}`);
  assert.deepEqual(app.errors, []);
});

test('B1 · cuantil 0,975 de la t: exacto también con pocos grados de libertad', async () => {
  const app = await loadApp();
  const exacto = { 1: 12.7062, 1.25: 8.028, 1.5: 6.0167, 1.75: 4.9488, 2: 4.3027, 2.5: 3.5747, 3.5: 2.9401, 4.5: 2.6589, 7.5: 2.333, 9.5: 2.2441, 10: 2.2281, 12: 2.1788, 30: 2.0423 };
  for (const [df, v] of Object.entries(exacto)) { const t = app.ev(`_cmT(${df})`); assert.ok(Math.abs(t / v - 1) < 0.002, `gl ${df}: ${t} frente a ${v}`); }
  assert.ok(Math.abs(app.ev('_cmT(1e6)') - 1.96) < 0.001); assert.equal(app.ev('_cmT(0)'), 1.96);
});

test('B3 · con más de seis diarios, cada uno tiene su color en los gráficos', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await paciente(app, 'ocho', '2024-01-01', { lat: 60 });
  for (let i = 1; i < 8; i++) { await app.ev(`crearDiarioNuevo({inicio:_sumarDias('2024-01-01',${i * 42}),etiqueta:'D${i + 1}'})`); await llenar(app, { lat: 60 - i * 6 }); }
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click(); secOpenState['Comparación de diarios']=true; renderAnalysis()`); await app.sleep(300);
  const col = [...app.doc.querySelectorAll('#cmpBlock .cmp-matriz thead th.cmp-dcol')].map(t => t.style.borderTop);
  assert.equal(col.length, 8); assert.equal(new Set(col).size, 8);
  assert.deepEqual(app.errors, []);
});

test('B6 · los avisos de un archivo que va a otro diario salen también en catalán', async () => {
  const app = await loadApp();
  const es = app.evj(`[tV5('imp.otro',{f:'03/03/2025'}),tV5('imp.nuevo',{f:'01/09/2025'})]`);
  assert.match(es[0], /es del diario que empieza el 03\/03\/2025/); assert.match(es[1], /diario nuevo del paciente \(desde el 01\/09\/2025\)/);
  app.ev(`LANG='ca'`);
  const ca = app.evj(`[tV5('imp.otro',{f:'03/03/2025'}),tV5('imp.nuevo',{f:'01/09/2025'})]`);
  assert.match(ca[0], /és del diari que comença el 03\/03\/2025/); assert.match(ca[1], /diari nou del pacient \(des de l’01\/09\/2025\)|diari nou del pacient \(des del 01\/09\/2025\)/);
});
