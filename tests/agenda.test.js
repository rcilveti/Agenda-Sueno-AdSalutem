// Pruebas automáticas de la Agenda de Sueño (v4.9.2, actualizadas a la v4.9.5). Ejecutar: npm test
// Requisitos: Node 20+ y jsdom (npm install). Zona horaria: Europe/Madrid (para el cambio de hora).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadApp, DEFAULT_FILE } = require('./harness');

const SRC = fs.readFileSync(DEFAULT_FILE, 'utf8');

async function loginDoctor(app, user = 'medico', pass = 'clinica') {
  app.doc.getElementById('luser').value = user;
  app.doc.getElementById('lpass').value = pass;
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
// Completa las ventanas del primer acceso del paciente (tipo de dispositivo y consentimiento)
async function pasarPrimerAcceso(app, modo = 'privado') {
  for (let i = 0; i < 20; i++) {
    const dev = app.doc.getElementById(modo === 'privado' ? 'devPriv' : 'devShared');
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

test('arranque sin errores, versión 4.9.5 y modo piloto', async () => {
  const app = await loadApp();
  assert.deepEqual(app.errors, []);
  assert.equal(app.ev('APP_VERSION'), '4.9.5');
  assert.equal(app.ev('DATA_SCHEMA'), 3);   // v4.9.5: el CSV lleva la escala de las calidades por día
  assert.equal(app.ev('MODO_PILOTO'), true);
  assert.match(app.doc.getElementById('loginVersion').textContent, /4\.9\.5/);
});

test('escHtml escapa los caracteres peligrosos', async () => {
  const app = await loadApp();
  assert.equal(app.ev(`escHtml('<a href="x">&\\'')`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('ida y vuelta CSV de los 16 casos de demostración (incluidas marcas de tiempo y escala de calidad)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const ids = app.ev('DEMO_CASES.index.map(x=>x.id)');
  assert.equal(ids.length, 16);
  for (const id of ids) {
    await app.ev(`selectPatient(${JSON.stringify(id)})`);
    // marcas de tiempo artificiales en dos días para comprobar que viajan en el CSV
    app.ev(`state[0].firstEnteredAt='2025-06-03T07:15:00.000Z';state[0].updatedAt='2025-06-03T07:20:00.000Z';state[5].deletedAt='2025-06-08T08:00:00.000Z';state[5].updatedAt='2025-06-08T08:00:00.000Z';`);
    const r = app.ev(`(()=>{const csv=buildUnifiedCsv();const imp=rawImportText(csv);
      const a=state.map(d=>_contenidoDia(d)+'|'+(d.firstEnteredAt||'')+'|'+(d.updatedAt||'')+'|'+(d.deletedAt||'')+'|'+(qDiaValorado(d)?qEscDia(d):''));
      const b=imp.state.map(d=>_contenidoDia(d)+'|'+(d.firstEnteredAt||'')+'|'+(d.updatedAt||'')+'|'+(d.deletedAt||'')+'|'+(qDiaValorado(d)?qEscDia(d):''));
      return {ok:JSON.stringify(a)===JSON.stringify(b), meta:imp.meta, first:a.find((x,i)=>x!==b[i]), firstB:b.find((x,i)=>x!==a[i])};})()`);
    assert.ok(r.ok, `ida y vuelta distinta en ${id}: ${r.first} ≠ ${r.firstB}`);
    assert.equal(r.meta.version_esquema, '3');
    assert.equal(r.meta.id, id);
  }
  assert.deepEqual(app.errors, []);
});

test('inyección: un diario manipulado no inserta HTML en el equipo del profesional', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const evil = '<img src=x onerror="window.__pwned=1">';
  const csv = [
    '# AGENDA DE SUENO v2', '# SECCION=PACIENTE', 'campo;valor',
    'id;malicioso', `nombre;"${evil.replace(/"/g, '""')}"`, 'inicio_registro;2026-09-01', 'fecha_nacimiento;1980-01-01', '',
    '# SECCION=DIARIO',
    'dia;fecha;tipo;sueno;siestas;acostarse;levantarse;acontecimientos;cal_sueno;cal_despertar;cal_dia;observaciones',
    `1;01/09;L;23:00-07:00;;23:00;07:00;03:00;2;2;2;"${evil.replace(/"/g, '""')}"`,
    `2;02/09;L;23:00-07:00;;23:00;07:00;;2;2;2;"</textarea><img src=x onerror=window.__pwned=2>"`,
    '3;03/09;F;00:00-09:00;;00:00;09:00;;3;3;3;'
  ].join('\n');
  app.ev(`handleRawFile(new File([${JSON.stringify(csv)}],'evil.csv',{type:'text/csv'}))`);
  await app.sleep(1200);
  assert.equal(app.ev('patient'), 'malicioso');
  await app.ev('populatePatients()');
  app.ev('renderAnalysis()');
  app.ev('fillAgendaPrintHead()');
  app.ev(`document.getElementById('longitResult')&&(document.getElementById('longitResult').innerHTML=renderLongitudinal([{label:${JSON.stringify(evil)},m:metricsOfState(state)},{label:'b',m:metricsOfState(state)}]))`);
  await app.sleep(100);
  assert.equal(app.doc.querySelectorAll('img[src="x"]').length, 0, 'se ha insertado una etiqueta <img> del diario');
  assert.equal(app.win.__pwned, undefined);
  // el texto sí debe verse, escapado
  assert.match(app.doc.getElementById('plist').textContent, /<img src=x/);
  assert.match(app.doc.getElementById('analisisContent').textContent, /<img src=x/);
  // la observación con </textarea> queda dentro de su textarea
  assert.equal(app.ev(`document.querySelector('textarea[data-cmt="1"]').value`), '</textarea><img src=x onerror=window.__pwned=2>');
});

test('CSV: neutraliza fórmulas al exportar y recupera el texto original al importar', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`state[2].cmt='=HYPERLINK("http://x";"y")';state[3].cmt='+34 600 000 000';state[4].cmt='-cafeína';state[6].cmt='@nota'`);
  const csv = app.ev('buildUnifiedCsv()');
  assert.ok(csv.includes(`"'=HYPERLINK(""http://x"";""y"")"`), 'la fórmula no se ha neutralizado');
  assert.ok(csv.includes(";'+34 600 000 000;"));
  assert.ok(csv.includes(";'-cafeína;"));
  assert.ok(csv.includes(";'@nota;"));
  const imp = app.ev(`rawImportText(${JSON.stringify(csv)}).state.map(d=>d.cmt)`);
  assert.equal(imp[2], '=HYPERLINK("http://x";"y")');
  assert.equal(imp[3], '+34 600 000 000');
  assert.equal(imp[4], '-cafeína');
  assert.equal(imp[6], '@nota');
});

test('cálculos: TST con dirección, rango por edad y edad a la fecha de referencia', async () => {
  const app = await loadApp();
  assert.deepEqual(app.evj('cutTST(11*60+30,30)'), { lvl: 'bad', txt: 'Excesivo', dir: 'high' });
  assert.deepEqual(app.evj('cutTST(5*60,30)'), { lvl: 'bad', txt: 'Insuficiente', dir: 'low' });
  assert.equal(app.ev('tstRangeTxt(30)'), '7–9 h');
  assert.equal(app.ev('tstRangeTxt(70)'), '7–8 h');
  assert.equal(app.ev(`patientAge('2000-06-15','2018-06-14')`), 17);
  assert.equal(app.ev(`patientAge('2000-06-15','2018-06-15')`), 18);
  assert.equal(app.ev('lvlColor(cutSE(87,10))'), 'var(--warn)');
  assert.equal(app.ev('lvlColor(cutSE(87,30))'), 'var(--good)');
  assert.equal(app.ev('medianaOrdinal([1,1,3])'), 1);
  assert.equal(app.ev('medianaOrdinal([0,2,3])'), 2.5);
});

test('referencias: SRI (Phillips 2017), IS (Witting 1990) y SJLsc (Jankowski 2017); sin la referencia mal formada', async () => {
  const app = await loadApp();
  const refs = app.ev('REFS.map(r=>r.t).join("\\n")');
  assert.match(refs, /Phillips AJK.*Sci Rep\. 2017/);
  assert.match(refs, /Witting W.*Biol Psychiatry\. 1990/);
  assert.match(refs, /Jankowski KS.*Chronobiol Int\. 2017/);
  assert.doesNotMatch(refs, /Fischer D, et al\. \/ Bei H/);
});

test('SJLsc de Jankowski: inicio, final y fórmula clásica', async () => {
  const app = await loadApp();
  // festivos más largos y con inicio más tardío → diferencia de inicios
  assert.deepEqual(app.evj('sjlCorrected({so:1380,soff:420,sd:480,mid:180},{so:30,soff:570,sd:540,mid:300})'), { val: 90, metodo: 'inicio' });
  // festivos más cortos y final más tardío → diferencia de finales
  assert.deepEqual(app.evj('sjlCorrected({so:1380,soff:420,sd:480,mid:180},{so:60,soff:480,sd:420,mid:270})'), { val: 60, metodo: 'fin' });
  // festivos más largos pero con inicio más temprano → fórmula clásica (MSF − MSW)
  assert.deepEqual(app.evj('sjlCorrected({so:1380,soff:420,sd:480,mid:180},{so:1320,soff:540,sd:660,mid:240})'), { val: 60, metodo: 'clasica' });
});

test('SRI = 100 e IS = 1 con días idénticos', async () => {
  const app = await loadApp();
  app.ev(`initState();for(let d=0;d<21;d++){for(let i=6;i<22;i++)state[d].slots[i]='s';}`);
  assert.equal(Math.round(app.ev('sleepRegularityIndex()')), 100);
  assert.equal(Math.round(app.ev('interdailyStability()') * 1000) / 1000, 1);
});

test('informe clínico: un adulto que duerme más de 11 h aparece como sueño excesivo, no insuficiente', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`document.getElementById('birth').value='1990-01-01';document.getElementById('start').value='2026-03-02';startDate=new Date('2026-03-02T00:00:00');
    initState();for(let d=0;d<21;d++){for(let i=2;i<=24;i++)state[d].slots[i]='s';state[d].downs=[2];state[d].ups=[25];}`);
  app.ev('renderAnalysis()');
  const txt = app.doc.querySelector('.clinrep').textContent;
  assert.match(txt, /excesivo para su edad/);
  assert.doesNotMatch(txt, /insuficiente para su edad/);
  assert.match(txt, /sueño excesivo para la edad/);
});

test('tabla diaria: la eficiencia se colorea con el punto de corte por edad', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  // niño de 10 años: SE 87,5 % → «subóptima» (ámbar), no verde
  app.ev(`document.getElementById('birth').value='2016-01-01';document.getElementById('start').value='2026-03-02';startDate=new Date('2026-03-02T00:00:00');
    initState();for(let d=0;d<3;d++){for(let i=4;i<=19;i++)state[d].slots[i]='s';state[d].slots[10]=null;state[d].slots[11]=null;state[d].downs=[4];state[d].ups=[20];}`);
  app.ev('renderAnalysis()');
  const html = app.doc.getElementById('analisisContent').innerHTML;
  assert.match(html, /color:var\(--warn\);font-weight:600">87\.5%/);
});

test('cambio de hora: se detecta la noche del 24 al 25 de octubre de 2026 (Europe/Madrid)', { skip: process.env.TZ !== 'Europe/Madrid' }, async () => {
  const app = await loadApp();
  app.ev(`startDate=new Date('2026-10-20T00:00:00')`);
  const flags = app.ev('Array.from({length:21},(_,i)=>esNocheCambioHora(i))');
  assert.equal(flags[4], true);
  assert.equal(flags.filter(Boolean).length, 1);
});

test('fusión por días: gana la modificación más reciente y las marcas de borrado', async () => {
  const app = await loadApp();
  const r = app.ev(`(()=>{
    const dia=(ts,datos,borrado)=>{const d=blankDay();if(datos){d.slots[6]='s';d.cmt=datos;}if(ts)d.updatedAt=ts;if(borrado)d.deletedAt=ts;return d;};
    const A=Array.from({length:21},()=>blankDay()), B=Array.from({length:21},()=>blankDay());
    A[0]=dia('2026-10-01T08:00:00Z','A antiguo'); B[0]=dia('2026-10-02T08:00:00Z','B nuevo');      // gana B (más reciente)
    A[1]=dia('2026-10-03T08:00:00Z',null,true); B[1]=dia('2026-10-02T08:00:00Z','B');             // gana el borrado de A
    A[2]=blankDay(); B[2]=dia(null,'B sin marca');                                                 // regla antigua: B se rescata
    A[3]=dia('2026-10-03T08:00:00Z',null,true); B[3]=dia(null,'B sin marca');                      // borrado con marca > datos sin marca
    A[4]=dia(null,'A sin marca'); B[4]=dia(null,'B sin marca');                                    // sin marcas: gana la entrante
    const f=fusionarDiarios(A,B);
    return {c0:f.merged[0].cmt,c1:_diaTieneDatos(f.merged[1]),c2:f.merged[2].cmt,c3:_diaTieneDatos(f.merged[3]),c4:f.merged[4].cmt,added:f.added,kept:f.kept,conflicts:f.conflicts};})()`);
  assert.equal(r.c0, 'B nuevo');
  assert.equal(r.c1, false);
  assert.equal(r.c2, 'B sin marca');
  assert.equal(r.c3, false);
  assert.equal(r.c4, 'A sin marca');
  assert.equal(r.added, 1);
  assert.equal(r.kept, 1);
  assert.equal(r.conflicts, 2);
});

test('marcas de tiempo: se sellan al editar y queda marca de borrado al vaciar un día', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`state[20]=blankDay();_fijarBaseline();state[20].slots[6]='s';scheduleAutoSave();`);
  await app.sleep(1000);
  const d = app.ev('({...state[20]})');
  assert.ok(d.firstEnteredAt && d.updatedAt && !d.deletedAt);
  const guardado = await app.ev(`load('caso-normal').then(o=>o.state[20])`);
  assert.equal(guardado.firstEnteredAt, d.firstEnteredAt);
  app.ev(`state[20].slots[6]=null;scheduleAutoSave();`);
  await app.sleep(1000);
  const d2 = app.ev('({...state[20]})');
  assert.ok(d2.deletedAt && !d2.firstEnteredAt);
});

