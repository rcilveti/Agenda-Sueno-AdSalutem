# Agenda de Sueño digital — AdSalutem

Diario de sueño de tres semanas en formato digital. Aplicación de un solo archivo,
sin servidor ni base de datos, pensada para funcionar en móvil, tableta y ordenador,
en castellano y en catalán.

**Versión actual:** v4.9.9 (noviembre de 2026) — MODO PILOTO (datos ficticios, sin cifrado)

**Dirección:** https://rcilveti.github.io/Agenda-Sueno-AdSalutem/

**Otras versiones** (ver «Varias versiones a la vez»):

- v4.9.5 (la anterior versión en uso: rejilla pintada a mano) en
  https://rcilveti.github.io/Agenda-Sueno-AdSalutem/v4.9.5/
- v4.9.6 (pruebas: modelo mixto, rejilla + minutos de la noche) en
  https://rcilveti.github.io/Agenda-Sueno-AdSalutem/v4.9.6/
- v4.9.7 (pruebas: recordatorio diario, registro con preguntas, factores del día,
  ventana de sueño e hitos, tendencias, patrón propio y resumen para la consulta) en
  https://rcilveti.github.io/Agenda-Sueno-AdSalutem/v4.9.7/
- v5.0.0 (pruebas: varios diarios por paciente y comparación de diarios) en
  https://rcilveti.github.io/Agenda-Sueno-AdSalutem/v5.0.0/

---

## ⚠️ AVISO CRÍTICO DE PROTECCIÓN DE DATOS

**En este repositorio SOLO se aloja la aplicación. NUNCA los datos de pacientes.**

Este repositorio es público: cualquier archivo subido aquí queda visible para todo
internet e indexable por buscadores. Subir un diario de un paciente sería una brecha
de datos de salud (RGPD, categoría especial del art. 9).

Los diarios viajan **como archivo adjunto o como enlace** entre profesional y paciente,
y se guardan **en sus dispositivos**, nunca en este repositorio.

El archivo `.gitignore` bloquea los nombres que genera la aplicación (`agenda-sueno_*`,
`*.csv`, `copia_seguridad_*`, informes Word y Excel, PDF fuera de `docs/`). Es una red
de seguridad para quien usa git o GitHub Desktop; **si subes arrastrando archivos desde
la web de GitHub, no confíes en él**: revisa siempre qué subes antes de confirmar.

---

## Contenido del repositorio

| Archivo | Función |
|---|---|
| `index.html` | La aplicación completa (incluye la librería QR incrustada) |
| `sw.js` | Hace que la app funcione sin conexión y recibe las actualizaciones. Debe estar junto a `index.html` |
| `manifest.json` | Permite instalarla como app en el móvil |
| `icon-192.png`, `icon-512.png` | Iconos de la app instalada |
| `docs/` | Documentación de la v4.9.9: documento técnico (`Agenda_Sueno_v4.9.9_documento_tecnico.pdf`), guía del paciente en castellano (`Guia_del_paciente_v4.9.9_castellano.pdf`) y en catalán (`Guia_del_pacient_v4.9.9_catala.pdf`) y auditoría (`auditoria_v4.9.9.md`). Las de otras versiones están en `v4.9.5/docs/`, `v4.9.6/docs/`, `v4.9.7/docs/` y `v5.0.0/docs/` |
| `tests/`, `package.json` | Pruebas automáticas (113 de la raíz; las de `v4.9.5/`, `v4.9.6/`, `v4.9.7/` y `v5.0.0/` van en sus carpetas) |
| `v4.9.5/`, `v4.9.6/`, `v4.9.7/`, `v5.0.0/` | Otras versiones, cada una con su página, service worker, manifiesto, iconos, documentación y pruebas |
| `.github/workflows/tests.yml` | Ejecuta las pruebas en GitHub cada vez que se sube un cambio (pestaña *Actions*) |
| `.gitignore` | Bloquea la subida accidental de datos clínicos |

La aplicación solo necesita conexión para cargarse la primera vez y para actualizarse:
no depende de ningún servicio externo para funcionar.

---

## Cómo funciona

Dos roles, una sola pantalla de acceso. El sistema reconoce por las credenciales
si quien entra es profesional o paciente.

**Profesional** (usuario y contraseña). Gestiona los diarios, ve el análisis clínico
de cada caso, imprime los PDF y exporta. En la demo: `medico` / `clinica`.

