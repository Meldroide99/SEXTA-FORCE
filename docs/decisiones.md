# Registro de decisiones

Cada decisión de diseño se anota aquí con fecha, motivo y quién la tomó. Un cambio de regla o de parámetro
que no esté aquí no existe.

| # | Fecha | Decisión | Motivo | Decide |
|---|---|---|---|---|
| D-001 | 2026-10-04 | Las reglas y el estado viven en código determinista; Claude solo decide (jefe enemigo), arbitra e instruye | Reproducibilidad y AAR trazable; un LLM no es determinista ni se puede probar | Balú (aprobado) |
| D-002 | 2026-10-04 | La operación ofensiva sigue los 7 pasos de Watling (RUSI, oct 2025): primero sensores, EW y fuegos; el asalto al final | Práctica ucraniana 2025-2026; Vivaldi (2026) | Balú |
| D-003 | 2026-10-04 | Turno simultáneo en 8 fases: órdenes → sensores → EW → fuegos → maniobra → combate próximo → logística → mando y moral | Ver, perturbar y golpear antes de moverse | Balú (aprobado) |
| D-004 | 2026-10-04 | Plantilla por defecto: SGT de asalto de ~100 (M3), escuadras de 5; sección de 7 de Watling como alternativa | Menos gente, más fuego descentralizado, más drones | Balú |
| D-005 | 2026-10-04 | No hay escenarios fijos: una pantalla de creación con desplegables genera cada partida | Petición de Balú | Balú |
| D-006 | 2026-10-04 | Enemigo en tres modos (IA de utilidad, Claude, compañero) y una IA que aprende en la fase 5 | Petición de Balú | Balú |
| D-007 | 2026-10-04 | Diseño para ordenador; tableta secundaria; móvil fuera | Densidad de información a nivel SGT | Balú |
| D-008 | 2026-10-04 | Motor e interfaz en TypeScript; herramientas de datos en Python | Un solo lenguaje para motor y página publicada; Python para investigación y generación de terreno | Claude (propuesta) |
| D-009 | 2026-10-04 | Solo fuentes abiertas; nada de NOP, plantillas reales de la BRIPAC ni información clasificada | Seguridad | Balú |
| D-010 | 2026-10-04 | Eficacia del FPV por radio: 30 % por defecto | Validación de la fase 0 | Balú |
| D-011 | 2026-10-04 | FPV de fibra: radio eficaz de 10 km (la bobina puede dar 20-40 km) | Validación de la fase 0; resuelve la asimetría B2 | Balú |
| D-012 | 2026-10-04 | Detección de una persona de pie con la térmica de un Mavic 3T: 250 m | Validación de la fase 0 | Balú |
| D-013 | 2026-10-04 | Artillería pesada de referencia: 155 mm de 52 calibres con base-bleed, 40 km; se añade la categoría completa de 155 mm | Prioridad de Balú por encima del bombardero pesado | Balú |
| D-014 | 2026-10-04 | Asimetría del bombardero pesado (B1): aplazada | Prioridad baja | Balú |
| D-015 | 2026-10-05 | Zona batida (A1): dominio FPV hasta 12,5 km de la línea; vehículos y logística batidos hasta 20 km por defecto (editable hasta 30) | Validación de la fase 0 | Balú |
| D-016 | 2026-10-05 | Tiempo de sensor a golpe (A4): 4 min con enlace digital (Delta), 15 min sin él, 30 min si la detección es solo por EW | Validación de la fase 0 | Balú |
| D-017 | 2026-10-05 | Mavic (B4): radio de trabajo de 6 km con 15 min de observación; enlace máximo de 15 km | Validación de la fase 0 | Balú |
| D-018 | 2026-10-05 | Movimiento encubierto bajo drones (C1): 1 km/h; el jugador elige cada turno entre «rápido y visible» o «lento y oculto» | Validación de la fase 0 | Balú |