test('adherencia «a tiempo»: ≤ 12 h tras levantarse', async () => {
  const app = await loadApp();
  const r = app.evj(`(()=>{initState();startDate=new Date('2026-03-02T00:00:00');
    for(const d of [0,1]){for(let i=6;i<=21;i++)state[d].slots[i]='s';state[d].ups=[22];}
    state[0].firstEnteredAt=new Date(2026,2,3,9,0).toISOString();   // 2 h tras levantarse (07:00)
    state[1].firstEnteredAt=new Date(2026,2,6,9,0).toISOString();   // 3 días después
    const all=[];for(let d=0;d<21;d++)all.push({d,...dayMetrics(d)});return adherenciaRegistro(all);})()`);
  assert.equal(r.conMarca, 2);
  assert.equal(r.aTiempo, 1);
  assert.deepEqual(r.tarde, [2]);
});

test('código de acceso del paciente: 8 caracteres seguros; acepta minúsculas, guion y contraseña en blanco', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const cred = await app.ev(`crearCredencialPaciente('paciente-x','Paciente X')`);
  assert.match(cred.pin, /^[A-HJ-NP-Z2-9]{8}$/);
  app.doc.getElementById('logoutBtn').click();
  await app.sleep(300);
  app.doc.getElementById('luser').value = (cred.pin.slice(0, 4) + '-' + cred.pin.slice(4)).toLowerCase();
  app.doc.getElementById('lpass').value = '';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(300);
  assert.ok(await pasarPrimerAcceso(app));
  assert.equal(app.ev('session.role'), 'patient');
  assert.equal(app.ev('session.patientId'), 'paciente-x');
});