**Paciente** (código QR o código de acceso de 8 caracteres, p. ej. `ABCD-2345`). El
acceso lo genera el profesional al crear el diario y vale 2 meses. El último carácter
es de control, así que un código mal tecleado se rechaza. En la demo también existe
el acceso `paciente` / `demo`.

### Circuito de uso

1. El profesional crea un diario nuevo y completa los datos del paciente. Al pulsar
   **«Guardar datos del paciente»**, la aplicación muestra el **código QR**, el código
   de acceso y botones para imprimir o enviar. Se puede volver a ver o renovar con
   **«🔑 Acceso del paciente»**.
2. El paciente **escanea el QR** (o escribe el código): entra directo, con su ficha ya
   rellena y el diario en blanco listo.
3. En su móvil la **sesión queda abierta**: al abrir el icono entra directamente en el
   diario, sin volver a escribir el código. Solo si pulsa «Cerrar sesión» se le vuelve
   a pedir, y aun así el código aparece ya escrito (un toque en «Entrar»). En ordenadores
   y en dispositivos compartidos la sesión nunca queda abierta.
4. El paciente anota cada mañana la noche que acaba de pasar: toca la noche en la lista
   de su diario y la anota en el **editor de la noche** (horas, despertares, acontecimientos,
   valoración y notas). Se autoguarda y queda la hora de registro de cada noche.
5. Al terminar, pulsa **«Enviar mi diario»** y lo devuelve por WhatsApp o correo; el
   profesional lo carga en su base con un toque.

### Rellenado y varios dispositivos

En el dispositivo del paciente el diario se autoguarda tras cada cambio. Lo recomendable
es usar siempre el mismo dispositivo; aun así, si el diario se carga en un segundo
dispositivo, la aplicación **fusiona** día a día en vez de sobrescribir.

### Formas de intercambiar los datos

- **Código QR** (inicio): lleva el acceso y los datos de ficha.
- **Archivo** (CSV, ~2 KB) o **enlace** (devolución): el diario completo viaja por
  WhatsApp o correo al terminar.

---

## Novedades recientes

**v5.0.0 (pruebas, en `v5.0.0/`) — Varios diarios por paciente y comparación de diarios.** Sobre la
v4.9.9, para seguir a un paciente antes y después de una intervención:

- *Varios diarios por paciente*: en la ficha, un selector con todos sus diarios (Diario 1, Diario 2…,
  con su etiqueta) y «＋ Nuevo diario». Cada diario tiene su fecha de inicio (sin solaparse con los
  demás), su etiqueta (Basal, Tras TCC-I…) y la intervención desde el anterior. El profesional crea el
  diario nuevo y, si quiere, abre el acceso del paciente para ese periodo.
- *Diarios que llegan por archivo o por el enlace*: van al diario que corresponde por fechas. Si se
  solapa con el abierto o con otro guardado, se fusiona con él; si no, se añade como diario nuevo. En
  el móvil, un acceso con otra fecha de inicio empieza un diario en blanco y guarda el anterior.
- *Comparación de diarios* (análisis): solo entre diarios del **mismo sistema de registro** (editor de
  la noche, rejilla o mixto: el de al menos el 75 % de sus noches) y con **al menos 14 noches y 2 fines
  de semana completos** (las noches del viernes al sábado y del sábado al domingo). El más antiguo de
  los elegidos es la referencia; con tres o más, el último se compara también con el anterior.
- *Por cada métrica* (latencia, WASO, despertares, tiempo total, eficiencia y calidades): medias,
  diferencia con su intervalo de confianza del 95 % (corregido por la dependencia entre noches), NAP y
  g de Hedges, y la valoración frente al **umbral de relevancia clínica de la AASM** (Edinger 2021),
  editable: mejoría clínicamente relevante, no concluyente, pequeña, sin cambios o empeoramiento.
  Conclusión: respuesta, respuesta mixta, empeoramiento o sin cambios clínicamente relevantes; remisión por diario
  (eficiencia ≥ 85 %, latencia y WASO ≤ 30 min).
- *Presentación*: primero un **resumen** (resultado, mantenimiento, remisión y las métricas más
  significativas en tarjetas) y la **evolución por métrica** (una columna por diario, con el cambio
  respecto a la referencia en color y con símbolo); después, **gráficos** (cambio en veces el umbral
  clínico, horario medio y noche a noche) y, plegado, el **detalle estadístico** de cada comparación.
- *Informe clínico provisional*: apartado «Evolución respecto a los diarios anteriores» y una frase en
  las conclusiones. *PDF del análisis* con la comparación en **hojas apaisadas**; *Word* con una sección
  apaisada; *Excel* con la hoja «Comparación» (y su resumen).
