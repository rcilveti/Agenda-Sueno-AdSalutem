// Pruebas de la v4.9.1: acceso con código (sin QR) y PDF del diario y del análisis.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

async function login(app, u, p) {
  app.doc.getElementById('luser').value = u;
  app.doc.getElementById('lpass').value = p;
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
async function pasarPrimerAcceso(app) {
  for (let i = 0; i < 30; i++) {
    const dev = app.doc.getElementById('devPriv');
    if (dev) { dev.click(); await app.sleep(50); }
    const chk = app.doc.getElementById('consentChk');
    if (chk) {
      chk.checked = true; chk.dispatchEvent(new app.win.Event('change'));
      app.doc.getElementById('consentYes').click();
      await app.sleep(400);
      return true;
    }
    await app.sleep(60);
  }
  return false;
}
// Crea un paciente con ficha y código en el «equipo del profesional» y devuelve el estado guardado
async function equipoProfesional() {
  const doc = await loadApp();
  await login(doc, 'medico', 'clinica');
  await doc.ev(`saveRec('maria-puig',{patient:'maria-puig',name:'María Puig',start:'2026-10-01',birth:'1985-05-05',sex:'F',cat:'dx',catDetail:null,state:Array.from({length:21},blankDay)}).then(()=>upsertIndex('maria-puig','María Puig'))`);
  const cred = await doc.evj(`crearCredencialPaciente('maria-puig','María Puig')`);
  return { doc, cred };
}

test('código con dígito de control (Luhn mod 32): todos los generados validan y un error de un carácter se rechaza', async () => {
  const app = await loadApp();
  const r = app.evj(`(()=>{let ok=0,det=0,tot=0;for(let k=0;k<300;k++){const c=generarCodigoAcceso();if(_codigoConControl(c))ok++;
      for(let i=0;i<8;i++){for(const ch of ACC_ALPHA){if(ch===c[i])continue;tot++;const m=c.slice(0,i)+ch+c.slice(i+1);if(!_codigoConControl(m))det++;}}}return {ok,det,tot};})()`);
  assert.equal(r.ok, 300);
  assert.equal(r.det, r.tot, 'todo error de un carácter debe detectarse');
});

test('la contraseña autocompletada del profesional no impide entrar con el código', async () => {
  const { doc, cred } = await equipoProfesional();
  doc.doc.getElementById('logoutBtn').click(); await doc.sleep(300);
  await login(doc, cred.pin.slice(0, 4) + '-' + cred.pin.slice(4), 'clinica');
  assert.ok(await pasarPrimerAcceso(doc));
  assert.equal(doc.ev('session.role'), 'patient');
  assert.equal(doc.ev('session.patientId'), 'maria-puig');
});

test('el código también vale escrito en el campo de contraseña', async () => {
  const { doc, cred } = await equipoProfesional();
  doc.doc.getElementById('logoutBtn').click(); await doc.sleep(300);
  await login(doc, '', cred.pin.toLowerCase());
  assert.ok(await pasarPrimerAcceso(doc));
  assert.equal(doc.ev('session.patientId'), 'maria-puig');
});

test('dispositivo nuevo sin QR: entra con el código, crea su diario y el profesional lo asocia a la ficha', async () => {
  const { doc, cred } = await equipoProfesional();
  // móvil del paciente: nunca ha escaneado el QR
  const movil = await loadApp();
  await login(movil, cred.pin.slice(0, 4) + ' ' + cred.pin.slice(4), '');
  assert.ok(await pasarPrimerAcceso(movil));
  const idProv = 'acceso-' + cred.pin.toLowerCase();
  assert.equal(movil.ev('session.patientId'), idProv);
  // anota una noche y envía el diario
  movil.ev(`state[0].slots[6]='s';state[0].slots[7]='s';state[0].cmt='primera noche';scheduleAutoSave();`);
  await movil.sleep(1000);
  const csv = movil.ev('buildUnifiedCsv()');
  assert.match(csv, new RegExp('acceso_pin;' + cred.pin));
  // el profesional importa el archivo: se guarda en la ficha de María, sin perder nombre ni nacimiento
  doc.ev(`handleRawFile(new File([${JSON.stringify(csv)}],'diario.csv',{type:'text/csv'}))`);
  await doc.sleep(1500);
  assert.equal(doc.ev('patient'), 'maria-puig');
  const rec = await doc.evj(`load('maria-puig')`);
  assert.equal(rec.name, 'María Puig');
  assert.equal(rec.birth, '1985-05-05');
  assert.equal(rec.cat, 'dx');
  assert.equal(rec.state[0].cmt, 'primera noche');
  const idx = await doc.evj('getIndex()');
  assert.equal(idx.some(x => x.id === idProv), false, 'no debe crearse un paciente duplicado');
  const acc = JSON.parse(doc.win.localStorage.getItem('agenda_accounts'));
  assert.equal(acc.patients[cred.pin].id, 'maria-puig', 'la cuenta del profesional no debe sobrescribirse');
});

test('si después escanea el QR, el diario abierto con el código pasa a su ficha', async () => {
  const { cred } = await equipoProfesional();
  const movil = await loadApp();
  await login(movil, cred.pin, '');
  assert.ok(await pasarPrimerAcceso(movil));
  movil.ev(`state[1].slots[8]='s';state[1].cmt='noche con código';scheduleAutoSave();`);
  await movil.sleep(1000);
  const hash = '#acc=' + [cred.pin, '2099-01-01T00:00:00.000Z', 'maria-puig', 'María Puig', 'F', '1985-05-05', '2026-10-01'].map(encodeURIComponent).join('~');
  const storage = {}; for (let i = 0; i < movil.win.localStorage.length; i++) { const k = movil.win.localStorage.key(i); storage[k] = movil.win.localStorage.getItem(k); }
  const movil2 = await loadApp({ storage, url: 'https://rcilveti.github.io/Agenda-Sueno-AdSalutem/' + hash });
  await pasarPrimerAcceso(movil2);   // en el navegador entra solo tras el QR (consentimiento ya dado)
  await movil2.sleep(500);
  const rec = await movil2.evj(`load('maria-puig')`);
  assert.equal(rec.state[1].cmt, 'noche con código');
  assert.equal(await movil2.evj(`load('acceso-${cred.pin.toLowerCase()}')`), null);
});

test('un código mal escrito no crea ninguna cuenta y orienta al paciente', async () => {
  const { cred } = await equipoProfesional();
  const movil = await loadApp();
  const malo = cred.pin.slice(0, 7) + (cred.pin[7] === 'A' ? 'B' : 'A');
  await login(movil, malo, '');
  assert.equal(movil.ev('session'), null);
  assert.match(movil.doc.getElementById('loginErr').textContent, /Comprueba que has escrito bien el código/);
  assert.equal(JSON.parse(movil.win.localStorage.getItem('agenda_accounts') || '{"patients":{}}').patients[malo], undefined);
});

test('PDF del análisis: no despliega apartados, mueve el longitudinal tras las métricas y añade la rejilla como anexo', async () => {
  const app = await loadApp();
  await login(app, 'medico', 'clinica');
  app.ev(`document.querySelector('nav.tabs button[data-view="analisis"]').click()`);
  await app.sleep(300);
  app.win.print = () => {};
  app.ev(`secOpenState['Calidad percibida']=true; printView('analisis')`);
  await app.sleep(400);
  const abiertos = app.evj(`[...document.querySelectorAll('#analisisContent details.secblock')].filter(d=>d.open).map(d=>d.dataset.sectitle)`);
  assert.deepEqual(abiertos, ['Calidad percibida']);
  const orden = app.evj(`[...document.querySelectorAll('#analisisContent>*')].map(e=>e.id||e.className.split(' ')[0])`);
  assert.ok(orden.indexOf('longitBlock') > orden.lastIndexOf('kgroup'), 'el bloque longitudinal debe ir tras las métricas');
  assert.equal(orden[orden.length - 1], 'annexGrid');
  const anexo = app.doc.getElementById('annexGrid');
  assert.equal(anexo.querySelectorAll('tbody tr').length, 21);
  assert.equal(anexo.querySelectorAll('textarea,button.dayedit,[id]').length, 0);
  assert.match(app.ev(`document.getElementById('pageOrientStyle').textContent`), /@page anexo\{size:A4 landscape/);
  // al terminar de imprimir se retira el anexo
  app.win.dispatchEvent(new app.win.Event('afterprint'));
  await app.sleep(100);
  assert.equal(app.doc.getElementById('annexGrid'), null);
});

test('PDF del diario: la 2.ª hoja lleva su propia cabecera y la rejilla ajustable', async () => {
  const app = await loadApp();
  await login(app, 'medico', 'clinica');
  app.win.print = () => {};
  app.ev(`printView('agenda')`);
  await app.sleep(200);
  assert.match(app.doc.getElementById('agendaGridHead').textContent, /Agenda de Sueño — diario de 3 semanas · Caso · Sueño normal/);
  assert.ok(app.doc.querySelector('.gridscroll').classList.contains('pg-fit'));
});