test('PIN antiguo de 3 cifras sigue funcionando', async () => {
  const app = await loadApp({ storage: { agenda_accounts: JSON.stringify({ doctors: {}, patients: { '123': { id: 'antiguo', name: 'Antiguo', pass: '123', expires: '' } } }) } });
  app.doc.getElementById('luser').value = '123';
  app.doc.getElementById('lpass').value = '123';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(300);
  assert.ok(await pasarPrimerAcceso(app));
  assert.equal(app.ev('session.patientId'), 'antiguo');
});

test('tipo de dispositivo: se pregunta una vez y se recuerda; el consentimiento también', async () => {
  const app = await loadApp();
  app.doc.getElementById('luser').value = 'paciente';
  app.doc.getElementById('lpass').value = 'demo';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(300);
  assert.ok(app.doc.getElementById('deviceOverlay'), 'debería preguntar el tipo de dispositivo');
  assert.ok(await pasarPrimerAcceso(app));
  assert.equal(app.win.localStorage.getItem('agenda_modo_dispositivo'), 'privado');
  assert.ok(app.win.localStorage.getItem('agenda_consentimiento:paciente-demo'));
  app.doc.getElementById('logoutBtn').click();
  await app.sleep(300);
  app.doc.getElementById('luser').value = 'paciente';
  app.doc.getElementById('lpass').value = 'demo';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(500);
  assert.equal(app.doc.getElementById('deviceOverlay'), null);
  assert.equal(app.doc.getElementById('consentOverlay'), null);
  assert.equal(app.ev('session.role'), 'patient');
});

