// Pruebas de la v4.9.2: en el móvil del paciente la sesión queda abierta y no hay que escribir
// el código cada vez que se abre la app.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('./harness');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

async function login(app, u, p = '') {
  app.doc.getElementById('luser').value = u;
  app.doc.getElementById('lpass').value = p;
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
async function pasarPrimerAcceso(app, dispositivo = 'devPriv') {
  for (let i = 0; i < 30; i++) {
    const dev = app.doc.getElementById(dispositivo);
    if (dev) { dev.click(); await app.sleep(50); }
    const chk = app.doc.getElementById('consentChk');
    if (chk) {
      chk.checked = true; chk.dispatchEvent(new app.win.Event('change'));
      app.doc.getElementById('consentYes').click();
      await app.sleep(500);
      return true;
    }
    await app.sleep(60);
  }
  return false;
}
const dentro = app => app.ev('session && session.role') === 'patient' && app.doc.getElementById('loginScreen').classList.contains('hide');

// Primer acceso con código en un iPhone; devuelve la app y el código
async function primerAccesoMovil(opts = {}) {
  const app = await loadApp({ userAgent: IPHONE, ...opts });
  const code = app.ev('generarCodigoAcceso()');
  await login(app, code.slice(0, 4) + '-' + code.slice(4));
  assert.ok(await pasarPrimerAcceso(app, opts.dispositivo));
  assert.equal(app.ev('session.role'), 'patient');
  return { app, code };
}

test('iPhone: tras el primer acceso con código, al volver a abrir la app entra directamente', async () => {
  const { app, code } = await primerAccesoMovil();
  const S = JSON.parse(app.storage().agenda_sesion_paciente);
  assert.equal(S.code, code);
  assert.equal(S.id, 'acceso-' + code.toLowerCase());
  app.ev(`state[0].slots[6]='s';state[0].cmt='noche 1';scheduleAutoSave();`);
  await app.sleep(1000);
  // se cierra la app y se vuelve a abrir (mismo almacenamiento)
  const otra = await loadApp({ userAgent: IPHONE, storage: app.storage() });
  assert.deepEqual(otra.errors, []);
  assert.ok(dentro(otra), 'debe abrir el diario sin pedir el código');
  assert.equal(otra.ev('session.patientId'), 'acceso-' + code.toLowerCase());
  assert.equal(otra.ev('state[0].cmt'), 'noche 1');
  // y sigue abierta en aperturas sucesivas
  const tercera = await loadApp({ userAgent: IPHONE, storage: otra.storage() });
  assert.ok(dentro(tercera));
});

test('iPhone: «Cerrar sesión» la cierra de verdad; la siguiente vez el código ya está escrito (un toque)', async () => {
  const { app, code } = await primerAccesoMovil();
  app.doc.getElementById('logoutBtn').click(); await app.sleep(400);
  const st = app.storage();
  assert.equal(st.agenda_sesion_paciente, undefined);
  assert.equal(st.agenda_sesion_cerrada, '1');
  const otra = await loadApp({ userAgent: IPHONE, storage: st });
  assert.equal(otra.ev('session'), null, 'no debe entrar solo tras cerrar sesión');
  assert.equal(otra.doc.getElementById('luser').value, code.slice(0, 4) + '-' + code.slice(4));
  assert.match(otra.doc.getElementById('loginErr').textContent, /pulsa «Entrar»/);
  // un toque en «Entrar» y vuelve a quedar abierta
  otra.doc.getElementById('loginBtn').click(); await otra.sleep(1200);
  assert.ok(dentro(otra));
  assert.equal(otra.storage().agenda_sesion_cerrada, undefined);
  const tercera = await loadApp({ userAgent: IPHONE, storage: otra.storage() });
  assert.ok(dentro(tercera));
});

test('ordenador: la sesión no queda abierta (equipo de consulta)', async () => {
  const app = await loadApp();
  const code = app.ev('generarCodigoAcceso()');
  await login(app, code);
  assert.ok(await pasarPrimerAcceso(app));
  assert.equal(app.ev('session.role'), 'patient');
  assert.equal(app.storage().agenda_sesion_paciente, undefined);
  const otra = await loadApp({ storage: app.storage() });
  assert.equal(otra.ev('session'), null);
  assert.equal(otra.doc.getElementById('luser').value, '');
});

test('móvil marcado como compartido: no se guarda la sesión', async () => {
  const { app } = await primerAccesoMovil({ dispositivo: 'devShared' });
  assert.equal(app.ev('deviceMode'), 'compartido');
  assert.equal(app.storage().agenda_sesion_paciente, undefined);
});

test('pasar el móvil de privado a compartido en Ajustes borra la sesión guardada', async () => {
  const { app } = await primerAccesoMovil();
  assert.ok(app.storage().agenda_sesion_paciente);
  await app.ev(`(async()=>{deviceMode='compartido';await guardarSesionPaciente();})()`);
  assert.equal(app.storage().agenda_sesion_paciente, undefined);
});

test('acceso caducado: no se reabre la sesión guardada', async () => {
  const { app, code } = await primerAccesoMovil();
  await app.ev(`(async()=>{const a=await ensureAccounts();a.patients['${code}'].expires='2020-01-01T00:00:00.000Z';await saveAccounts(a);})()`);
  const otra = await loadApp({ userAgent: IPHONE, storage: app.storage() });
  assert.equal(otra.ev('session'), null);
});

test('app instalada (pantalla de inicio) abierta con el enlace del QR: entra sola salvo que se haya cerrado sesión', async () => {
  const acc = ['ABCD2345', '2099-01-01T00:00:00.000Z', 'qr-paciente', 'Paciente QR', 'F', '1985-05-05', '2026-10-01'].map(encodeURIComponent).join('~');
  const storage = { agenda_ultimo_acceso: acc };
  const pwa = await loadApp({ storage, standalone: true, userAgent: IPHONE });
  assert.ok(dentro(pwa) || await pasarPrimerAcceso(pwa));
  assert.ok(dentro(pwa));
  assert.equal(pwa.ev('session.patientId'), 'qr-paciente');
  pwa.doc.getElementById('logoutBtn').click(); await pwa.sleep(400);
  const otra = await loadApp({ storage: pwa.storage(), standalone: true, userAgent: IPHONE });
  assert.equal(otra.ev('session'), null);
  assert.equal(otra.doc.getElementById('luser').value, 'ABCD-2345');
});

test('«Borrar mis datos» elimina también la sesión guardada', async () => {
  const { app } = await primerAccesoMovil();
  const id = app.ev('session.patientId');
  await app.ev(`_borrarDatosLocalesPaciente(${JSON.stringify(id)})`);
  const st = app.storage();
  assert.equal(st.agenda_sesion_paciente, undefined);
  assert.equal(st.agenda_sesion_cerrada, undefined);
});
