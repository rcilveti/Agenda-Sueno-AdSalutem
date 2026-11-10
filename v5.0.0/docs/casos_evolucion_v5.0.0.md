# Casos para estudiar la evolución entre diarios (v5.0.0)

Versión de pruebas 5.0.0 · noviembre de 2026 · datos ficticios

Catorce casos de ejemplo («Evolución 1» a «Evolución 14» en la lista de pacientes) para estudiar cómo la aplicación compara varios diarios del mismo paciente. Cada uno parte de un caso de ejemplo de la v4.9.9: **su diario de 21 noches es el diario basal, tal cual**, y los diarios siguientes se han obtenido transformando esas mismas noches de forma controlada (latencia, despertares, ventana de sueño, calidades, noches sin anotar, noches anotadas en la rejilla). Así se sabe qué cambia y cuánto, y se puede comprobar qué concluye la aplicación.

Todos los resultados de esta guía son los que da la aplicación con los umbrales de la AASM por defecto; se han obtenido con la propia aplicación y se comprueban en las pruebas automáticas.

## Cómo estudiarlos

1. Abrir el paciente «Evolución N · …» (los casos se cargan solos la primera vez que se abre esta versión).
2. En **Análisis**, desplegar «Comparación de diarios del paciente». Por defecto se eligen los diarios aptos del sistema de registro del diario abierto (el más reciente); el más antiguo es la referencia.
3. Leer el **resumen** (resultado, mantenimiento, remisión y métricas más significativas), la **evolución por métrica**, los **gráficos** y, con «Ver el detalle estadístico», la tabla completa de cada comparación (diferencia mínima detectable, NAP, g).
4. Probar los **ejercicios**: cambiar un umbral o qué métricas cuentan para la respuesta («⚙️ Umbrales de relevancia clínica»; «Restablecer los de la AASM» para volver), o elegir otros diarios con las casillas.

Recordatorio de las reglas: un cambio es **clínicamente relevante** si alcanza el umbral y su IC del 95 % no incluye el 0; **no concluyente** si alcanza el umbral pero el IC incluye el 0; **pequeño** si el IC excluye el 0 pero no llega al umbral. **Respuesta**: al menos una métrica que cuenta (●: latencia, WASO, despertares, tiempo total de sueño, eficiencia y calidad del sueño) mejora de forma relevante y ninguna empeora así. Las calidades usan como umbral la g de Hedges (0,5 DE). El IC corrige la dependencia entre noches con las noches efectivas, n·(1−r₁)/(1+r₁), con r₁ entre 0 y 0,8.

## Los 14 casos de un vistazo

| Caso | Parte de | Qué muestra | Resultado por defecto |
|---|---|---|---|
| **Evolución 1** · Respuesta con remisión (insomnio de conciliación) | Caso · Insomnio de conciliación | Respuesta clara: la latencia baja mucho más que el umbral y con poca variabilidad; cumple la remisión. | D2 frente a D1: respuesta |
| **Evolución 2** · Respuesta sin remisión (insomnio de mantenimiento) | Caso · Insomnio de mantenimiento | El WASO mejora de forma relevante (hay respuesta), pero la eficiencia no llega a 85 % ni el WASO a 30 min: no hay remisión. | D2 frente a D1: respuesta |
| **Evolución 3** · Respuesta mixta y después respuesta (restricción de sueño) | Caso · Mujer 52a (menopausia) | Al principio de la restricción de sueño mejoran el WASO y la eficiencia, pero baja el tiempo total de sueño: respuesta mixta. | D2 frente a D1: respuesta mixta; D3 frente a D1: respuesta; D3 frente a D2 (anterior): se mantiene |
| **Evolución 4** · Empeoramiento y recuperación (retirada de lorazepam) | Caso · Mujer 80a (sueño normal para su edad) | Insomnio de rebote al retirar el hipnótico: empeoramiento clínicamente relevante. | D2 frente a D1: empeoramiento; D3 frente a D1: sin cambios clínicamente relevantes; D3 frente a D2 (anterior): se mantiene |
| **Evolución 5** · Sin cambios (apnea con insomnio: CPAP sin TCC-I) | Caso · Adulto apnea + insomnio (COMISA) | La CPAP no cambia el insomnio: ninguna métrica cambia de forma relevante y fiable. | D2 frente a D1: sin cambios clínicamente relevantes |
| **Evolución 6** · Mejoría pequeña y remisión sin respuesta (melatonina) | Caso · Adulto 60a (sospecha TCSR REM) | El WASO baja de forma fiable pero menos que el umbral (mejoría pequeña): no hay respuesta. | D2 frente a D1: sin cambios clínicamente relevantes |
| **Evolución 7** · No concluyente con 14 noches en tendencia; respuesta con un diario estable | Caso · Insomnio de conciliación | Con 14 noches muy variables y en tendencia (la restricción va haciendo efecto), la latencia baja más que el umbral pero el intervalo cruza el 0: no concluyente. | D2 frente a D1: sin cambios clínicamente relevantes; D3 frente a D1: respuesta; D3 frente a D2 (anterior): se mantiene |
| **Evolución 8** · Respuesta y pérdida de respuesta en el seguimiento (piernas inquietas) | Caso · Adulto SPI/PLMD (piernas inquietas) | Con pramipexol, respuesta y remisión. | D2 frente a D1: respuesta; D3 frente a D1: sin cambios clínicamente relevantes; D3 frente a D2 (anterior): pérdida de respuesta (latencia de sueño, WASO, despertares, tiempo total de sueño, eficiencia, calidad del sueño) |
| **Evolución 9** · Respuesta solo por la calidad percibida (pseudoinsomnio) | Caso · Mujer 65a (pseudoinsomnio) | El sueño anotado no cambia, pero la calidad del sueño sube mucho (umbral en DE, g de Hedges): hay respuesta porque la calidad cuenta para la respuesta. | D2 frente a D1: respuesta |
| **Evolución 10** · Bebé: tras hierro oral (el tiempo de sueño incluye las siestas) | Caso · Bebé 8m (despertares/ferropenia) | En menores de 18 años el tiempo de sueño incluye las siestas. | D2 frente a D1: respuesta |
| **Evolución 11** · Sistema de registro: editor, rejilla y mixto (retraso de fase) | Caso · Retraso de fase | El diario 2 tiene 16 de 21 noches del editor (76 %): cuenta como editor y se compara con el basal. | Sin comparación por defecto: elige al menos dos diarios aptos del mismo sistema de registro |
| **Evolución 12** · Aptitud al límite: noches y fines de semana (avance de fase) | Caso · Avance de fase | Diario 2: 16 noches pero un solo fin de semana completo (no apto). | D3 frente a D1: sin cambios clínicamente relevantes |
| **Evolución 13** · Vacaciones frente a semanas laborables (sin intervención) | Caso · Sueño normal | Sin ninguna intervención, en vacaciones duerme más: el tiempo de sueño «mejora» de forma relevante y sale «respuesta». | D2 frente a D1: respuesta |
| **Evolución 14** · Basal con tendencia (anotado ya en tratamiento): intervalos muy anchos | Caso · Mujer 57a (insomnio en TCC-I) | El diario basal se anotó con la TCC-I ya empezada y tiene tendencia (mejora de una semana a otra). | D2 frente a D1: respuesta |

## Qué regla se ve en cada caso

