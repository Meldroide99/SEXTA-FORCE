# Fase 0 · Formatos de partida y papel de Claude

Qué guarda el juego y qué hace Claude en cada uno de sus tres papeles. **Aprobado por Balú el 5 de octubre de 2026 (D-048 a D-051).** Los formatos técnicos están en el repositorio (`rules/schema/` y `ai/`); aquí va lo que importa para jugar.

## 1. El escenario: lo que sale de la pantalla de creación

Al pulsar el botón, el generador produce un **escenario** (`rules/schema/escenario.schema.json`) con:

| Parte | Qué contiene |
|---|---|
| Semilla | Un número que se muestra. Misma semilla y mismas elecciones dan la misma partida. |
| Elecciones | Los 10 desplegables: escalón, doctrina propia, enemigo y su tamaño, misión, paso inicial, qué quieres aprender, terreno, meteorología y estación, mando enemigo y recursos. |
| Juego de reglas | «Ucrania 2026» v0.7.0 y los parámetros que hayas cambiado en el panel. |
| Terreno | Relieve en rejilla de 10 m, capa de vegetación y obstáculos, curvas cada 10 m, carreteras, caminos, arroyos, vados, puentes, edificios, lesosmugas, bosques, cultivos y campos de minas (cada uno con quién lo conoce), y topónimos con cota. |
| Fuerzas | Para cada bando: plantilla, paquete de apoyos, perfil de la IA y cada ficha con su tipo, símbolo APP-6, efectivos, posición, postura, calidad (veterana, regular o bisoña), munición, drones, baterías y tarea permanente. |
| Misión | Plantilla de pasos, paso inicial, objetivos (tomar, mantener, destruir, reconocer, negar), condiciones de victoria y límite de turnos u horas. |
| Eventos | Sucesos preparados según lo que quieres aprender, con el porqué de cada uno. |
| Orden de operaciones | Los 5 párrafos: situación, misión, ejecución, apoyo logístico y mando y transmisiones, con el plan PACE. |
| Comprobación | Que hay rutas, que el objetivo es alcanzable y que las fuerzas caben. |

## 2. El estado de la partida: lo que se guarda cada turno

Al final de cada turno se guarda el **estado** (`rules/schema/estado-partida.schema.json`). Es la verdad completa; cada bando solo recibe su parte.

| Parte | Qué contiene |
|---|---|
| Global | Turno, hora, paso de la operación, duración del turno, luz, meteorología, cruce térmico y estado del generador de azar. |
| Fichas | Posición, efectivos (iniciales y actuales), heridos sin evacuar, postura, movimiento (quieta, rápido y visible, lento y oculto), firma, cohesión y estado de moral, si está suprimida, si tiene al jefe, enlace, medio de enlace en uso, estado de emisión, días en posición, munición, drones, baterías, orden actual y tarea permanente. |
| Por bando | Contactos (tipo estimado, posición, incertidumbre en metros, certeza: detectado, reconocido, identificado, solo EW o falso, turno en que se vio y con qué sensor), puntos de referencia, corredores EW, depósitos, bajas acumuladas y FPV gastados. |
| Zonas | Zonas de perturbación activas, campos de minas (quién los conoce, si tienen paso abierto) y humo. |
| Indicadores | Enemigo localizado, abastecimiento enemigo, puestos de mando y depósitos destruidos, drones enemigos operativos, y tus bajas frente a la referencia de Watling. |
| Registro | Todo lo que pasó en el turno, fase a fase, con los parámetros que decidieron cada resultado. Es la materia prima del AAR. |

Con el escenario, la semilla y las órdenes de cada turno se puede **repetir la partida entera**, para revisarla, o **abrir una rama** desde un turno concreto para jugarla de otra forma (D-050; ver el apartado 5).

## 3. Claude en sus tres papeles

En los tres casos Claude recibe un texto con etiquetas fijas y responde solo con JSON, que el juego comprueba antes de usarlo. **Nunca cambia un resultado del motor** (D-001).

