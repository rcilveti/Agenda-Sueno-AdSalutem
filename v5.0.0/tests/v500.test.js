// Pruebas de la versión 5.0.0: varios diarios del mismo paciente (crear, abrir, etiquetar, borrar; reparto de los
// archivos por fechas; diario nuevo en el móvil del paciente) y su comparación (aptitud: 14 noches, 2 fines de semana
// completos y el mismo sistema de registro; diferencia con IC del 95 %, NAP y g; umbrales de la AASM editables;
// valoraciones, respuesta y remisión; apartado del análisis, informe clínico, PDF, Word y Excel). Compatibilidad
// con la v4.9.9, que abre los pacientes de un solo diario y no sobrescribe los de varios.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { loadApp } = require('./harness');

const RAIZ_499 = path.join(__dirname, '..', '..', 'index.html');   // la v4.9.9 (versión principal)
async function loginDoctor(app) {
  app.doc.getElementById('luser').value = 'medico';
  app.doc.getElementById('lpass').value = 'clinica';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
async function analisis(app, abrir = true) {
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click(); ${abrir ? "secOpenState['Comparación de diarios']=true;" : ''} renderAnalysis()`);
}
// un paciente nuevo (no de ejemplo) con un diario de 21 noches del editor desde «inicio»
async function pacienteConDiario(app, id, inicio, opts = {}) {
  await app.ev(`(async()=>{ patient=${JSON.stringify(id)}; await upsertIndex(patient,'Prueba ${id}');
    await saveRec(patient,{patient,name:'Prueba ${id}',start:${JSON.stringify(inicio)},birth:'1980-01-01',sex:'F',cat:'demo',state:Array.from({length:DAYS},blankDay)});
    await populatePatients(); await selectPatient(patient); })()`);
  app.ev(`(()=>{ const salta=${JSON.stringify(opts.salta || [])};
    for(let d=0; d<DAYS; d++){ if(salta.includes(d)) continue;
      AgendaPuente.guardar(d,{gd:{b:'23:30',s:${opts.lat || 30},w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:3,qd:3,qe:3,trat:'',obs:''}); } })()`);
  await app.sleep(50);
  app.ev('flushAutoSave()'); await app.sleep(100);
}

test('v5.0.0: versión, casos de ejemplo con varios diarios y selector de diario en la ficha', async () => {
  const app = await loadApp();
  assert.equal(app.ev('APP_VERSION'), '5.0.0');
  assert.match(app.doc.getElementById('loginVersion').textContent, /5\.0\.0 \(pruebas\)/);
  await loginDoctor(app);
  const idx = app.evj('DEMO_CASES.index.map(x=>x.id)');
  assert.equal(idx.length, 34);
  assert.deepEqual(idx.slice(17, 20), ['caso-seg-tcci', 'caso-seg-nino', 'caso-seg-retraso']);
  assert.equal(app.ev('DEMO_V5.length'), 3);
  // los 14 casos para estudiar la evolución (marca 19), cada uno a partir de un caso de la v4.9.9 (su diario es el basal)
  assert.equal(app.ev('DEMO_EVO.length'), 14);
  assert.deepEqual(idx.slice(20).map(x => x.slice(0, 12)), Array(14).fill('caso-evo-').map((x, i) => x + String(i + 1).padStart(2, '0') + '-').map(x => x.slice(0, 12)));
  assert.ok(app.evj(`DEMO_EVO.every(id=>{ const r=DEMO_CASES.records[id]; return r.ver==='5.0.0'&&r.diarios.length>=1&&r.diarios[0].etiqueta==='Basal'; })`));
  // el basal de cada caso es el diario del caso de la v4.9.9 del que parte, tal cual
  assert.ok(app.evj(`(()=>{ const base={'caso-evo-01-respuesta':'caso-ins-conciliacion','caso-evo-08-recaida':'caso-spi-plmd','caso-evo-14-basal-tendencia':'caso-tcci'};
    return Object.entries(base).every(([e,b])=>JSON.stringify(DEMO_CASES.records[e].diarios[0].state)===JSON.stringify(DEMO_CASES.records[b].state)); })()`));
  await app.ev(`selectPatient('caso-seg-tcci')`);
  const opts = [...app.doc.querySelectorAll('#diarioSel option')].map(o => o.textContent);
  assert.deepEqual(opts, ['Diario 1 · Diario antiguo (rejilla) · 07/10/2024', 'Diario 2 · Basal · 01/09/2025',
    'Diario 3 · Tras TCC-I (6 semanas) · 20/10/2025', 'Diario 4 · Seguimiento a los 3 meses · 19/01/2026']);
  assert.equal(app.doc.querySelector('#diarioSel option:checked').textContent, opts[3]);
  assert.equal(app.doc.getElementById('diarioSel').disabled, false);
  assert.equal(app.doc.getElementById('newPatBtn').textContent, '+ NUEVO PACIENTE');
  // un caso de un solo diario: selector desactivado, con la explicación
  await app.ev(`selectPatient('caso-normal')`);
  assert.equal(app.doc.getElementById('diarioSel').disabled, true);
  assert.match(app.doc.getElementById('diarioSel').title, /un solo diario/);
  // los casos de la v4.9.9 no se vuelven a cargar si ya estaban (marca 17): solo los de la v5.0.0 (marca 18)
  const st = app.storage();
  assert.equal(st.agenda_demo_seeded18, '1'); assert.equal(st.agenda_demo_seeded19, '1');
  assert.equal(JSON.parse(st['agendasueno3:caso-normal']).ver, '4.9.9');
  assert.equal(JSON.parse(st['agendasueno3:caso-seg-tcci']).ver, '5.0.0');
  const app2 = await loadApp({ storage: Object.assign({}, st, { 'agendasueno3:caso-normal': JSON.stringify(Object.assign(JSON.parse(st['agendasueno3:caso-normal']), { name: 'tocado' })) }) });
  await loginDoctor(app2);
  assert.equal(JSON.parse(app2.storage()['agendasueno3:caso-normal']).name, 'tocado');
  // un navegador con las marcas 17 y 18 (v5.0.0 ya abierta antes): solo se cargan los casos de evolución (marca 19)
  const st3 = {};
  Object.keys(st).forEach(k => { if (!/^agendasueno3:caso-evo-/.test(k) && k !== 'agenda_demo_seeded19') st3[k] = st[k]; });
  st3.agenda_patient_index3 = JSON.stringify(JSON.parse(st.agenda_patient_index3).filter(x => !x.id.startsWith('caso-evo-')));
  st3['agendasueno3:caso-seg-nino'] = JSON.stringify(Object.assign(JSON.parse(st['agendasueno3:caso-seg-nino']), { name: 'tocado' }));
  const app3 = await loadApp({ storage: st3 });
  await loginDoctor(app3);
  const st4 = app3.storage();
  assert.equal(st4.agenda_demo_seeded19, '1');
  assert.equal(JSON.parse(st4.agenda_patient_index3).filter(x => x.id.startsWith('caso-evo-')).length, 14);
  assert.equal(JSON.parse(st4['agendasueno3:caso-evo-03-mixta']).diarios.length, 2);
  assert.equal(JSON.parse(st4['agendasueno3:caso-seg-nino']).name, 'tocado');   // los de la marca 18 no se tocan
  assert.deepEqual(app.errors, []); assert.deepEqual(app2.errors, []); assert.deepEqual(app3.errors, []);
});

test('varios diarios: nuevo diario (sin solaparse), abrir otro, etiqueta e intervención, borrar; versión necesaria', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await pacienteConDiario(app, 'pac-multi', '2025-03-03');
  const rec = async () => JSON.parse(await app.ev(`load('pac-multi').then(r=>JSON.stringify(r))`));
  assert.equal((await rec()).ver, '4.9.9');   // un solo diario: compatible con la v4.9.9
  // un diario nuevo no puede solaparse con los anteriores
  let r = await app.ev(`crearDiarioNuevo({inicio:'2025-03-17',etiqueta:'x',intervencion:''})`);
  assert.equal(r.ok, false); assert.match(r.motivo, /se solapan con el diario que empieza el 03\/03\/2025/);
  r = await app.ev(`crearDiarioNuevo({inicio:'2025-05-05',etiqueta:'Tras TCC-I',intervencion:'Restricción de sueño'})`);
  assert.equal(r.ok, true);
  let R = await rec();
  assert.equal(R.ver, '5.0.0'); assert.equal(R.start, '2025-05-05');
  assert.equal(R.diario.etiqueta, 'Tras TCC-I'); assert.equal(R.diario.intervencion, 'Restricción de sueño');
  assert.equal(R.diarios.length, 1); assert.equal(R.diarios[0].inicio, '2025-03-03');
  assert.equal(R.diarios[0].state.filter(d => d.gd).length, 21);
  assert.equal(app.ev('_diasConDatos(state)'), 0);
  assert.equal(app.ev(`getStartInput().value`), '2025-05-05');
  // se anota en el diario nuevo y se abre el anterior: lo anotado se guarda con su diario
  app.ev(`AgendaPuente.guardar(0,{gd:{b:'00:00',s:15,w:[],f:'06:30',r:'06:30'},ev:[],sie:null,qs:4,qd:4,qe:4,trat:'',obs:''})`);
  const idAnt = app.ev('diariosPac[0].id');
  await app.ev(`abrirDiario('${idAnt}')`);
  R = await rec();
  assert.equal(R.start, '2025-03-03'); assert.equal(R.diarios[0].inicio, '2025-05-05');
  assert.equal(R.diarios[0].state[0].gd.b, '00:00');
  assert.equal(app.ev('_diasConDatos(state)'), 21);
  assert.equal(app.ev(`document.querySelector('#diarioSel option:checked').textContent`), 'Diario 1 · 03/03/2025');
  // etiqueta e intervención del diario abierto, desde su ventana
  app.ev(`dialogoDiario('editar')`);
  app.doc.getElementById('dlgEtiqueta').value = 'Basal';
  app.doc.getElementById('dlgOk').click(); await app.sleep(150);
  assert.equal((await rec()).diario.etiqueta, 'Basal');
  assert.match(app.ev(`document.querySelector('#diarioSel option:checked').textContent`), /Diario 1 · Basal/);
  // la ventana de un diario nuevo propone una fecha que no se solapa y avisa de los requisitos para comparar
  app.ev(`dialogoDiario('nuevo')`);
  assert.equal(app.doc.getElementById('dlgInicio').value, '2025-06-16');
  assert.match(app.doc.getElementById('diarioOverlay').textContent, /al menos 14 noches anotadas, con 2 fines de semana completos, y el mismo sistema de registro/);
  app.doc.getElementById('dlgInicio').value = '2025-03-10';
  app.doc.getElementById('dlgOk').click(); await app.sleep(100);
  assert.match(app.doc.getElementById('dlgError').textContent, /se solapan/);
  app.doc.getElementById('dlgCancelar').click();
  // borrar el diario abierto: se abre el que queda y el paciente vuelve a tener un solo diario (v4.9.9)
  assert.equal(await app.ev('eliminarDiarioAbierto()'), true);
  R = await rec();
  assert.equal(R.start, '2025-05-05'); assert.deepEqual(R.diarios, []); assert.equal(R.ver, '5.0.0');   // conserva la etiqueta
  await app.ev(`editarDiarioAbierto({etiqueta:'',intervencion:''})`);
  assert.equal((await rec()).ver, '4.9.9');
  // los casos de ejemplo no pierden diarios
  await app.ev(`selectPatient('caso-seg-tcci')`);
  assert.equal(await app.ev('eliminarDiarioAbierto()'), false);
  assert.deepEqual(app.errors, []);
});

test('la v4.9.9 abre los pacientes de un solo diario de la v5.0.0 y no sobrescribe los de varios diarios', { skip: !fs.existsSync(RAIZ_499) }, async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await pacienteConDiario(app, 'pac-uno', '2025-03-03');
  await pacienteConDiario(app, 'pac-varios', '2025-03-03');
  await app.ev(`crearDiarioNuevo({inicio:'2025-05-05',etiqueta:'Seguimiento',intervencion:''})`);
  const v4 = await loadApp({ file: RAIZ_499, storage: app.storage(), quiet: true });
  await loginDoctor(v4);
  assert.equal(v4.ev('APP_VERSION'), '4.9.9');
  await v4.ev(`selectPatient('pac-uno')`);
  assert.equal(v4.ev('_diasConDatos(state)'), 21);
  assert.equal(await v4.ev(`saveRec('pac-uno',Object.assign({},{patient:'pac-uno',name:'x',start:'2025-03-03',state}))`), true);
  await v4.ev(`selectPatient('pac-varios')`);
  assert.equal(await v4.ev(`saveRec('pac-varios',{patient:'pac-varios',name:'x',start:'2025-05-05',state})`), false);   // no pierde los demás diarios
  assert.match(v4.doc.getElementById('avisoVersion').textContent, /versión 5\.0\.0, posterior a esta/);
  assert.equal(JSON.parse(v4.storage()['agendasueno3:pac-varios']).diarios.length, 1);
  assert.deepEqual(app.errors, []);
});

test('importar: un diario de otras fechas se añade como diario nuevo; uno que se solapa con un diario guardado va a ese diario', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await pacienteConDiario(app, 'pac-imp', '2025-03-03', { salta: [20] });
  app.ev(`dialogoDiario('editar')`); app.doc.getElementById('dlgEtiqueta').value = 'Basal'; app.doc.getElementById('dlgOk').click(); await app.sleep(150);
  const csvA = app.ev('buildUnifiedCsv()');
  assert.match(csvA, /\ndiario_etiqueta;Basal\r?\n/); assert.match(csvA, /\ndiario_intervencion;\r?\n/);
  await app.ev(`crearDiarioNuevo({inicio:'2025-05-05',etiqueta:'Tras TCC-I',intervencion:''})`);
  const importa = async (txt) => { app.ev(`handleRawFile(new File([${JSON.stringify(txt)}],'d.csv',{type:'text/csv'}))`); await app.sleep(600); };
  const rec = async () => JSON.parse(await app.ev(`load('pac-imp').then(r=>JSON.stringify(r))`));
  // el CSV del diario basal con una noche más (la 21.ª): va al diario basal y el abierto sigue siendo el nuevo
  const lineas = csvA.split('\n'); const i20 = lineas.findIndex(l => /^21;/.test(l)), i19 = lineas.findIndex(l => /^20;/.test(l));
  assert.ok(i20 > 0 && i19 > 0);
  const c20 = lineas[i19].split(';'); c20[0] = '21'; c20[1] = lineas[i20].split(';')[1];
  lineas[i20] = c20.join(';');
  await importa(lineas.join('\n'));
  let R = await rec();
  assert.equal(R.start, '2025-05-05'); assert.equal(R.diarios.length, 1);
  assert.equal(R.diarios[0].state.filter(d => d.gd).length, 21);
  assert.match(app.doc.getElementById('toast').textContent, /es del diario que empieza el 03\/03\/2025: se ha añadido a ese diario/);
  // un CSV de unas fechas que no se solapan con ninguno: diario nuevo (con su etiqueta) y se abre
  const otro = csvA.replace(/\ninicio_registro;2025-03-03/, '\ninicio_registro;2025-09-01').replace(/\ndiario_etiqueta;Basal/, '\ndiario_etiqueta;Seguimiento');
  await importa(otro);
  R = await rec();
  assert.equal(R.start, '2025-09-01'); assert.equal(R.diario.etiqueta, 'Seguimiento');
  assert.deepEqual(R.diarios.map(d => d.inicio).sort(), ['2025-03-03', '2025-05-05']);
  assert.match(app.doc.getElementById('toast').textContent, /se ha añadido como diario nuevo del paciente \(desde el 01\/09\/2025\)/);
  assert.equal(app.doc.querySelectorAll('#diarioSel option').length, 3);
  // un CSV del diario abierto se fusiona con él, como siempre
  const n0 = R.diarios.length;
  await importa(app.ev('buildUnifiedCsv()'));
  assert.equal((await rec()).diarios.length, n0);
  // JSON: etiqueta e intervención
  let json = null; app.ev(`window.__dl=dl; dl=(c,n)=>{ window.__json=c; }`); app.doc.getElementById('exportJson').click();
  json = JSON.parse(app.ev('window.__json'));
  assert.deepEqual(json.diario, { etiqueta: 'Seguimiento', intervencion: '' });
  assert.deepEqual(app.errors, []);
});

test('móvil del paciente: un acceso con otra fecha de inicio (sin solaparse) empieza un diario nuevo y guarda el anterior', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const reg = (ini) => app.ev(`_registrarAccesoPaciente({pin:'ABCD2345',exp:'2099-01-01',id:'pac-movil',nombre:'Paciente móvil',sex:'F',nac:'1985-05-05',ini:'${ini}'})`);
  const rec = async () => JSON.parse(await app.ev(`load('pac-movil').then(r=>JSON.stringify(r))`));
  await reg('2025-03-03');
  let R = await rec(); assert.equal(R.start, '2025-03-03');
  // con noches anotadas
  await app.ev(`(async()=>{ const r=await load('pac-movil'); r.state[0]=Object.assign(blankDay(),{slots:Array(48).fill(null).map((_,k)=>k>=8&&k<20?'s':null),downs:[7],ups:[21]}); await saveRec('pac-movil',r); })()`);
  await reg('2025-03-10');   // se solapa: el mismo diario
  R = await rec(); assert.equal(R.start, '2025-03-03'); assert.ok(!R.diarios);
  await reg('2025-06-02');   // no se solapa: diario nuevo
  R = await rec();
  assert.equal(R.start, '2025-06-02'); assert.equal(R.diarios.length, 1); assert.equal(R.diarios[0].inicio, '2025-03-03');
  assert.equal(app.ev(`_diasConDatos(${JSON.stringify(R.state)})`), 0);
  assert.equal(app.ev(`_diasConDatos(${JSON.stringify(R.diarios[0].state)})`), 1);
  assert.equal(R.ver, '5.0.0');
  // un diario sin noches no se guarda: solo cambia la fecha
  await reg('2025-09-01');
  R = await rec(); assert.equal(R.start, '2025-09-01'); assert.equal(R.diarios.length, 1);
  assert.deepEqual(app.errors, []);
});

test('aptitud para comparar: 14 noches, 2 fines de semana completos y el sistema de registro de cada diario', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-seg-retraso')`);
  let P = app.evj(`_perfilesPaciente().map(p=>({n:p.noches,f:p.findes,s:p.sistema,apto:p.apto,m:p.motivos}))`);
  assert.deepEqual(P[0], { n: 20, f: 3, s: 'editor', apto: true, m: [] });
  assert.deepEqual(P[1], { n: 11, f: 1, s: 'editor', apto: false, m: ['11 noches anotadas (mínimo 14)', '1 fin de semana completo (mínimo 2)'] });
  await app.ev(`selectPatient('caso-seg-tcci')`);
  P = app.evj(`_perfilesPaciente().map(p=>({s:p.sistema,apto:p.apto}))`);
  assert.deepEqual(P.map(p => p.s), ['rejilla', 'editor', 'editor', 'editor']);
  // 14 noches pero un solo fin de semana completo (falta la noche del sábado al domingo de la 2.ª semana, la fila 12)
  await pacienteConDiario(app, 'pac-apto', '2025-03-03', { salta: [6, 12, 14, 15, 16, 17, 18] });   // lunes 03/03/2025
  P = app.evj(`_perfilesPaciente().map(p=>({n:p.noches,f:p.findes,apto:p.apto,m:p.motivos}))`);
  assert.deepEqual(P[0], { n: 14, f: 1, apto: false, m: ['1 fin de semana completo (mínimo 2)'] });
  app.ev(`AgendaPuente.guardar(12,{gd:{b:'23:30',s:30,w:[],f:'06:45',r:'07:00'},ev:[],sie:null,qs:3,qd:3,qe:3,trat:'',obs:''})`);
  P = app.evj(`_perfilesPaciente().map(p=>({n:p.noches,f:p.findes,apto:p.apto}))`);
  assert.deepEqual(P[0], { n: 15, f: 2, apto: true });
  // sistema: editor (≥ 75 % de noches), rejilla (≤ 25 %), mixto (entre medias)
  app.ev(`[0,1,2,3,4,5,7].forEach(d=>{ delete state[d].gd; })`);
  assert.equal(app.ev(`_perfilesPaciente()[0].sistema`), 'mixto');
  app.ev(`state.forEach(d=>{ delete d.gd; })`);
  assert.equal(app.ev(`_perfilesPaciente()[0].sistema`), 'rejilla');
  assert.deepEqual(app.errors, []);
});