| Regla o resultado | Casos |
|---|---|
| Mejoría clínicamente relevante | 1, 2, 3, 4, 7, 8, 9, 10, 12, 13, 14 |
| Mejoría no concluyente (alcanza el umbral, IC con 0) | 7, 12, 14 |
| Mejoría pequeña (fiable, bajo el umbral) | 1, 2, 3, 4, 6, 7, 12 |
| Sin cambios | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14 |
| Empeoramiento pequeño | 3, 4 |
| Empeoramiento no concluyente | 5 |
| Empeoramiento clínicamente relevante | 3, 4, 8 |
| Cambio fiable (tiempo en la cama) | 3, 7, 13 |
| Conclusión: respuesta | 1, 2, 3, 7, 8, 9, 10, 13, 14 |
| Conclusión: respuesta mixta | 3 |
| Conclusión: empeoramiento | 4 |
| Conclusión: sin cambios clínicamente relevantes | 4, 5, 6, 7, 8, 12 |
| Frente al anterior: se mantiene | 3, 4, 7 |
| Frente al anterior: pérdida de respuesta | 8 |
| La remisión cambia de un diario a otro | 1, 3, 6, 8, 10, 14 |
| Aviso: proporción de noches antes de festivo | 13 |
| Aviso: tratamiento anotado | 1, 3, 5, 6, 7, 8, 10, 12 |
| No apto: menos de 14 noches | 12 |
| No apto: menos de 2 fines de semana | 12 |
| Sistema mixto (no comparable con el editor) | 11 |
| Límite exacto de aptitud (14 noches y 2 fines de semana) | 12 |
| Límite del 75 % de noches del editor (16 de 21 = 76 %) | 11 |
| Diario corto o con tendencia: pocas noches efectivas e intervalos anchos | 5, 7, 14 |
| Tiempo de sueño con siestas (menores de 18 años) | 10 |
| Respuesta solo por la calidad percibida | 9 |

## Los casos, uno a uno

### Evolución 1 · Respuesta con remisión (insomnio de conciliación)

**Parte de:** Caso · Insomnio de conciliación (su diario es el basal). **Qué muestra:** Respuesta clara: la latencia baja mucho más que el umbral y con poca variabilidad; cumple la remisión.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 72 min | 0 min | 0,0 | 6 h 41 min | 83 % | 5,0 | no | Apto |
| D2 · Tras control de estímulos (4 semanas) (abierto) | 28/07/2025 | Control de estímulos e higiene del sueño | editor | 21 (3) | 23 min | 0 min | 0,0 | 7 h 15 min | 93 % | 9,0 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Respuesta** — D2 · Tras control de estímulos (4 semanas) frente a D1 · Basal (referencia). Mejoría clínicamente relevante en latencia de sueño, tiempo total de sueño y calidad del sueño. Ninguna métrica que cuenta para la respuesta empeora. Remisión por diario: D1 no · D2 sí. Métricas más significativas (tarjetas): Latencia de sueño, Tiempo total de sueño, Calidad del sueño, Calidad al despertar.

*D2 frente a D1 (referencia): Respuesta.* Avisos: Tratamiento anotado en las noches del diario posterior: Control de estímulos: a la cama solo con sueño; si no duerme en 20 min, se levanta.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 72 → 23 | −49 min (−59 a −39 min) | +2,5× | ✓ Mejoría clínicamente relevante |
| WASO ● | −20 min | 0 → 0 | 0 min (0 a 0 min) | 0,0× | Sin cambios |
| Despertares ● | −0,5 | 0,0 → 0,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 6h 41min → 7h 15min | +34 min (+16 a +52 min) | +2,3× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 83 → 93 | +9,9 puntos (+7,6 a +12,2 puntos) | +1,0× | Mejoría pequeña |
| Calidad del sueño ● | g ≥ 0,5 | 5,0 → 9,0 | +4,0 (+3,3 a +4,7) | +7,7× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 4,7 → 6,7 | +2,0 (+1,2 a +2,8) | +3,0× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 4,7 → 6,7 | +2,0 (+1,2 a +2,8) | +3,0× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 12 → 12 | 0 min (−6 a +6 min) | — | Sin cambios |
| Tiempo en la cama | — | 8h 05min → 7h 50min | −15 min (−31 a +1 min) | — | Sin cambios |

**Para estudiar:**

- Umbral de la eficiencia en 9 puntos (en vez de 10) → D2 frente a D1: respuesta (D2 frente a D1: eficiencia pasa de «Mejoría pequeña» a «Mejoría clínicamente relevante»).

### Evolución 2 · Respuesta sin remisión (insomnio de mantenimiento)

**Parte de:** Caso · Insomnio de mantenimiento (su diario es el basal). **Qué muestra:** El WASO mejora de forma relevante (hay respuesta), pero la eficiencia no llega a 85 % ni el WASO a 30 min: no hay remisión.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 24 min | 71 min | 1,6 | 5 h 46 min | 76 % | 4,9 | no | Apto |
| D2 · TCC-I (8 semanas) (abierto) | 04/08/2025 | TCC-I: restricción de sueño moderada y reestructuración cognitiva | editor | 21 (3) | 24 min | 35 min | 1,4 | 6 h 22 min | 84 % | 6,9 | no | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Respuesta** — D2 · TCC-I (8 semanas) frente a D1 · Basal (referencia). Mejoría clínicamente relevante en WASO, tiempo total de sueño y calidad del sueño. Ninguna métrica que cuenta para la respuesta empeora. Remisión por diario: D1 no · D2 no. Métricas más significativas (tarjetas): WASO, Tiempo total de sueño, Calidad del sueño, Calidad al despertar.

*D2 frente a D1 (referencia): Respuesta.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 24 → 24 | 0 min (−6 a +6 min) | 0,0× | Sin cambios |
| WASO ● | −20 min | 71 → 35 | −36 min (−48 a −24 min) | +1,8× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 1,6 → 1,4 | −0,2 (−0,8 a +0,5) | +0,4× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 5h 46min → 6h 22min | +36 min (+15 a +57 min) | +2,4× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 76 → 84 | +8,1 puntos (+5,6 a +10,6 puntos) | +0,8× | Mejoría pequeña |
| Calidad del sueño ● | g ≥ 0,5 | 4,9 → 6,9 | +2,0 (+0,7 a +3,3) | +3,9× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 3,1 → 5,1 | +2,0 (+0,6 a +3,4) | +2,6× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 3,1 → 5,1 | +2,0 (+0,6 a +3,4) | +2,6× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 12 → 12 | 0 min (−8 a +8 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 34min → 7h 34min | 0 min (−20 a +20 min) | — | Sin cambios |

**Para estudiar:**

- Umbral de la eficiencia en 8 puntos → D2 frente a D1: respuesta (D2 frente a D1: eficiencia pasa de «Mejoría pequeña» a «Mejoría clínicamente relevante»).

### Evolución 3 · Respuesta mixta y después respuesta (restricción de sueño)

**Parte de:** Caso · Mujer 52a (menopausia) (su diario es el basal). **Qué muestra:** Al principio de la restricción de sueño mejoran el WASO y la eficiencia, pero baja el tiempo total de sueño: respuesta mixta. Al ampliar la ventana, respuesta y se mantiene.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 25 min | 99 min | 1,5 | 5 h 08 min | 68 % | 3,0 | no | Apto |
| D2 · Restricción de sueño (semana 3) | 07/07/2025 | Restricción de sueño: ventana de 00:30 a 05:30 | editor | 21 (3) | 14 min | 25 min | 1,0 | 4 h 11 min | 84 % | 3,0 | no | Apto |
| D3 · Ventana ampliada (3 meses) (abierto) | 06/10/2025 | Ventana ampliada de 23:45 a 07:00 | editor | 21 (3) | 16 min | 18 min | 1,0 | 6 h 27 min | 89 % | 7,0 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2, D3; referencia D1). El resumen de la aplicación dice: **Respuesta** — D3 · Ventana ampliada (3 meses) frente a D1 · Basal (referencia). Mejoría clínicamente relevante en WASO, despertares, tiempo total de sueño, eficiencia del sueño y calidad del sueño. Ninguna métrica que cuenta para la respuesta empeora. D2 · Restricción de sueño (semana 3) frente a la referencia: respuesta mixta · Frente al diario anterior (D2 · Restricción de sueño (semana 3)): se mantiene · Remisión por diario: D1 no · D2 no · D3 sí. Métricas más significativas (tarjetas): WASO, Eficiencia del sueño, Tiempo total de sueño, Despertares.