| Papel | Cuándo | Qué recibe | Qué devuelve |
|---|---|---|---|
| **Jefe enemigo** | Mando enemigo = Claude | Solo lo que su bando sabe, la misión, su secuencia de pasos, un resumen de las reglas y las acciones permitidas | Intención, una orden por ficha y razonamiento en 3 frases. Si una orden es imposible se le devuelve una vez; si falla otra vez, esa ficha espera |
| **Árbitro** | Mando enemigo = compañero | Lo que sabe cada bando y el registro del turno | Un parte de turno para cada bando sin revelar nada del contrario, respuestas a «¿por qué ha pasado esto?» citando regla y valores, y los huecos del reglamento que detecte, con propuesta |
| **Instructor (AAR)** | Al terminar, o cuando lo pidas | La verdad completa: escenario, registro de los dos bandos, indicadores y lo que querías aprender | Resumen, resultado, puntos fuertes y errores con turno, consecuencia, qué hacer y fuente, notas de 1 a 5 por criterio, tus bajas frente a la referencia y el siguiente ejercicio recomendado |

**Criterios del instructor** (D-048), con más peso en lo que elegiste aprender:

1. **Preparación:** ¿se reconoció, aisló y degradó antes de mover la infantería?
2. **Momento del asalto:** ¿estaba el enemigo ciego cuando empezaste a cerrar y destruir?
3. **Firma y dispersión:** ¿te moviste rápido y visible cuando no tocaba? ¿Grupos de más de 5?
4. **Cadena sensor-tirador:** tiempos reales de detección a golpe frente a 4, 15 y 30 min.
5. **EW:** perturbación coordinada con tus drones y localización de emisores enemigos.
6. **Logística y evacuación:** munición, baterías y heridos sin evacuar.
7. **Lectura del terreno:** línea de vista, contrapendientes, lesosmugas y vaguadas.
8. **Transmisiones:** plan PACE (principal, alternativo, contingencia y emergencia) y paso al siguiente medio cuando cae uno; disciplina de emisión (apagado o solo escucha al moverse, transmisiones cortas); emisores propios localizados y fuego recibido tras emitir; fichas sin enlace y si tu intención les bastaba para seguir.

Los textos completos de los tres prompts están en `ai/prompts/` y sus formatos de respuesta en `ai/esquemas/`.

## 4. Transmisiones en el juego (D-051)

Para poder corregir el criterio 8, cada ficha lleva dos datos más:

- **Medio de enlace en uso:** radio de mano (4 km), VHF portátil (10 km), HF, Starlink, red mallada (mesh), fibra o cable, enlace a pie, o ninguno. La orden de operaciones lleva un **plan PACE** con el orden de los medios. Si cae el medio en uso (perturbado, destruido o fuera de alcance), la ficha pasa al siguiente del plan al turno siguiente; si no tiene ninguno, queda sin enlace.
- **Emisión,** que eliges con la orden igual que «rápido y visible» o «lento y oculto»:

| Emisión | Recibe órdenes | Transmite (informa contactos, pide fuego) | Le localiza la escucha enemiga |
|---|---|---|---|
| Emitiendo | Sí | Sí | Sí, hasta 15 km (salvo fibra, cable o a pie) |
| Solo escucha | Sí | No: sus contactos no llegan al resto del bando hasta que emita | No |
| Silencio | No | No | No |

El silencio se ordena por un número de turnos (por defecto 1); al acabar, la ficha pasa sola a solo escucha y vuelve a recibir órdenes. Mientras dura cuenta como sin enlace para las órdenes, pero no pierde cohesión el primer turno, porque es una decisión tuya y no un corte. Esto se apoya en el informe del CPT Josiah Turner publicado por el Ejército de EE. UU. y por el portal de lecciones aprendidas de la OTAN (feb. 2026): cadena enemiga de 3 a 15 min desde la detección, apagar o dejar en recepción las radios al moverse y transmisiones cortas.

## 5. Árbitro y repetición (D-049, D-050)

- **Árbitro** (D-049): redacta el parte de cada bando y explica los resultados citando la regla y los valores. No cambia ningún resultado. Si encuentra un hueco del reglamento, lo anota con una propuesta y el motor aplica su regla por defecto.
- **Repetir desde un turno** (D-050): eliges un turno de una partida guardada y se abre una **rama** nueva desde el estado de ese turno; la partida original se conserva. Desde ahí das órdenes distintas. El AAR de la rama compara con la original en lo que cambiaste. El formato está en `rules/schema/partida.schema.json`.
