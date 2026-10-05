# Fase 0 · Formatos de partida y papel de Claude

Qué guarda el juego y qué hace Claude en cada uno de sus tres papeles. Los formatos técnicos están en el repositorio (`rules/schema/` y `ai/`); aquí va lo que importa para jugar.

## 1. El escenario: lo que sale de la pantalla de creación

Al pulsar el botón, el generador produce un **escenario** (`rules/schema/escenario.schema.json`) con:

| Parte | Qué contiene |
|---|---|
| Semilla | Un número que se muestra. Misma semilla y mismas elecciones dan la misma partida. |
| Elecciones | Los 10 desplegables: escalón, doctrina propia, enemigo y su tamaño, misión, paso inicial, qué quieres aprender, terreno, meteorología y estación, mando enemigo y recursos. |
| Juego de reglas | «Ucrania 2026» v0.6.0 y los parámetros que hayas cambiado en el panel. |
| Terreno | Relieve en rejilla de 10 m, capa de vegetación y obstáculos, curvas cada 10 m, carreteras, caminos, arroyos, vados, puentes, edificios, lesosmugas, bosques, cultivos y campos de minas (cada uno con quién lo conoce), y topónimos con cota. |
| Fuerzas | Para cada bando: plantilla, paquete de apoyos, perfil de la IA y cada ficha con su tipo, símbolo APP-6, efectivos, posición, postura, calidad (veterana, regular o bisoña), munición, drones, baterías y tarea permanente. |
| Misión | Plantilla de pasos, paso inicial, objetivos (tomar, mantener, destruir, reconocer, negar), condiciones de victoria y límite de turnos u horas. |
| Eventos | Sucesos preparados según lo que quieres aprender, con el porqué de cada uno. |
| Orden de operaciones | Los 5 párrafos: situación, misión, ejecución, apoyo logístico y mando y transmisiones. |
| Comprobación | Que hay rutas, que el objetivo es alcanzable y que las fuerzas caben. |

## 2. El estado de la partida: lo que se guarda cada turno

Al final de cada turno se guarda el **estado** (`rules/schema/estado-partida.schema.json`). Es la verdad completa; cada bando solo recibe su parte.

| Parte | Qué contiene |
|---|---|
| Global | Turno, hora, paso de la operación, duración del turno, luz, meteorología, cruce térmico y estado del generador de azar. |
| Fichas | Posición, efectivos (iniciales y actuales), heridos sin evacuar, postura, movimiento (quieta, rápido y visible, lento y oculto), firma, cohesión y estado de moral, si está suprimida, si tiene al jefe, enlace, días en posición, munición, drones, baterías, orden actual y tarea permanente. |
| Por bando | Contactos (tipo estimado, posición, incertidumbre en metros, certeza: detectado, reconocido, identificado, solo EW o falso, turno en que se vio y con qué sensor), puntos de referencia, corredores EW, depósitos, bajas acumuladas y FPV gastados. |
| Zonas | Zonas de perturbación activas, campos de minas (quién los conoce, si tienen paso abierto) y humo. |
| Indicadores | Enemigo localizado, abastecimiento enemigo, puestos de mando y depósitos destruidos, drones enemigos operativos, y tus bajas frente a la referencia de Watling. |
| Registro | Todo lo que pasó en el turno, fase a fase, con los parámetros que decidieron cada resultado. Es la materia prima del AAR. |

Con el escenario, la semilla y las órdenes de cada turno se puede **repetir la partida entera**, para revisarla o para jugarla de otra forma desde un turno concreto.

## 3. Claude en sus tres papeles

En los tres casos Claude recibe un texto con etiquetas fijas y responde solo con JSON, que el juego comprueba antes de usarlo. **Nunca cambia un resultado del motor** (D-001).

| Papel | Cuándo | Qué recibe | Qué devuelve |
|---|---|---|---|
| **Jefe enemigo** | Mando enemigo = Claude | Solo lo que su bando sabe, la misión, su secuencia de pasos, un resumen de las reglas y las acciones permitidas | Intención, una orden por ficha y razonamiento en 3 frases. Si una orden es imposible se le devuelve una vez; si falla otra vez, esa ficha espera |
| **Árbitro** | Mando enemigo = compañero | Lo que sabe cada bando y el registro del turno | Un parte de turno para cada bando sin revelar nada del contrario, respuestas a «¿por qué ha pasado esto?» citando regla y valores, y los huecos del reglamento que detecte, con propuesta |
| **Instructor (AAR)** | Al terminar, o cuando lo pidas | La verdad completa: escenario, registro de los dos bandos, indicadores y lo que querías aprender | Resumen, resultado, puntos fuertes y errores con turno, consecuencia, qué hacer y fuente, notas de 1 a 5 por criterio, tus bajas frente a la referencia y el siguiente ejercicio recomendado |

**Criterios del instructor**, con más peso en lo que elegiste aprender:

1. **Preparación:** ¿se reconoció, aisló y degradó antes de mover la infantería?
2. **Momento del asalto:** ¿estaba el enemigo ciego cuando empezaste a cerrar y destruir?
3. **Firma y dispersión:** ¿te moviste rápido y visible cuando no tocaba? ¿Grupos de más de 5?
4. **Cadena sensor-tirador:** tiempos reales de detección a golpe frente a 4, 15 y 30 min.
5. **EW:** perturbación coordinada con tus drones y emisores expuestos.
6. **Logística y evacuación:** munición, baterías y heridos sin evacuar.
7. **Lectura del terreno:** línea de vista, contrapendientes, lesosmugas y vaguadas.

Los textos completos de los tres prompts están en `ai/prompts/` y sus formatos de respuesta en `ai/esquemas/`.

## 4. Lo que necesito de ti

1. ¿Te valen los **7 criterios** del instructor, o quitas o añades alguno?
2. ¿Te vale que el **árbitro** solo explique y redacte partes, sin poder cambiar resultados?
3. ¿Te sirve poder **repetir la partida desde un turno** para jugarla de otra forma?
