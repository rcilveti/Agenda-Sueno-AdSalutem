// Pruebas de la versión 4.9.7 que siguen en la v4.9.9: recordatorio diario (.ics), validación de las respuestas de la noche,
// tendencias, desviaciones respecto al patrón propio y resumen para la consulta. La v4.9.9 quita el registro guiado (lo
// recoge el editor de la noche), los factores (los recogen los acontecimientos), la ventana de sueño y los hitos.
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

// ---------- factores (etiquetas) ----------
// ---------- ventana de sueño e hitos ----------
// ---------- análisis ----------
test('patrón propio: se señalan las noches que se apartan de sus noches comparables (v4.9.9: todo el diario es un periodo)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const nDesv = async id => { await app.ev(`selectPatient('${id}')`); return app.evj('analysisData().nochesDesv'); };
  assert.deepEqual(await nDesv('caso-normal'), []);
  assert.deepEqual(await nDesv('caso-ins-conciliacion'), []);     // media hora arriba o abajo no es desviación
  assert.deepEqual(await nDesv('caso-trabajo-turnos'), []);
  // sin hitos, las noches basales de la TCC-I se comparan con todo el diario: la latencia de 90 min del día 5 ya destaca
  assert.equal(app.evj('periodosDiario().cortes.length'), 0);
  assert.deepEqual(await nDesv('caso-tcci'), [4, 5, 6, 12]);       // día 5 (latencia), fin de semana basal y la noche de la cena
  const L4 = app.evj('analysisData().desv.lista').filter(x => x.d === 4);
  assert.equal(L4[0].k, 'sol'); assert.equal(Math.round(L4[0].dev), 70);
  const L = app.evj('analysisData().desv.lista').filter(x => x.d === 12);
  assert.equal(L[0].k, 'tst'); assert.equal(Math.round(L[0].dev), -115);   // a minuto (la rejilla daba −120)
  // con menos de 7 noches no se calcula
  app.ev(`for(let d=6;d<21;d++){state[d].slots=new Array(48).fill(null);state[d].downs=[];state[d].ups=[];}`);
  assert.equal(app.evj('analysisData().desv.insuficiente'), true);
  assert.deepEqual(app.errors, []);
});

test('análisis: resumen para la consulta y tendencias, sin ventana ni hitos (v4.9.9)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  app.ev('renderAnalysis()');
  const res = app.doc.getElementById('resConsulta');
  assert.ok(res, 'resumen para la consulta');
  assert.match(res.textContent, /21 de 21 noches con datos/);
  assert.doesNotMatch(res.textContent, /con preguntas|registro guiado|Ventana|noches dentro|Inicio de TCC-I|Plan y factores/);
  assert.match(res.textContent, /Acontecimientos y tratamiento/);
  const tr = app.doc.querySelectorAll('#analisis .trends svg');
  assert.ok(tr.length >= 4, 'gráficos de tendencia');
  assert.ok(!app.doc.querySelector('#analisis .trends').innerHTML.includes('#e0941f'), 'sin líneas de hitos');
  // evolución: la eficiencia mejora de la semana 1 a la 3
  const w = app.evj('analysisData().weeks.map(x=>Math.round(x.se))');
  assert.ok(w[2] - w[0] >= 15, `eficiencia ${w}`);
  assert.equal(app.evj('analysisData().gdDecl'), null);   // v4.9.9: las métricas ya salen de lo anotado a minuto
  assert.equal(app.evj('analysisData().all.filter(x=>x.fuente==="editor").length'), 21);
  assert.deepEqual(app.errors, []);
});

test('análisis: Excel con el patrón propio y los acontecimientos por tipo; base de datos sin ventana ni hitos (v4.9.9)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-tcci')`);
  const hojas = {};
  app.win.XLSX = { utils: { book_new: () => ({}), aoa_to_sheet: a => a, book_append_sheet: (wb, ws, n) => { hojas[n] = ws; } }, writeFile: () => {} };
  app.ev('exportExcel()');
  const a2 = hojas['Análisis'];
  assert.ok(a2.some(r => r[0] === 'PATRÓN PROPIO Y ACONTECIMIENTOS ANOTADOS'));
  assert.ok(!a2.some(r => /PLAN|Ventana (de sueño )?objetivo|^Hito/.test(r[0] || '')));   // la ventana sugerida (TCC-I) es una métrica y sigue
  assert.deepEqual([...a2.find(r => r[0] === 'Noches anotadas en el editor').slice(0, 2)], ['Noches anotadas en el editor', 21]);
  const dia = hojas['Diario'];
  assert.deepEqual([...dia[0].slice(-6)], ['Estado día', 'Tratamiento', 'Observaciones', 'Acontecimientos (hora y tipo)', 'Respuestas del editor', 'Fuente']);
  assert.ok(dia.slice(1).every(r => r[r.length - 1] === 'Editor (a minuto)'));
  await app.ev('exportAllPatients()');
  const bd = hojas['Pacientes']; const i = bd[0].indexOf('Noches anotadas en el editor');
  assert.ok(i > 0);
  assert.deepEqual([...bd[0].slice(i)], ['Noches anotadas en el editor', 'Noches fuera de su patrón', 'Acontecimientos anotados (noches)']);
  const fila = bd.find(r => r[1] === 'caso-tcci');
  assert.deepEqual([...fila.slice(i, i + 2)], [21, 4]);
  assert.equal(fila.length, bd[0].length);
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
