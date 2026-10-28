// Pruebas de la versión 4.9.7: recordatorio diario (.ics), registro guiado (5 preguntas), factores de contexto,
// ventana de sueño e hitos, tendencias, desviaciones respecto al patrón propio y resumen para la consulta.
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
const rangos = (app, d) => app.ev(`slotsToRanges(state[${d}].slots,'s')`);

// ---------- registro guiado ----------
test('guiado: las respuestas pintan la rejilla conservando, redondeadas, latencia y despertares', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');`);
  // 23:50 a la cama, 30 min en dormirse, despierto 03:00–03:30, despertar final 06:30, levantarse 07:00
  let p = app.evj(`gdAplicar(4,{b:'23:50',s:30,w:[{t:'03:00',d:30,m:'bano'}],f:'06:30',r:'07:00'})`);
  assert.deepEqual(p.errores, []);
  assert.equal(rangos(app, 4), '00:30-03:00,03:30-06:30');
  assert.deepEqual(app.evj('[state[4].downs,state[4].ups]'), [[8], [22]]);
  const m = app.evj('dayMetrics(4)');
  assert.equal(m.sol, 30); assert.equal(m.waso, 30); assert.equal(m.wakeLat, 30);
  assert.equal(p.tib, 430); assert.equal(p.wake, 90); assert.equal(p.tst, 340);   // minutos exactos de las respuestas
  assert.ok(app.ev(`diaTags(state[4]).includes('bano')`), 'el motivo del despertar queda como factor');
  assert.ok(app.ev('_gdCoincide(4)'));
  // un despertar breve (10 min) no cabe en la rejilla, pero se guarda en las respuestas
  p = app.evj(`gdAplicar(5,{b:'23:00',s:15,w:[{t:'02:00',d:10}],f:'07:00',r:'07:00'})`);
  assert.equal(rangos(app, 5), '23:30-07:00');
  assert.equal(p.breves, 1);
  assert.equal(app.evj('state[5].gd').w[0].d, 10);
  // si se retoca la rejilla, las respuestas dejan de coincidir y el análisis ya no las usa
  app.ev(`state[5].slots[20]=null`);
  assert.equal(app.ev('_gdCoincide(5)'), false);
  assert.deepEqual(app.errors, []);
});

test('guiado: validación de las respuestas y noche de bebé que empieza antes de las 20:00', async () => {
  const app = await loadApp();
  app.ev(`initState();`);
  const err = g => app.evj(`gdPintar(${JSON.stringify(g)}).errores`);
  assert.equal(err({ b: '23:00', s: 10, w: [], f: '06:00', r: '05:00' }).length, 1);          // se levanta antes de despertarse
  assert.equal(err({ b: '23:00', s: 600, w: [], f: '06:00', r: '07:00' }).length, 1);          // latencia imposible
  assert.equal(err({ b: '23:00', s: 10, w: [{ t: '22:00', d: 20 }], f: '06:00', r: '07:00' }).length, 1); // despertar fuera de la noche
  assert.equal(err({ b: '23:00', s: 10, w: [{ t: '02:00', d: 60 }, { t: '02:30', d: 20 }], f: '06:00', r: '07:00' }).length, 1); // solapados
  const b = app.evj(`gdPintar({b:'19:40',s:15,w:[{t:'23:00',d:30}],f:'06:30',r:'07:00'})`);
  assert.deepEqual(b.errores, []);
  assert.equal(b.down, 47);   // a las 19:30: flecha en la última casilla de la fila
  assert.equal(app.evj(`gdPintar({b:'19:45',s:15,w:[],f:'06:30',r:'07:00'})`).down, 0);   // empate: a la media hora siguiente
});

