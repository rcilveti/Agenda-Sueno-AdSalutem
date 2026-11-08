# Auditoría de la Agenda de Sueño v5.0.0 (pruebas)

Noviembre de 2026 · modo piloto, solo datos ficticios · versión de pruebas en `v5.0.0/` (la versión en uso sigue siendo la v4.9.9, en la raíz)

## 1. Qué es la v5.0.0

La v5.0.0 parte de la v4.9.9 y permite seguir a un paciente con **varios diarios** (basal, tras una intervención, seguimiento) y **compararlos**. La pantalla del paciente no cambia.

**Reglas pedidas:**

- Umbrales de relevancia clínica por defecto: los de la **AASM** (Edinger et al., 2021), **editables** por el profesional.
- Solo se comparan diarios con el **mismo sistema de registro**.
- Cada diario necesita **al menos 14 noches** anotadas y **2 fines de semana** registrados.

**Decisiones tomadas al prepararla:**

| Tema | Decisión |
|---|---|
| Dónde se publica | En `/v5.0.0/`, como versión de pruebas. La raíz sigue con la v4.9.9 |
| Fin de semana registrado | Las dos noches anotadas: la del viernes al sábado y la del sábado al domingo |
| Sistema de registro de un diario | **Editor** si al menos el 75 % de sus noches se anotó en el editor de la noche; **rejilla** si al menos el 75 % se anotó en la rejilla; **mixto** en otro caso |
| Quién crea los diarios | El profesional, desde la ficha («＋ Nuevo diario»). Al crearlo puede abrir el acceso del paciente para ese periodo |
| Diarios que llegan por archivo o por el enlace | Van al diario que corresponde por fechas: si se solapan con el abierto o con otro guardado, se fusionan con él; si no, se añaden como diario nuevo |
| Móvil del paciente | Un acceso con otra fecha de inicio que no se solapa empieza un diario en blanco y guarda el anterior (si tenía noches) |
| Referencia | El más antiguo de los diarios elegidos. Con tres o más, el último también se compara con el anterior (mantenimiento o pérdida de respuesta) |

**Datos.** El registro del paciente mantiene los campos de siempre para el diario abierto (`state`, `start`, `ventanas`, `hitos`) y añade:

- `diario`: `{id, etiqueta, intervencion}` del diario abierto;
- `diarios`: los demás, cada uno con `{id, inicio, etiqueta, intervencion, state, ventanas, hitos}`;
- `ver`: la versión mínima necesaria para abrirlo sin pérdidas: `5.0.0` si tiene varios diarios, o etiqueta o intervención en el suyo; `4.9.9` si no.

El CSV añade `diario_etiqueta` y `diario_intervencion` en los datos del paciente, y el JSON, el objeto `diario`. El formato de datos sigue en la versión 5: las versiones anteriores ignoran esos campos.

## 2. Método

| Comprobación | Alcance |
|---|---|
| Pruebas automáticas (jsdom) | **125 pruebas, 125 superadas**: las 113 de la v4.9.9, copiadas en `v5.0.0/tests/` y adaptadas, y 12 nuevas (`v5.0.0/tests/v500.test.js`), una de ellas con el resultado de los 14 casos de evolución. Las de la raíz no cambian (la raíz no se ha tocado) |
| Navegador real (Playwright, Chromium) | Escritorio a 1300 px, iPhone 13, iPhone SE y tableta (820 px): ficha con el selector de diario, ventana «Nuevo diario», apartado de comparación (resumen, evolución por métrica, gráficos y detalle) y umbrales. Sin errores de JavaScript ni desbordamiento lateral en el móvil |
| Estadística a mano | Las medias, diferencias e intervalos de confianza del caso de insomnio se recalcularon en Python (SciPy) con los datos de cada noche (apartado 4) |
| Impresión y exportaciones | PDF del análisis generado con Chromium (hojas apaisadas de la comparación entre las verticales, posición del pie en cada hoja), Word del análisis abierto con LibreOffice (secciones apaisadas), Excel del paciente (hoja «Comparación» con su resumen), CSV y JSON de ida y vuelta |
| Compatibilidad | La v4.9.9 de la raíz, cargada en las pruebas, abre los pacientes de un solo diario guardados por la v5.0.0 y no sobrescribe los de varios diarios |
| Casos de ejemplo | Los 34 casos (17 de la v4.9.9, 3 con varios diarios y 14 de evolución) se abren en el editor sin errores y hacen el viaje de ida y vuelta por CSV |

## 3. Resultados por área

### Varios diarios