test('«Borrar mis datos de este dispositivo» elimina diario, ficha, acceso y consentimiento', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const cred = await app.ev(`crearCredencialPaciente('borrame','Bórrame')`);
  await app.ev(`saveRec('borrame',{patient:'borrame',name:'Bórrame',state:Array.from({length:21},blankDay)})`);
  app.doc.getElementById('logoutBtn').click(); await app.sleep(200);
  app.doc.getElementById('luser').value = cred.pin; app.doc.getElementById('lpass').value = '';
  app.doc.getElementById('loginBtn').click(); await app.sleep(300);
  await pasarPrimerAcceso(app);
  await app.ev('borrarMisDatos()');
  await app.sleep(200);
  assert.equal(app.win.localStorage.getItem('agendasueno3:borrame'), null);
  assert.equal(app.win.localStorage.getItem('agenda_consentimiento:borrame'), null);
  const acc = JSON.parse(app.win.localStorage.getItem('agenda_accounts'));
  assert.equal(Object.values(acc.patients).some(p => p.id === 'borrame'), false);
  assert.equal(app.ev('session'), null);
});

test('acceso por QR: entra solo en el navegador, limpia la URL en el ordenador y el cierre de sesión olvida el acceso', async () => {
  const acc = ['ABCD2345', '2099-01-01T00:00:00.000Z', 'qr-paciente', 'Paciente QR', 'F', '1985-05-05', '2026-10-01'].map(encodeURIComponent).join('~');
  const app = await loadApp({ url: 'https://rcilveti.github.io/Agenda-Sueno-AdSalutem/#acc=' + acc });
  assert.ok(await pasarPrimerAcceso(app));
  assert.equal(app.ev('session.patientId'), 'qr-paciente');
  assert.equal(app.win.location.hash, '', 'en el ordenador el fragmento con datos debe borrarse');
  assert.ok(app.win.localStorage.getItem('agenda_ultimo_acceso'));
  app.doc.getElementById('logoutBtn').click();
  await app.sleep(300);
  assert.equal(app.win.localStorage.getItem('agenda_ultimo_acceso'), null);
});

