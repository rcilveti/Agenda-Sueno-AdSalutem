# Auditoría de la Agenda de Sueño v4.9.9

Noviembre de 2026 · modo piloto, solo datos ficticios

## 1. Qué es la v4.9.9

La v4.9.9 parte de la v4.9.8 (regla del MCTQ) y cambia la forma de anotar:

- **El editor de la noche (prototipo v7) es la única forma de anotar una noche.** Las horas de acostarse y de levantarse van de 15 en 15 minutos. Las duraciones van en escalones: de 5 en 5 min hasta media hora, luego 45 y 60 min, y de 30 en 30 después. El eje va de las 18:00 a las 20:00 del día siguiente. El editor tiene cuatro pasos:
  1. La noche, con los acontecimientos y sus emoji.
  2. Las siestas del día anterior a la noche, opcionales.
  3. La valoración 1–5, obligatoria.
  4. El tratamiento y las observaciones, opcionales.

  La rejilla se pinta sola con lo anotado. Ya no se pinta a mano: queda para consultar e imprimir. Se descartan la rejilla manual y el modelo mixto. El editor está en castellano y en catalán.
- **La pantalla del paciente en el móvil es nueva.**
  - La cabecera es compacta y ya no muestra el QR.
  - Una tarjeta de inicio reúne la fecha de inicio, una instrucción de dos frases y tres enlaces: «Cómo se anota», «Recordatorio» y «Ajustes».
  - Las 21 noches aparecen en una lista por semanas. Cada noche anotada muestra su barra, sus horas y sus tres caras. La noche de ayer se destaca y las que aún no han terminado están desactivadas.
  - «Guardar» y «Enviar a mi médico» van juntos en una barra fija abajo.
- **De la v4.9.7 se conservan** el recordatorio diario (.ics y Google Calendar), el aviso de noche pendiente, las tendencias, el patrón propio y el resumen para la consulta.
- **De la v4.9.7 se retiran** el registro guiado (lo recoge el editor), los factores de contexto (los recogen los acontecimientos), la ventana de sueño objetivo y los hitos del tratamiento. Los datos que ya existían de todo ello se conservan en la ficha y en el CSV.
- **Datos nuevos de cada noche:**
  - `ev`: acontecimientos con su hora y su tipo (baño, dolor, ruido, calor o frío, preocupación, tos, niño, toma u otro).
  - `trat`: el tratamiento.
  - `gd`: las respuestas del editor (acostarse, latencia, despertares, despertar final y levantarse).
  - `sie`: las siestas del día anterior, con su hora y su duración (una lista vacía si no hubo).
  - `ver` (en el diario): la versión que lo guardó.

  El CSV añade tres columnas al final: `acont_tipos`, `tratamiento` y `siestas_anotadas`. Se leen por nombre, así que el esquema sigue siendo el 5 y las versiones anteriores leen el archivo sin problema.
- **Una sola versión por diario.** Las versiones anteriores publicadas (v4.9.5, v4.9.6 y v4.9.7) ya no sobrescriben un diario de la v4.9.9.
- **Casos de ejemplo regenerados con el editor** y **documento técnico y guía del paciente en PDF** (castellano y catalán) en `docs/`.

## 2. Método

| Comprobación | Alcance |
|---|---|
| Pruebas automáticas (jsdom) | **95 pruebas, 95 superadas**: 68 heredadas y adaptadas, y 27 nuevas de la v4.9.9 (`tests/v499.test.js`). Las de `v4.9.5/`, `v4.9.6/` y `v4.9.7/` siguen pasando con el parche de versión |
| Navegador real (Playwright, Chromium) | iPhone 13 y iPhone SE, en vertical y en horizontal; escritorio a 1400 px; editor en castellano y en catalán. Sin errores de JavaScript ni desbordamiento horizontal |
| Impresión | PDF del diario (2 hojas en horizontal) y PDF del análisis |
| Métricas a mano | Una noche conocida y un diario de 21 noches con laborables y festivos (apartado 5) |
| Casos de ejemplo | Los 17 casos (357 noches), regenerados con el editor. Se compararon sus categorías clínicas con las de la v4.9.7 (apartado 8) |
| Revisión del código | Referencias a elementos y funciones retirados (todas protegidas) y textos obsoletos en pantalla, PDF, Word, Excel y CSV |

## 3. Resultados por área

### Funcionamiento y flujos

