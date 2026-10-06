# generator/

Generador de partidas (fase 1): a partir de las opciones de la pantalla de creación produce terreno, fuerzas,
despliegue enemigo, eventos y orden de operaciones, con una semilla visible para repetir la partida.

El terreno se construye desde la red de drenaje (vaguadas y espolones coherentes), como el de la Loma del Cuervo.

Hecho (fase 1, entrega 1): `terreno/colinas.ts` con su configuración en `terreno/config-colinas.ts`,
la red de drenaje en `terreno/hidrologia.ts` y el trazado de vías en `terreno/caminos.ts`.