| Flujo | Resultado |
|---|---|
| Ficha: selector de diario (Diario 1, Diario 2…, con su etiqueta), «＋ Nuevo diario» y ✎ para la etiqueta y la intervención | Correcto. Con un solo diario, el selector está desactivado y explica por qué |
| Nuevo diario: fecha de inicio propuesta (21 días después de terminar el último), etiqueta e intervención; no se puede solapar con otro diario | Correcto. Si se solapa, avisa con la fecha del diario con el que choca |
| Un diario abierto vacío no se archiva al crear otro | Correcto |
| Abrir otro diario: lo anotado en el abierto se guarda con él | Correcto |
| Borrar el diario abierto | Solo si hay otros diarios y no en los casos de ejemplo |
| Archivo de otras fechas → diario nuevo; archivo que se solapa con un diario guardado → ese diario | Correcto, con su aviso |
| Móvil: acceso que se solapa → mismo diario; acceso con otra fecha → diario nuevo y el anterior guardado | Correcto. Un diario sin noches no se guarda: solo cambia la fecha |
| Copia de seguridad | Incluye todos los diarios del paciente |

### Comparación de diarios

| Flujo | Resultado |
|---|---|
| Apartado «Comparación de diarios del paciente» en el análisis, tras la primera hoja | Aparece solo si el paciente tiene más de un diario |
| Tabla de diarios: fechas, sistema, noches, fines de semana, medias, remisión y si es apto, con «Abrir» y el color de cada diario en los gráficos | Correcto. Los no aptos explican el motivo (p. ej., «11 noches anotadas (mínimo 14)») |
| **Resumen**: resultado del último diario frente a la referencia (con una frase corta), los demás diarios frente a la referencia, mantenimiento respecto al anterior y remisión de cada diario; al lado, hasta 4 tarjetas con las métricas más significativas | Correcto. Las tarjetas muestran primero los cambios relevantes, por orden clínico (latencia, WASO, eficiencia, tiempo de sueño…), no por veces el umbral |
| **Evolución por métrica**: una fila por métrica (agrupadas), una columna por diario con su media y, en los posteriores, el cambio respecto a la referencia con color y símbolo (✓, ?, ✗) | Correcto. Se lee también en blanco y negro gracias a los símbolos; leyenda debajo |
| **Gráficos**: cambio en veces el umbral clínico con su IC (todas las métricas en una escala), horario medio de cada diario y noche a noche (latencia, WASO, tiempo de sueño, eficiencia) | Correcto. En el móvil, los gráficos anchos se desplazan dentro de su caja; la página no se ensancha |
| **Detalle estadístico**: una tabla por comparación (media ± DE, diferencia, IC 95 %, diferencia mínima detectable, NAP, g, umbral, valoración) | Plegado en pantalla («Ver el detalle estadístico»); en el PDF y en el Word va siempre |
| Casillas para elegir diarios | Desactivadas en los no aptos y en los de otro sistema de registro. Por defecto se eligen los aptos del sistema del diario abierto |
| Mezcla de sistemas | No se compara: «Solo se pueden comparar diarios con el mismo sistema de registro» |
| Umbrales (AASM): ver, editar, elegir qué métricas cuentan para la respuesta, restablecer | Correcto. Se guardan en el navegador (`agenda_umbrales_comparacion`) y el apartado indica si están editados |
| Avisos | Proporción distinta de noches antes de festivo (más de 15 puntos) y tratamiento anotado en el diario posterior |
| Informe clínico provisional | Apartado «Evolución respecto a los diarios anteriores» y una frase en las conclusiones |
| PDF del análisis | Hojas apaisadas (A4 horizontal) entre las verticales: 1) diarios y resumen; 2) evolución por métrica y método; 3) cambio en veces el umbral y horario medio; 4) noche a noche; 5 y 6) detalle estadístico. En el caso de insomnio, 6 hojas apaisadas. Si no hay nada que comparar, no se imprime |
| Pie de página del PDF | Con hojas de dos tamaños, en el margen de cada hoja (Chrome y Edge, que admiten los márgenes de página); en los demás navegadores, el pie de siempre. Comprobado en el PDF: una vez por hoja, abajo, también en el anexo |
| Word | El apartado, como imágenes del PDF, en una sección apaisada entre dos verticales y con las mismas hojas que el PDF; el informe clínico, con la evolución, editable |
| Excel | Hoja «Comparación» con los diarios, un resumen (media de cada diario y valoración del cambio respecto a la referencia) y cada comparación |

## 4. Estadística comprobada a mano

Método de la aplicación, para cada métrica y cada par de diarios (el posterior frente al anterior):