| Flujo | Resultado |
|---|---|
| Paciente: primer acceso con código, QR o enlace; sesión abierta en su móvil; «Cerrar sesión» | Correcto (pruebas de la v4.9.2 a la v4.9.8) |
| Paciente: fecha de inicio → lista de noches → tocar una → editor → guardar → la lista se actualiza | Correcto |
| Paciente: volver a abrir la app conserva lo anotado | Correcto |
| Paciente: «Guardar», «Enviar a mi médico», «Recordatorio», «Cómo se anota», «Ajustes» | Correcto |
| Paciente: aviso de noche pendiente → «Anotarla ahora» abre el editor | Correcto |
| Profesional: ✏️, tocar una hora, la valoración o las notas abre el editor en el paso que toca. Funciona también con el teclado | Correcto |
| Profesional: «Cancelar» no cambia nada; «Deshacer» revierte el último guardado | Correcto |
| Editor: sin fecha de inicio no se abre y la pide; sin las tres valoraciones no guarda y lleva al paso 3 | Correcto |
| Editor: siestas (paso 2), añadir, cambiar la hora y la duración, quitar; «no hubo siesta» | Correcto |
| Editor: un bebé que se acuesta a las 19:00 se anota desde su hora (eje desde las 18:00) | Correcto |
| Editor: cambiar laborable o festivo en los dos días de la noche (MCTQ) | Correcto: el cambio se aplica al guardar |
| Catalán: pantalla del paciente, editor de la noche, guía, instrucciones impresas y ayudas | Correcto |
| Versión anterior abierta en el mismo navegador sobre un diario de la v4.9.9 | No lo sobrescribe y avisa (apartado 8) |

### Registro de datos

- Guardar una noche valida las respuestas, que no pueden ser imposibles. Además:
  - pinta la rejilla con la regla común, a la media hora;
  - coloca las ✕ de los acontecimientos;
  - guarda `gd`, `ev`, `trat`, las valoraciones en la escala 1–5 y el tipo de las dos fechas;
  - sella la marca de tiempo de la noche, que sirve para la adherencia y para la fusión entre dispositivos.
