# Agenda de Sueño digital — AdSalutem

Diario de sueño de tres semanas en formato digital. Aplicación de un solo archivo,
sin servidor ni base de datos, pensada para funcionar en móvil, tableta y ordenador,
en castellano y en catalán.

**Versión actual:** v4.9.5 (octubre de 2026) — MODO PILOTO (datos ficticios, sin cifrado)

**Dirección:** https://rcilveti.github.io/Agenda-Sueno-AdSalutem/

**Versiones de pruebas** (ver «Varias versiones a la vez»):

- v4.9.6 (modelo mixto: rejilla + minutos de la noche) en
  https://rcilveti.github.io/Agenda-Sueno-AdSalutem/v4.9.6/
- v4.9.7 (sobre la v4.9.5: recordatorio diario, registro con preguntas, factores del día,
  ventana de sueño e hitos, tendencias, patrón propio y resumen para la consulta) en
  https://rcilveti.github.io/Agenda-Sueno-AdSalutem/v4.9.7/

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
| `docs/` | Guía del paciente (castellano y catalán) y documento técnico, en PDF |
| `tests/`, `package.json` | Pruebas automáticas (52 de la raíz; las de `v4.9.6/` y `v4.9.7/` van en sus carpetas) |
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
4. El paciente rellena el diario cada mañana (edición día a día, con autoguardado y
   hora de registro de cada día).
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

La raíz del sitio publica la versión en uso (v4.9.5). Las carpetas `v4.9.6/` y `v4.9.7/` publican
las versiones de pruebas, cada una con su propia página, service worker, manifiesto, documentación
(`docs/`) y pruebas automáticas (`tests/`, que `npm test` ejecuta junto con las de la raíz). Las dos
parten de la v4.9.5 por separado: la v4.9.7 no incluye el modelo mixto de la v4.9.6.

- **Mismo navegador, mismos datos.** Las versiones comparten el almacenamiento del navegador
  (mismo dominio): en un dispositivo se ven los mismos pacientes y diarios en todas. Conviene que
  cada paciente use una sola versión; los del modo mixto, solo la v4.9.6. Si un diario en modo mixto
  se abre y se guarda en la v4.9.5, se pierde la marca del modo (los minutos se conservan, pero la
  v4.9.5 no los muestra ni los exporta); la v4.9.7 conserva la marca, pero no usa los minutos.
- **Plan terapéutico de la v4.9.7.** Si un diario con ventana de sueño o hitos se abre y se guarda
  en la v4.9.5 o en la v4.9.6, se pierden la ventana y los hitos de la ficha. Los factores del día y
  las respuestas con preguntas se conservan, aunque esas versiones no los muestran ni los exportan.
- **Enlaces y QR.** Cada versión genera los QR y los enlaces con su propia dirección: el paciente
  entra en la versión desde la que se creó su acceso.
- **Sin conexión.** Cada carpeta guarda su propia copia; ninguna borra la de la otra.
- **Casos de ejemplo.** La v4.9.6 los vuelve a cargar con los minutos de la noche y la v4.9.7, con
  factores, hitos, respuestas con preguntas y un caso nuevo de insomnio en TCC-I (17 casos); las
  demás versiones los verán así (son ficticios).

Para pasar una versión de pruebas a la raíz cuando esté validada, basta con copiar el contenido de
su carpeta a la raíz (y, si se quiere conservar la anterior, la v4.9.5 a `v4.9.5/`).

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

Con Node.js 20 o superior: `npm install` y después `npm test` (unos 3 minutos).

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
