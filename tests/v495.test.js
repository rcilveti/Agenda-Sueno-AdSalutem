// Pruebas de las versiones 4.9.3–4.9.5: índice RU-SATED, SRI según RIRI y calidades en escala Likert 1–5.
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
// diario con sueño de 23:00 a 07:00 todos los días (slots 6–21)
const DIARIO_BASE = `initState();for(let d=0;d<21;d++){for(let i=6;i<22;i++)state[d].slots[i]='s';state[d].downs=[6];state[d].ups=[22];}`;

// ---------- v4.9.3: RU-SATED ----------
test('RU-SATED: seis dimensiones; el caso normal es 6/6 y se exporta en el CSV', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  const A = app.evj('analysisData().rusated');
  assert.deepEqual(A.dims.map(d => d.clave), ['R', 'S', 'A', 'T', 'E', 'D']);
  assert.equal(A.score6, 6);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /RU_SATED_compuesto;6;/);
  assert.match(csv, /RU_SATED_perfil;R\+ S\+ A\+ T\+ E\+ D\+;/);
  assert.deepEqual(app.errors, []);
});

// ---------- v4.9.4: SRI según RIRI ----------
test('SRI: exige 5 pares de días consecutivos, informa de los pares válidos y se valora sin semáforo', async () => {
  const app = await loadApp();
  app.ev(DIARIO_BASE);
  let D = app.evj('sriDetalle()');
  assert.equal(D.pares, 20); assert.equal(D.posibles, 20); assert.equal(D.pct, 100); assert.equal(Math.round(D.sri), 100);
  // solo 4 días seguidos con datos → 3 pares → no se calcula
  app.ev(`for(let d=4;d<21;d++){state[d].slots=new Array(48).fill(null);state[d].downs=[];state[d].ups=[];}`);
  D = app.evj('sriDetalle()');
  assert.equal(D.pares, 3); assert.equal(D.suficiente, false); assert.equal(D.sri, null);
  assert.equal(app.ev('sleepRegularityIndex()'), null);
  assert.match(app.ev('sriEvTxt(null,sriDetalle())'), /No calculado: 3 de 20 pares válidos \(15 %\); mínimo 5/);
  // valoración descriptiva (lvl 'info'), no verde/ámbar/rojo
  assert.deepEqual(app.evj('cutSRI(85)'), { lvl: 'info', txt: 'Concordancia alta' });
  assert.deepEqual(app.evj('cutSRI(50)'), { lvl: 'info', txt: 'Concordancia baja' });
});

// ---------- v4.9.5: escala Likert 1–5 ----------
test('rejilla: la casilla de calidad abre el paso 2 del editor y la valoración 1–5 se guarda con su escala (v4.9.9)', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.doc.querySelector('#gridBody tr[data-d="3"] .lkcell[data-q="qd"]').click();
  assert.equal(app.doc.getElementById('ed').hidden, false, 'editor abierto');
  assert.equal(app.doc.getElementById('pasoValor').hidden, false, 'en el paso de la valoración');
  const fila = app.doc.querySelector('#edValor .vfila[data-k="qd"]');
  assert.equal(fila.querySelectorAll('.vop').length, 5);
  assert.match(fila.textContent, /descansado\/a/);
  fila.querySelector('.vop[data-v="2"]').click();
  app.doc.getElementById('edGuardar2').click();
  assert.equal(app.doc.getElementById('ed').hidden, true);
  assert.deepEqual(app.evj('[state[3].qd,state[3].qsc]'), [2, 5]);
  assert.equal(app.doc.querySelector('#gridBody tr[data-d="3"] .lkcell[data-q="qd"] .lkb').textContent, '2');
  // con el teclado también se abre (Intro)
  app.doc.querySelector('#gridBody tr[data-d="4"] .lkcell[data-q="qs"]').dispatchEvent(new app.win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(app.doc.getElementById('ed').hidden, false);
  assert.equal(app.ev('EditorNoche.estado().i'), 4);
  assert.deepEqual(app.errors, []);
});

test('compatibilidad: un día antiguo (1–3) llega al editor en 1–5 y se guarda en 1–5', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  app.ev(`state[2].qs=1;state[2].qd=2;state[2].qe=3;delete state[2].qsc;buildBody();`);
  assert.equal(app.doc.querySelector('#gridBody tr[data-d="2"] .lkcell[data-q="qs"] .lkb').textContent, 'M');
  app.doc.querySelector('#gridBody tr[data-d="2"] .lkcell[data-q="qd"]').click();
  // se pasan de forma lineal: 1→1, 2→3, 3→5
  assert.deepEqual(app.evj(`['qs','qd','qe'].map(k=>EditorNoche.estado().q[k])`), [1, 3, 5]);
  app.doc.querySelector('#edValor .vfila[data-k="qd"] .vop[data-v="4"]').click();
  app.doc.getElementById('edGuardar2').click();
  assert.deepEqual(app.evj('[state[2].qs,state[2].qd,state[2].qe,state[2].qsc]'), [1, 4, 5, 5]);
});