test('guiado: el diálogo de 5 preguntas guarda la noche y propone la anterior', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2026-03-02T00:00:00');buildBody();`);
  app.ev(`gdAplicar(2,{b:'23:20',s:25,w:[{t:'03:10',d:20,m:'bano'}],f:'06:40',r:'07:05'})`);
  app.ev('gdAbrir(3)');
  assert.ok(app.doc.getElementById('gdOvl').classList.contains('on'));
  const pref = app.evj('_gd.g');
  assert.equal(pref.b, '23:20'); assert.equal(pref.s, 25);   // propone los horarios de la noche anterior…
  assert.deepEqual(pref.w, []);                              // …pero no sus despertares
  app.ev('gdGuardar()');
  assert.equal(rangos(app, 3), '00:00-06:30');
  // tras guardar la noche, el último paso pide cómo durmió y cómo está (y los factores del día)
  assert.equal(app.ev('GD_PASOS[_gd.paso]'), 'dia');
  app.ev(`_gd.dia.qs=4;_gd.dia.qd=3;_gd.dia.qe=4;_gd.dia.tags=['cafe'];gdGuardarDia()`);
  assert.equal(app.doc.getElementById('gdOvl').classList.contains('on'), false);
  assert.deepEqual(app.evj('[state[3].qs,state[3].qd,state[3].qe,state[3].qsc,state[3].tags]'), [4, 3, 4, 5, ['cafe']]);
  assert.ok(app.ev('_gdCoincide(3)'));
  assert.deepEqual(app.errors, []);
});

// ---------- factores (etiquetas) ----------
test('factores: se anotan por día, viajan en el CSV y se comparan con los días sin ellos', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  assert.deepEqual(app.evj('diaTags(state[12])'), ['cena', 'alcohol']);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /;escala_calidad;etiquetas;guiado\n/);
  assert.match(csv, /^13;[^\n]*;cena alcohol;01:30\|20\|04:30\+30\|06:40\|07:00$/m);
  const st = app.evj(`rawImportText(${JSON.stringify(csv)}).state`);
  assert.deepEqual(st[12].tags, ['cena', 'alcohol']);
  assert.deepEqual(st[3].gd.w[0], { t: '03:15', d: 60, m: 'bano' });
  const fac = app.evj(`factoresResumen((()=>{const a=[];for(let d=0;d<DAYS;d++)a.push({d,...dayMetrics(d)});return a;})())`);
  const es = fac.find(f => f.k === 'estres');
  assert.equal(es.n, 3); assert.equal(es.comp, true);
  assert.ok(es.sol[0] > es.sol[1], 'latencia mayor los días con estrés');
  // etiquetas desconocidas o repetidas se descartan
  assert.deepEqual(app.evj(`diaTags({tags:['ruido','ruido','<b>']})`), ['ruido']);
  assert.deepEqual(app.errors, []);
});

test('factores: un CSV de la v4.9.5 (sin etiquetas ni guiado) se importa sin ellos', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  const csv = app.ev('buildUnifiedCsv()');
  const viejo = csv.replace(/;etiquetas;guiado\n/, '\n').replace(/^(\d+;.*);[^;\n]*;[^;\n]*$/gm, '$1')
    .replace(/^(ventanas_objetivo|hitos);.*\n/gm, '');
  const imp = app.evj(`rawImportText(${JSON.stringify(viejo)})`);
  assert.ok(imp.state.every(d => !d.tags && !d.gd));
  assert.equal(imp.state.filter(d => d.slots.some(Boolean)).length, 21);
});