test('estadística: diferencia con IC del 95 % (Welch, noches efectivas), NAP y g de Hedges', async () => {
  const app = await loadApp();
  const t = x => app.ev(`_cmT(${x})`);
  assert.equal(t(10), 2.228); assert.equal(t(2), 4.303);
  assert.ok(Math.abs(t(30) - 2.042) < 0.002); assert.ok(Math.abs(t(1e6) - 1.960) < 0.001);
  // series sin autocorrelación positiva (alternas): noches efectivas = noches
  const A = [60, 40, 60, 40, 60, 40, 60, 40, 60, 40, 60, 40, 60, 40];
  const B = [20, 30, 20, 30, 20, 30, 20, 30, 20, 30, 20, 30, 20, 30];
  const r = app.evj(`compararSeries(${JSON.stringify(A)},${JSON.stringify(B)},-1)`);
  assert.equal(r.mA, 50); assert.equal(r.mB, 25); assert.equal(r.dif, -25);
  const sA = Math.sqrt(14 * 100 / 13), sB = Math.sqrt(14 * 25 / 13), se = Math.sqrt(sA * sA / 14 + sB * sB / 14);
  const df = (sA * sA / 14 + sB * sB / 14) ** 2 / ((sA * sA / 14) ** 2 / 13 + (sB * sB / 14) ** 2 / 13);
  const tq = app.ev(`_cmT(${df})`);
  assert.ok(Math.abs(r.ic[0] - (-25 - tq * se)) < 1e-9 && Math.abs(r.ic[1] - (-25 + tq * se)) < 1e-9);
  assert.equal(r.nap, 1);   // todas las noches de B (≤ 30) mejores que todas las de A (≥ 40)
  const sp = Math.sqrt((13 * sA * sA + 13 * sB * sB) / 26), J = 1 - 3 / (4 * 28 - 9);
  assert.ok(Math.abs(r.g - (-25 / sp * J)) < 1e-9);
  // NAP con empates: 0,5 si no cambia nada
  assert.equal(app.evj(`compararSeries([10,20,30],[10,20,30],1).nap`), 0.5);
  // autocorrelación positiva: menos noches efectivas, IC más ancho
  const lento = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43];
  assert.ok(app.ev(`_cmNef(${JSON.stringify(lento)})`) < 14);
  assert.equal(app.ev(`_cmNef(${JSON.stringify(A)})`), 14);
  assert.deepEqual(app.errors, []);
});

