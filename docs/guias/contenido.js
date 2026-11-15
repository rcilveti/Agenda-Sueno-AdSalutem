// El texto de las dos guías. Es el de la v5.0.0, con un solo cambio: los acontecimientos se
// anotan junto a los despertares, así que van ahí tanto en el paso 1 como en la tabla.
'use strict';

module.exports = {

Guia_del_paciente_v5_0_0_castellano: {
  titulo: 'Guía del paciente — Agenda de Sueño',
  firma: '15 de noviembre de 2026 · @Robs & Mirs',
  entrada: 'Durante tres semanas anotarás cada mañana cómo has dormido. Solo te llevará un par de minutos al día y ayudará a tu profesional a entender tu sueño.',
  s1: {
    titulo: '1. Entrar en tu diario',
    intro: 'La primera vez basta con escanear tu código QR personal; después se abre desde su icono, directamente en tu diario, sin volver a escribir el código.',
    pasos: [
      'Escanea con la cámara del móvil el **código QR** que te ha dado tu profesional. Entrarás directamente y tu ficha ya estará rellena.',
      'Lee la **información sobre tus datos** y acéptala para empezar.',
      'Indica si el dispositivo es **solo tuyo** o **compartido**. Solo se pregunta una vez.',
      'Cuando te lo ofrezca, **instala la aplicación** en la pantalla de inicio: en iPhone, botón Compartir → «Añadir a pantalla de inicio»; en Android, «Instalar». Si ya habías anotado alguna noche en el navegador, pasa sola a la aplicación.',
      'A partir de entonces, ábrela **siempre desde su icono** y desde el mismo móvil. Tus datos se guardan solos en el teléfono y la sesión queda abierta: cada vez que la abras entrarás directamente en tu diario.',
    ],
    cola: [
      'Si no puedes escanear el QR, o si la aplicación te pide entrar, escribe tu **código de acceso** (8 letras y números, por ejemplo ABCD-2345) en «Usuario o código» y pulsa «Entrar». La contraseña puede quedar en blanco y funciona en cualquier móvil. La aplicación también está en catalán: elige el idioma en la pantalla de acceso o en ⚙️ Ajustes.',
      '**Cerrar sesión.** Solo si pulsas «Cerrar sesión» la aplicación volverá a pedirte entrar; aun así, tu código aparecerá ya escrito y bastará con pulsar «Entrar». En un ordenador o en un dispositivo compartido la sesión no queda abierta, por seguridad.',
    ],
  },
  s2: {
    titulo: '2. Cada mañana: anotar la noche',
    intro: [
      'Rellena el diario **cada mañana**, en las horas siguientes a levantarte (por ejemplo, en el desayuno), anotando la noche que acaba de pasar. La aplicación guarda la hora a la que anotas cada día: así tu profesional sabe que el registro es fiable. No mires el reloj por la noche; las horas aproximadas bastan.',
      '**Recordatorio diario.** Pulsa «⏰ Recordatorio», en la tarjeta de arriba de tu diario, elige la hora y pulsa «📅 Añadir al calendario» (o «Google Calendar» en Android): el móvil te avisará cada mañana durante las tres semanas. El aviso no lleva ningún dato tuyo. Si un día se te olvida, al abrir la aplicación verás un aviso naranja con la noche que falta y un botón para anotarla.',
      'Tu diario es una lista de las 21 noches, por semanas. Toca la noche que acaba de pasar (la de ayer aparece destacada) y se abre el **editor de la noche**, en horizontal: si tienes el móvil en vertical, gíralo. Las noches que aún no han terminado no se pueden abrir. El fondo de cada noche lleva el color de sus dos días: azul claro, laborable; naranja claro, festivo. Cada noche anotada muestra su horario, las tres caras de tu valoración y, en su barra, el icono de cada acontecimiento (🚽, 💢, 🔊…).',
      'Arriba ves los dos días que une la noche, con su fecha. Si alguno fue libre (sin despertador ni obligaciones), tócalo para cambiarlo a «Festivo». La noche cuenta como el día en que te levantas. Las pestañas del editor siguen el orden de la noche, de izquierda a derecha: acostarse, latencia, despertares, acontecimientos, despertar final y levantarse.',
    ],
    pasos: [
      '**Noche:** arrastra las bolitas o usa − y +. A qué hora te acostaste (de 15 en 15 minutos), cuánto tardaste en dormirte, los despertares («Despertares» → «+ Añadir»: hacia qué hora y cuánto rato) y, si pasó algo, qué fue («Acontecimientos» → «+ Añadir»). Después, tu despertar final (cuándo te despertaste del todo; + es más tarde y − más temprano) y, por último, cuánto rato seguiste en la cama hasta levantarte («Levantarse»: al despertar, 5, 10, 15, 20, 30 minutos…).',
      '**Siestas:** si ayer dormiste alguna siesta, «+ Añadir siesta»: arrástrala con el dedo hacia su hora y estira su borde derecho para lo que duró (o usa − y +). Si no, sigue.',
      '**Valoración:** toca una cara en cada fila, de 1 (muy mal) a 5 (muy bien): tu sueño, lo descansado/a que te levantaste y cómo te encontraste durante el día anterior (el editor te dice qué día). Las tres hacen falta para guardar.',
      '**Notas**, si quieres: el tratamiento («Igual que ayer» copia el de la noche anterior) y lo que pudo influir (café, alcohol, una cena tardía…). Pulsa Guardar. Si el móvil tiene la rotación bloqueada, el teclado sale en vertical: mientras escribes, el editor también se pone en vertical. Para escribir en horizontal, desbloquea la rotación.',
    ],
  },
  tabla: [
    ['**En el editor**', '**Qué anotas**'],
    ['↓ Acostarse', 'La hora en que te metiste en la cama para dormir'],
    ['Latencia', 'Cuánto tardaste en dormirte'],
    ['Despertares', 'Cada vez que te despertaste: hacia qué hora y cuánto rato'],
    ['Acontecimientos', '🚽 baño · 💢 dolor · 🔊 ruido · 🌡️ calor o frío · 😟 preocupación · 😷 tos · 👶 niño · 🍼 toma · 🏷️ otro'],
    ['☀ Despertar final', 'La hora en que te despertaste del todo'],
    ['↑ Levantarse', 'Cuánto rato seguiste en la cama después del despertar final, hasta levantarte'],
    ['Siestas', 'Las del día anterior a la noche, con su hora y su duración'],
    ['Valoración (1–5)', 'Sueño: 1 muy mala … 5 muy buena · Despertar: 1 nada … 5 muy bien descansado/a · Día anterior: 1 muy mal … 5 muy bien. El 3 es un día normal.'],
  ],
  s3: {
    titulo: '3. Enviar el diario y tus datos',
    intro: 'Tú decides cuándo y cómo llega el diario a tu profesional; hasta entonces solo está en tu móvil.',
    puntos: [
      '**Enviar:** al terminar las tres semanas (o cuando te lo pida tu profesional), pulsa «📤 Enviar a mi médico», abajo, y elige WhatsApp, correo u otra aplicación. «💾 Guardar», a su lado, confirma que tus noches están guardadas en el móvil.',
      '**Recordatorio:** si pasa una semana sin enviarlo, la aplicación te lo recordará. También puedes «Guardar copia»: un enlace que te mandas a ti mismo y que recupera el diario si cambias de móvil.',
      '**Ajustes (⚙️):** cambiar el idioma o el tipo de dispositivo, releer la información sobre tus datos y abrir esta guía.',
      '**Borrar tus datos:** cuando tu profesional confirme que ha recibido el diario, en ⚙️ Ajustes → «Borrar mis datos de este dispositivo». Se borran el diario, la ficha y el acceso del móvil; si instalaste la aplicación, puedes quitar también su icono.',
      '**Dispositivo compartido:** si elegiste «Es compartido», nada se guarda al cerrar la sesión. Envía el diario antes de salir.',
    ],
  },
  faq: {
    titulo: 'Preguntas frecuentes',
    puntos: [
      '**Se me olvidó un día.** Rellénalo en cuanto puedas, recordando lo mejor posible. Quedará anotado que se registró más tarde, y no pasa nada.',
      '**Me he equivocado.** Toca la noche, corrige lo que haga falta y pulsa «Guardar». «Cancelar» cierra el editor sin cambiar nada.',
      '**No veo toda la noche.** El editor se abre con la noche encuadrada; si mueves el horario, «Ajustar» la vuelve a encuadrar, y la barra morada de arriba mueve el horario visible.',
      '**Me acosté antes de las 20:00.** El editor empieza a las 18:00: arrastra la hora de acostarte hacia la izquierda (por ejemplo, la de un niño pequeño).',
      '**¿Las siestas de qué día?** Las del día anterior a la noche que anotas: por la mañana, las de ayer. Así la siesta y la noche que le sigue quedan juntas.',
      '**La pantalla no se amplía.** Mientras anotas la noche, la pantalla no se amplía, para que tocar − y + seguidos no la amplíe sin querer. Al cerrar el editor, se puede ampliar como siempre.',
      '**He cambiado de móvil.** Escanea de nuevo tu QR en el móvil nuevo. Si tienes una copia por enlace, ábrela allí: los días se combinan sin perder ninguno.',
      '**Me pide un código y no lo tengo.** Vuelve a escanear el QR. Si ha caducado (dura dos meses), pide uno nuevo a tu profesional.',
      '**¿Quién ve mis datos?** Solo tú, en tu móvil, hasta que los envías a tu profesional.',
    ],
  },
  cierre: 'Ante cualquier duda, consulta con tu profesional. Gracias por tu colaboración: nos ayuda a cuidar tu descanso.',
},

Guia_del_pacient_v5_0_0_catala: {
  titulo: 'Guia del pacient — Agenda de Son',
  firma: '15 de novembre de 2026 · @Robs & Mirs',
  entrada: 'Durant tres setmanes anotaràs cada matí com has dormit. Només et caldran un parell de minuts al dia i ajudarà el teu professional a entendre el teu son.',
  s1: {
    titulo: '1. Entrar al teu diari',
    intro: 'La primera vegada n’hi ha prou d’escanejar el teu codi QR personal; després s’obre des de la seva icona, directament al teu diari, sense tornar a escriure el codi.',
    pasos: [
      'Escaneja amb la càmera del mòbil el **codi QR** que t’ha donat el teu professional. Hi entraràs directament i la teva fitxa ja estarà emplenada.',
      'Llegeix la **informació sobre les teves dades** i accepta-la per començar.',
      'Indica si el dispositiu és **només teu** o **compartit**. Només es pregunta un cop.',
      'Quan t’ho ofereixi, **instal·la l’aplicació** a la pantalla d’inici: a l’iPhone, botó Compartir → «Afegeix a la pantalla d’inici»; a Android, «Instal·la». Si ja havies anotat alguna nit al navegador, passa sola a l’aplicació.',
      'A partir d’aleshores, obre-la **sempre des de la seva icona** i des del mateix mòbil. Les teves dades es desen soles al telèfon i la sessió queda oberta: cada vegada que l’obris entraràs directament al teu diari.',
    ],
    cola: [
      'Si no pots escanejar el QR, o si l’aplicació et demana entrar, escriu el teu **codi d’accés** (8 lletres i números, per exemple ABCD-2345) a «Usuari o codi» i prem «Entrar». La contrasenya es pot deixar en blanc i funciona en qualsevol mòbil. Tria el català a la pantalla d’accés o a ⚙️ Configuració.',
      '**Tancar la sessió.** Només si prems «Tanca la sessió» l’aplicació et tornarà a demanar entrar; tot i així, el teu codi ja hi apareixerà escrit i n’hi haurà prou de prémer «Entrar». En un ordinador o en un dispositiu compartit la sessió no queda oberta, per seguretat.',
    ],
  },
  s2: {
    titulo: '2. Cada matí: anotar la nit',
    intro: [
      'Omple el diari **cada matí**, en les hores següents a llevar-te (per exemple, a l’hora d’esmorzar), anotant la nit que acaba de passar. L’aplicació desa l’hora en què anotes cada dia: així el teu professional sap que el registre és fiable. No miris el rellotge a la nit; n’hi ha prou amb hores aproximades.',
      '**Recordatori diari.** Prem «⏰ Recordatori», a la targeta de dalt del teu diari, tria l’hora i prem «📅 Afegir al calendari» (o «Google Calendar» a Android): el mòbil t’avisarà cada matí durant les tres setmanes. L’avís no porta cap dada teva. Si un dia se t’oblida, en obrir l’aplicació veuràs un avís taronja amb la nit que falta i un botó per anotar-la.',
      'El teu diari és una llista de les 21 nits, per setmanes. Toca la nit que acaba de passar (la d’ahir apareix destacada) i s’obre l’**editor de la nit**, en horitzontal: si tens el mòbil en vertical, gira’l. Les nits que encara no s’han acabat no es poden obrir. El fons de cada nit porta el color dels seus dos dies: blau clar, laborable; taronja clar, festiu. Cada nit anotada mostra el seu horari, les tres cares de la teva valoració i, a la seva barra, la icona de cada esdeveniment (🚽, 💢, 🔊…).',
      'A dalt veus els dos dies que uneix la nit, amb la seva data. Si algun va ser lliure (sense despertador ni obligacions), toca’l per canviar-lo a «Festiu». La nit compta com el dia en què et lleves. Les pestanyes de l’editor segueixen l’ordre de la nit, d’esquerra a dreta: anar al llit, latència, despertars, esdeveniments, despertar final i llevar-se.',
    ],
    pasos: [
      '**Nit:** arrossega les boletes o fes servir − i +. A quina hora et vas ficar al llit (de 15 en 15 minuts), quant vas trigar a adormir-te, els despertars («Despertars» → «+ Afegir»: cap a quina hora i quanta estona) i, si va passar alguna cosa, què va ser («Esdeveniments» → «+ Afegir»). Després, el teu despertar final (quan et vas despertar del tot; + és més tard i − més d’hora) i, per acabar, quanta estona vas seguir al llit fins a llevar-te («Llevar-se»: en despertar-te, 5, 10, 15, 20, 30 minuts…).',
      '**Migdiades:** si ahir vas fer alguna migdiada, «+ Afegir migdiada»: arrossega-la amb el dit cap a la seva hora i estira’n la vora dreta per al que va durar (o fes servir − i +). Si no, continua.',
      '**Valoració:** toca una cara a cada fila, d’1 (molt malament) a 5 (molt bé): el teu son, com de descansat/da et vas llevar i com et vas trobar durant el dia anterior (l’editor et diu quin dia). Calen les tres per desar.',
      '**Notes**, si vols: el tractament («Igual que ahir» copia el de la nit anterior) i el que hi va poder influir (cafè, alcohol, un sopar tardà…). Prem Desar. Si el mòbil té la rotació bloquejada, el teclat surt en vertical: mentre escrius, l’editor també es posa en vertical. Per escriure en horitzontal, desbloqueja la rotació.',
    ],
  },
  tabla: [
    ['**A l’editor**', '**Què anotes**'],
    ['↓ Anar al llit', 'L’hora en què et vas ficar al llit per dormir'],
    ['Latència', 'Quant vas trigar a adormir-te'],
    ['Despertars', 'Cada vegada que et vas despertar: cap a quina hora i quanta estona'],
    ['Esdeveniments', '🚽 lavabo · 💢 dolor · 🔊 soroll · 🌡️ calor o fred · 😟 preocupació · 😷 tos · 👶 nen · 🍼 presa · 🏷️ altre'],
    ['☀ Despertar final', 'L’hora en què et vas despertar del tot'],
    ['↑ Llevar-se', 'Quanta estona vas seguir al llit després del despertar final, fins a llevar-te'],
    ['Migdiades', 'Les del dia anterior a la nit, amb la seva hora i la seva durada'],
    ['Valoració (1–5)', 'Son: 1 molt dolent … 5 molt bo · Despertar: 1 gens … 5 molt ben descansat/da · Dia anterior: 1 molt malament … 5 molt bé. El 3 és un dia normal.'],
  ],
  s3: {
    titulo: '3. Enviar el diari i les teves dades',
    intro: 'Tu decideixes quan i com arriba el diari al teu professional; fins aleshores només és al teu mòbil.',
    puntos: [
      '**Enviar:** en acabar les tres setmanes (o quan t’ho demani el teu professional), prem «📤 Enviar al meu metge», a baix, i tria WhatsApp, correu o una altra aplicació. «💾 Desar», al costat, confirma que les teves nits estan desades al mòbil.',
      '**Recordatori:** si passa una setmana sense enviar-lo, l’aplicació t’ho recordarà. També pots «Desar còpia»: un enllaç que t’envies a tu mateix i que recupera el diari si canvies de mòbil.',
      '**Configuració (⚙️):** canviar l’idioma o el tipus de dispositiu, tornar a llegir la informació sobre les teves dades i obrir aquesta guia.',
      '**Esborrar les teves dades:** quan el teu professional confirmi que ha rebut el diari, a ⚙️ Configuració → «Esborra les meves dades d’aquest dispositiu». S’esborren el diari, la fitxa i l’accés del mòbil; si vas instal·lar l’aplicació, també en pots treure la icona.',
      '**Dispositiu compartit:** si vas triar «És compartit», no es desa res en tancar la sessió. Envia el diari abans de sortir.',
    ],
  },
  faq: {
    titulo: 'Preguntes freqüents',
    puntos: [
      '**Em vaig oblidar d’un dia.** Omple’l tan aviat com puguis, recordant-ho tan bé com sàpigues. Quedarà anotat que es va registrar més tard, i no passa res.',
      '**M’he equivocat.** Toca la nit, corregeix el que calgui i prem «Desar». «Cancel·lar» tanca l’editor sense canviar res.',
      '**No veig tota la nit.** L’editor s’obre amb la nit enquadrada; si mous l’horari, «Ajustar» la torna a enquadrar, i la barra morada de dalt mou l’horari visible.',
      '**Em vaig ficar al llit abans de les 20:00.** L’editor comença a les 18:00: arrossega l’hora d’anar al llit cap a l’esquerra (per exemple, la d’un nen petit).',
      '**Les migdiades de quin dia?** Les del dia anterior a la nit que anotes: al matí, les d’ahir. Així la migdiada i la nit que la segueix queden juntes.',
      '**La pantalla no s’amplia.** Mentre anotes la nit, la pantalla no s’amplia, perquè tocar − i + seguits no l’ampliï sense voler. En tancar l’editor, es pot ampliar com sempre.',
      '**He canviat de mòbil.** Torna a escanejar el teu QR al mòbil nou. Si tens una còpia per enllaç, obre-la allà: els dies es combinen sense perdre’n cap.',
      '**Em demana un codi i no el tinc.** Torna a escanejar el QR. Si ha caducat (dura dos mesos), demana’n un de nou al teu professional.',
      '**Qui veu les meves dades?** Només tu, al teu mòbil, fins que les envies al teu professional.',
    ],
  },
  cierre: 'Si tens qualsevol dubte, consulta el teu professional. Gràcies per la teva col·laboració: ens ajuda a tenir cura del teu descans.',
},

};