*D2 frente a D1 (referencia): Respuesta mixta.* Avisos: Tratamiento anotado en las noches del diario posterior: Restricción de sueño: ventana de 00:30 a 05:30.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 25 → 14 | −10 min (−16 a −5 min) | +0,5× | Mejoría pequeña |
| WASO ● | −20 min | 99 → 25 | −75 min (−92 a −57 min) | +3,7× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 1,5 → 1,0 | −0,5 (−0,8 a −0,3) | +1,0× | ✓ Mejoría clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 5h 08min → 4h 11min | −57 min (−80 a −33 min) | −3,8× | ✗ Empeoramiento clínicamente relevante |
| Eficiencia ● | +10 puntos | 68 → 84 | +15,9 puntos (+11,5 a +20,3 puntos) | +1,6× | ✓ Mejoría clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 3,0 → 3,0 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 2,3 → 2,3 | 0,0 (−0,6 a +0,6) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 2,3 → 2,3 | 0,0 (−0,6 a +0,6) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 21 → 10 | −11 min (−21 a −2 min) | — | Mejoría pequeña |
| Tiempo en la cama | — | 7h 33min → 5h 00min | −153 min (−170 a −136 min) | — | Cambio fiable |

*D3 frente a D1 (referencia): Respuesta.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 25 → 16 | −8 min (−14 a −2 min) | +0,4× | Mejoría pequeña |
| WASO ● | −20 min | 99 → 18 | −81 min (−98 a −64 min) | +4,0× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 1,5 → 1,0 | −0,5 (−0,8 a −0,3) | +1,0× | ✓ Mejoría clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 5h 08min → 6h 27min | +78 min (+55 a +102 min) | +5,2× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 68 → 89 | +21,0 puntos (+17,1 a +24,9 puntos) | +2,1× | ✓ Mejoría clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 3,0 → 7,0 | +4,0 (+3,2 a +4,8) | +5,8× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 2,3 → 6,3 | +4,0 (+3,4 a +4,6) | +8,2× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 2,3 → 6,3 | +4,0 (+3,4 a +4,6) | +8,2× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 21 → 14 | −7 min (−17 a +2 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 33min → 7h 15min | −18 min (−35 a −1 min) | — | Cambio fiable |

*D3 frente a D2 (el anterior: ¿se mantiene?): Se mantiene.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 14 → 16 | +2 min (−2 a +6 min) | −0,1× | Sin cambios |
| WASO ● | −20 min | 25 → 18 | −6 min (−14 a +2 min) | +0,3× | Sin cambios |
| Despertares ● | −0,5 | 1,0 → 1,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 4h 11min → 6h 27min | +135 min (+125 a +145 min) | +9,0× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 84 → 89 | +5,1 puntos (+2,2 a +8,0 puntos) | +0,5× | Mejoría pequeña |
| Calidad del sueño ● | g ≥ 0,5 | 3,0 → 7,0 | +4,0 (+3,2 a +4,8) | +5,8× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 2,3 → 6,3 | +4,0 (+3,4 a +4,6) | +8,2× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 2,3 → 6,3 | +4,0 (+3,4 a +4,6) | +8,2× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 10 → 14 | +4 min (+2 a +6 min) | — | Empeoramiento pequeño |
| Tiempo en la cama | — | 5h 00min → 7h 15min | +135 min (+135 a +135 min) | — | Cambio fiable |

**Para estudiar:**

- Umbral de los despertares en 0,6 por noche (en vez de 0,5) → D2 frente a D1: respuesta mixta; D3 frente a D1: respuesta; D3 frente a D2 (anterior): se mantiene (D2 frente a D1: despertares pasa de «Mejoría clínicamente relevante» a «Mejoría pequeña»; D3 frente a D1: despertares pasa de «Mejoría clínicamente relevante» a «Mejoría pequeña»).
- Sin contar el tiempo total de sueño para la respuesta → D2 frente a D1: respuesta; D3 frente a D1: respuesta; D3 frente a D2 (anterior): se mantiene.

### Evolución 4 · Empeoramiento y recuperación (retirada de lorazepam)

**Parte de:** Caso · Mujer 80a (sueño normal para su edad) (su diario es el basal). **Qué muestra:** Insomnio de rebote al retirar el hipnótico: empeoramiento clínicamente relevante. A los 2 meses vuelve a lo basal: sin cambios frente a la referencia y «se mantiene» frente al anterior (que era un empeoramiento).

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 16 min | 46 min | 1,7 | 7 h 46 min | 86 % | 8,3 | no | Apto |
| D2 · Tras retirar el lorazepam (2 semanas) | 14/07/2025 | Retirada de lorazepam 1 mg | editor | 21 (3) | 49 min | 90 min | 2,7 | 6 h 22 min | 71 % | 6,3 | no | Apto |
| D3 · A los 2 meses sin hipnótico (abierto) | 15/09/2025 | Sin hipnótico; higiene del sueño | editor | 21 (3) | 18 min | 45 min | 1,7 | 7 h 45 min | 86 % | 8,3 | no | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2, D3; referencia D1). El resumen de la aplicación dice: **Sin cambios clínicamente relevantes** — D3 · A los 2 meses sin hipnótico frente a D1 · Basal (referencia). Ninguna métrica que cuenta para la respuesta cambia de forma clínicamente relevante y fiable. D2 · Tras retirar el lorazepam (2 semanas) frente a la referencia: empeoramiento · Frente al diario anterior (D2 · Tras retirar el lorazepam (2 semanas)): se mantiene · Remisión por diario: D1 no · D2 no · D3 no. Métricas más significativas (tarjetas): Latencia de sueño, WASO, Eficiencia del sueño, Tiempo total de sueño.

*D2 frente a D1 (referencia): Empeoramiento.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 16 → 49 | +33 min (+23 a +42 min) | −1,6× | ✗ Empeoramiento clínicamente relevante |
| WASO ● | −20 min | 46 → 90 | +44 min (+25 a +63 min) | −2,2× | ✗ Empeoramiento clínicamente relevante |
| Despertares ● | −0,5 | 1,7 → 2,7 | +1,0 (+0,5 a +1,5) | −2,0× | ✗ Empeoramiento clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 7h 46min → 6h 22min | −84 min (−116 a −52 min) | −5,6× | ✗ Empeoramiento clínicamente relevante |
| Eficiencia ● | +10 puntos | 86 → 71 | −15,6 puntos (−19,9 a −11,3 puntos) | −1,6× | ✗ Empeoramiento clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 8,3 → 6,3 | −2,0 (−3,0 a −1,0) | −3,0× | ✗ Empeoramiento clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 8,6 → 6,6 | −2,0 (−2,9 a −1,1) | −3,0× | ✗ Empeoramiento clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 8,3 → 6,3 | −2,0 (−3,0 a −1,0) | −3,0× | ✗ Empeoramiento clínicamente relevante |
| Del despertar a levantarse | — | 11 → 18 | +7 min (0 a +14 min) | — | Empeoramiento pequeño |
| Tiempo en la cama | — | 8h 59min → 8h 59min | 0 min (−22 a +22 min) | — | Sin cambios |

