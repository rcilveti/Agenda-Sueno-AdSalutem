# Auditoría total de la Agenda de Sueño v5.0.0 (pruebas)

10 de noviembre de 2026 · modo piloto, solo datos ficticios · se audita `v5.0.0/index.html` tal como está publicado (con el editor de noviembre)

Esta auditoría no cambia la aplicación: solo comprueba y describe. Complementa la auditoría de la versión (`auditoria_v5.0.0.md`), que explica qué hace la v5.0.0.

## 1. Veredicto

La v5.0.0 calcula bien y es estable en el uso normal de una sola ventana. No está lista para datos reales por **dos fallos que pierden noches anotadas** (A1 y A2). Los dos necesitan una situación concreta (dos ventanas abiertas, o restaurar una copia antigua), pero cuando ocurren no avisan.

| Gravedad | Hallazgos |
|---|---|
| Alta (se pierden datos) | 2 |
| Media | 5 |
| Baja | 8 |

## 2. Qué se ha comprobado y cómo

| Área | Comprobación | Resultado |
|---|---|---|
| Pruebas automáticas | Las 127 pruebas de `v5.0.0/tests/` (17 min) | 127 superadas |
| Estadística | Recalculada en Python (SciPy) para los 17 casos con varios diarios: 26 comparaciones, 260 filas (media, DE, diferencia, IC 95 %, NAP, g) | Medias, DE, diferencias, NAP y g idénticas. IC: ver B1 |
| Fines de semana y remisión | Recalculados con el calendario para los 43 diarios de esos casos | Idénticos (salvo M2) |
| Veredictos falsos | Simulación: dos diarios de 21 noches sin cambio real, 2.000 repeticiones por caso y dos modelos | Apartado 5 |
| Umbrales | Contrastados con la tabla 3 de Edinger et al. (2021) y con Lichstein et al. (2003) | Correctos |
| Varios diarios | 120 operaciones aleatorias (crear, rellenar, abrir, borrar, etiquetar), comprobando tras cada una que no se pierde ninguna noche, que no hay solapes ni identificadores repetidos y la versión guardada | Sin fallos en una sola ventana |
| Casos límite | Fecha de inicio cambiada, diario sin fecha, 8 diarios, umbrales corruptos, almacenamiento lleno, dos ventanas, copias antiguas y copias mal formadas | Hallazgos A1, A2, M1, M2, B2, B3 |
| Seguridad | Inyección de HTML en etiqueta, intervención, tratamiento, nombre y fechas (pantalla, gráficos, informe); política de contenido; librerías externas | Sin inyección. Ver B4 |
| Zonas horarias | Los 17 casos en Los Ángeles, Auckland y Calcuta frente a Madrid | Sin diferencias |
| Navegador real | Chromium: escritorio (1300 px), iPhone SE, iPhone 13, Pixel 7 y iPad Mini. Errores de JavaScript, anchura de página, PDF del análisis | Sin errores. PDF de 9 hojas, pie una vez por hoja |
| Accesibilidad | axe-core (WCAG 2.1 A y AA) en ficha, ventana de diario, comparación y umbrales; teclado en la ventana de diario | Hallazgo M4 |
| Rendimiento | Análisis con 8 diarios; tamaño del archivo y del almacenamiento | 0,26 s. Ver B5 |
| Documentación | Coherencia entre la aplicación, la auditoría y el documento técnico | Ver B7 |

## 3. Hallazgos

### Gravedad alta

**A1 · Con el mismo paciente abierto en dos ventanas, se pierden las noches de un diario.**
- *Cómo ocurre.* Ventana A con el diario «Post» abierto. En la ventana B (misma memoria del navegador) se abre el diario «Basal». En A se corrige una noche.
- *Qué pasa.* El guardado de A escribe sus noches sobre el diario que está abierto en el almacenamiento, que ya es el «Basal». Las noches del «Basal» desaparecen y el «Post» queda dos veces: una con su nombre y otra con el nombre y las fechas del «Basal».
- *Por qué.* El autoguardado y «Guardar datos del diario» guardan solo las noches; a qué diario pertenecen se lee del almacenamiento, no de la pantalla.
- *Corrección propuesta.* Guardar siempre con el identificador del diario que está en pantalla y, si no coincide con el abierto en el almacenamiento, no escribir y recargar con un aviso. Es el mismo criterio que ya impide a la v4.9.9 sobrescribir un registro de la v5.0.0.

