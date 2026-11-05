// Pruebas de la versión 4.9.8: regla del MCTQ para los días laborables y festivos.
// Cada fila marca si SU fecha fue laborable o festiva y cada noche cuenta como el día en que te levantas
// (la del viernes al sábado es una noche antes de festivo; la del domingo al lunes, una noche antes de laborable).
// state[d].lf sigue siendo el tipo de la noche d: el análisis no cambia respecto a la v4.9.7.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { loadApp } = require('./harness');

const fs = require('fs');
// la v4.9.7 está en su carpeta: al lado de la v4.9.9 (v4.9.9/tests → ../../v4.9.7) o, ya publicada en la raíz, debajo (tests → ../v4.9.7)
const V497 = [path.join(__dirname, '..', '..', 'v4.9.7', 'index.html'), path.join(__dirname, '..', 'v4.9.7', 'index.html')].find(f => fs.existsSync(f));
async function loginDoctor(app) {
  app.doc.getElementById('luser').value = 'medico';
  app.doc.getElementById('lpass').value = 'clinica';
  app.doc.getElementById('loginBtn').click();
  await app.sleep(1200);
}
// lo que muestra la celda del día de una fila: las marcas (fecha y tipo) y si hay paso entre dos tipos
const celda = (app, d) => app.evj(`(()=>{ const tr=document.querySelector('#gridBody tr[data-d="${d}"]');
  const m=[...tr.querySelectorAll('td.day .lf')].map(x=>[+x.dataset.lfd,x.classList.contains('F')?'F':'L',x.textContent]);
  const hr=[...tr.querySelectorAll('td.hr')].map(x=>x.classList.contains('fd')?'F':'L').join('');
  return {m,par:!!tr.querySelector('td.day .lfs'),festiu:tr.classList.contains('festiu'),fdia:tr.classList.contains('fdia'),hr}; })()`);

test('MCTQ: el análisis de los casos de ejemplo pintados en la rejilla es el mismo que en la v4.9.7; los anotados con preguntas, a minuto', { skip: !V497 }, async () => {
  const a = await loadApp(); await loginDoctor(a);
  const b = await loadApp({ file: V497 }); await loginDoctor(b);
  const ids = a.evj('DEMO_CASES.index.map(c=>c.id)');
  assert.equal(ids.length, 17);
  for (const id of ids) {
    await a.ev(`selectPatient('${id}')`); await b.ev(`selectPatient('${id}')`);
    assert.deepEqual(a.evj('state.map(x=>x.lf)'), b.evj('state.map(x=>x.lf)'), id + ': tipos de noche');
    // v4.9.9: las noches con las respuestas de la noche (a minuto) se miden con ellas; las demás, con la rejilla, como antes
    if (a.ev('state.some((d,i)=>d.gd&&_gdCoincide(i))')) {
      const ma = a.evj('metricsOfState(state)'), mb = b.evj('metricsOfState(state)');
      assert.ok(Math.abs(ma.tst - mb.tst) < 30 && Math.abs(ma.se - mb.se) < 6, id + ': a minuto, cerca de la rejilla');
      assert.ok(a.ev('dayMetrics(0).fuente') === 'editor', id + ': fuente');
    } else assert.deepEqual(a.evj('metricsOfState(state)'), b.evj('metricsOfState(state)'), id + ': análisis');
  }
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []);
});