*D3 frente a D1 (referencia): Sin cambios clínicamente relevantes.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 16 → 18 | +2 min (−8 a +12 min) | −0,1× | Sin cambios |
| WASO ● | −20 min | 46 → 45 | −1 min (−16 a +14 min) | 0,0× | Sin cambios |
| Despertares ● | −0,5 | 1,7 → 1,7 | 0,0 (−0,5 a +0,5) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 7h 46min → 7h 45min | −1 min (−29 a +27 min) | −0,1× | Sin cambios |
| Eficiencia ● | +10 puntos | 86 → 86 | −0,2 puntos (−3,9 a +3,5 puntos) | 0,0× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 8,3 → 8,3 | 0,0 (−1,0 a +1,0) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 8,6 → 8,6 | 0,0 (−0,9 a +0,9) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 8,3 → 8,3 | 0,0 (−1,0 a +1,0) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 11 → 11 | 0 min (−8 a +8 min) | — | Sin cambios |
| Tiempo en la cama | — | 8h 59min → 8h 59min | 0 min (−22 a +22 min) | — | Sin cambios |

*D3 frente a D2 (el anterior: ¿se mantiene?): Se mantiene.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 49 → 18 | −31 min (−40 a −22 min) | +1,5× | ✓ Mejoría clínicamente relevante |
| WASO ● | −20 min | 90 → 45 | −45 min (−63 a −26 min) | +2,2× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 2,7 → 1,7 | −1,0 (−1,5 a −0,5) | +2,0× | ✓ Mejoría clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 6h 22min → 7h 45min | +83 min (+51 a +115 min) | +5,5× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 71 → 86 | +15,4 puntos (+11,0 a +19,8 puntos) | +1,5× | ✓ Mejoría clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 6,3 → 8,3 | +2,0 (+1,0 a +3,0) | +3,0× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 6,6 → 8,6 | +2,0 (+1,1 a +2,9) | +3,0× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 6,3 → 8,3 | +2,0 (+1,0 a +3,0) | +3,0× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 18 → 11 | −7 min (−14 a 0 min) | — | Mejoría pequeña |
| Tiempo en la cama | — | 8h 59min → 8h 59min | 0 min (−22 a +22 min) | — | Sin cambios |

### Evolución 5 · Sin cambios (apnea con insomnio: CPAP sin TCC-I)

**Parte de:** Caso · Adulto apnea + insomnio (COMISA) (su diario es el basal). **Qué muestra:** La CPAP no cambia el insomnio: ninguna métrica cambia de forma relevante y fiable. La latencia sube más que el umbral, pero solo las primeras noches con la mascarilla (adaptación): con esa variabilidad y esa tendencia el intervalo cruza el 0 (empeoramiento no concluyente) y no cuenta como empeoramiento.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 40 min | 134 min | 2,4 | 4 h 25 min | 58 % | 2,3 | no | Apto |
| D2 · Con CPAP (2 meses) (abierto) | 04/08/2025 | CPAP nocturna, sin tratamiento del insomnio | editor | 21 (3) | 64 min | 116 min | 2,4 | 4 h 19 min | 57 % | 2,3 | no | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Sin cambios clínicamente relevantes** — D2 · Con CPAP (2 meses) frente a D1 · Basal (referencia). Ninguna métrica que cuenta para la respuesta cambia de forma clínicamente relevante y fiable. Remisión por diario: D1 no · D2 no. Métricas más significativas (tarjetas): Latencia de sueño, WASO, Eficiencia del sueño, Tiempo total de sueño.