- **Diferencia de medias** con su intervalo de confianza del 95 % (Welch). La dependencia entre noches se corrige con las *noches efectivas* `n·(1−r₁)/(1+r₁)`, con la autocorrelación de primer orden `r₁` acotada entre 0 y 0,8.
- **NAP** (no solapamiento de todos los pares; Parker y Vannest, 2009) y **g de Hedges**.
- **Valoración** frente al umbral: mejoría clínicamente relevante (la diferencia supera el umbral y el intervalo excluye el 0), no concluyente (supera el umbral, pero el intervalo incluye el 0), pequeña (fiable, por debajo del umbral), sin cambios o empeoramiento (con los mismos grados).
- **Conclusión**: respuesta, respuesta mixta, empeoramiento o sin cambios clínicamente relevantes.
- **Remisión por diario**: eficiencia ≥ 85 %, latencia ≤ 30 min, WASO ≤ 30 min y menos de 3 noches por semana con latencia o WASO de 31 min o más (Lichstein et al., 2003).

Recalculado en Python (SciPy, cuantil exacto de la t) con las noches del caso de insomnio, diario «Tras TCC-I» frente al «Basal» (20 y 19 noches):

| Métrica | Python | Aplicación |
|---|---|---|
| Latencia de sueño (min) | 59,25 → 15,79; −43,46 (IC −56,46 a −30,46) | Idéntico |
| WASO (min) | 61,75 → 4,47; −57,28 (IC −73,50 a −41,05) | Idéntico |
| Eficiencia (%) | 68,89 → 92,01; +23,12 (IC 19,59 a 26,65) | Idéntico |
| Tiempo total de sueño (min) | 340,25 → 363,16; +22,91 (IC −1,22 a 47,04) | Idéntico |

Las pruebas automáticas comprueban además el cuantil de la t (tabla hasta 10 grados de libertad y aproximación de Cornish-Fisher por encima), el NAP con empates, la g de Hedges y que la autocorrelación positiva reduce las noches efectivas.

## 5. Casos de ejemplo nuevos (datos ficticios)

Se cargan con la marca 18. Si los 17 de la v4.9.9 ya estaban en el navegador, no se vuelven a cargar.

| Caso | Diarios | Resultado |
|---|---|---|
| Insomnio: basal, tras TCC-I y a los 3 meses (mujer, 46 años) | 1. Diario antiguo, de la rejilla (19 noches). 2. Basal (20). 3. Tras TCC-I (19). 4. Seguimiento a los 3 meses (17, abierto) | El 1 no se puede comparar con los demás (otro sistema). 3 frente a 2: **respuesta** (latencia 59 → 16 min, WASO 62 → 4 min, eficiencia 69 → 92 %; el tiempo total de sueño, mejoría no concluyente) y remisión. 4 frente a 2: respuesta. 4 frente a 3: se mantiene |
| Niño de 3 años: antes y después de la extinción gradual | 1. Basal (20 noches). 2. Tras la extinción gradual (19, abierto) | **Respuesta** (latencia 69 → 14 min, WASO 59 → 2 min) y remisión |
| Retraso de fase: basal y con melatonina (17 años) | 1. Basal (20 noches). 2. Con melatonina (11, abierto) | El diario 2 **no es apto**: 11 noches (mínimo 14) y 1 fin de semana completo (mínimo 2). No hay comparación |

**Casos para estudiar la evolución (marca 19).** Catorce casos más («Evolución 1» a «Evolución 14»). Cada uno parte de un caso de la v4.9.9: su diario de 21 noches es el basal, sin cambios, y los diarios siguientes se generan transformando esas noches (latencia, despertares, ventana de sueño, calidades, noches sin anotar o anotadas en la rejilla) con un generador reproducible, guardándolas como el editor de la noche. Entre todos recorren las 8 valoraciones, las 4 conclusiones, el mantenimiento y la pérdida de respuesta, los cambios de remisión, los dos avisos, los dos motivos de no aptitud (en el límite exacto), el umbral del 75 % del sistema de registro, el diario abierto mixto, las siestas en menores y la autocorrelación. Una prueba automática fija el resultado de cada uno. La guía `casos_evolucion_v5.0.0.md` da los diarios, el resultado exacto de cada métrica y ejercicios con los umbrales.

Lo que estos casos dejan ver del método, para decidir (detalle en la guía):

- **Diarios con tendencia** (casos 7 y 14): con r₁ acotado a 0,8, las noches efectivas bajan a n/9 (mínimo 2) y la t, con 1-2 grados de libertad, llega a 12,7; los intervalos se vuelven enormes (p. ej., el del tiempo en la cama en el caso 14). Conservador, pero poco interpretable.
- **«Se mantiene» tras un empeoramiento** (caso 4): la comparación con el anterior solo mira si algo empeora.
- **Remisión del adulto en un bebé** (caso 10), **respuesta solo por la calidad percibida** (caso 9) y **vacaciones** que dan «respuesta» con solo un aviso (caso 13).
- **Diario abierto mixto** (caso 11): por defecto no hay comparación hasta quitarlo.

## 6. Compatibilidad entre versiones