test('MCTQ: cada fila marca su fecha; desde las 00:00 la fila es del día siguiente; «lab. → fest.» en los cambios', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);   // empieza el lunes 2/6/2025; noches del viernes y del sábado, libres
  assert.equal(app.ev('state.slice(0,7).map(x=>x.lf).join("")'), 'LLLLFFL');
  assert.equal(app.ev('[0,1,2,3,4,5,6,7].map(tipoFecha).join("")'), 'LLLLLFFL', 'lun–vie laborables, sáb y dom festivos, lun laborable');
  const lun = celda(app, 0), jue = celda(app, 3), vie = celda(app, 4), sab = celda(app, 5), dom = celda(app, 6);
  assert.deepEqual(jue.m, [[3, 'L', 'Laborable']]); assert.equal(jue.par, false);
  assert.equal(lun.par, false); assert.equal(lun.hr, 'L'.repeat(24));
  // viernes: su fecha es laborable y la noche, antes de festivo
  assert.deepEqual(vie.m, [[4, 'L', 'lab.'], [5, 'F', 'fest.']]); assert.equal(vie.par, true);
  assert.equal(vie.festiu, true); assert.equal(vie.fdia, false);
  assert.equal(vie.hr, 'LLLL' + 'F'.repeat(20), 'de 20 a 24 el viernes; desde las 00, el sábado');
  assert.match(app.ev(`document.querySelector('#gridBody tr[data-d="4"] .lfs').title`), /Noche antes de festivo/);
  // sábado: festivo entero; domingo: festivo hasta las 24 y la noche, antes de laborable
  assert.deepEqual(sab.m, [[5, 'F', 'Festivo']]); assert.equal(sab.hr, 'F'.repeat(24)); assert.equal(sab.festiu && sab.fdia, true);
  assert.deepEqual(dom.m, [[6, 'F', 'fest.'], [7, 'L', 'lab.']]); assert.equal(dom.hr, 'FFFF' + 'L'.repeat(20));
  assert.equal(dom.festiu, false); assert.equal(dom.fdia, true);
  assert.match(app.ev(`document.querySelector('#gridBody tr[data-d="6"] .lfs').title`), /Noche antes de laborable/);
  // la última fila muestra siempre los dos días, para poder marcar la mañana final
  const ult = celda(app, 20); assert.equal(ult.par, true); assert.deepEqual(ult.m.map(x => x[0]), [20, 21]);
  assert.deepEqual(app.errors, []);
});

