# engine/

Motor de reglas en TypeScript, sin interfaz. Recibe órdenes, aplica el juego de reglas activo y devuelve lo
que sabe cada bando. Se empieza en la fase 1, cuando la fase 0 esté validada.

Fases del turno (D-003): órdenes → sensores → EW → fuegos → maniobra → combate próximo → logística → mando y moral.