**A2 · Restaurar una copia de seguridad anterior al segundo diario borra las noches del diario abierto.**
- *Cómo ocurre.* Copia de seguridad con un solo diario. Después se crea el diario «Post» y se rellena. Se restaura la copia.
- *Qué pasa.* El diario abierto conserva la etiqueta «Post», pero pasa a tener las noches y la fecha del basal. Las noches del «Post» se pierden y el basal queda dos veces, con las mismas fechas.
- *Agravante.* El aviso dice «Se añadirán o actualizarán sobre los existentes, sin borrar nada».
- *Corrección propuesta.* Al restaurar, repartir cada diario de la copia por fechas, como ya hace la importación de archivos (fusionar con el que se solapa o añadirlo como diario nuevo), y corregir el texto del aviso.

### Gravedad media

**M1 · Cambiar «Inicio del registro» permite solapar dos diarios.** «＋ Nuevo diario» impide el solape, pero el campo de fecha de la ficha no lo comprueba. Con dos diarios solapados, un archivo importado puede ir a cualquiera de los dos. *Corrección:* rechazar la fecha si queda a menos de 21 días de otro diario.

**M2 · La remisión sale «Sí» sin datos de latencia.** Un diario pintado en la rejilla sin flechas de acostarse y levantarse no tiene latencia y su eficiencia sale del 100 %; aun así, la remisión por diario es «Sí». *Corrección:* mostrar «—» (no valorable) cuando falta la eficiencia, la latencia o el WASO.

**M3 · En el móvil del paciente, las noches de un diario guardado quedan inaccesibles.** Si el profesional reenvía el acceso con una fecha de inicio a 21 días o más de la anterior (por ejemplo, al corregir un mes mal escrito), el móvil guarda las noches anotadas como otro diario y abre uno en blanco. El paciente no ve ese diario ni puede enviarlo: cada envío lleva solo el diario abierto. Las noches no se borran, pero no llegan al profesional. *Corrección:* avisar al paciente y enviar también los diarios guardados, o preguntar al profesional antes de generar un acceso con una fecha tan distinta.