test('valoraciones y conclusión con los umbrales de la AASM, editables (y qué métricas cuentan para la respuesta)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  assert.deepEqual(app.evj('umbralesAASM()'), { sol: { u: 20, d: true }, waso: { u: 20, d: true }, nw: { u: 0.5, d: true }, tst: { u: 15, d: true },
    se: { u: 10, d: true }, qs: { u: 0.5, d: true }, qd: { u: 0.5, d: false }, qe: { u: 0.5, d: false } });
  await app.ev(`selectPatient('caso-seg-tcci')`);
  const comp = () => app.evj(`(()=>{ const P=_perfilesPaciente(); const C=compararDiarios(P,_seleccionPorDefecto(P)); return C.pares.map(p=>({tipo:p.tipo,A:p.A.dia.n,B:p.B.dia.n,g:p.global,v:Object.fromEntries(p.filas.map(r=>[r.M.k,r.val]))})); })()`);
  let C = comp();
  assert.deepEqual(C.map(p => [p.tipo, p.A, p.B, p.g]), [['ref', 2, 3, 'respuesta'], ['ref', 2, 4, 'respuesta'], ['anterior', 3, 4, 'respuesta']]);
  assert.equal(C[0].v.se, 'mej-rel'); assert.equal(C[0].v.sol, 'mej-rel'); assert.equal(C[0].v.tst, 'mej-nc');
  assert.equal(C[0].v.tib, 'cambio'); assert.equal(C[2].v.sol, 'igual'); assert.equal(C[2].v.tst, 'mej-rel');
  // valorarCambio: relevante y fiable / relevante no concluyente / pequeño y fiable / sin cambios / empeora
  const M = 'COMP_METRICAS.find(m=>m.k==="sol")', U = 'umbralesAASM()';
  const v = (dif, lo, hi) => app.ev(`valorarCambio({dif:${dif},ic:[${lo},${hi}],g:0},${M},${U})`);
  assert.equal(v(-25, -35, -15), 'mej-rel'); assert.equal(v(-25, -40, 5), 'mej-nc'); assert.equal(v(-10, -15, -5), 'mej-peq');
  assert.equal(v(-10, -20, 2), 'igual'); assert.equal(v(25, 15, 35), 'peor-rel'); assert.equal(v(25, -2, 50), 'peor-nc');
  // umbrales editados (desde el apartado): el TST pide 100 min; solo el TST cuenta para la respuesta → sin respuesta
  await analisis(app);
  app.doc.getElementById('cmpUmbralesBtn').click();
  const ins = k => app.doc.querySelector(`#cmpUmbrales .cmp-u[data-k="${k}"]`), chk = k => app.doc.querySelector(`#cmpUmbrales .cmp-d[data-k="${k}"]`);
  ins('tst').value = '100';
  ['sol', 'waso', 'nw', 'se', 'qs'].forEach(k => { chk(k).checked = false; });
  app.doc.getElementById('cmpUGuardar').click(); await app.sleep(50);
  const guardados = JSON.parse(app.storage().agenda_umbrales_comparacion);
  assert.equal(guardados.tst.u, 100); assert.equal(guardados.se.d, false);
  C = comp();
  assert.equal(C[0].v.tst, 'igual'); assert.equal(C[1].v.tst, 'mej-peq'); assert.equal(C[0].g, 'sin'); assert.equal(C[1].g, 'sin');
  assert.match(app.doc.getElementById('cmpBlock').textContent, /Umbrales de relevancia clínica \(editados\)/);
  assert.match(app.doc.getElementById('cmpBlock').textContent, /Umbrales editados por el profesional/);
  // restablecer los de la AASM
  app.doc.getElementById('cmpUAasm').click(); await app.sleep(50);
  assert.equal(app.storage().agenda_umbrales_comparacion, undefined);
  assert.equal(comp()[0].g, 'respuesta');
  assert.match(app.doc.getElementById('cmpBlock').textContent, /Umbrales de relevancia clínica \(AASM\)/);
  assert.deepEqual(app.errors, []);
});