// ---------- ventana de sueño e hitos ----------
test('plan: la ventana objetivo se dibuja en la rejilla, se mide la adherencia y viaja en el CSV y en el enlace', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  assert.deepEqual(app.evj('ventanaDe(10)'), { desde: 7, a: '00:30', l: '06:30' });
  assert.equal(app.evj('ventanaDe(3)'), null);
  assert.equal(app.doc.querySelectorAll('#gridBody tr[data-d="10"] .tw').length, 7);   // 00:30–06:30: un tramo por hora
  assert.equal(app.doc.querySelectorAll('#gridBody tr[data-d="10"] .tw.ini').length, 1);
  assert.equal(app.doc.querySelectorAll('#gridBody tr[data-d="3"] .tw').length, 0);
  assert.ok(app.doc.querySelector('#gridBody tr[data-d="7"]').classList.contains('hito'));
  const ad = app.evj(`adherenciaVentana((()=>{const a=[];for(let d=0;d<DAYS;d++)a.push({d,...dayMetrics(d)});return a;})())`);
  assert.equal(ad.n, 14); assert.equal(ad.ok, 13);   // la noche de la cena se acostó 1 h más tarde
  // CSV: metadatos y métricas
  const csv = app.ev('buildUnifiedCsv()');
  const imp = app.evj(`rawImportText(${JSON.stringify(csv)})`);
  assert.deepEqual(JSON.parse(imp.meta.ventanas_objetivo), [{ desde: 7, a: '00:30', l: '06:30' }, { desde: 14, a: '00:00', l: '06:30' }]);
  assert.equal(JSON.parse(imp.meta.hitos).length, 2);
  assert.match(csv, /^ventana_objetivo_noches_cumplidas;13\/14;/m);
  assert.match(csv, /^noches_modo_guiado;21;noches$/m);
  // enlace de acceso: parámetro con nombre &vt= (no posicional)
  assert.equal(app.ev(`ventanasACodigo(loadedVentanas)`), '7:0030-0630,14:0000-0630');
  assert.deepEqual(app.evj(`ventanasDeCodigo('7:0030-0630,14:0000-0630')`), [{ desde: 7, a: '00:30', l: '06:30' }, { desde: 14, a: '00:00', l: '06:30' }]);
  assert.deepEqual(app.evj(`ventanasDeCodigo('x,99:0000-0630,3:2500-0630')`), []);
  // los datos de la ficha se conservan aunque quien guarde no los traiga (autoguardado)
  await app.ev(`(async()=>{const r=JSON.parse(await rawGet(safeKey('caso-tcci')));delete r.ventanas;delete r.hitos;await saveRec('caso-tcci',r);})()`);
  const r = app.evj(`(async()=>JSON.parse(await rawGet(safeKey('caso-tcci'))))()`);
  assert.equal((await r).ventanas.length, 2);
  assert.deepEqual(app.errors, []);
});

// ---------- análisis ----------
test('patrón propio: se señalan las noches que se apartan de sus noches comparables, no la resolución de la rejilla', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const nDesv = async id => { await app.ev(`selectPatient('${id}')`); return app.evj('analysisData().nochesDesv'); };
  assert.deepEqual(await nDesv('caso-normal'), []);
  assert.deepEqual(await nDesv('caso-ins-conciliacion'), []);     // media hora arriba o abajo no es desviación
  assert.deepEqual(await nDesv('caso-trabajo-turnos'), []);       // cada turno se compara con su periodo (hitos)
  assert.deepEqual(await nDesv('caso-tcci'), [5, 6, 12]);          // fin de semana basal y la noche de la cena
  const L = app.evj('analysisData().desv.lista').filter(x => x.d === 12);
  assert.equal(L[0].k, 'tst'); assert.equal(Math.round(L[0].dev), -120);
  // con menos de 7 noches no se calcula
  app.ev(`for(let d=6;d<21;d++){state[d].slots=new Array(48).fill(null);state[d].downs=[];state[d].ups=[];}`);
  assert.equal(app.evj('analysisData().desv.insuficiente'), true);
  assert.deepEqual(app.errors, []);
});

test('análisis: resumen para la consulta, tendencias con hitos y ventana, e impresión del resumen', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  app.ev('renderAnalysis()');
  const res = app.doc.getElementById('resConsulta');
  assert.ok(res, 'resumen para la consulta');
  assert.match(res.textContent, /21 de 21 noches con datos/);
  assert.match(res.textContent, /21 con preguntas/);
  assert.match(res.textContent, /13\/14 noches dentro/);
  assert.match(res.textContent, /Día 8: Inicio de TCC-I/);
  const tr = app.doc.querySelectorAll('#analisis .trends svg');
  assert.ok(tr.length >= 4, 'gráficos de tendencia');
  assert.ok(app.doc.querySelector('#analisis .trends').innerHTML.includes('#e0941f'), 'líneas de los hitos');
  // evolución: la eficiencia mejora de la semana 1 a la 3
  const w = app.evj('analysisData().weeks.map(x=>Math.round(x.se))');
  assert.ok(w[2] - w[0] >= 15, `eficiencia ${w}`);
  const G = app.evj('analysisData().gdDecl');
  assert.equal(G.n, 21); assert.ok(G.sol < G.solRej, 'latencia declarada a minuto frente a la rejilla');
  assert.deepEqual(app.errors, []);
});

