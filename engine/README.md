# engine/

Motor de reglas en TypeScript, sin interfaz. Recibe órdenes, aplica el juego de reglas activo y devuelve lo
que sabe cada bando. Hecho: `azar.ts` (azar con semilla), `parametros.ts` (acceso al juego de reglas) y `terreno/` (tipos y línea de vista).

Fases del turno (D-003): órdenes → sensores → EW → fuegos → maniobra → combate próximo → logística → mando y moral.