test('apartado «Comparación de diarios del paciente»: tabla de diarios, casillas por sistema, abrir, resumen, evolución por métrica, gráficos, detalle y sus hojas apaisadas en el PDF', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-seg-tcci')`);
  await analisis(app);
  const blk = () => app.doc.getElementById('cmpBlock');
  assert.ok(blk().open);
  const filas = [...blk().querySelectorAll('table.cmp-diarios tbody tr')];
  assert.equal(filas.length, 4);
  const chk = [...blk().querySelectorAll('.cmp-chk')];
  assert.deepEqual(chk.map(c => [c.checked, c.disabled]), [[false, true], [true, false], [true, false], [true, false]]);
  assert.match(filas[0].textContent, /Rejilla de media hora.*Otro sistema de registro/s);
  assert.match(filas[3].textContent, /Seguimiento a los 3 meses \(abierto\).*Ventana ampliada/s);
  const txt = blk().textContent;
  // resumen: resultado del último diario frente a la referencia, los demás pares, el mantenimiento y la remisión
  const ver = blk().querySelector('.cmp-ver').textContent.replace(/\s+/g, ' ');
  assert.match(ver, /^ ?Respuesta D4 · Seguimiento a los 3 meses frente a D2 · Basal \(referencia\) Mejoría clínicamente relevante en latencia de sueño, WASO, despertares, tiempo total de sueño, eficiencia del sueño y calidad del sueño\. Ninguna métrica que cuenta para la respuesta empeora\./);
  assert.match(ver, /D3 · Tras TCC-I \(6 semanas\) frente a la referencia: respuesta/);
  assert.match(ver, /Frente al diario anterior \(D3 · Tras TCC-I \(6 semanas\)\): se mantiene/);
  assert.match(ver, /Remisión por diario: D2 no · D3 sí · D4 sí/);
  // las métricas más significativas: los cambios relevantes, por orden clínico (no por veces el umbral)
  const tarj = [...blk().querySelectorAll('.cmp-card')].map(c => c.querySelector('.cmp-card-n').textContent);
  assert.deepEqual(tarj, ['Latencia de sueño', 'WASO', 'Eficiencia del sueño', 'Tiempo total de sueño']);
  assert.match(blk().querySelector('.cmp-card').textContent.replace(/\s+/g, ' '), /59 → 15 min ✓ −44 min IC 95 %: −57 a −31 min Umbral −20 min · 2,2 veces Mejoría clínicamente relevante/);
  // evolución por métrica: una columna por diario, el cambio respecto a la referencia con su símbolo, y la remisión
  const mz = blk().querySelector('table.cmp-matriz');
  assert.deepEqual([...mz.querySelectorAll('thead th')].map(t => t.textContent.replace(/\s+/g, ' ').trim()),
    ['Métrica', 'D2 · Basalreferencia01/09/2025 · 20 noches', 'D3 · Tras TCC-I (6 semanas)20/10/2025 · 19 noches', 'D4 · Seguimiento a los 3 meses19/01/2026 · 17 noches', 'Umbral clínico']);
  const fila = n => [...mz.querySelectorAll('tbody tr')].find(tr => tr.querySelector('.cmp-m') && tr.querySelector('.cmp-m').textContent.startsWith(n));
  assert.deepEqual([...fila('Latencia de sueño').cells].slice(1).map(c => c.textContent.replace(/\s+/g, ' ').trim()), ['59', '16✓ −43 min', '15✓ −44 min', '−20 min']);
  assert.match(fila('Tiempo total de sueño').cells[2].textContent, /\? \+23 min/);   // D3: alcanza el umbral, no concluyente
  assert.deepEqual([...fila('Criterios de remisión').cells].slice(1, 4).map(c => c.textContent.trim()), ['No', 'Sí', 'Sí']);
  assert.equal(mz.querySelectorAll('tr.cmp-grupo').length, 4);
  // gráficos: cambio en veces el umbral, horario medio y noche a noche (latencia, WASO, tiempo de sueño, eficiencia)
  assert.equal(blk().querySelectorAll('svg.cmp-fp').length, 1);
  assert.equal(blk().querySelectorAll('svg.cmp-hz').length, 1);
  assert.equal(blk().querySelectorAll('svg.cmp-nn').length, 4);
  assert.match(blk().querySelector('svg.cmp-fp').textContent, /D3: −43 min · 2,2×.*D4: −44 min · 2,2×/s);
  assert.match(blk().querySelector('svg.cmp-hz').textContent, /D2 · Basal.*23:19.*07:33.*Cama 8h 14min · sueño 5h 40min · 69 %/s);
  // detalle estadístico: plegado en pantalla (se imprime siempre), con las tres comparaciones
  assert.match(txt, /D3 · Tras TCC-I \(6 semanas\) frente a D2 · Basal \(referencia\) Respuesta/);
  assert.match(txt, /D4 · Seguimiento a los 3 meses frente a D3 · Tras TCC-I \(6 semanas\) \(el anterior: ¿se mantiene\?\)/);
  assert.match(txt, /Se mantiene:/);
  assert.equal(blk().querySelectorAll('.cmp-detalle .cmp-par').length, 3);
  assert.doesNotMatch(app.doc.getElementById('cmpDetalle').className, /\bver\b/);
  app.doc.getElementById('cmpDetalleBtn').click();
  assert.match(app.doc.getElementById('cmpDetalle').className, /\bver\b/);
  assert.match(app.doc.getElementById('cmpDetalleBtn').textContent, /^▾ Ocultar el detalle estadístico \(3 comparaciones\)/);
  app.doc.getElementById('cmpDetalleBtn').click();
  assert.doesNotMatch(app.doc.getElementById('cmpDetalle').className, /\bver\b/);
  assert.deepEqual([...[...blk().querySelectorAll('.cmp-detalle .cmp-tabla tbody tr')][4].cells].map(c => c.textContent.replace(/\s+/g, ' ').trim()),
    ['Eficiencia del sueño ●', '69 ± 7', '92 ± 2', '+23,1 puntos', '+19,6 a +26,7 puntos', '±3,5 puntos', '1,00', '4,47', '+10 puntos', 'Mejoría clínicamente relevante']);
  assert.match(txt, /Edinger et al\., 2021/); assert.match(txt, /Parker y Vannest, 2009/); assert.match(txt, /Lichstein et al\., 2003/);
  // quitar el diario 3: queda una sola comparación
  chk[2].checked = false; chk[2].dispatchEvent(new app.win.Event('change', { bubbles: true })); await app.sleep(50);
  assert.equal(blk().querySelectorAll('.cmp-par').length, 1);
  assert.doesNotMatch(blk().querySelector('.cmp-ver').textContent, /diario anterior/);
  assert.deepEqual(app.evj('compSel.ids').length, 2);
  // con todos quitados se pueden elegir los de otro sistema (el antiguo, en la rejilla), pero solo hay uno: no compara
  [...blk().querySelectorAll('.cmp-chk')].forEach(c => { if (c.checked) { c.checked = false; } });
  blk().querySelector('.cmp-chk').dispatchEvent(new app.win.Event('change', { bubbles: true })); await app.sleep(50);
  assert.equal(blk().querySelector('.cmp-chk').disabled, false);
  assert.match(blk().textContent, /Elige al menos dos diarios aptos del mismo sistema de registro/);
  assert.match(blk().className, /noprint/);
  // el motor tampoco compara sistemas distintos
  const err = app.evj(`(()=>{ const P=_perfilesPaciente(); return compararDiarios(P,P.map(p=>p.dia.id)).error; })()`);
  assert.match(err, /Solo se pueden comparar diarios con el mismo sistema de registro: Rejilla de media hora y Editor de la noche/);
  // «Abrir» abre ese diario
  blk().querySelector('.cmp-abrir[data-id]').click(); await app.sleep(400);
  assert.equal(app.ev('getStartInput().value'), '2024-10-07');
  // PDF: la comparación, en su hoja, tras la primera (con el diario 4 abierto y los diarios por defecto)
  await app.ev(`abrirDiario(diariosPac.find(x=>x.etiqueta==='Seguimiento a los 3 meses').id)`); await app.sleep(400);
  app.ev('compSel={pid:null,ids:null}'); await analisis(app);
  assert.equal(blk().querySelectorAll('.cmp-detalle .cmp-par').length, 3);
  app.win.print = () => {};
  app.ev(`printView('analisis')`);
  const orden = app.evj(`[...document.querySelectorAll('#analisisContent>*')].map(e=>e.dataset.sectitle||e.id||((e.querySelector('.kgh')||{}).textContent||'').trim())`);
  const i = orden.indexOf('Comparación de diarios');
  assert.ok(i > 0 && /Duración y continuidad/.test(orden[i - 1]), orden.join(' | '));
  assert.match(app.ev(`document.getElementById('cmpBlock').className`), /pg-salto/);
  // en hojas apaisadas (página con nombre). El pie de página va en el margen de cada hoja si el navegador lo admite
  // (Chromium; comprobado con el PDF real); jsdom no lo admite: se queda el pie de siempre, sin errores
  const ps = app.ev(`document.getElementById('pageOrientStyle').textContent`);
  assert.match(ps, /@page comparacion\{size:A4 landscape;margin:9mm 10mm 13mm\}/);
  assert.equal(app.doc.getElementById('piePaginasStyle'), null);
  assert.doesNotMatch(app.doc.body.className, /pie-paginas/);
  const css = app.ev(`[...document.querySelectorAll('style')].map(s=>s.textContent).join('\\n')`);
  assert.match(css, /body\[data-print="analisis"\] #cmpBlock\{page:comparacion\}/);
  assert.match(css, /body\[data-print="analisis"\] #cmpBlock \.cmp-detalle\{display:block!important/);
  app.win.dispatchEvent(new app.win.Event('afterprint'));
  assert.equal(app.ev(`document.getElementById('pageOrientStyle').textContent`), '');
  // un paciente de un solo diario: sin apartado (ni hoja en el PDF)
  await app.ev(`selectPatient('caso-normal')`); await analisis(app);
  assert.equal(blk(), null);
  // un diario no apto (el de la melatonina, corto): no se elige y el apartado lo explica, pero no se imprime
  await app.ev(`selectPatient('caso-seg-retraso')`); await analisis(app);
  assert.match(blk().textContent, /No apto: 11 noches anotadas \(mínimo 14\); 1 fin de semana completo \(mínimo 2\)/);
  assert.match(blk().textContent, /Elige al menos dos diarios aptos/);
  assert.match(blk().className, /noprint/);
  assert.deepEqual(app.errors, []);
});

test('informe clínico provisional: evolución respecto a los diarios anteriores comparables (y en las conclusiones)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const informe = async (id) => { await app.ev(`selectPatient('${id}')`); await analisis(app, false);
    return app.ev(`(document.querySelector('#analisisContent details[data-sectitle="Informe clínico provisional"]')||{}).textContent||''`); };
  let inf = await informe('caso-seg-tcci');
  assert.match(inf, /Evolución respecto a los diarios anteriores/);
  assert.match(inf, /Este diario \(Diario 4 · Seguimiento a los 3 meses, desde el 19\/01\/2026; Ventana ampliada \(23:30–07:00\), sin restricción\) frente a Diario 2 · Basal \(desde el 01\/09\/2025\): respuesta: latencia de sueño 59 → 15 min \(−44 min; IC 95 %: −57 min a −31 min\)/);
  assert.match(inf, /Respecto al diario anterior \(Diario 3 · Tras TCC-I \(6 semanas\)\), se mantiene\./);
  assert.match(inf, /Cumple los criterios de remisión por diario/);
  assert.match(inf, /También mejoran de forma clínicamente relevante: calidad al despertar y estado durante el día\./);
  assert.match(inf, /Respecto al diario de referencia, hay respuesta a la intervención\./);   // en las conclusiones
  assert.doesNotMatch(inf, /Diario antiguo/);   // el de la rejilla no es comparable
  // el informe de un diario anterior solo se compara con los anteriores a él (el basal no tiene)
  const idBasal = app.ev(`diariosPac.find(x=>x.etiqueta==='Basal').id`);
  await app.ev(`abrirDiario('${idBasal}')`); await analisis(app, false);
  assert.doesNotMatch(app.ev(`document.querySelector('#analisisContent details[data-sectitle="Informe clínico provisional"]').textContent`), /Evolución respecto/);
  assert.doesNotMatch(await informe('caso-seg-retraso'), /Evolución respecto/);   // el diario abierto no es apto
  assert.doesNotMatch(await informe('caso-normal'), /Evolución respecto/);
  assert.match(await informe('caso-seg-nino'), /Tras la extinción gradual.*respuesta: latencia de sueño 69 → 14 min/s);
  assert.deepEqual(app.errors, []);
});