- *Compatibilidad*: un paciente con varios diarios se guarda como de la v5.0.0 y la v4.9.9 no lo
  sobrescribe; uno con un solo diario sigue siendo de la v4.9.9. El CSV y el JSON llevan la etiqueta y
  la intervención del diario (el formato de datos sigue en la versión 5).
- Tres casos de ejemplo nuevos con varios diarios (insomnio con TCC-I y seguimiento, niño de 3 años
  con extinción gradual y retraso de fase con un diario corto, que no se puede comparar).
- *Catorce casos para estudiar la evolución* («Evolución 1» a «Evolución 14»): cada uno parte de un caso
  de la v4.9.9 (su diario es el basal) y sus diarios siguientes son transformaciones controladas de esas
  noches, con resultado conocido: respuesta con y sin remisión, respuesta mixta, empeoramiento, sin
  cambios, mejoría pequeña, no concluyente, pérdida de respuesta, respuesta solo por la calidad, bebé,
  sistemas de registro, aptitud al límite, vacaciones y basal con tendencia. Guía con los resultados
  exactos y ejercicios en `v5.0.0/docs/casos_evolucion_v5.0.0.md`.
- La pantalla del paciente no cambia: sirven las guías del paciente de la v4.9.9. Documento técnico
  (capítulo 11) y auditoría en `v5.0.0/docs/`.

**v4.9.9 — Editor de la noche y pantalla nueva del paciente.** Sobre la v4.9.7, con la regla del MCTQ
de la v4.9.8 (que no se llegó a publicar):

- *Regla del MCTQ*: cada fecha se marca como laborable o festiva y cada noche cuenta como el día en
  que te levantas (la del viernes al sábado es una noche antes de festivo).
- *Editor de la noche*, única forma de anotar, en cuatro pasos (noche · siestas · valoración ·
  notas) y con un eje de 18:00 a 20:00 del día siguiente (sirve para niños que se acuestan antes de
  las 20:00), que se abre con la noche ya encuadrada y con el fondo de la escala horaria del color
  de cada día (laborable o festivo): acostarse de 15 en 15 minutos y el despertar final como hora
  (botones de 15 en 15, con el dedo de 5 en 5); latencia, despertares en escalones (5 min hasta
  media hora, luego 45, 60 y de 30 en 30) y levantarse como el rato en la cama tras el despertar
  final, de 0, 5, 10, 15, 20 o 30 minutos y luego de 30 en 30 (mover levantarse no mueve el
  despertar final); sin zoom de la pantalla mientras el editor está abierto;
  acontecimientos con su hora y su tipo (🚽 baño, 💢 dolor, 🔊 ruido, 🌡️ calor o frío,
  😟 preocupación, 😷 tos, 👶 niño, 🍼 toma, 🏷️ otro); siestas del día anterior a la noche, que se
  arrastran con el dedo (hora y duración, opcional); valoración 1–5 obligatoria (el estado del día,
  con la fecha del día previo); tratamiento y observaciones opcionales (en el móvil en vertical, mientras
  se escribe, el editor se pone derecho, como el teclado). La cabecera se compacta si no cabe, sin
  solaparse. La rejilla se pinta sola y queda para consultar e imprimir. El editor está también en catalán.
- *Métricas a minuto* de las noches anotadas en el editor (las de diarios anteriores, con la rejilla).
- *Pantalla del paciente en el móvil*: cabecera sencilla y sin QR, fecha de inicio e instrucciones en
  una tarjeta (con «Cómo se anota», «Recordatorio» y «Ajustes» en una sola fila), las 21 noches en
  una lista por semanas con su barra y sus caras (el fondo, del color de sus dos días: laborable o
  festivo), y «Guardar» y «Enviar a mi médico» juntos abajo.
- *Del navegador a la app instalada*: lo anotado en el navegador del móvil pasa a la app al
  añadirla a la pantalla de inicio (en iPhone tienen almacenamientos separados): la dirección lleva
  una copia comprimida del diario, que la app fusiona noche a noche.
- *PDF del análisis*: la cabecera lleva el código de acceso del paciente y un solo logo, la rejilla del
  anexo cabe en su hoja apaisada y las referencias, en una hoja, sin hojas casi en blanco.
- *Word del análisis*: reproduce el PDF del análisis completo (los mismos apartados desplegados, en el
  mismo orden y con las mismas hojas). La cabecera y el informe clínico provisional son editables; el
  resto de apartados, imágenes en alta resolución del PDF, y el anexo, una imagen apaisada.