test('análisis: Excel con el plan, el patrón propio y los factores; base de datos con columnas nuevas', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  const hojas = {};
  app.win.XLSX = { utils: { book_new: () => ({}), aoa_to_sheet: a => a, book_append_sheet: (wb, ws, n) => { hojas[n] = ws; } }, writeFile: () => {} };
  app.ev('exportExcel()');
  const a2 = hojas['Análisis'];
  assert.ok(a2.some(r => r[0] === 'PLAN, PATRÓN PROPIO Y FACTORES ANOTADOS'));
  assert.ok(a2.some(r => r[0] === 'Factor anotado'));
  assert.ok(a2.some(r => /^Hito · día 8/.test(r[0] || '')));
  const dia = hojas['Diario'];
  assert.deepEqual([...dia[0].slice(-4)], ['Factores', 'Registro guiado', 'Ventana objetivo', 'Hito']);
  await app.ev('exportAllPatients()');
  const bd = hojas['Pacientes']; const i = bd[0].indexOf('Noches modo guiado');
  assert.ok(i > 0);
  const fila = bd.find(r => r[1] === 'caso-tcci');
  assert.deepEqual([...fila.slice(i)], [21, 3, fila[i + 2], '00:00–06:30', 93, 2]);
  assert.match(fila[i + 2], /^Estrés o preocupación 3; /);
  assert.deepEqual(app.errors, []);
});

// ---------- recordatorio ----------
test('recordatorio: archivo .ics sin datos del paciente, con repetición diaria y líneas de 75 octetos', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date(Date.now()+86400000);startDate.setHours(0,0,0,0);`);
  const ics = app.ev(`icsRecordatorio('08:30',true)`);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /RRULE:FREQ=DAILY;COUNT=21/);
  assert.match(ics, /BEGIN:VALARM\r\nACTION:DISPLAY\r\n.*\r\nTRIGGER:PT0M\r\nEND:VALARM/);
  // al desplegar las líneas no queda ninguna secuencia de escape partida
  const despl = ics.replace(/\r\n /g, '');
  assert.match(despl, /médico»\.\\nhttps:\/\//);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1 + 3);   // diario + uno por semana para enviarlo
  for (const l of ics.split('\r\n')) assert.ok(Buffer.byteLength(l, 'utf8') <= 75, 'línea larga: ' + l);
  assert.doesNotMatch(ics, /acc=|pin|caso-/i);
  const g = app.ev(`googleRecordatorioUrl('08:30')`);
  assert.match(g, /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
  assert.match(decodeURIComponent(g), /RRULE:FREQ=DAILY;COUNT=21/);
});

test('aviso de noche pendiente: solo para el paciente y solo si falta la última noche', async () => {
  const app = await loadApp();
  app.ev(`session={role:'patient'};patient='prueba';initState();const h=new Date();h.setHours(0,0,0,0);startDate=new Date(h.getTime()-3*86400000);buildBody();`);
  app.ev('actualizarAviso()');
  const bar = app.doc.getElementById('nudgeBar');
  assert.ok(bar.style.display !== 'none' && bar.textContent.length > 0, 'aviso visible');
  app.ev(`for(let d=0;d<3;d++){for(let i=6;i<22;i++)state[d].slots[i]='s';state[d].downs=[6];state[d].ups=[22];} actualizarAviso();`);
  assert.equal(app.doc.getElementById('nudgeBar').style.display, 'none');
  app.ev(`session={role:'doctor'};for(let i=6;i<22;i++)state[2].slots[i]=null;state[2].downs=[];state[2].ups=[];actualizarAviso();`);
  assert.equal(app.doc.getElementById('nudgeBar').style.display, 'none');
});

// ---------- casos de ejemplo ----------
test('casos de ejemplo: la mujer de 80 años registrada con preguntas reproduce su rejilla; el caso de TCC-I mejora', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-anciana-80')`);
  assert.equal(app.ev(`state.filter((d,i)=>d.gd&&_gdCoincide(i)).length`), 21);
  await app.ev(`selectPatient('caso-tcci')`);
  const s = app.evj('analysisData().weeks.map(w=>[Math.round(w.se),Math.round(w.sol)])');
  assert.ok(s[0][0] < 65 && s[2][0] >= 85, `eficiencia ${JSON.stringify(s)}`);
  assert.ok(s[2][1] < s[0][1], 'latencia');
  assert.deepEqual(app.evj('hitosValidos(loadedHitos).map(h=>h.dia)'), [7, 14]);
  assert.ok(app.ev(`state.filter(d=>d.slots.some(Boolean)).every(d=>[d.qs,d.qd,d.qe].every(v=>v>=1&&v<=5)&&d.qsc===5)`));
  assert.deepEqual(app.errors, []);
});

