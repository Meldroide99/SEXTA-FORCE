# Fase 0 · Decisiones pendientes de validación

Cruce de la matriz de parámetros (`docs/fase0/matriz-parametros.md`): conflictos entre fuentes, asimetrías
físicas y valores de confianza baja que cambian el resultado del juego. Para cada punto hay una propuesta;
el valor queda «propuesto» hasta que lo valides.

## A. Conflictos entre fuentes

| # | Tema | Lo que dicen las fuentes | Propuesta |
|---|---|---|---|
| A1 | Profundidad de la zona batida | 15 km para vehículos (CSIS, nov 2025); 10-15 km de dominio FPV (OSW, oct 2025); 20-25 km y 30 km a final de 2026 (Brovdi, may 2026; Lasiichuk, jul 2026) | FPV dominante 12,5 km; vehículos 20 km por defecto en «Ucrania 2026», editable hasta 30 |
| A2 | Eficacia del FPV por radio | 20-40 % (Brovdi, 2024); 43 % de salidas con impacto en una unidad (WOTR, 2025); 60-80 % de fallos (RUSI, feb 2025); 70-80 % con guiado terminal autónomo (CSIS, mar 2025) | 30 % por defecto con EW normal; crear un tipo aparte «FPV con guiado terminal» al 75 % y menos inmune a la cúpula |
| A3 | Alcance del FPV de fibra | 10 km (RUSI, feb 2025); 20 km en servicio (Syrskyi, abr 2025); 40 km en pruebas (jul 2025) | 20 km por defecto; 10 km para el escalón SGT si prefieres el dato de RUSI |
| A4 | Tiempo de sensor a golpe | 3-5 min con C2 digital (Delta, NYT ago 2026; RUSI 2023 para la artillería rusa); 15-20 min sin integración (WOTR 2025) | 4 min con enlace digital activo; 15 min sin él; 30 min si la detección llega solo por EW |

## B. Asimetrías físicas detectadas al cruzar valores

| # | Asimetría | Por qué no cuadra | Propuesta |
|---|---|---|---|
| B1 | Bombardero pesado: 20 km de alcance con 23 min de autonomía cargado | Ida y vuelta de 40 km en 23 min exige ~105 km/h con 10 kg; no es realista | Radio de acción cargado de 8-10 km sin espera sobre el objetivo; los 20 km como alcance de enlace o en vacío |
| B2 | FPV de fibra a 20 km con ~8 min de autonomía | A ~80 km/h, 8 min dan ~10 km; la fibra limita la velocidad | Autonomía propia del FPV de fibra (pendiente de fuente) o radio eficaz de 10 km aunque el cable dé más |
| B3 | Detección de una persona con la térmica del Mavic 3T: 250 m | Es el cálculo por criterio de Johnson; en la práctica se detecta antes por movimiento (×3) y por contraste térmico alto | Detección base 250 m quieto, ×3 en movimiento, ×0,3-0,5 en cruce térmico. **Necesito tu experiencia aquí** |
| B4 | Alcance del enlace del Mavic (15 km) frente a su autonomía real (25-35 min) | Si se quieren 15 min de observación sobre el objetivo, el tránsito de ida y vuelta (~15 m/s) deja un radio útil de unos 6-7 km | Radio de trabajo 6 km con 15 min de observación; enlace máximo 15 km |

## C. Valores de confianza baja que pesan mucho

| # | Parámetro | Valor | Propuesta |
|---|---|---|---|
| C1 | Movimiento táctico encubierto bajo drones | 1 km/h (estimación); ~5 km/día efectivos en la zona batida (RBC, ago 2026) | Aceptar 1 km/h y que el jugador elija entre «rápido y visible» o «lento y oculto» |
| C2 | Bajas esperadas en la infiltración rusa | 2 de cada 3 (declaración de prensa, nov 2025) | Solo para el perfil de IA «Rusia 2026» como tolerancia a bajas, no como regla de combate |
| C3 | Efecto de los señuelos | −50 % de daño con 3 señuelos por medio real (fuente indirecta) | Modelar el señuelo como contacto falso en la imagen enemiga, sin porcentaje fijo |
| C4 | Reducción de firma con poncho antitérmico y redes | 90-96 % (fabricantes) | ×0,3 quieto y ×0,7 en movimiento |
| C5 | Duración de la supresión tras cesar el fuego | 2 min (Wikipedia) | Supresión mientras dure el fuego + 1 turno corto |

## D. Fuentes antiguas (2022-2023) que conviene actualizar

Pole-21, Silok, Kropyva, densidad de EW rusa y supresión de radios (RUSI *Meatgrinder*, 2023). Son útiles
como orden de magnitud, pero la EW ha cambiado mucho desde entonces. Propuesta: mantenerlas con confianza
media y buscar fuentes de 2025-2026 en la fase 0.

## E. Lo que falta por investigar

- Autonomía y velocidad del FPV de fibra.
- Retardo de órdenes por cable, radio y mensajero.
- Moral: efecto de bajas, aislamiento y supresión.
- Fuerzas del GT (apoyos de batallón para que ataque una compañía).
- Secuencias de pasos para defensa, infiltración y reconocimiento.