test('acceso recordado: en el navegador no entra solo; en la app instalada entra directamente (v4.9.2) salvo tras cerrar sesión', async () => {
  const acc = ['ABCD2345', '2099-01-01T00:00:00.000Z', 'qr-paciente', 'Paciente QR', 'F', '1985-05-05', '2026-10-01'].map(encodeURIComponent).join('~');
  const storage = { agenda_ultimo_acceso: acc };
  const nav = await loadApp({ storage });
  assert.equal(nav.ev('session'), null);
  assert.equal(nav.doc.getElementById('luser').value, '');
  const pwa = await loadApp({ storage, standalone: true });
  assert.equal(pwa.ev('session && session.patientId'), 'qr-paciente');
  const cerrada = await loadApp({ storage: { ...storage, agenda_sesion_cerrada: '1' }, standalone: true });
  assert.equal(cerrada.ev('session'), null);
  assert.equal(cerrada.doc.getElementById('luser').value, 'ABCD-2345');
  assert.match(cerrada.doc.getElementById('loginErr').textContent, /Hola, Paciente QR/);
});

test('producción (MODO_PILOTO=false): sin cuentas demo, cuenta del profesional con hash y bloqueo tras 5 fallos', async () => {
  const app = await loadApp({ pilot: false });
  assert.deepEqual(app.errors, []);
  assert.equal(app.ev('MODO_PILOTO'), false);
  assert.deepEqual(app.evj('_accountsCache.doctors'), {});
  assert.equal(app.doc.getElementById('loginHintDemo').style.display, 'none');
  assert.equal(app.doc.getElementById('setupLinkWrap').style.display, 'block');
  // la cuenta demo no existe
  await loginDoctor(app);
  assert.equal(app.ev('session'), null);
  app.ev('limpiarFallos()');
  // crear la cuenta
  app.doc.getElementById('setupLink').click();
  app.doc.getElementById('setupUser').value = 'dra.sueno';
  app.doc.getElementById('setupName').value = 'Dra. Sueño';
  app.doc.getElementById('setupPass').value = 'una-clave-larga';
  app.doc.getElementById('setupPass2').value = 'una-clave-larga';
  app.doc.getElementById('setupSave').click();
  await app.sleep(1200);
  const d = JSON.parse(app.win.localStorage.getItem('agenda_accounts')).doctors['dra.sueno'];
  assert.ok(d && d.hash && d.salt && d.iter === 150000);
  assert.equal(d.pass, undefined, 'la contraseña no debe guardarse en claro');
  // 5 fallos → bloqueo, aunque después se escriba la contraseña correcta
  for (let i = 0; i < 5; i++) await loginDoctor(app, 'dra.sueno', 'mala-clave');
  await loginDoctor(app, 'dra.sueno', 'una-clave-larga');
  assert.equal(app.ev('session'), null);
  assert.match(app.doc.getElementById('loginErr').textContent, /Demasiados intentos/);
  app.ev('limpiarFallos()');
  await loginDoctor(app, 'dra.sueno', 'una-clave-larga');
  assert.equal(app.ev('session.role'), 'doctor');
  // el paciente de demostración no se añade en producción
  const idx = await app.ev('getIndex()');
  assert.equal(idx.some(x => x.id === 'paciente-demo'), false);
});