- *Calidad percibida*: la valoración sigue en la escala 1–5; las medias y medianas del análisis, del
  informe clínico y del Excel van sobre 10, como el doble del valor (1 = 2 … 5 = 10), y los anillos,
  con la leyenda sin numerar.
- Se mantienen de la v4.9.7 el recordatorio, el aviso de noche pendiente, las tendencias, el patrón
  propio y el resumen para la consulta. Se retiran el registro con preguntas, los factores del día,
  la ventana de sueño y los hitos (sus datos se conservan).
- CSV con tres columnas nuevas (`acont_tipos`, `tratamiento`, `siestas_anotadas`); el formato de
  datos sigue en la versión 5.
- *Una sola versión por diario*: cada diario guarda la versión que lo guardó, y las versiones
  anteriores (v4.9.5, v4.9.6 y v4.9.7) ya no sobrescriben un diario de la v4.9.9.
- Casos de ejemplo regenerados con el editor (acontecimientos con tipo, siestas y tratamiento, y el
  rato tras el despertar final en sus saltos), sin cambiar sus categorías clínicas.
- Documento técnico y guía del paciente (castellano y catalán) en PDF en `docs/`; auditoría completa
  en `docs/auditoria_v4.9.9.md`.

**v4.9.7 (pruebas, en `v4.9.7/`) — Adherencia, registro guiado y herramientas para el
clínico.** Sobre la v4.9.5 (sin el modelo mixto de la v4.9.6):

- *Recordatorio diario*: el paciente añade al calendario de su móvil un aviso cada mañana
  del registro (archivo `.ics` generado en el propio dispositivo, sin datos personales, o
  Google Calendar en Android), y un aviso naranja le indica al abrir la app la noche que falta.
- *Registro con preguntas* (🧭): cinco preguntas (acostarse, latencia, despertares, despertar
  final, levantarse) que pintan la rejilla conservando las duraciones; las respuestas a minuto
  se guardan con el día.
- *Factores del día*: columna con 17 etiquetas rápidas (ruido, dolor, cafeína, alcohol,
  estrés, turno…), comparadas en el análisis con las noches sin ellas.
- *Plan terapéutico*: ventana de sueño prescrita (marco verde en la rejilla, adherencia a
  ±30 min; viaja en el QR) e hitos del tratamiento.
- *Para el clínico*: resumen para la consulta (imprimible en una hoja), tendencias noche a
  noche y noches fuera del patrón habitual del propio paciente (mediana y dispersión robusta
  de sus noches comparables, por periodos entre hitos).
- Formato de datos versión 5; 17 casos de ejemplo (nuevo: insomnio en TCC-I).

**v4.9.5 — Calidades en escala de 1 a 5.** El paciente valora cada día su sueño, su
despertar y su estado durante el día de 1 a 5 (antes, con un semáforo de tres niveles).
Al tocar la casilla se abre un panel con las cinco opciones; en el PDF del diario, las
casillas vacías muestran los números para rodearlos a mano. Los diarios registrados con
el semáforo se siguen analizando en su escala, y si un diario mezcla ambas, las
valoraciones antiguas se pasan a 1–5 de forma lineal. El formato de datos pasa a la
versión 3 (el CSV guarda la escala de cada día). Los 16 casos de ejemplo se han vuelto a
valorar con una regla común, para que se puedan comparar entre sí (anexo III del
documento técnico).

**v4.9.4 — Índice de regularidad (SRI) según el estándar RIRI.** El SRI solo se calcula
con al menos 5 pares de días consecutivos con datos, se acompaña de los pares válidos y
su porcentaje, y se valora como concordancia día a día (orientativa), sin semáforo.

**v4.9.3 — Salud del sueño RU-SATED.** Índice compuesto de seis dimensiones (Regularidad,
Satisfacción, Alerta, Horario, Eficiencia y Duración) en el análisis del profesional y en
las exportaciones.

---

## Varias versiones a la vez

La raíz del sitio publica la versión en uso (v4.9.9). La carpeta `v4.9.5/` guarda la versión anterior
y las carpetas `v4.9.6/`, `v4.9.7/` y `v5.0.0/`, las versiones de pruebas; cada una con su propia página, service
worker, manifiesto, documentación (`docs/`) y pruebas automáticas (`tests/`, que `npm test` ejecuta
junto con las de la raíz). La v4.9.6 y la v4.9.7 parten de la v4.9.5 por separado; la v5.0.0, de la
v4.9.9.

