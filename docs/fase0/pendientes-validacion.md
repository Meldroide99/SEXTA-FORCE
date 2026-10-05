# Fase 0 · Decisiones de validación (validación cerrada el 2026-10-05; queda el apartado E)

Cruce de la matriz de parámetros (`docs/fase0/matriz-parametros.md`): conflictos entre fuentes, asimetrías
físicas y valores de confianza baja que cambian el resultado del juego. Para cada punto hay una propuesta;
el valor queda «propuesto» hasta que lo valides.

## A. Conflictos entre fuentes

| # | Tema | Lo que dicen las fuentes | Propuesta |
|---|---|---|---|
| A1 | Profundidad de la zona batida | 15 km para vehículos (CSIS, nov 2025); 10-15 km de dominio FPV (OSW, oct 2025); 20-25 km y 30 km a final de 2026 (Brovdi, may 2026; Lasiichuk, jul 2026) | **Resuelto (D-015): FPV 12,5 km; vehículos 20 km por defecto, editable hasta 30** |
| A2 | Eficacia del FPV por radio | 20-40 % (Brovdi, 2024); 43 % (WOTR, 2025); 60-80 % de fallos (RUSI, feb 2025); 70-80 % con guiado terminal (CSIS, mar 2025) | **Resuelto (D-010): 30 %.** Tipo aparte «FPV con guiado terminal» al 75 % (D-028) |
| A3 | Alcance del FPV de fibra | 10 km (RUSI, feb 2025); 20 km en servicio (abr 2025); 40 km en pruebas (jul 2025) | **Resuelto (D-011): 10 km eficaces** |
| A4 | Tiempo de sensor a golpe | 3-5 min con C2 digital (Delta, NYT ago 2026; RUSI 2023 para la artillería rusa); 15-20 min sin integración (WOTR 2025) | **Resuelto (D-016): 4 min con enlace digital; 15 min sin él; 30 min solo por EW** |

## B. Asimetrías físicas detectadas al cruzar valores

| # | Asimetría | Por qué no cuadra | Propuesta |
|---|---|---|---|
| B1 | Bombardero pesado: 20 km de alcance con 23 min de autonomía cargado | Ida y vuelta de 40 km en 23 min exige ~105 km/h con 10 kg | **Aplazado** (prioridad baja para Balú). Propuesta: radio de acción cargado de 8-10 km |
| B2 | FPV de fibra a 20 km con ~8 min de autonomía | A ~80 km/h, 8 min dan ~10 km | **Resuelto con A3 (10 km)** |
| B3 | Detección de una persona con la térmica del Mavic 3T | Cálculo por criterio de Johnson | **Resuelto (D-012): 250 m.** Modificadores resueltos (D-029): ×3 en movimiento y ×0,3-0,5 en cruce térmico |
| B4 | Alcance del enlace del Mavic (15 km) frente a su autonomía real (25-35 min) | Si se quieren 15 min de observación sobre el objetivo, el tránsito de ida y vuelta (~15 m/s) deja un radio útil de unos 6-7 km | **Resuelto (D-017): radio de trabajo 6 km con 15 min de observación; enlace máximo 15 km** |

## F. Artillería pesada de 155 mm (añadida el 2026-10-04)

Referencia validada (D-013): obús de 52 calibres con base-bleed, **40 km**. Datos nuevos en `research/fase0/artilleria_155.json`.

| # | Tema | Lo que dicen las fuentes | Propuesta |
|---|---|---|---|
| F1 | Alcances por munición | M777 (39 cal): 24 km HE, 30 km base-bleed o RAP, 40 km Excalibur. 52 cal: 36 km HE, 40 km base-bleed, 50 km Excalibur, 54 km V-LAP | **Resuelto (D-023): HE, base-bleed, RAP y Excalibur; V-LAP fuera** |
| F2 | Excalibur bajo perturbación GNSS | Acierto del 55 % al 6 % en 2023 (informes ucranianos vía WaPo/NYT) | **Resuelto (D-024): sin guiar en zona con EW de navegación** |
| F3 | Supervivencia de la pieza | Ventana de 2-3 min para salir tras disparar; Lancet hasta 40-50 km; "una pieza que dispara 100 disparos al día no llega a la noche" (TWZ, sep 2026) | **Resuelto (D-025): moverse en 3 min; ~10 disparos por pieza y día** |
| F4 | Consumo de munición | Rusia: 27.000/día en 2025, >10.000 en 2026 (fuente débil); Ucrania: 4.000-6.000 de 155 mm/día (fuente débil) | **Resuelto (D-026): solo referencia** |
| F5 | Despliegue | Piezas a ~15 km de la línea; separación ≥ 500 m entre piezas (RUSI, feb 2025) | **Resuelto (D-027): batería dispersa, piezas que tiran por separado** |

## C. Valores de confianza baja que pesan mucho

| # | Parámetro | Valor | Propuesta |
|---|---|---|---|
| C1 | Movimiento táctico encubierto bajo drones | 1 km/h (estimación); ~5 km/día efectivos en la zona batida (RBC, ago 2026) | **Resuelto (D-018): 1 km/h; el jugador elige «rápido y visible» o «lento y oculto»** |
| C2 | Bajas esperadas en la infiltración rusa | 2 de cada 3 (declaración de prensa, nov 2025) | **Resuelto (D-019)** |
| C3 | Efecto de los señuelos | −50 % de daño con 3 señuelos por medio real (fuente indirecta) | **Resuelto (D-020): contacto falso, sin porcentaje fijo** |
| C4 | Reducción de firma con poncho antitérmico y redes | 90-96 % (fabricantes) | **Resuelto (D-021): ×0,3 quieto y ×0,7 en movimiento** |
| C5 | Duración de la supresión tras cesar el fuego | 2 min (Wikipedia) | **Resuelto (D-022): mientras dure el fuego + 1 turno corto** |

## D. Fuentes antiguas (2022-2023) que conviene actualizar

Pole-21, Silok, Kropyva, densidad de EW rusa y supresión de radios (RUSI *Meatgrinder*, 2023). Son útiles
como orden de magnitud, pero la EW ha cambiado mucho desde entonces. Propuesta: mantenerlas con confianza
media y buscar fuentes de 2025-2026 en la fase 0. **Decidido (D-030).**

## E. Lo que falta por investigar

- Autonomía y velocidad del FPV de fibra.
- Retardo de órdenes por cable, radio y mensajero.
- Moral: efecto de bajas, aislamiento y supresión.
- Fuerzas del GT (apoyos de batallón para que ataque una compañía).
- Secuencias de pasos para defensa, infiltración y reconocimiento.