test('análisis: diario antiguo en su escala 1–3, diario mixto reescalado y umbrales en % del máximo', async () => {
  const app = await loadApp();
  app.ev(DIARIO_BASE);
  // diario entero antiguo: todos «regular» (2) salvo 7 días «buena» (3)
  app.ev(`for(let d=0;d<21;d++){state[d].qs=d<7?3:2;state[d].qd=2;state[d].qe=2;delete state[d].qsc;}`);
  let A = app.evj('analysisData()');
  assert.equal(A.qEsc, 3); assert.equal(A.qMixto, false);
  assert.equal(Math.round(A.total.qs * 100) / 100, 2.33);
  assert.equal(A.rusated.dims.find(d => d.clave === 'S').ok, true);   // 2,33/3 > 65 % del máximo
  // un día nuevo (1–5) convierte el diario en mixto: las antiguas se reescalan (2→3, 3→5)
  app.ev(`state[20].qs=5;state[20].qd=5;state[20].qe=5;state[20].qsc=5;`);
  A = app.evj('analysisData()');
  assert.equal(A.qEsc, 5); assert.equal(A.qMixto, true);
  assert.equal(Math.round(A.total.qs * 100) / 100, Math.round((7 * 5 + 13 * 3 + 5) / 21 * 100) / 100);
  // equivalencia de umbrales: 3,6/5 y 2,3/3 están ambos en torno al 65 % del máximo posible
  assert.equal(Math.round(app.ev('qPomp(3.6,5)')), 65);
  assert.equal(Math.round(app.ev('qPomp(2.3,3)')), 65);
});

test('CSV: guarda la escala por día; un CSV antiguo (sin la columna) se importa como escala 1–3', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  await app.ev(`selectPatient('caso-pseudoinsomnio')`);
  const csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /;escala_calidad;etiquetas;guiado;acont_tipos;tratamiento\n/);
  assert.match(csv, /^escala_calidad;5;niveles$/m);
  assert.match(csv, /^calidad_sueno_dias_malos;\d+;% dias 1-2$/m);
  const st = app.evj(`rawImportText(${JSON.stringify(csv)}).state`);
  assert.ok(st.filter(d => d.qs >= 1).every(d => d.qsc === 5));
  // el mismo archivo sin la columna (formato anterior): valores 4–5 no válidos en 1–3 y escala antigua
  // (v4.9.7 y v4.9.9: el archivo lleva además etiquetas, guiado, acont_tipos y tratamiento, que también faltan en el formato anterior)
  const viejo = csv.replace(/;escala_calidad;etiquetas;guiado;acont_tipos;tratamiento\n/, '\n').replace(/^(\d+;.*);(5)?;[^;\n]*;[^;\n]*;[^;\n]*;[^;\n]*$/gm, '$1');
  const st2 = app.evj(`rawImportText(${JSON.stringify(viejo)}).state`);
  assert.ok(st2.every(d => !d.qsc));
  assert.ok(st2.every(d => [d.qs, d.qd, d.qe].every(v => v >= 0 && v <= 3)));
});

test('casos de ejemplo: valoraciones completas en 1–5 y perfiles RU-SATED de la regla común', async () => {
  const app = await loadApp();
  await loginDoctor(app);
  const esperado = {
    'caso-normal': 'R+S+A+T+E+D+', 'caso-ins-conciliacion': 'R+S-A-T+E-D-', 'caso-ins-mantenimiento': 'R+S-A-T+E-D-',
    'caso-retraso-fase': 'R+S-A-T-E+D-', 'caso-avance-fase': 'R+S+A+T-E+D+', 'caso-ritmo-irregular': 'R-S+A-T-E+D+',
    'caso-trabajo-turnos': 'R-S+A-T-E+D+', 'caso-bebe-hierro': 'R+S-A-T?E-D+', 'caso-nino-tea': 'R+S-A-T?E-D-',
    'caso-anciana-80': 'R+S+A+T+E+D+', 'caso-pseudoinsomnio': 'R+S-A+T+E+D+', 'caso-menopausia': 'R+S-A-T+E-D-',
    'caso-spi-plmd': 'R+S-A-T+E-D-', 'caso-apnea-insomnio': 'R+S-A-T+E-D-', 'caso-tcsr-rem': 'R+S+A+T+E+D-',
    'caso-hipersomnia': 'R+S+A-T+E+D-', 'caso-tcci': 'R+S-A-T+E-D-'
  };
  for (const [id, perfil] of Object.entries(esperado)) {
    await app.ev(`selectPatient(${JSON.stringify(id)})`);
    const ok = app.ev(`state.filter(d=>d.slots.some(s=>s)).every(d=>[d.qs,d.qd,d.qe].every(v=>v>=1&&v<=5)&&d.qsc===5)`);
    assert.ok(ok, `valoraciones incompletas o fuera de escala en ${id}`);
    const p = app.ev(`analysisData().rusated.dims.map(d=>d.clave+(d.ok===null?'?':d.ok?'+':'-')).join('')`);
    assert.equal(p, perfil, `perfil RU-SATED de ${id}`);
    app.ev('renderAnalysis()');
    const disc = /discordancia entre la percepción/.test(app.doc.getElementById('analisis').innerHTML);
    assert.equal(disc, id === 'caso-pseudoinsomnio', `discordancia en ${id}`);
  }
  assert.deepEqual(app.errors, []);
});

test('impresión: las casillas vacías llevan los números 1–5 para rodear a mano', async () => {
  const app = await loadApp();
  app.ev(`initState();buildBody();`);
  const c = app.doc.querySelector('#gridBody tr[data-d="0"] .lkcell[data-q="qe"]');
  assert.ok(c.classList.contains('vacio'));
  assert.equal(c.querySelector('.lkpaper').textContent, '12345');
});