- **Una sola versión por diario.** Cada diario guarda la versión que lo guardó. La v4.9.5, la v4.9.6
  y la v4.9.7 no sobrescriben un diario de la v4.9.9: muestran un aviso para abrirlo en la versión
  principal (si lo hicieran, se perderían las siestas, los acontecimientos con su tipo, el tratamiento
  y las respuestas del editor). Al revés no hay pérdidas: la v4.9.9 lee los diarios de todas las
  versiones anteriores y, al guardarlos, pasan a ser de la v4.9.9.
- **Varios diarios (v5.0.0).** Un paciente con varios diarios, o con etiqueta o intervención en su
  diario, se guarda como de la v5.0.0: la v4.9.9 lo muestra con el aviso y no lo sobrescribe (se
  perderían los demás diarios). Los pacientes con un solo diario siguen guardándose como de la v4.9.9.

- **Mismo navegador, mismos datos.** Las versiones comparten el almacenamiento del navegador
  (mismo dominio): en un dispositivo se ven los mismos pacientes y diarios en todas. Conviene que
  cada paciente use siempre la misma versión; los del modo mixto, solo la v4.9.6. Si un diario en modo mixto
  se abre y se guarda en la v4.9.5, se pierde la marca del modo (los minutos se conservan, pero la
  v4.9.5 no los muestra ni los exporta); la v4.9.7 conserva la marca, pero no usa los minutos.
- **Plan terapéutico de la v4.9.7.** Si un diario con ventana de sueño o hitos se abre y se guarda
  en la v4.9.5 o en la v4.9.6, se pierden la ventana y los hitos de la ficha. Los factores del día y
  las respuestas con preguntas se conservan, aunque esas versiones no los muestran ni los exportan.
- **Enlaces y QR.** Cada versión genera los QR y los enlaces con su propia dirección: el paciente
  entra en la versión desde la que se creó su acceso.
- **Sin conexión.** Cada carpeta guarda su propia copia; ninguna borra la de la otra.
- **Casos de ejemplo.** La v4.9.6 los vuelve a cargar con los minutos de la noche; la v4.9.7, con
  factores, hitos, respuestas con preguntas y un caso nuevo de insomnio en TCC-I (17 casos), y la
  v4.9.9, regenerados con el editor. Como son diarios de la v4.9.9, las versiones anteriores los
  muestran pero no los guardan (son ficticios).

Para pasar una versión de pruebas a la raíz cuando esté validada, basta con copiar el contenido de
su carpeta a la raíz (y, si se quiere conservar la anterior, guardarla antes en su propia carpeta, como
`v4.9.5/`).

## Cómo se publica

1. Repositorio **público** en GitHub con estos archivos.
2. Ajustes → Pages → Origen: rama `main`, carpeta `/ (root)` → Guardar.
3. Esperar 1–2 minutos. La dirección de publicación es:
   **https://rcilveti.github.io/Agenda-Sueno-AdSalutem/**

En el móvil conviene «Añadir a pantalla de inicio» para usarla como una app.

## Cómo se actualiza

1. Sustituir `index.html` **y `sw.js`** por los de la versión nueva (el `sw.js` lleva el
   número de versión: si no se cambia, los móviles pueden tardar en recibir la nueva).
2. Confirmar el cambio. La web se actualiza sola en 1–2 minutos y los usuarios pasan a
   la versión nueva la próxima vez que abren la app con conexión, sin reinstalar nada.
3. Comprobar en la pestaña **Actions** que las pruebas salen en verde.

Al publicar una versión nueva conviene avisar a los pacientes activos de que envíen o
guarden una copia de su diario antes.

### Pruebas en el ordenador (opcional)

Con Node.js 20 o superior: `npm install` y después `npm test` (unos 25 minutos).

---

## Estado y limitaciones

Fase **piloto con datos ficticios**. La aplicación muestra un distintivo naranja
permanente mientras el modo piloto está activo.

No apta todavía para datos clínicos reales en producción:

- El acceso se comprueba en el navegador, así que no es un control de acceso real.
- El código de acceso del paciente es adecuado solo para datos de prueba.
- Los datos se guardan sin cifrar en el dispositivo.
- No hay sincronización entre dispositivos ni trazabilidad de accesos.

Para uso con pacientes reales hace falta un backend (autenticación real, cifrado en
reposo, registro de accesos y cumplimiento del RGPD). El cifrado por paciente y las
cuentas de profesional con contraseña protegida ya están implementados en el código y
se activan poniendo `MODO_PILOTO = false`, pero el paso a producción requiere además
la infraestructura anterior y la validación del DPO.