- Lo anotado va y vuelve sin pérdidas por cinco vías: CSV, enlace del paciente (#z=/#d=), copia de seguridad, «Guardar» y autoguardado.
- Los CSV de la v4.9.5 y de la v4.9.8 se importan bien.
- Las fórmulas del CSV se neutralizan al exportar y se recuperan al importar.
- Una hora mal escrita en un acontecimiento del CSV se descarta.
- Seguridad: el texto de las notas y del tratamiento se escapa en la rejilla, el editor, el análisis y los informes (prueba de inyección).

### Métricas

- Las noches anotadas en el editor se miden **a minuto** con sus respuestas: TIB, TST, SE, latencia, WASO, número de despertares, despertar terminal, TWT y horarios, incluido el punto medio. Las noches de diarios anteriores siguen midiéndose con la rejilla, a media hora.
- Antes de regenerar los casos de ejemplo, los 15 pintados en la rejilla daban exactamente el mismo análisis que en la v4.9.7, y los dos anotados con preguntas (mujer de 80 años y TCC-I), medidos a minuto, diferían menos de 30 min de TST y 6 puntos de eficiencia. Regenerados con el editor, conservan sus categorías clínicas (apartado 8).
- El SRI y el IS siguen calculándose con la rejilla, a media hora.
- Patrón propio: sin hitos, todo el diario es un único periodo. En el caso TCC-I se señala además el día 5, por su latencia de 90 min frente a la mediana del diario entero.

### Informes y exportaciones

| Salida | Cambios verificados |
|---|---|
| Análisis en pantalla y PDF | El apartado «Factores anotados» pasa a ser «Acontecimientos anotados», con un emoji por tipo y la comparación con y sin cada uno. «Acontecimientos reportados» indica el tipo y la hora. La tabla diaria lleva los emoji. Desaparecen la ventana y los hitos |
| Resumen para la consulta | «Registro» ya no habla del registro guiado y avisa de las noches de una versión anterior. El cuadro «Plan y factores» pasa a ser «Acontecimientos y tratamiento», con los más anotados y el tratamiento o sus cambios |
| Word | Nuevo apartado «Patrón propio, acontecimientos y tratamiento», sin la ventana, los hitos ni el modo guiado |
| Excel | La hoja Diario incluye las columnas Tratamiento, Observaciones, Acontecimientos (hora y tipo), Respuestas del editor y Fuente (editor o rejilla). La hoja Acontecimientos indica el tipo. La hoja Análisis queda sin el plan |
| Base de datos de pacientes | Incluye las noches anotadas en el editor, las noches fuera de patrón y los acontecimientos. Se quitan la ventana y los hitos |
| CSV, filas del resumen | Ahora tiene `noches_editor` y `acontecimientos_por_tipo`. Se quitan las filas `guiado_*` y `ventana_objetivo_*` |
| Diario impreso | Instrucciones nuevas en castellano y catalán, y una leyenda con «✕ o icono: acontecimiento». El QR impreso se mantiene: lo que se pidió fue quitarlo de la pantalla |

## 4. Errores encontrados y corregidos durante la auditoría

1. **Guardar sin cambios una noche de una versión anterior la alteraba.** El editor la reajustaba a sus escalones. En el caso TCC-I, la noche 2 pasaba de 75 a 60 min de latencia y el despertar final de 06:15 a 06:30, con 60 min más de sueño. En el caso del bebé, la noche se perdía entera. **Corregido:** lo que no se toca se guarda tal cual, tanto la noche como sus acontecimientos.
2. **Una noche que empieza antes de las 20:00 (bebés) se abría mal.** **Corregido:** el eje del editor empieza ahora a las 18:00 (apartado 8).
3. **Una hora inválida en la columna de acontecimientos del CSV se convertía en 00:00.** Corregido.
4. **La lista del paciente decía «Anota la noche de ayer» en cualquier noche antigua sin anotar.** Ahora esa frase solo aparece en la de ayer. Las demás noches pendientes también se destacan, con el texto «Sin anotar · toca para anotarla».
5. **El aviso emergente se quedaba asomando sobre «Guardar» y «Enviar»** en móviles estrechos. Ahora se oculta del todo y, en el móvil del paciente, sale por encima de la barra.
6. **La rejilla del profesional aún se podía «desbloquear»** (Solo ver o Editando) sin ningún efecto. Ahora es siempre de consulta. Las celdas de valoración y de notas se abren con el teclado.
7. **Datos que quedaban ocultos.**
   - Los factores de diarios de la v4.9.7 se ven ahora en las notas de su noche, sin repetir los acontecimientos.
   - Los despertares con motivo de la v4.9.7 recuperan su tipo y su hora, por ejemplo 🚽 a las 03:15 en lugar de una ✕ a las 03:00.
8. **Textos obsoletos**, ya corregidos:
   - tendencias («líneas de los hitos»);
   - instrucciones impresas («pinta las horas», 🧭);
   - ayuda del paciente y leyenda impresa;
   - resumen para la consulta;
   - PDF, Word, Excel y filas del CSV.
9. **Márgenes en el ordenador.** Al retirar la ayuda de la rejilla quedó un cierre de bloque de más, que sacaba «Análisis» y «Pacientes» de la columna centrada: en pantallas anchas, el análisis ocupaba todo el ancho, sin márgenes, y «Exportar e importar» salía también en «Análisis». **Corregido:** vuelven a la columna de 1280 px y, en pantallas anchas, la cabecera y las pestañas se alinean con ella (en el modo paciente, con la lista de noches).
10. **Código sin uso eliminado:**
   - panel del registro guiado;
   - casilla y panel de factores;
   - panel de valoración de la rejilla;
   - edición del plan terapéutico;
   - cálculo de lo «declarado frente a la rejilla».

## 5. Métricas comprobadas a mano

**Una noche:** a la cama a las 23:50, 30 min para dormirse, despertares de 30 y 10 min, despertar final a las 06:30 y levantarse a las 07:00.

| Métrica | Esperado | App |
|---|---|---|
| TIB | 07:00 − 23:50 = 430 min | 430 |
| Latencia · WASO · nº despertares | 30 · 40 · 2 | 30 · 40 · 2 |
| TST | (06:30 − 00:20) − 40 = 330 min | 330 |
| SE | 330 / 430 = 76,7 % | 76,7 % |
| Despertar terminal · TWT | 30 · 30 + 40 + 30 = 100 | 30 · 100 |
| Punto medio | mitad de 00:20–06:30 = 03:25 | 03:25 |
| Bebé: a la cama a las 19:30, latencia 15, despertar final 06:00, levantarse 06:15 | TIB 645 · TST 615 | 645 · 615 |

**Diario de 21 noches** que empieza en lunes, con la regla del MCTQ (las noches del viernes y del sábado son libres):

| Métrica | Esperado | App |
|---|---|---|
| Nº de noches libres | 6 | 6 |
| TST laborable · libre | 430 · 500 min | 430 · 500 |
| TST medio | (15 × 430 + 6 × 500) / 21 = 450 min | 450 |
| Punto medio laborable · libre | 03:02,5 · 04:50 | 03:02,5 · 04:50 |
| Jet-lag social | 107,5 min | 107,5 |
| Acontecimientos | Baño en las 15 noches laborables | bano: 15 |

## 6. Pendientes

Los pendientes 1, 2, 4, 5, 9 y 10 se resolvieron tras la auditoría (apartado 8).

| # | Hallazgo | Importancia | Estado o propuesta |
|---|---|---|---|
| 1 | **Siestas.** El editor no las registraba | Alta en pediatría | **Resuelto:** paso 2 del editor |
| 2 | **Acostarse antes de las 20:00.** El eje del editor empezaba a las 20:00 | Alta en pediatría | **Resuelto:** el eje empieza a las 18:00 |
| 3 | **No se puede vaciar una noche** anotada por error: solo se puede modificar | Media | Añadir «Vaciar esta noche» en el paso de valoración, con confirmación |
| 4 | **El editor estaba solo en castellano** | Media (pacientes en catalán) | **Resuelto:** editor en catalán |
| 5 | **Mezclar versiones en el mismo navegador** | Media | **Resuelto:** una sola versión por diario |
| 6 | **El paciente no tiene «Deshacer».** Solo puede cancelar en el editor antes de guardar | Baja | Valorar junto con el punto 3 |
| 7 | **Ventana e hitos.** Se conservan en la ficha, en el CSV y en el enlace de acceso, pero no se ven, no se analizan y el profesional no puede editarlos | Informativa | Se retomarán cuando vuelvan |
| 8 | **Patrón propio sin hitos.** En un tratamiento en curso, las noches anteriores a él pueden salir «fuera de su patrón» | Informativa | Se resuelve al reintroducir los hitos |
| 9 | **Documentación en PDF** | Media | **Resuelto:** documento técnico y guía en PDF en `docs/` |
| 10 | **Casos de ejemplo** pintados en la rejilla | Baja | **Resuelto:** regenerados con el editor |
| 11 | **Hojas de estilo residuales** de los paneles retirados | Muy baja (sin efecto) | Limpiar en la próxima versión |
| 12 | **Siestas del último día.** Se anotan con la noche siguiente, así que las del día 21 no se recogen | Baja | Se puede añadir una pregunta al enviar el diario |

## 7. Publicación

- La v4.9.9 pasa a la raíz: es la versión por defecto en https://rcilveti.github.io/Agenda-Sueno-AdSalutem/.
- La v4.9.5 se guarda en `v4.9.5/`, con su página, service worker, manifiesto, iconos, documentación y pruebas.
- La v4.9.8 queda solo en local, como se pidió.
- Las pruebas de la raíz, de `v4.9.5/`, `v4.9.6/` y `v4.9.7/` se ejecutan con `npm test` y en GitHub Actions.

## 8. Pendientes resueltos tras la auditoría

### Siestas (paso 2 del editor)

- El editor pasa a tener cuatro pasos: **noche · siestas · valoración · notas**. Las siestas son opcionales.
- El paso pregunta por las siestas del día anterior a la noche que se anota («¿Echaste alguna siesta el viernes 6, antes de esta noche?»). Es lo que el paciente sabe por la mañana, como en el diario de consenso.
- Cada siesta lleva su hora de inicio (de 15 en 15 min, de las 06:00 hasta un cuarto de hora antes de acostarse) y su duración (escalones). Se pueden añadir, cambiar y quitar. Si el paciente pasa por el paso sin añadir ninguna, se guarda que no hubo siesta.
- **Dónde se guardan:** con la noche (`sie`). En la rejilla se pintan en su hora, al final de la fila del día anterior (que va de las 20:00 de la víspera a las 20:00 de ese día). Tocar una siesta pintada abre las siestas de la noche siguiente.
- **Análisis:** cuentan con la noche a la que se anotan. El sueño de 24 horas de los menores de 18 años suma las siestas de ese día y la noche que le sigue. En los diarios anteriores, sin siestas anotadas, se siguen contando las pintadas en la rejilla.
- **Pantalla del paciente:** cada noche de la lista muestra sus siestas.
- **CSV:** columna `siestas_anotadas` (por ejemplo, `15:00+60`; un guion si no hubo siesta).
- Si se abre una noche y no se tocan sus siestas, se guardan tal cual.

### Eje desde las 18:00

- El eje del editor va de las **18:00 a las 20:00 del día siguiente** (26 h). Acostarse puede ir de 18:00 en adelante.
- Al abrirse, el editor muestra el horario habitual (de 20:00 a 08:00) o, si la noche empieza antes, desde su hora. «Ajustar» encuadra la noche y «20–08» vuelve al horario habitual.
- En la rejilla, que sigue empezando a las 20:00, un acostarse antes de las 20:00 se pinta al final de la fila, como antes.
- Comprobado con el caso del bebé (acostarse a las 19:00) y con una noche anotada a mano: a la cama a las 19:30, latencia 15, despertar final 06:00 y levantarse 06:15 dan TIB 645 y TST 615 min.

### Editor en catalán

- Todos los textos del editor tienen versión catalana: pasos, días y fechas, tipos de día, categorías, lectura, resumen, valoraciones, acontecimientos (Lavabo, Dolor, Soroll, Calor/fred, Preocupació, Tos, Nen, Presa, Altre), siestas, avisos, botones y textos de accesibilidad.
- Se usa el idioma que haya elegido el paciente. Los acontecimientos se guardan por su clave, así que un diario anotado en catalán se lee igual en castellano.
- Los informes del profesional siguen en castellano.
- Comprobado en iPhone 13 y en iPhone SE en horizontal, sin desbordamiento.

### Una sola versión por diario

- Cada diario guardado lleva la versión que lo guardó (campo `ver`).
- La v4.9.5, la v4.9.6 y la v4.9.7 llevan un parche mínimo: si el diario que van a guardar es de una versión posterior, no lo sobrescriben y, mientras ese diario está abierto, muestran una banda con la dirección de la versión principal. Al cargar sus propios casos de ejemplo, no sobrescriben los de la v4.9.9.
- La v4.9.9 hace lo mismo con las versiones posteriores.
- Los diarios de versiones anteriores se abren en la v4.9.9 sin conversión y, al guardarse, pasan a ser de la v4.9.9.
- Comprobado con una prueba automática en las tres versiones anteriores.

### Casos de ejemplo regenerados con el editor

- Cada noche se anota como si se hubiera hecho en el editor:
  - partiendo de la rejilla del caso (o de las respuestas a minuto, en la mujer de 80 años y en el caso de TCC-I);
  - con una variación pequeña y reproducible: acostarse y levantarse ±15 min, y la latencia, los despertares y el tiempo final en cama a un escalón del editor dentro de ±15 min.
- Las ✕ pasan a ser acontecimientos con el tipo propio de cada caso, las siestas pintadas pasan al paso 2 y el tratamiento se anota desde la noche en que empezaba el hito (TCC-I, cronoterapia y hierro oral).
- **Ningún caso cambia de categoría clínica** (TST, eficiencia, latencia y WASO por edad, cronotipo y RU-SATED). La única excepción es la latencia del bebé, que pasa de 60 a unos 14 min: la de la rejilla era un artefacto de acostarse a las 19:00.
- Frente a la v4.9.7, el TST medio de cada caso cambia como mucho 12 min y la eficiencia, 2,5 puntos (6 en el bebé, por la latencia). Las noches fuera del patrón propio del caso de TCC-I son las mismas (días 5, 6, 7 y 13).
- Se cargan una vez al abrir la v4.9.9 (marca 16).

### Documentación

- **Documento técnico v4.9.9** (`docs/Agenda_Sueno_v4.9.9_documento_tecnico.pdf`). Incluye el editor, los acontecimientos y las siestas, la pantalla del paciente, la regla del MCTQ, una sola versión por diario, el anexo II (del editor a la rejilla y siestas) y un anexo IV nuevo con los casos regenerados.
- **Guía del paciente v4.9.9**, en castellano y en catalán (`docs/Guia_del_paciente_v4.9.9_castellano.pdf`, `docs/Guia_del_pacient_v4.9.9_catala.pdf`).