test('Excel del paciente: hoja «Comparación»; Word del análisis: la comparación, como imagen (y su texto, sin html2canvas)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-seg-nino')`);
  const hojas = {};
  app.win.XLSX = { utils: { book_new: () => ({}), aoa_to_sheet: a => a, book_append_sheet: (wb, ws, n) => { hojas[n] = ws; } }, writeFile: () => {} };
  app.ev('exportExcel()');
  const c = hojas['Comparación'].map(f => [...f]);
  assert.match(c[0][0], /Comparación de diarios del paciente \(v5\.0\.0\)/);
  assert.deepEqual(c[1], ['Umbrales', 'AASM 2021 (Edinger et al.)']);
  assert.equal(c.filter(f => f[0] === 'D1' || f[0] === 'D2').length, 2);
  const i = c.findIndex(f => f[0] === 'D2 frente a D1 (referencia)');
  assert.equal(c[i][1], 'Respuesta');
  assert.deepEqual(c[i + 1].slice(0, 4), ['Métrica', 'Unidad', 'Media D1', 'Media D2']);
  assert.equal(c[i + 2][0], 'Latencia de sueño'); assert.equal(c[i + 2][10], 'Mejoría clínicamente relevante');
  // resumen: la media de cada diario y la valoración del cambio respecto a la referencia
  const r = c.findIndex(f => f[0] === 'Resumen');
  assert.ok(r > 0 && r < i);
  assert.deepEqual(c[r], ['Resumen', 'D2 frente a D1 (referencia)', 'Respuesta']);
  assert.deepEqual(c[r + 1], ['Métrica', 'Unidad', 'Media D1 (referencia)', 'Media D2', 'Cambio D2', 'Umbral']);
  assert.equal(c[r + 2][0], 'Latencia de sueño'); assert.equal(c[r + 2][4], 'Mejoría clínicamente relevante'); assert.equal(c[r + 2][5], 20);
  assert.deepEqual(c.find(f => f[0] === 'Remisión por diario').slice(2, 4), ['No', 'Sí']);
  // un paciente de un solo diario: sin hoja
  await app.ev(`selectPatient('caso-normal')`); delete hojas['Comparación']; app.ev('exportExcel()');
  assert.equal(hojas['Comparación'], undefined);
  // Word: el título de la imagen de la comparación (captura simulada)
  await app.ev(`selectPatient('caso-seg-nino')`); await analisis(app);
  assert.equal(app.ev(`_wdTitulo(document.getElementById('cmpBlock'))`), 'Comparación de diarios');
  assert.equal(app.ev(`_wdEditable(document.getElementById('cmpBlock'))`), false);
  // el Word: la comparación, en su sección apaisada entre dos verticales (como en el PDF); el anexo, al final
  let D = null;
  { const B = app.win.Blob; app.win.Blob = function (parts, o) { return new B(parts, o); };
    app.win.URL.createObjectURL = () => 'blob:x'; app.win.URL.revokeObjectURL = () => {};
    const clic = app.win.HTMLAnchorElement.prototype.click; app.win.HTMLAnchorElement.prototype.click = function () {};
    try { await app.ev('exportAnalysisWord()'); } finally { app.win.Blob = B; app.win.HTMLAnchorElement.prototype.click = clic; }
    D = app.evj('window._ultimoWordAnalisis'); }
  assert.deepEqual(D.secciones.map(x => x.apaisada), [false, true, false, true]);
  const txt = bs => bs.map(b => b.t === 'p' ? b.runs.map(r => r.text || '').join('') : b.rows.map(r => r.cells.map(c => txt(c.blocks || [])).join(' ')).join(' ')).join(' ');
  assert.match(txt(D.secciones[1].bloques), /Comparación de diarios del paciente.*Resumen.*Respuesta.*Evolución por métrica.*Detalle estadístico de cada comparación/s);
  assert.doesNotMatch(txt(D.secciones[0].bloques), /Comparación de diarios del paciente/);
  assert.ok(!D.secciones[1].bloques[0].salto && !D.secciones[2].bloques[0].salto);   // cada sección empieza hoja: sin salto de más
  assert.deepEqual(app.errors, []);
});

// ---------- casos para estudiar la evolución (marca 19): cada uno da el resultado documentado en
// v5.0.0/docs/casos_evolucion_v5.0.0.md ----------
test('casos de evolución: aptitud, sistema, selección por defecto, conclusiones, mantenimiento, remisión y valoraciones clave', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const caso = async id => { await app.ev(`selectPatient('${id}')`);
    return app.evj(`(()=>{ const P=_perfilesPaciente(), C=compararDiarios(P,_seleccionPorDefecto(P));
      const v=(p,k)=>(p.filas.find(r=>r.M.k===k)||{}).val;
      return {d:P.map(p=>({n:p.dia.n,sis:p.sistema,noches:p.noches,findes:p.findes,apto:p.apto,rem:p.remision?p.remision.ok:null})),
        sel:_seleccionPorDefecto(P).map(i=>P.find(p=>p.dia.id===i).dia.n),error:C.error,
        p:(C.pares||[]).map(p=>({par:p.B.dia.n+'-'+p.A.dia.n+(p.tipo==='ref'?'':'a'),g:p.global,peor:p.peor.length,v:Object.fromEntries(p.filas.map(r=>[r.M.k,r.val])),av:p.avisos.length}))}; })()`); };
  const G = r => r.p.map(p => p.par + ':' + (p.par.endsWith('a') ? (p.peor ? 'pérdida' : 'mantiene') : p.g));
  let r = await caso('caso-evo-01-respuesta');
  assert.deepEqual(G(r), ['2-1:respuesta']); assert.equal(r.p[0].v.sol, 'mej-rel'); assert.equal(r.p[0].v.se, 'mej-peq'); assert.deepEqual(r.d.map(x => x.rem), [false, true]);
  r = await caso('caso-evo-02-sin-remision');
  assert.deepEqual(G(r), ['2-1:respuesta']); assert.equal(r.p[0].v.waso, 'mej-rel'); assert.deepEqual(r.d.map(x => x.rem), [false, false]);
  r = await caso('caso-evo-03-mixta');
  assert.deepEqual(G(r), ['2-1:mixta', '3-1:respuesta', '3-2a:mantiene']); assert.equal(r.p[0].v.tst, 'peor-rel'); assert.equal(r.p[0].v.tib, 'cambio'); assert.equal(r.p[2].v.lat, 'peor-peq');
  r = await caso('caso-evo-04-empeora');
  assert.deepEqual(G(r), ['2-1:empeora', '3-1:sin', '3-2a:mantiene']);
  r = await caso('caso-evo-05-sin-cambios');
  assert.deepEqual(G(r), ['2-1:sin']); assert.equal(r.p[0].v.sol, 'peor-nc');
  r = await caso('caso-evo-06-pequena');
  assert.deepEqual(G(r), ['2-1:sin']); assert.equal(r.p[0].v.waso, 'mej-peq'); assert.deepEqual(r.d.map(x => x.rem), [false, true]);
  r = await caso('caso-evo-07-no-concluyente');
  assert.deepEqual(G(r), ['2-1:sin', '3-1:respuesta', '3-2a:mantiene']); assert.equal(r.p[0].v.sol, 'mej-nc'); assert.equal(r.p[1].v.sol, 'mej-rel');
  assert.deepEqual([r.d[1].noches, r.d[1].findes, r.d[1].apto], [14, 2, true]);
  r = await caso('caso-evo-08-recaida');
  assert.deepEqual(G(r), ['2-1:respuesta', '3-1:sin', '3-2a:pérdida']); assert.deepEqual(r.d.map(x => x.rem), [false, true, false]);
  r = await caso('caso-evo-09-calidad');
  assert.deepEqual(G(r), ['2-1:respuesta']); assert.deepEqual(Object.entries(r.p[0].v).filter(([, v]) => v === 'mej-rel').map(([k]) => k), ['qs']);
  r = await caso('caso-evo-10-bebe');
  assert.deepEqual(G(r), ['2-1:respuesta']); assert.equal(r.p[0].v.nw, 'mej-rel');
  r = await caso('caso-evo-11-sistemas');
  assert.deepEqual(r.d.map(x => x.sis), ['editor', 'editor', 'mixto']); assert.deepEqual(r.sel, [3]); assert.deepEqual(r.p, []);
  r = await caso('caso-evo-12-aptitud');
  assert.deepEqual(r.d.map(x => [x.noches, x.findes, x.apto]), [[21, 3, true], [16, 1, false], [14, 2, true], [13, 2, false]]);
  assert.deepEqual(r.sel, [1, 3]); assert.deepEqual(G(r), ['3-1:sin']); assert.equal(r.p[0].v.tst, 'mej-nc'); assert.equal(r.p[0].v.qd, 'mej-rel');
  r = await caso('caso-evo-13-vacaciones');
  assert.deepEqual(G(r), ['2-1:respuesta']); assert.equal(r.p[0].v.tst, 'mej-rel');
  assert.match(app.evj(`(()=>{ const P=_perfilesPaciente(); return compararDiarios(P,_seleccionPorDefecto(P)).pares[0].avisos.join(' '); })()`), /noches antes de festivo distinta \(29 % frente a 100 %\)/);
  r = await caso('caso-evo-14-basal-tendencia');
  assert.deepEqual(G(r), ['2-1:respuesta']); assert.equal(r.p[0].v.sol, 'mej-nc'); assert.equal(r.p[0].v.se, 'mej-nc');
  assert.deepEqual(app.errors, []);
});