test('acceso del paciente: el QR lleva la ventana de sueño y el paciente la ve en su rejilla', async () => {
  const doc = await loadApp();
  await loginDoctor(doc);
  await doc.ev(`selectPatient('caso-tcci')`);
  await doc.ev(`crearCredencialPaciente('caso-tcci','TCC-I')`);
  const url = doc.ev(`_urlAccesoPaciente('caso-tcci',{name:'TCC-I',sex:'F',birth:'1968-03-14',start:'2025-06-02',ventanas:loadedVentanas})`);
  assert.match(url, /#acc=[^&]+&vt=7%3A0030-0630%2C14%3A0000-0630$/);
  // otro dispositivo (almacenamiento vacío) abre el enlace
  const pac = await loadApp({ url, bootDelay: 1500 });
  assert.equal(pac.ev('session&&session.role'), 'patient');
  // primer acceso en este dispositivo: tipo de dispositivo e información sobre los datos
  for (let i = 0; i < 30; i++) {
    const dev = pac.doc.getElementById('devPriv'); if (dev) { dev.click(); await pac.sleep(50); }
    const chk = pac.doc.getElementById('consentChk');
    if (chk) { chk.checked = true; chk.dispatchEvent(new pac.win.Event('change')); pac.doc.getElementById('consentYes').click(); await pac.sleep(800); break; }
    await pac.sleep(60);
  }
  assert.deepEqual(pac.evj('ventanasValidas(loadedVentanas)'), [{ desde: 7, a: '00:30', l: '06:30' }, { desde: 14, a: '00:00', l: '06:30' }]);
  assert.ok(pac.doc.querySelectorAll('#gridBody tr[data-d="9"] .tw').length > 0, 'ventana dibujada para el paciente');
  assert.deepEqual(pac.errors, []);
});

test('acceso: el mensaje de «Enviar» lleva el enlace directo, que abre el diario con la ficha y la ventana', async () => {
  let mensaje = null;
  const doc = await loadApp({ prompt: (m, d) => { mensaje = d; return null; } });
  await loginDoctor(doc);
  await doc.ev(`selectPatient('caso-tcci')`);
  await doc.ev(`(async()=>{const c=await crearCredencialPaciente('caso-tcci','TCC-I');mostrarCredencialNueva('TCC-I',c.pin,c.expires);})()`);
  doc.doc.getElementById('credMsgBtn').click();
  for (let i = 0; i < 40 && !mensaje; i++) await doc.sleep(50);
  assert.ok(mensaje, 'mensaje preparado');
  const url = (mensaje.match(/https?:\/\/\S+#acc=\S+/) || [])[0];
  assert.ok(url, 'el mensaje lleva el enlace de acceso directo');
  assert.match(url, /&vt=7%3A0030-0630%2C14%3A0000-0630$/);
  assert.match(mensaje, /Código de acceso: [A-Z0-9]{4}-[A-Z0-9]{4}/);
  // el paciente abre el enlace en su móvil
  const pac = await loadApp({ url, bootDelay: 1500 });
  for (let i = 0; i < 30; i++) {
    const dev = pac.doc.getElementById('devPriv'); if (dev) { dev.click(); await pac.sleep(50); }
    const chk = pac.doc.getElementById('consentChk');
    if (chk) { chk.checked = true; chk.dispatchEvent(new pac.win.Event('change')); pac.doc.getElementById('consentYes').click(); await pac.sleep(800); break; }
    await pac.sleep(60);
  }
  assert.equal(pac.ev('session&&session.role'), 'patient');
  assert.equal(pac.ev('getBirthInput().value'), '1968-03-14');
  assert.equal(pac.ev('getStartInput().value'), '2025-06-02');
  assert.equal(pac.ev('ventanasValidas(loadedVentanas).length'), 2);
  assert.deepEqual(pac.errors, []);
});