- **v4.9.9 → v5.0.0.** La v5.0.0 abre todos los pacientes de la v4.9.9 (un solo diario, sin cambios).
- **v5.0.0 → v4.9.9.** Un paciente con un solo diario se sigue guardando como de la v4.9.9 y la v4.9.9 lo abre y lo guarda con normalidad. Uno con varios diarios se guarda como de la v5.0.0: la v4.9.9 lo muestra con el aviso de versión posterior y no lo sobrescribe (se perderían los demás diarios).
- **Mismo navegador.** Las versiones comparten el almacenamiento del navegador. Los umbrales editados se guardan en una clave propia, que la v4.9.9 no usa.
- **Archivos.** El CSV y el JSON de la v5.0.0 se leen en la v4.9.9 (ignora la etiqueta y la intervención). Cada archivo lleva un solo diario.

## 7. Incidencias encontradas y corregidas durante la auditoría

| Incidencia | Corrección |
|---|---|
| Un archivo que se solapaba con un diario guardado, con el diario abierto vacío, se cargaba en el abierto (diario duplicado) | Primero se busca el diario guardado que se solapa. Un diario abierto vacío solo se sustituye si es el único y no tiene etiqueta |
| El apartado de comparación aparecía con un solo diario y dejaba una hoja casi en blanco en el PDF | Solo aparece con varios diarios y no se imprime si no hay nada que comparar |
| La comparación ocupaba 5 hojas en el PDF, con columnas mal cortadas | Estilos de impresión compactos con anchos fijos, y cada comparación entera en una hoja (sin chocar con el pie) |
| Revisión de la presentación (a petición): las tablas eran densas y los gráficos, muy simples | Resumen con el resultado y las métricas más significativas; tabla de evolución con una columna por diario; gráficos del cambio en veces el umbral, del horario medio y noche a noche; detalle estadístico aparte; hojas apaisadas en el PDF y en el Word |
| Con hojas apaisadas en medio del PDF, el pie fijo aparecía a media hoja (encima de las tablas) y, en la hoja vertical siguiente, dos veces | El pie va en el margen de cada hoja (@page) cuando el navegador lo admite |
| En el Word, la tabla de evolución no cabía en la hoja apaisada (se dibujaba a 277 mm y se ampliaba a 285 mm) | Se dibuja con el ancho de la hoja del Word |
| Las tarjetas del resumen ponían primero las calidades (su umbral en DE da muchas «veces el umbral») | Orden clínico entre los cambios relevantes |
| Textos: «−0 min», unidades de minutos en los despertares, desviación del tiempo total sin minutos, títulos de los gráficos cortados | Corregidos |
| Casos de ejemplo: en el niño, una noche sin anotar seguida de una noche con siesta dejaba en la fila anterior una siesta sola | El generador ya no anota la siesta de la noche que sigue a una noche sin anotar, y las marcas de tiempo quedan en las fechas del caso |
| Ida y vuelta CSV de los casos nuevos: se perdía el tipo de día de la fila 0 | El generador no lo guarda cuando es el de por defecto (laborable), como el CSV |

## 8. Limitaciones y pendientes

- Los umbrales de la AASM se definieron para comparar grupos de pacientes. En un paciente orientan sobre el cambio que importa, y por eso se pueden editar.
- La corrección por la dependencia entre noches es aproximada (de primer orden). Con 14 a 21 noches, los intervalos son orientativos.
- La comparación no corrige la regresión a la media, la estación del año ni los periodos de vacaciones. Avisa si la proporción de noches antes de festivo es muy distinta.
- Los fines de semana son el sábado y el domingo del calendario. En trabajo a turnos, los días libres pueden ser otros.
- Sin cuestionarios (ISI): la respuesta y la remisión se valoran solo con el diario.
- El pie de página en el margen de cada hoja necesita un navegador que admita los márgenes de página (Chrome y Edge). En Firefox y Safari se imprime el pie de siempre, que en las hojas apaisadas puede quedar a media hoja. Para el PDF del análisis con la comparación, mejor Chrome o Edge.
- En el iPhone SE, la leyenda de las valoraciones de la rejilla del profesional ensancha la página unos 70 px. Viene de la v4.9.9 y no es de esta versión.
- Las guías del paciente de la v4.9.9 siguen valiendo, porque su pantalla no cambia. El capítulo 11 del documento técnico (`Agenda_Sueno_v5.0.0_documento_tecnico.pdf`) describe la versión.

## Referencias

- Edinger JD, et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine systematic review, meta-analysis, and GRADE assessment. *J Clin Sleep Med.* 2021;17(2):263-298.
- Parker RI, Vannest K. An improved effect size for single-case research: nonoverlap of all pairs. *Behav Ther.* 2009;40(4):357-367.
- Lichstein KL, Durrence HH, Taylor DJ, Bush AJ, Riedel BW. Quantitative criteria for insomnia. *Behav Res Ther.* 2003;41(4):427-445.
