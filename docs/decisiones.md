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
| D-019 | 2026-10-05 | Bajas en la infiltración rusa (C2): no es regla de combate; solo tolerancia a bajas de la IA con perfil «Rusia 2026» | Validación de la fase 0 | Balú |
| D-020 | 2026-10-05 | Señuelos (C3): cada señuelo es un contacto falso en la imagen enemiga; sin porcentaje fijo de reducción del daño | Validación de la fase 0 | Balú |
| D-021 | 2026-10-05 | Poncho antitérmico (C4): firma térmica ×0,3 quieto y ×0,7 en movimiento; el 96 % del fabricante queda como referencia | Validación de la fase 0 | Balú |
| D-022 | 2026-10-05 | Supresión (C5): mientras cae el fuego y un turno corto más | Validación de la fase 0 | Balú |
| D-023 | 2026-10-05 | Munición de 155 mm (F1): HE, base-bleed, RAP y Excalibur; V-LAP fuera por escasez | Validación de la fase 0 | Balú |
| D-024 | 2026-10-05 | Excalibur bajo perturbación GNSS (F2): se comporta como proyectil sin guiar | Validación de la fase 0 | Balú |
| D-025 | 2026-10-05 | Supervivencia de la pieza (F3): moverse en 3 min tras disparar; tope práctico de ~10 disparos por pieza y día | Validación de la fase 0 | Balú |
| D-026 | 2026-10-05 | Consumo de munición de todo el frente (F4): solo referencia | Validación de la fase 0 | Balú |
| D-027 | 2026-10-05 | Despliegue de artillería (F5): baterías a ~15 km de la línea, piezas a ≥ 500 m y tiro por separado | Validación de la fase 0 | Balú |
| D-028 | 2026-10-05 | FPV con guiado terminal: tipo aparte, 75 % de acierto, más caro y escaso | Validación de la fase 0 | Balú |
| D-029 | 2026-10-05 | Detección térmica: ×3 en movimiento (750 m) y ×0,3-0,5 en el cruce térmico | Validación de la fase 0 | Balú |
| D-030 | 2026-10-05 | Fuentes de EW de 2022-2023 (Pole-21, Silok, Kropyva): se mantienen con confianza media hasta tener fuentes de 2025-2026 | Validación de la fase 0 | Balú |
| D-031 | 2026-10-05 | Cierre de la validación de parámetros de la fase 0: juego de reglas «Ucrania 2026» v0.3.0; los valores no validados uno a uno quedan como valores por defecto editables | Validación de la fase 0 | Balú |
| D-032 | 2026-10-05 | Órdenes inmediatas: se ejecutan el mismo turno; una unidad sin enlace sigue sin recibir órdenes nuevas | Decisión de Balú (apartado E) | Balú |
| D-033 | 2026-10-05 | El alcance del tiro directo es el menor entre el alcance eficaz del arma y la línea de vista calculada sobre el terreno, con la vegetación (bosque, lesosmugas, cultivos según estación) y los edificios | Corrección de Balú | Balú |
| D-034 | 2026-10-05 | Rechazado el «carro como artillería» a 9 km como valor de juego; el tiro indirecto de carro queda como opción excepcional desactivada por defecto | Corrección de Balú | Balú |
| D-035 | 2026-10-05 | FPV de fibra: radio eficaz de 12 km (sustituye a los 10 km de D-011) | Validación del apartado G1 | Balú |
| D-036 | 2026-10-05 | Regla de línea de vista y capa de vegetación del apartado L, con sus valores (bosque, lesosmugas, cultivos, urbano, alturas del ojo, alcances de las armas) | Validación del apartado L | Balú |
| D-037 | 2026-10-05 | Lista de acciones por tipo de ficha para todos los jefes (jugador, IA del juego, Claude), sin cambios | Validación del apartado K | Balú |
| D-038 | 2026-10-05 | FPV de fibra G2-G7: 20 min de autonomía, 65 km/h de crucero y 90 en el ataque, emboscada de 12 h (máx. 24), 45 % de impacto, 15 % de los FPV ucranianos y 30 % de los rusos son de fibra, la red o barrera reduce el impacto a la mitad | Validación de la fase 0 | Balú |
| D-039 | 2026-10-05 | Paquetes de apoyo tipo para el ataque de compañía y de sección (templates/apoyos) | Validación de la fase 0 | Balú |
| D-040 | 2026-10-05 | Modelo de moral por cohesión 0-100 con estados Firme, Tocado, Suprimido y Roto, umbrales y factores del apartado I | Validación de la fase 0 | Balú |
| D-041 | 2026-10-05 | Secuencias por pasos de defensa (ucraniana y variante rusa), infiltración rusa y reconocimiento (templates/misiones) | Validación de la fase 0 | Balú |
| D-042 | 2026-10-05 | Cierre de la validación de parámetros de la fase 0: juego de reglas «Ucrania 2026» v0.5.0 | Validación de la fase 0 | Balú |