*D2 frente a D1 (referencia): Sin cambios clínicamente relevantes.* Avisos: Tratamiento anotado en las noches del diario posterior: CPAP.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 40 → 64 | +24 min (−36 a +84 min) | −1,2× | ? Empeoramiento no concluyente |
| WASO ● | −20 min | 134 → 116 | −18 min (−54 a +18 min) | +0,9× | Sin cambios |
| Despertares ● | −0,5 | 2,4 → 2,4 | 0,0 (−0,6 a +0,6) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 4h 25min → 4h 19min | −6 min (−64 a +52 min) | −0,4× | Sin cambios |
| Eficiencia ● | +10 puntos | 58 → 57 | −1,4 puntos (−14,3 a +11,5 puntos) | −0,1× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 2,3 → 2,3 | 0,0 (−0,6 a +0,6) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 2,0 → 2,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 2,0 → 2,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 15 → 15 | 0 min (−16 a +16 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 34min → 7h 34min | 0 min (−17 a +17 min) | — | Sin cambios |

**Para estudiar:**

- Umbral de la latencia en 30 min → D2 frente a D1: sin cambios clínicamente relevantes (D2 frente a D1: latencia de sueño pasa de «Empeoramiento no concluyente» a «Sin cambios»).

### Evolución 6 · Mejoría pequeña y remisión sin respuesta (melatonina)

**Parte de:** Caso · Adulto 60a (sospecha TCSR REM) (su diario es el basal). **Qué muestra:** El WASO baja de forma fiable pero menos que el umbral (mejoría pequeña): no hay respuesta. Aun así, ahora cumple la remisión (el WASO pasa de 38 a menos de 30 min).

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 23 min | 38 min | 1,1 | 6 h 49 min | 85 % | 7,4 | no | Apto |
| D2 · Melatonina 3 mg (6 semanas) (abierto) | 21/07/2025 | Melatonina de liberación inmediata 3 mg | editor | 21 (3) | 23 min | 20 min | 1,1 | 6 h 52 min | 89 % | 7,4 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Sin cambios clínicamente relevantes** — D2 · Melatonina 3 mg (6 semanas) frente a D1 · Basal (referencia). Ninguna métrica que cuenta para la respuesta cambia de forma clínicamente relevante y fiable. Remisión por diario: D1 no · D2 sí. Métricas más significativas (tarjetas): WASO, Eficiencia del sueño, Latencia de sueño, Tiempo total de sueño.

*D2 frente a D1 (referencia): Sin cambios clínicamente relevantes.* Avisos: Tratamiento anotado en las noches del diario posterior: Melatonina 3 mg.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 23 → 23 | 0 min (−6 a +6 min) | 0,0× | Sin cambios |
| WASO ● | −20 min | 38 → 20 | −18 min (−32 a −4 min) | +0,9× | Mejoría pequeña |
| Despertares ● | −0,5 | 1,1 → 1,1 | 0,0 (−0,2 a +0,2) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 6h 49min → 6h 52min | +3 min (−12 a +18 min) | +0,2× | Sin cambios |
| Eficiencia ● | +10 puntos | 85 → 89 | +3,3 puntos (+0,7 a +6,0 puntos) | +0,3× | Mejoría pequeña |
| Calidad del sueño ● | g ≥ 0,5 | 7,4 → 7,4 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 7,4 → 7,4 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 7,4 → 7,4 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 9 → 9 | 0 min (−3 a +3 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 59min → 7h 44min | −15 min (−33 a +3 min) | — | Sin cambios |

**Para estudiar:**

- Umbral del WASO en 15 min (en vez de 20) → D2 frente a D1: respuesta (D2 frente a D1: WASO pasa de «Mejoría pequeña» a «Mejoría clínicamente relevante»).

### Evolución 7 · No concluyente con 14 noches en tendencia; respuesta con un diario estable

**Parte de:** Caso · Insomnio de conciliación (su diario es el basal). **Qué muestra:** Con 14 noches muy variables y en tendencia (la restricción va haciendo efecto), la latencia baja más que el umbral pero el intervalo cruza el 0: no concluyente. El diario siguiente, con un cambio medio parecido y noches estables, da respuesta.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 72 min | 0 min | 0,0 | 6 h 41 min | 83 % | 5,0 | no | Apto |
| D2 · Restricción de sueño en curso (2 semanas) | 07/07/2025 | Restricción de sueño: ventana de 00:00 a 06:30 | editor | 14 (2) | 41 min | 1 min | 0,1 | 6 h 40 min | 88 % | 5,0 | no | Apto |
| D3 · Restricción completada (3 semanas) (abierto) | 01/09/2025 | Ventana de 23:45 a 06:45, estable | editor | 21 (3) | 44 min | 0 min | 0,0 | 6 h 40 min | 88 % | 5,0 | no | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2, D3; referencia D1). El resumen de la aplicación dice: **Respuesta** — D3 · Restricción completada (3 semanas) frente a D1 · Basal (referencia). Mejoría clínicamente relevante en latencia de sueño. Ninguna métrica que cuenta para la respuesta empeora. D2 · Restricción de sueño en curso (2 semanas) frente a la referencia: sin cambios clínicamente relevantes · Frente al diario anterior (D2 · Restricción de sueño en curso (2 semanas)): se mantiene · Remisión por diario: D1 no · D2 no · D3 no. Métricas más significativas (tarjetas): Latencia de sueño, Eficiencia del sueño, WASO, Tiempo total de sueño.

*D2 frente a D1 (referencia): Sin cambios clínicamente relevantes.* Avisos: Tratamiento anotado en las noches del diario posterior: Restricción de sueño: ventana de 00:00 a 06:30.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 72 → 41 | −31 min (−147 a +86 min) | +1,5× | ? Mejoría no concluyente |
| WASO ● | −20 min | 0 → 1 | +1 min (−1 a +4 min) | −0,1× | Sin cambios |
| Despertares ● | −0,5 | 0,0 → 0,1 | +0,1 (−0,1 a +0,4) | −0,3× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 6h 41min → 6h 40min | −2 min (−26 a +23 min) | −0,1× | Sin cambios |
| Eficiencia ● | +10 puntos | 83 → 88 | +5,2 puntos (−1,7 a +12,1 puntos) | +0,5× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 5,0 → 5,0 | 0,0 (−0,8 a +0,9) | +0,1× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 4,7 → 4,7 | 0,0 (−0,9 a +1,0) | +0,1× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 4,7 → 4,7 | 0,0 (−0,9 a +1,0) | +0,1× | Sin cambios |
| Del despertar a levantarse | — | 12 → 12 | 0 min (−7 a +7 min) | — | Sin cambios |
| Tiempo en la cama | — | 8h 05min → 7h 34min | −31 min (−50 a −11 min) | — | Cambio fiable |

*D3 frente a D1 (referencia): Respuesta.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 72 → 44 | −29 min (−38 a −19 min) | +1,4× | ✓ Mejoría clínicamente relevante |
| WASO ● | −20 min | 0 → 0 | 0 min (0 a 0 min) | 0,0× | Sin cambios |
| Despertares ● | −0,5 | 0,0 → 0,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 6h 41min → 6h 40min | −1 min (−19 a +16 min) | −0,1× | Sin cambios |
| Eficiencia ● | +10 puntos | 83 → 88 | +5,1 puntos (+2,8 a +7,5 puntos) | +0,5× | Mejoría pequeña |
| Calidad del sueño ● | g ≥ 0,5 | 5,0 → 5,0 | 0,0 (−0,7 a +0,7) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 4,7 → 4,7 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 4,7 → 4,7 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 12 → 12 | 0 min (−6 a +6 min) | — | Sin cambios |
| Tiempo en la cama | — | 8h 05min → 7h 35min | −30 min (−46 a −14 min) | — | Cambio fiable |

*D3 frente a D2 (el anterior: ¿se mantiene?): Se mantiene.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 41 → 44 | +2 min (−165 a +170 min) | −0,1× | Sin cambios |
| WASO ● | −20 min | 1 → 0 | −1 min (−4 a +1 min) | +0,1× | Sin cambios |
| Despertares ● | −0,5 | 0,1 → 0,0 | −0,1 (−0,4 a +0,1) | +0,3× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 6h 40min → 6h 40min | 0 min (−23 a +23 min) | 0,0× | Sin cambios |
| Eficiencia ● | +10 puntos | 88 → 88 | −0,1 puntos (−7,1 a +7,0 puntos) | 0,0× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 5,0 → 5,0 | 0,0 (−0,9 a +0,8) | −0,1× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 4,7 → 4,7 | 0,0 (−1,0 a +0,9) | −0,1× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 4,7 → 4,7 | 0,0 (−1,0 a +0,9) | −0,1× | Sin cambios |
| Del despertar a levantarse | — | 12 → 12 | 0 min (−7 a +7 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 34min → 7h 35min | +1 min (−19 a +20 min) | — | Sin cambios |

### Evolución 8 · Respuesta y pérdida de respuesta en el seguimiento (piernas inquietas)

**Parte de:** Caso · Adulto SPI/PLMD (piernas inquietas) (su diario es el basal). **Qué muestra:** Con pramipexol, respuesta y remisión. A los 9 meses (aumento del síndrome con el agonista dopaminérgico) empeora frente al diario anterior: pérdida de respuesta, y frente a la referencia ya no hay respuesta.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 58 min | 71 min | 2,8 | 5 h 39 min | 72 % | 2,4 | no | Apto |
| D2 · Pramipexol 0,25 mg (6 semanas) | 21/07/2025 | Pramipexol 0,25 mg a las 21:00 y hierro oral | editor | 21 (3) | 18 min | 9 min | 1,0 | 7 h 21 min | 93 % | 6,4 | sí | Apto |
| D3 · A los 9 meses (aumento) (abierto) | 13/04/2026 | Pramipexol 0,25 mg (sin cambios); síntomas más tempranos | editor | 21 (3) | 58 min | 69 min | 2,8 | 5 h 41 min | 72 % | 2,4 | no | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2, D3; referencia D1). El resumen de la aplicación dice: **Sin cambios clínicamente relevantes** — D3 · A los 9 meses (aumento) frente a D1 · Basal (referencia). Ninguna métrica que cuenta para la respuesta cambia de forma clínicamente relevante y fiable. D2 · Pramipexol 0,25 mg (6 semanas) frente a la referencia: respuesta · Frente al diario anterior (D2 · Pramipexol 0,25 mg (6 semanas)): pérdida de respuesta en latencia de sueño, WASO, despertares, tiempo total de sueño, eficiencia del sueño y calidad del sueño · Remisión por diario: D1 no · D2 sí · D3 no. Métricas más significativas (tarjetas): Latencia de sueño, WASO, Eficiencia del sueño, Tiempo total de sueño.

*D2 frente a D1 (referencia): Respuesta.* Avisos: Tratamiento anotado en las noches del diario posterior: Pramipexol 0,25 mg.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 58 → 18 | −40 min (−51 a −29 min) | +2,0× | ✓ Mejoría clínicamente relevante |
| WASO ● | −20 min | 71 → 9 | −63 min (−72 a −53 min) | +3,1× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 2,8 → 1,0 | −1,8 (−2,0 a −1,6) | +3,6× | ✓ Mejoría clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 5h 39min → 7h 21min | +102 min (+82 a +122 min) | +6,8× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 72 → 93 | +21,6 puntos (+18,9 a +24,4 puntos) | +2,2× | ✓ Mejoría clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 2,4 → 6,4 | +4,0 (+3,4 a +4,6) | +7,7× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 2,2 → 6,2 | +4,0 (+3,5 a +4,5) | +9,0× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 2,2 → 6,2 | +4,0 (+3,5 a +4,5) | +9,0× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 6 → 6 | 0 min (−3 a +3 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 54min → 7h 54min | 0 min (−17 a +17 min) | — | Sin cambios |

*D3 frente a D1 (referencia): Sin cambios clínicamente relevantes.* Avisos: Tratamiento anotado en las noches del diario posterior: Pramipexol 0,25 mg.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 58 → 58 | 0 min (−14 a +15 min) | 0,0× | Sin cambios |
| WASO ● | −20 min | 71 → 69 | −3 min (−16 a +10 min) | +0,1× | Sin cambios |
| Despertares ● | −0,5 | 2,8 → 2,8 | 0,0 (−0,3 a +0,3) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 5h 39min → 5h 41min | +2 min (−19 a +23 min) | +0,2× | Sin cambios |
| Eficiencia ● | +10 puntos | 72 → 72 | +0,5 puntos (−3,1 a +4,1 puntos) | +0,1× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 2,4 → 2,4 | 0,0 (−0,6 a +0,6) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 2,2 → 2,2 | 0,0 (−0,5 a +0,5) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 2,2 → 2,2 | 0,0 (−0,5 a +0,5) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 6 → 6 | 0 min (−4 a +4 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 54min → 7h 54min | 0 min (−17 a +17 min) | — | Sin cambios |

*D3 frente a D2 (el anterior: ¿se mantiene?): Pérdida de respuesta (latencia de sueño, waso, despertares, tiempo total de sueño, eficiencia, calidad del sueño).*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 18 → 58 | +40 min (+29 a +51 min) | −2,0× | ✗ Empeoramiento clínicamente relevante |
| WASO ● | −20 min | 9 → 69 | +60 min (+50 a +70 min) | −3,0× | ✗ Empeoramiento clínicamente relevante |
| Despertares ● | −0,5 | 1,0 → 2,8 | +1,8 (+1,6 a +2,0) | −3,6× | ✗ Empeoramiento clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 7h 21min → 5h 41min | −100 min (−120 a −80 min) | −6,7× | ✗ Empeoramiento clínicamente relevante |
| Eficiencia ● | +10 puntos | 93 → 72 | −21,1 puntos (−23,9 a −18,4 puntos) | −2,1× | ✗ Empeoramiento clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 6,4 → 2,4 | −4,0 (−4,6 a −3,4) | −7,7× | ✗ Empeoramiento clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 6,2 → 2,2 | −4,0 (−4,5 a −3,5) | −9,0× | ✗ Empeoramiento clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 6,2 → 2,2 | −4,0 (−4,5 a −3,5) | −9,0× | ✗ Empeoramiento clínicamente relevante |
| Del despertar a levantarse | — | 6 → 6 | 0 min (−3 a +3 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 54min → 7h 54min | 0 min (−17 a +17 min) | — | Sin cambios |

### Evolución 9 · Respuesta solo por la calidad percibida (pseudoinsomnio)

**Parte de:** Caso · Mujer 65a (pseudoinsomnio) (su diario es el basal). **Qué muestra:** El sueño anotado no cambia, pero la calidad del sueño sube mucho (umbral en DE, g de Hedges): hay respuesta porque la calidad cuenta para la respuesta. Si se quita esa casilla en los umbrales, pasa a «sin cambios».

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 21 min | 6 min | 0,2 | 7 h 05 min | 93 % | 3,7 | sí | Apto |
| D2 · Tras educación del sueño (4 semanas) (abierto) | 28/07/2025 | Educación sobre el sueño y reestructuración cognitiva | editor | 21 (3) | 22 min | 6 min | 0,2 | 7 h 04 min | 93 % | 7,5 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Respuesta** — D2 · Tras educación del sueño (4 semanas) frente a D1 · Basal (referencia). Mejoría clínicamente relevante en calidad del sueño. Ninguna métrica que cuenta para la respuesta empeora. Remisión por diario: D1 sí · D2 sí. Métricas más significativas (tarjetas): Calidad del sueño, Latencia de sueño, WASO, Eficiencia del sueño.

*D2 frente a D1 (referencia): Respuesta.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 21 → 22 | +1 min (−6 a +7 min) | 0,0× | Sin cambios |
| WASO ● | −20 min | 6 → 6 | 0 min (−8 a +8 min) | 0,0× | Sin cambios |
| Despertares ● | −0,5 | 0,2 → 0,2 | 0,0 (−0,3 a +0,3) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 7h 05min → 7h 04min | −1 min (−23 a +22 min) | 0,0× | Sin cambios |
| Eficiencia ● | +10 puntos | 93 → 93 | −0,1 puntos (−2,6 a +2,3 puntos) | 0,0× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 3,7 → 7,5 | +3,8 (+2,6 a +5,0) | +4,4× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 6,6 → 6,6 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 8,6 → 8,6 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 4 → 4 | 0 min (−4 a +4 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 36min → 7h 36min | 0 min (−21 a +21 min) | — | Sin cambios |

**Para estudiar:**

- Sin contar la calidad del sueño para la respuesta → D2 frente a D1: sin cambios clínicamente relevantes.

### Evolución 10 · Bebé: tras hierro oral (el tiempo de sueño incluye las siestas)

**Parte de:** Caso · Bebé 8m (despertares/ferropenia) (su diario es el basal). **Qué muestra:** En menores de 18 años el tiempo de sueño incluye las siestas. Bajan el WASO y los despertares: respuesta. Los criterios de remisión son los del insomnio del adulto (Lichstein): en un bebé, orientativos.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 14 min | 115 min | 4,0 | 12 h 43 min | 81 % | 2,1 | no | Apto |
| D2 · Tras hierro oral (3 meses) (abierto) | 08/09/2025 | Sulfato ferroso 3 mg/kg/día | editor | 21 (3) | 14 min | 25 min | 2,0 | 14 h 13 min | 93 % | 6,1 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Respuesta** — D2 · Tras hierro oral (3 meses) frente a D1 · Basal (referencia). Mejoría clínicamente relevante en WASO, despertares, tiempo total de sueño, eficiencia del sueño y calidad del sueño. Ninguna métrica que cuenta para la respuesta empeora. Remisión por diario: D1 no · D2 sí. Métricas más significativas (tarjetas): WASO, Eficiencia del sueño, Tiempo total de sueño, Despertares.

*D2 frente a D1 (referencia): Respuesta.* Avisos: Tratamiento anotado en las noches del diario posterior: Hierro oral.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 14 → 14 | 0 min (−7 a +7 min) | 0,0× | Sin cambios |
| WASO ● | −20 min | 115 → 25 | −90 min (−107 a −72 min) | +4,5× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 4,0 → 2,0 | −2,0 (−2,4 a −1,7) | +4,1× | ✓ Mejoría clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 12h 43min → 14h 13min | +90 min (+61 a +118 min) | +6,0× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 81 → 93 | +12,5 puntos (+9,9 a +15,1 puntos) | +1,3× | ✓ Mejoría clínicamente relevante |
| Calidad del sueño ● | g ≥ 0,5 | 2,1 → 6,1 | +4,0 (+3,7 a +4,3) | +18,0× | ✓ Mejoría clínicamente relevante |
| Calidad al despertar | g ≥ 0,5 | 2,1 → 6,1 | +4,0 (+3,7 a +4,3) | +18,0× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 2,1 → 6,1 | +4,0 (+3,7 a +4,3) | +18,0× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 9 → 9 | 0 min (−4 a +4 min) | — | Sin cambios |
| Tiempo en la cama | — | 11h 55min → 11h 55min | 0 min (−22 a +22 min) | — | Sin cambios |

### Evolución 11 · Sistema de registro: editor, rejilla y mixto (retraso de fase)

**Parte de:** Caso · Retraso de fase (su diario es el basal). **Qué muestra:** El diario 2 tiene 16 de 21 noches del editor (76 %): cuenta como editor y se compara con el basal. El diario 3 (abierto) tiene la mitad en la rejilla: es mixto y no se puede comparar con los otros; con él elegido, los demás salen como «otro sistema».

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 30 min | 0 min | 0,0 | 5 h 25 min | 89 % | 7,0 | sí | Apto |
| D2 · Cronoterapia y luz (4 semanas) | 07/07/2025 | Luz brillante al despertar y adelanto progresivo del horario | editor (16 de 21 del editor) | 21 (3) | 20 min | 0 min | 0,0 | 6 h 28 min | 93 % | 9,0 | sí | Apto |
| D3 · Seguimiento (la mitad, en la rejilla) (abierto) | 15/09/2025 | Luz brillante al despertar | mixto (10 de 20 del editor) | 20 (3) | 23 min | 0 min | 0,0 | 6 h 22 min | 93 % | 9,1 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D3): Elige al menos dos diarios aptos del mismo sistema de registro. Cada diario necesita al menos 14 noches anotadas, con 2 fines de semana completos.

**Para estudiar:**

- Quitar el diario 3 (mixto) y elegir los diarios 1 y 2 (editor) → D2 frente a D1: respuesta.

### Evolución 12 · Aptitud al límite: noches y fines de semana (avance de fase)

**Parte de:** Caso · Avance de fase (su diario es el basal). **Qué muestra:** Diario 2: 16 noches pero un solo fin de semana completo (no apto). Diario 3: exactamente 14 noches y 2 fines de semana (apto). Diario 4 (abierto): 13 noches (no apto). Se comparan el basal y el diario 3.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 22 min | 0 min | 0,0 | 7 h 09 min | 92 % | 8,6 | sí | Apto |
| D2 · Luz vespertina (incompleto) | 07/07/2025 | Luz brillante de 19:00 a 20:00 | editor | 16 (1) | 25 min | 0 min | 0,0 | 7 h 39 min | 93 % | 8,3 | sí | No apto: 1 fin de semana completo (mínimo 2) |
| D3 · Luz vespertina (4 semanas) | 04/08/2025 | Luz brillante de 19:00 a 20:00 | editor | 14 (2) | 20 min | 0 min | 0,0 | 7 h 38 min | 94 % | 8,7 | sí | Apto |
| D4 · Seguimiento (13 noches) (abierto) | 06/10/2025 | Luz vespertina 3 días por semana | editor | 13 (2) | 20 min | 0 min | 0,0 | 7 h 39 min | 94 % | 8,8 | sí | No apto: 13 noches anotadas (mínimo 14) |

**Resultado por defecto** (diarios elegidos: D1, D3; referencia D1). El resumen de la aplicación dice: **Sin cambios clínicamente relevantes** — D3 · Luz vespertina (4 semanas) frente a D1 · Basal (referencia). Ninguna métrica que cuenta para la respuesta cambia de forma clínicamente relevante y fiable. Remisión por diario: D1 sí · D3 sí. Métricas más significativas (tarjetas): Calidad al despertar, Estado durante el día, Tiempo total de sueño, Eficiencia del sueño.

*D3 frente a D1 (referencia): Sin cambios clínicamente relevantes.* Avisos: Tratamiento anotado en las noches del diario posterior: Luz vespertina.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 22 → 20 | −2 min (−10 a +7 min) | +0,1× | Sin cambios |
| WASO ● | −20 min | 0 → 0 | 0 min (0 a 0 min) | 0,0× | Sin cambios |
| Despertares ● | −0,5 | 0,0 → 0,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 7h 09min → 7h 38min | +29 min (−1 a +58 min) | +1,9× | ? Mejoría no concluyente |
| Eficiencia ● | +10 puntos | 92 → 94 | +2,7 puntos (+0,4 a +4,9 puntos) | +0,3× | Mejoría pequeña |
| Calidad del sueño ● | g ≥ 0,5 | 8,6 → 8,7 | +0,1 (−0,7 a +1,0) | +0,3× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 8,3 → 9,7 | +1,4 (+0,3 a +2,6) | +2,5× | ✓ Mejoría clínicamente relevante |
| Estado durante el día | g ≥ 0,5 | 8,3 → 9,7 | +1,4 (+0,3 a +2,6) | +2,5× | ✓ Mejoría clínicamente relevante |
| Del despertar a levantarse | — | 18 → 8 | −10 min (−14 a −6 min) | — | Mejoría pequeña |
| Tiempo en la cama | — | 7h 49min → 8h 06min | +17 min (−17 a +51 min) | — | Sin cambios |

**Para estudiar:**

- Contando también la calidad al despertar para la respuesta → D3 frente a D1: respuesta.

### Evolución 13 · Vacaciones frente a semanas laborables (sin intervención)

**Parte de:** Caso · Sueño normal (su diario es el basal). **Qué muestra:** Sin ninguna intervención, en vacaciones duerme más: el tiempo de sueño «mejora» de forma relevante y sale «respuesta». El aviso de noches antes de festivo (todas en vacaciones) indica que la diferencia puede deberse al tipo de noche.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 21 min | 0 min | 0,0 | 7 h 35 min | 94 % | 8,6 | sí | Apto |
| D2 · Vacaciones de verano (abierto) | 04/08/2025 | Ninguna (vacaciones) | editor | 21 (3) | 21 min | 0 min | 0,0 | 8 h 36 min | 95 % | 8,6 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Respuesta** — D2 · Vacaciones de verano frente a D1 · Basal (referencia). Mejoría clínicamente relevante en tiempo total de sueño. Ninguna métrica que cuenta para la respuesta empeora. Remisión por diario: D1 sí · D2 sí. Métricas más significativas (tarjetas): Tiempo total de sueño, Latencia de sueño, WASO, Eficiencia del sueño.

*D2 frente a D1 (referencia): Respuesta.* Avisos: Proporción de noches antes de festivo distinta (29 % frente a 100 %): las medias pueden diferir por el tipo de noche.

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 21 → 21 | 0 min (−8 a +8 min) | 0,0× | Sin cambios |
| WASO ● | −20 min | 0 → 0 | 0 min (0 a 0 min) | 0,0× | Sin cambios |
| Despertares ● | −0,5 | 0,0 → 0,0 | 0,0 (0,0 a 0,0) | 0,0× | Sin cambios |
| Tiempo total de sueño ● | +15 min | 7h 35min → 8h 36min | +61 min (+47 a +76 min) | +4,1× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 94 → 95 | +0,7 puntos (−1,0 a +2,3 puntos) | +0,1× | Sin cambios |
| Calidad del sueño ● | g ≥ 0,5 | 8,6 → 8,6 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Calidad al despertar | g ≥ 0,5 | 8,6 → 8,6 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Estado durante el día | g ≥ 0,5 | 8,6 → 8,6 | 0,0 (−0,8 a +0,8) | 0,0× | Sin cambios |
| Del despertar a levantarse | — | 7 → 7 | 0 min (−4 a +4 min) | — | Sin cambios |
| Tiempo en la cama | — | 8h 03min → 9h 04min | +61 min (+43 a +80 min) | — | Cambio fiable |

**Para estudiar:**

- Sin contar el tiempo total de sueño para la respuesta → D2 frente a D1: sin cambios clínicamente relevantes.

### Evolución 14 · Basal con tendencia (anotado ya en tratamiento): intervalos muy anchos

**Parte de:** Caso · Mujer 57a (insomnio en TCC-I) (su diario es el basal). **Qué muestra:** El diario basal se anotó con la TCC-I ya empezada y tiene tendencia (mejora de una semana a otra). La autocorrelación alta deja muy pocas noches efectivas y los intervalos se hacen muy anchos: la latencia, la eficiencia y las calidades cambian mucho pero salen no concluyentes; solo las métricas que cambian muchísimo siguen siendo relevantes. El basal debe anotarse antes de la intervención y estable.

| Diario | Fechas | Intervención | Sistema | Noches (fines de semana) | Latencia | WASO | Despertares | Tiempo de sueño | Eficiencia | Calidad del sueño | Remisión | Para comparar |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 · Basal | 02/06/2025 | — | editor | 21 (3) | 31 min | 28 min | 0,8 | 5 h 40 min | 80 % | 5,8 | no | Apto |
| D2 · Tras completar la TCC-I (abierto) | 01/09/2025 | Ventana de 23:45 a 06:45, estable | editor | 21 (3) | 11 min | 1 min | 0,1 | 6 h 40 min | 95 % | 7,7 | sí | Apto |

**Resultado por defecto** (diarios elegidos: D1, D2; referencia D1). El resumen de la aplicación dice: **Respuesta** — D2 · Tras completar la TCC-I frente a D1 · Basal (referencia). Mejoría clínicamente relevante en WASO, despertares y tiempo total de sueño. Ninguna métrica que cuenta para la respuesta empeora. Remisión por diario: D1 no · D2 sí. Métricas más significativas (tarjetas): WASO, Tiempo total de sueño, Despertares, Latencia de sueño.

*D2 frente a D1 (referencia): Respuesta.*

| Métrica | Umbral | Antes → después | Cambio (IC 95 %) | Veces el umbral (+: mejora) | Valoración |
|---|---|---|---|---|---|
| Latencia de sueño ● | −20 min | 31 → 11 | −20 min (−60 a +19 min) | +1,0× | ? Mejoría no concluyente |
| WASO ● | −20 min | 28 → 1 | −27 min (−53 a 0 min) | +1,3× | ✓ Mejoría clínicamente relevante |
| Despertares ● | −0,5 | 0,8 → 0,1 | −0,7 (−1,1 a −0,4) | +1,4× | ✓ Mejoría clínicamente relevante |
| Tiempo total de sueño ● | +15 min | 5h 40min → 6h 40min | +60 min (+42 a +79 min) | +4,0× | ✓ Mejoría clínicamente relevante |
| Eficiencia ● | +10 puntos | 80 → 95 | +15,1 puntos (−13,3 a +43,6 puntos) | +1,5× | ? Mejoría no concluyente |
| Calidad del sueño ● | g ≥ 0,5 | 5,8 → 7,7 | +1,9 (−7,1 a +10,9) | +1,3× | ? Mejoría no concluyente |
| Calidad al despertar | g ≥ 0,5 | 4,3 → 6,2 | +1,9 (−1,3 a +5,1) | +1,6× | ? Mejoría no concluyente |
| Estado durante el día | g ≥ 0,5 | 4,2 → 6,1 | +1,9 (−1,4 a +5,2) | +1,7× | ? Mejoría no concluyente |
| Del despertar a levantarse | — | 35 → 7 | −28 min (−119 a +64 min) | — | Sin cambios |
| Tiempo en la cama | — | 7h 14min → 7h 00min | −14 min (−289 a +260 min) | — | Sin cambios |

## Observaciones sobre el método (para revisar)

Lo que estos casos dejan ver y conviene decidir si se cambia:

1. **Intervalos muy anchos con diarios en tendencia** (casos 7 y 14). Si un diario mejora de una semana a otra, la autocorrelación de un día al siguiente es alta; con r₁ acotado a 0,8, las noches efectivas bajan a n/9 (con un mínimo de 2) y la t de Student, con 1 o 2 grados de libertad, llega a 12,7. En el caso 14, por ejemplo, el IC del tiempo en la cama va de −289 a +260 min y el de la calidad del sueño de −7,1 a +10,9 (en una escala de 10). Es conservador (no da por buena una mejoría que puede ser solo la tendencia), pero los números son poco interpretables. Opciones: acotar r₁ a 0,5, poner un mínimo de noches efectivas (p. ej., n/4) o avisar en la comparación cuando un diario tiene tendencia.
2. **«Se mantiene» tras un empeoramiento** (caso 4). La comparación con el diario anterior solo mira si algo empeora; si el diario anterior era un empeoramiento y el último se recupera, el resumen dice «Frente al diario anterior: se mantiene». Mejor algo como «mejora respecto al anterior» cuando el anterior no era una respuesta.
3. **Criterios de remisión del adulto en niños** (caso 10). La remisión por diario (Lichstein) es la del insomnio del adulto; en un bebé, con siestas y despertares propios de la edad, es solo orientativa. Podría no mostrarse por debajo de cierta edad o indicarse que no aplica.
4. **Respuesta solo por la calidad percibida** (caso 9). La calidad del sueño cuenta para la respuesta: un cambio subjetivo sin cambio en el sueño anotado da «respuesta». Es coherente con la AASM (que incluye la calidad), pero conviene tenerlo presente o que el resumen lo diga.
5. **Vacaciones** (caso 13). Sin intervención, en vacaciones sale «respuesta» por el tiempo de sueño; el único freno es el aviso de noches antes de festivo. Podría destacarse más el aviso en el resumen o no dar «respuesta» cuando la diferencia de festivos supera cierto valor.
6. **Diario abierto mixto** (caso 11). Si el diario abierto es mixto, por defecto solo se elige ese y no hay comparación; para comparar los otros hay que quitarlo primero (con él elegido, los demás salen como «otro sistema»). Es lo previsto, pero puede no ser evidente.

## Cómo se generan

Con un generador reproducible (semilla fija) que toma el diario del caso de la v4.9.9 y, noche a noche, aplica la transformación de cada diario y la guarda como lo haría el editor de la noche (horas de 15 en 15 min, duraciones en sus escalones, tipos de noche como en el basal salvo en vacaciones). Las noches «de la rejilla» se guardan sin las respuestas del editor. Se cargan con la marca 19: en un navegador donde ya se había abierto la v5.0.0 aparecen sin tocar los demás casos.