test('piloto: la contraseña demo en claro se convierte a hash al primer acceso', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const d = JSON.parse(app.win.localStorage.getItem('agenda_accounts')).doctors.medico;
  assert.ok(d.hash);
  assert.equal(d.pass, undefined);
});

test('sin descargas automáticas: makeSafetyCopy solo se usa desde el botón manual', () => {
  const usos = SRC.match(/makeSafetyCopy\(/g) || [];
  assert.equal(usos.length, 2, 'definición + botón «Guardar copia ahora»');
  assert.doesNotMatch(SRC, /addEventListener\('visibilitychange',\(\)=>\{\s*if\(document\.visibilityState==='hidden'&&session&&session\.role==='patient'&&_dirtySinceBackup\)/);
});

test('código eliminado: insights(), askPatientDiaryFile() y el botón inexistente exportAllBtn', () => {
  assert.doesNotMatch(SRC, /function insights\(/);
  assert.doesNotMatch(SRC, /function askPatientDiaryFile\(/);
  assert.doesNotMatch(SRC, /\$\("exportAllBtn"\)&&/);
});

test('catalán: interfaz del paciente, casillas de calidad 1–5 (y letras en días de la escala antigua) y guía', async () => {
  const app = await loadApp();
  // v4.9.5: un día valorado con la escala antigua (sin qsc) muestra su letra; uno nuevo, su número
  app.ev(`initState();state[0].qs=1;state[1].qs=4;state[1].qsc=5;buildBody();`);
  app.ev(`setLang('ca')`);
  assert.equal(app.doc.querySelector('label[for="luser"]').textContent, "Usuari o codi d'accés");
  assert.match(app.doc.getElementById('headRow').innerHTML, /Qualitat/);
  assert.equal(app.doc.querySelector('#gridBody tr[data-d="0"] .lkcell[data-q="qs"] .lkb').textContent, 'D');
  assert.equal(app.doc.querySelector('#gridBody tr[data-d="1"] .lkcell[data-q="qs"] .lkb').textContent, '4');
  assert.match(app.doc.querySelector('#gridBody tr[data-d="1"] .lkcell[data-q="qs"]').getAttribute('aria-label'), /Qualitat del son: 4 · Bona/);
  app.ev('showInstructions()');
  assert.match(app.doc.getElementById('instrOverlay').textContent, /El teu diari de son/);
  app.ev(`document.getElementById('instrOverlay').remove();setLang('es')`);
  assert.equal(app.doc.querySelector('label[for="luser"]').textContent, 'Usuario o código de acceso');
  assert.equal(app.doc.querySelector('#gridBody tr[data-d="0"] .lkcell[data-q="qs"] .lkb').textContent, 'M');
  // todas las claves de I18N.es tienen traducción al catalán
  const falta = app.evj('Object.keys(I18N.es).filter(k=>I18N.ca[k]==null)');
  assert.deepEqual(falta, []);
});

test('política de seguridad de contenidos y service worker', () => {
  assert.match(SRC, /<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https:\/\/cdnjs\.cloudflare\.com;[^"]*connect-src 'self'/);
  const sw = path.join(path.dirname(DEFAULT_FILE), 'sw.js');
  assert.ok(fs.existsSync(sw), 'falta sw.js junto a la página');
  execFileSync(process.execPath, ['--check', sw]);
  assert.match(SRC, /navigator\.serviceWorker\.register\('\.\/sw\.js'\)/);
  assert.match(SRC, /navigator\.storage\.persist\(\)/);
});

test('manifiesto dinámico con URL absolutas', async () => {
  const app = await loadApp();
  let capturado = null;
  app.win.Blob = class { constructor(parts) { capturado = parts.join(''); } };
  app.ev(`_instalarManifestConAcceso('ABCD2345~x~id~Nom')`);
  const m = JSON.parse(capturado);
  assert.match(m.start_url, /^https:\/\/rcilveti\.github\.io\/Agenda-Sueno-AdSalutem\/#acc=ABCD2345/);
  assert.equal(m.scope, 'https://rcilveti.github.io/Agenda-Sueno-AdSalutem/');
  assert.match(m.icons[0].src, /^https:\/\//);
});