**M4 · Accesibilidad de lo nuevo de la v5.0.0.**
- La ventana «Nuevo diario» no se cierra con Escape, el tabulador sale de ella y, al cerrarla, el foco no vuelve al botón.
- Los 16 campos de los umbrales no tienen nombre accesible (un lector de pantalla no dice a qué métrica corresponden).
- El texto gris secundario (#7c8a9b) tiene un contraste de 3,3 a 3,5:1 sobre blanco; el mínimo AA es 4,5:1. Afecta a 161 textos de la comparación. Viene de versiones anteriores.
- Las cajas con desplazamiento lateral (tablas y gráficos anchos) no se pueden recorrer con el teclado.

**M5 · Riesgo al desplegar: la v4.9.9 y la v5.0.0 comparten la memoria del navegador.** En cuanto un paciente tiene dos diarios, su registro pasa a ser de la v5.0.0 y la v4.9.9 deja de guardarlo (muestra el aviso de versión posterior). Es lo previsto, pero implica que un paciente con la v4.9.9 instalada no podrá anotar en ella tras recibir un segundo diario creado en la v5.0.0. No es un fallo de programación: hay que decidir el paso de una versión a otra antes de usarla con pacientes.

### Gravedad baja

| N.º | Hallazgo | Corrección propuesta |
|---|---|---|
| B1 | El cuantil de la t se interpola en línea recta entre grados de libertad enteros. Con menos de 3 grados de libertad (7 de 246 filas, las de diarios con tendencia), el IC sale hasta un 37 % más ancho que el exacto. Es conservador y en ninguna fila cambia la valoración | Interpolar en 1/gl o usar la fórmula exacta |
| B2 | Una copia de seguridad con una fecha imposible en un diario (p. ej., 2026-13-45) impide abrir al paciente. Los registros de una copia se guardan sin validar | Validar fechas reales y la forma de cada diario al restaurar |
| B3 | Con más de 6 diarios elegidos, los últimos comparten color en los gráficos | Ampliar la paleta o variar el trazo |
| B4 | Las tres librerías externas (Excel, Word, captura) se cargan sin comprobación de integridad, y la política de contenido permite código en línea. Heredado | Añadir `integrity` a las tres o servirlas desde la propia carpeta |
| B5 | El 43 % del archivo (637 KB de 1,48 MB) son los 34 casos de ejemplo, que además ocupan 1,2 MB de los unos 5 MB de memoria del navegador | Cargar los casos de ejemplo solo en el modo profesional o desde un archivo aparte |
| B6 | Los avisos nuevos de importación («El archivo es del diario que empieza el…») salen en castellano también con la aplicación en catalán | Traducirlos |
| B7 | La auditoría de la versión dice 125 pruebas; son 127 desde los cambios del editor | Actualizar la cifra |
| B8 | En el iPhone SE, la ficha ensancha la página 71 px (ya conocido). En la comparación, 7 controles miden menos de 24 px y la letra más pequeña es de 10,9 px | Revisar con el resto de la accesibilidad |

## 4. Lo que funciona bien

- **Cálculo.** Las 260 filas recalculadas coinciden hasta el último decimal en medias, desviaciones, diferencias, NAP y g. Los fines de semana completos y la remisión de los 43 diarios coinciden con el calendario.
- **Uso en una ventana.** Tras 120 operaciones aleatorias, ninguna noche perdida, ningún solape y ningún identificador repetido.
- **Fallos de guardado.** Con el almacenamiento lleno, cambiar de diario o crear uno avisa («No se pudo cambiar de diario») y deja el registro intacto.
- **Datos hostiles.** Etiquetas, intervenciones, tratamientos y nombres con HTML se muestran como texto. Unos umbrales corruptos en el almacenamiento se sustituyen por los de la AASM.
- **Zonas horarias.** Los resultados no cambian con la zona horaria del equipo.
- **Móvil.** En los cuatro tamaños probados, el análisis con la comparación no ensancha la página y no hay errores de JavaScript.
- **PDF.** El análisis del caso de insomnio sale en 9 hojas (6 apaisadas de la comparación), con el pie una vez por hoja.
- **Umbrales.** Coinciden con la tabla 3 de Edinger et al. (2021): latencia y WASO 20 min, tiempo total de sueño 15 min, eficiencia 10 puntos, 0,5 despertares por noche y calidad 0,5 DE. El criterio de 31 min o más, 3 noches por semana, es el de Lichstein et al. (2003).

## 5. El método, para decidir

No son fallos, pero conviene conocerlos antes de usar la comparación en la consulta.

**Veredictos sin cambio real.** Se generaron dos diarios de 21 noches a partir de las noches del diario basal de cada caso (sin ningún cambio entre ellos) y se aplicó la regla de la aplicación.

| Modelo | «Respuesta» | «Empeoramiento» | Algún veredicto falso |
|---|---|---|---|
| Noches independientes | 3,8 % | 3,8 % | 7,6 % |
| Noches dependientes (bloques de 4) | 2,6 % | 2,8 % | 5,6 % |

- Las métricas que más veredictos falsos dan son el tiempo total de sueño y las calidades (unos 3 % cada una); la latencia y la eficiencia, 0,1 %.
- Según el caso, el veredicto falso va del 2 % al 14 %.
- Los datos de partida son los casos ficticios: las cifras orientan, no miden lo que pasará con pacientes.

**Decisiones abiertas (ya señaladas en la auditoría de la versión).**
- Basta una métrica para dar «respuesta», y el umbral del tiempo total de sueño (15 min) es fácil de superar, por ejemplo en vacaciones.
- Los criterios de remisión del adulto se aplican también a niños.
- Con diarios con tendencia, los intervalos son muy anchos.

## 6. Límites de esta auditoría

- Navegador real: solo Chromium, con móviles simulados. Sin Safari ni Firefox, y sin un iPhone real.
- El Word y el Excel no se han vuelto a generar con las librerías reales; los cubren las pruebas automáticas y la auditoría de la versión.
- No se ha probado el service worker sin conexión.
- La simulación de veredictos falsos usa datos ficticios.

## 7. Orden de corrección propuesto

1. A1 y A2 (pérdida de noches), cada una con su prueba automática.
2. M1 y M2 (solape por la fecha y remisión sin datos): cambios pequeños.
3. M3 y M5: decidir el paso de la v4.9.9 a la v5.0.0 y qué hace el móvil del paciente con un diario guardado.
4. M4 y las de gravedad baja.

## Referencias

- Edinger JD, et al. Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine systematic review, meta-analysis, and GRADE assessment. *J Clin Sleep Med.* 2021;17(2):263-298. https://doi.org/10.5664/jcsm.8988 (consultado en PubMed)
- Lichstein KL, Durrence HH, Taylor DJ, Bush AJ, Riedel BW. Quantitative criteria for insomnia. *Behav Res Ther.* 2003;41(4):427-445.
- Parker RI, Vannest K. An improved effect size for single-case research: nonoverlap of all pairs. *Behav Ther.* 2009;40(4):357-367.