test('MCTQ: tocar la marca de una fecha cambia la noche que acaba en ella', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  // el sábado 7 como laborable: la noche del viernes pasa a laborable y la del sábado empieza en laborable
  app.ev(`document.querySelector('#gridBody tr[data-d="5"] .lf[data-lfd="5"]').click()`);
  assert.equal(app.ev('state[4].lf'), 'L'); assert.equal(app.ev('state[5].lf'), 'F');
  assert.equal(celda(app, 4).par, false);
  assert.deepEqual(celda(app, 5).m, [[5, 'L', 'lab.'], [6, 'F', 'fest.']]);
  // y de nuevo festivo, ahora desde la marca de la mañana de la fila del viernes
  app.ev(`document.querySelector('#gridBody tr[data-d="5"] .lf[data-lfd="5"]').click()`);
  assert.equal(app.ev('state[4].lf'), 'F');
  app.ev(`document.querySelector('#gridBody tr[data-d="4"] .lf[data-lfd="5"]').click()`);
  assert.equal(app.ev('state[4].lf'), 'L', 'la marca «fest.» de la fila del viernes también cambia el sábado');
  app.ev(`document.querySelector('#gridBody tr[data-d="5"] .lf[data-lfd="5"]').click()`);
  assert.equal(app.ev('state[4].lf'), 'F');
  // la primera fecha no la da ninguna noche: se guarda aparte y no cambia ninguna noche
  const antes = app.ev('state.map(x=>x.lf).join("")');
  app.ev(`document.querySelector('#gridBody tr[data-d="0"] .lf[data-lfd="0"]').click()`);
  assert.equal(app.ev('state[0].lft'), 'F'); assert.equal(app.ev('state.map(x=>x.lf).join("")'), antes);
  assert.equal(celda(app, 0).hr, 'FFFF' + 'L'.repeat(20));
  assert.deepEqual(celda(app, 0).m.map(x => x[2]), ['fest.', 'lab.']);
  // la mañana final (fecha 21) cambia la última noche
  const l20 = app.ev('state[20].lf');
  app.ev(`document.querySelector('#gridBody tr[data-d="20"] .lf[data-lfd="21"]').click()`);
  assert.notEqual(app.ev('state[20].lf'), l20);
  // con teclado
  app.ev(`document.querySelector('#gridBody tr[data-d="2"] .lf').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);
  assert.equal(app.ev('state[1].lf'), 'F');
  assert.deepEqual(app.errors, []);
});

test('MCTQ: el tipo de cada fecha viaja en el CSV (tipo_fecha) y un CSV anterior se importa igual', async () => {
  const app = await loadApp(); await loginDoctor(app);
  await app.ev(`selectPatient('caso-normal')`);
  let csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /\ndia;fecha;tipo;tipo_fecha;sueno;/);
  assert.match(csv, /\n5;06\/06;F;L;/, 'viernes: noche libre, fecha laborable');
  assert.match(csv, /\n7;08\/06;L;F;/, 'domingo: noche laborable, fecha festiva');
  // sin tipo propio de la primera fecha, la ida y vuelta no lo inventa
  assert.equal(app.evj(`rawImportText(${JSON.stringify(csv)}).state[0].lft`), undefined);
  app.ev(`state[0].lft='F'`); csv = app.ev('buildUnifiedCsv()');
  assert.match(csv, /\n1;02\/06;L;F;/);
  const st = app.evj(`rawImportText(${JSON.stringify(csv)}).state`);
  assert.equal(st[0].lft, 'F'); assert.equal(st.map(x => x.lf).join(''), app.ev('state.map(x=>x.lf).join("")'));
  // un CSV de la v4.9.7 (sin la columna) da las mismas noches
  const viejo = csv.replace(/\ndia;fecha;tipo;tipo_fecha;/, '\ndia;fecha;tipo;').replace(/^(\d+;[^;\n]*;[LF]);[LF];/gm, '$1;');
  const st2 = app.evj(`rawImportText(${JSON.stringify(viejo)}).state`);
  assert.equal(st2.map(x => x.lf).join(''), st.map(x => x.lf).join('')); assert.equal(st2[0].lft, undefined);
  assert.deepEqual(app.errors, []);
});

test('MCTQ: el editor de la noche muestra los dos días de la noche y deja cambiarlos (v4.9.9)', async () => {
  const app = await loadApp();
  app.ev(`initState();startDate=new Date('2025-06-02T00:00:00');[4,5].forEach(d=>state[d].lf='F');buildBody();`);
  const valorar = () => ['qs', 'qd', 'qe'].forEach(k => app.doc.querySelector(`#edValor .vfila[data-k="${k}"] .vop[data-v="3"]`).click());
  app.ev('abrirEditorNoche(4)');
  const dias = () => app.evj(`['edDiaA','edDiaB'].map(id=>[document.getElementById(id).className,document.getElementById(id).textContent])`);
  let d = dias();
  assert.match(d[0][1], /vie 6 jun/i); assert.match(d[0][1], /Laborable/); assert.match(d[0][0], /\bL\b/);
  assert.match(d[1][1], /sáb 7 jun/i); assert.match(d[1][1], /Festivo/); assert.match(d[1][0], /\bF\b/);
  assert.match(app.ev(`document.getElementById('edTrans').textContent`), /Noche antesde festivo/);
  assert.ok(app.ev(`document.getElementById('edTrans').classList.contains('cambio')`));
  // el sábado 7 → laborable: cambia la noche 4 (la del viernes al sábado) al guardar
  app.doc.getElementById('edDiaB').click();
  assert.match(app.ev(`document.getElementById('edTrans').textContent`), /Entrelaborables/);
  assert.equal(app.ev('state[4].lf'), 'F', 'no cambia hasta guardar');
  app.ev('EditorNoche.irPaso(1)'); valorar(); app.doc.getElementById('edGuardar2').click();
  assert.equal(app.ev('state[4].lf'), 'L');
  // el viernes 6 → festivo: cambia la noche del jueves (3)
  app.ev('abrirEditorNoche(4)'); app.doc.getElementById('edDiaA').click();
  app.ev('EditorNoche.irPaso(1)'); app.doc.getElementById('edGuardar2').click();
  assert.equal(app.ev('state[3].lf'), 'F');
  assert.deepEqual(app.errors, []);
});

test('MCTQ: textos en catalán y ayuda del paciente', async () => {
  const app = await loadApp();
  app.ev(`setLang('ca')`);
  assert.equal(app.ev(`t('tr.LF')`), 'Nit abans de festiu: compta com a nit lliure');
  assert.equal(app.ev(`t('tr.FL')`), 'Nit abans de laborable');
  assert.match(app.ev(`t('help.patient')`), /editor de la nit/);   // v4.9.9
  assert.match(app.ev(`t('help.v499')`), /editor de la nit/);
  app.ev(`setLang('es')`);
  assert.match(app.ev(`t('help.patient')`), /editor de la noche/);
  assert.deepEqual(app.errors, []);
});
