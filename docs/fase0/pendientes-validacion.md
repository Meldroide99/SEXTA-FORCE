# Fase 0 · Decisiones de validación (todas cerradas el 2026-10-05)

Cruce de la matriz de parámetros (`docs/fase0/matriz-parametros.md`): conflictos entre fuentes, asimetrías
físicas y valores de confianza baja que cambian el resultado del juego. Para cada punto hay una propuesta;
el valor queda «propuesto» hasta que lo valides.

## A. Conflictos entre fuentes

| # | Tema | Lo que dicen las fuentes | Propuesta |
|---|---|---|---|
| A1 | Profundidad de la zona batida | 15 km para vehículos (CSIS, nov 2025); 10-15 km de dominio FPV (OSW, oct 2025); 20-25 km y 30 km a final de 2026 (Brovdi, may 2026; Lasiichuk, jul 2026) | **Resuelto (D-015): FPV 12,5 km; vehículos 20 km por defecto, editable hasta 30** |
| A2 | Eficacia del FPV por radio | 20-40 % (Brovdi, 2024); 43 % (WOTR, 2025); 60-80 % de fallos (RUSI, feb 2025); 70-80 % con guiado terminal (CSIS, mar 2025) | **Resuelto (D-010): 30 %.** Tipo aparte «FPV con guiado terminal» al 75 % (D-028) |
| A3 | Alcance del FPV de fibra | 10 km (RUSI, feb 2025); 20 km en servicio (abr 2025); 40 km en pruebas (jul 2025) | **Resuelto (D-011): 10 km eficaces; actualizado a 12 km (D-035)** |
| A4 | Tiempo de sensor a golpe | 3-5 min con C2 digital (Delta, NYT ago 2026; RUSI 2023 para la artillería rusa); 15-20 min sin integración (WOTR 2025) | **Resuelto (D-016): 4 min con enlace digital; 15 min sin él; 30 min solo por EW** |

## B. Asimetrías físicas detectadas al cruzar valores

| # | Asimetría | Por qué no cuadra | Propuesta |
|---|---|---|---|
| B1 | Bombardero pesado: 20 km de alcance con 23 min de autonomía cargado | Ida y vuelta de 40 km en 23 min exige ~105 km/h con 10 kg | **Aplazado** (prioridad baja para Balú). Propuesta: radio de acción cargado de 8-10 km |
| B2 | FPV de fibra a 20 km con ~8 min de autonomía | A ~80 km/h, 8 min dan ~10 km | **Resuelto con A3 (hoy 12 km, D-035)** |
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

## E. Lo que faltaba por investigar (investigado el 2026-10-05)

| Tema | Estado |
|---|---|
| Autonomía y velocidad del FPV de fibra | Investigado: apartado G |
| Retardo de órdenes por cable, radio y mensajero | **Decidido por Balú (D-032): órdenes inmediatas** |
| Moral: bajas, aislamiento y supresión | Modelo propuesto: apartado I |
| Apoyos del GT a la compañía que ataca | Paquetes de apoyo propuestos: apartado H |
| Secuencias de defensa, infiltración y reconocimiento | Propuestas: apartado J |
| Qué órdenes puede dar la IA a cada ficha | Propuesta: apartado K |

## G. FPV de fibra óptica (fuentes 2025-2026) — **validado (D-035, D-038)**

| # | Tema | Lo que dicen las fuentes | Propuesta |
|---|---|---|---|
| G1 | Radio eficaz | Tu valor validado es 10 km (D-011). En 2026 las fuentes dan 15-25 km como típico (Ukrainska Pravda, ene 2026) y bobinas de 40-50 km en nicho (TWZ, oct 2025) | **Resuelto (D-035): 12 km eficaces** (rango editable 10-40) |
| G2 | Autonomía con carga | 8-12 min el KVN ruso con 2-4 kg; 16-21 min los ucranianos de 10 pulgadas; 35 min con bobina de 50 km | **20 min** (rango 8-35) |
| G3 | Velocidad | Crucero 50-85 km/h; ataque 80-110 km/h (fabricantes) | **65 km/h** de crucero y **90 km/h** en ataque; una misión de 10 km tarda unos 9 min |
| G4 | Emboscada posado junto a la ruta | De horas a más de un día (Oboronka, nov 2025); hasta 48 h según un fabricante | **12 h** por defecto, máximo 24 h |
| G5 | Probabilidad de impacto | 40-50 % con buenas tripulaciones (Defense News, nov 2025; TWZ) | **45 %**, sin efecto de la EW; frente al 30 % del FPV por radio |
| G6 | Cuántos FPV son de fibra | Ucrania 10-15 % en todo el frente (ene 2026); 70 % en la Guardia Nacional (sep 2026); Rusia por delante | Ucrania **15 %**, Rusia **30 %** (estimación), editable por escenario |
| G7 | Contramedidas | 1.170 km de carreteras con redes en mayo de 2026; barreras cortacables sin datos de combate | Red o barrera **reduce** la probabilidad de impacto a la mitad (estimación), no la anula |

Lo que no publica nadie: cuántas misiones fallan por cable enganchado o roto. Va metido en el 45 % de G5.

## H. Paquete de apoyos tipo — **validado (D-039)**

Ninguna fuente publica plantillas de apoyo por compañía (RUSI omite a propósito esas cifras). Las cantidades son estimaciones; las distancias, tiempos y cargas tienen fuente. Detalle en `templates/apoyos/`.

**Ataque de compañía** (2 grupos de asalto de 20 en escuadras de 5 o menos; 5-10 días):

| Apoyo | Cantidad propuesta | Quién lo controla | Pasos | Cómo se emplea (con fuente) |
|---|---|---|---|---|
| Drones de reconocimiento | 2-3 en el aire continuamente | Célula UAS + batallón | 1, 2, 7 | Vigilan hasta 15 km |
| FPV de radio y fibra | 30-60 salidas al día | Compañía UAS de brigada o USF | 3, 5, 6 | Más de 15 por blindado y más de 30 por carro (Kofman, abr 2026) |
| Bombarderos pesados | 2-4, de noche | Batallón UAS | 2, 3, 7 | 20-30 kg, unos 20 km; desmontan lindes antes del asalto |
| Artillería de 155 | 2-4 piezas sueltas | Brigada | 3, 4, 5 | Máx. 10 disparos por misión; 8-10 para destruir un blanco blando (RUSI) |
| Morteros | 4 tubos | Jefe de compañía | 4, 5 | Por piezas sueltas |
| Carros | 1-2 | Compañía de carros de brigada | 5, 6 | Fuego directo hasta donde dé la línea de vista (apartado L): apoyo a unos 2 km y carro contra carro a 1 km o menos (RUSI); salen desde escondites a menos de 3 km; aguantan 10-15 FPV |
| Transportes o VCI | 2-4 | Batallón | 6 | Dejan a la tropa y se retiran |
| UGV logísticos y de evacuación | 6-10 | Pelotón UGV de brigada | 7 | A 2-5 km, de noche, 300 kg (RUSI; TerMIT) |
| UGV armado | 1-2 | Batallón | 4, 6 | Unos 300 m de alcance eficaz |
| EW | 1 inhibidor por escuadra + 1 vehicular | Célula EW | 1-6 | No sirve contra fibra; pasillos para los drones propios |
| Antidrón | Interceptores + torreta o escopetas | Equipo antiaéreo | 5-7 | Torreta hasta 1 km |
| Ingenieros | 1 equipo de 3-4 + UGV de desminado | Batallón | 2, 6, 7 | UGV guiado a 0,5-3 km |
| Evacuación | Por UGV y de noche | Grupo de abastecimiento | 7 | Puesto médico a más de 7 km |

**Ataque de sección** (grupo de 20 sobre 1-2 posiciones): 1-2 drones de reconocimiento, 10-20 FPV al día, 1 bombardero, 2 morteros, 1 pieza a demanda, 0-1 carro en fuego directo desde un escondite, 2-3 UGV logísticos y 0-1 armado, 1 inhibidor por escuadra, 1 zapador y 1 UGV de evacuación reservado.

Referencias de escala: los drones hacen el 70-95 % de los golpes (TWZ, sep 2026); 25.143 misiones de UGV en agosto de 2026 (MoD); los asaltos mecanizados rusos pierden en torno al 87 % de los blindados (ISW, dic 2025).

## I. Modelo de moral — **validado (D-040)**

Cada unidad tiene una **cohesión de 0 a 100** que se recalcula en la fase de mando y moral. Inicial: veterana 80, regular 65, bisoña 50.

| Estado | Cuándo | Fuego | Movimiento y órdenes |
|---|---|---|---|
| **Firme** | Cohesión 60 o más | ×1 | Todo |
| **Tocado** | 40-59, o 10 % de bajas en un turno, o pérdida del jefe | ×0,75 | No puede asaltar. Atacante con 20 % de bajas acumuladas: solo defiende o se repliega |
| **Suprimido** | 20-39, o fuego supresor ese turno (se le pasa al siguiente) | ×0,25 | Solo ocultarse, esperar o replegarse |
| **Roto** | Menos de 20, o defensor con 40 % de bajas acumuladas | ×0,1 | Se repliega e ignora órdenes 1 turno. Rodeado: se rinde (urbano 35 %, abierto 8 %; ruso de asalto casi nunca) |

| Resta cohesión | Puntos |
|---|---|
| Cada 1 % de bajas en el turno | −2 |
| Recibir fuego supresor | −10 |
| Perder al jefe | −15 (una vez) |
| Turno sin enlace / heridos sin evacuar más de 24 h / dron encima sin defensa antidrón | −5 / −5 / −3 |
| Cada día en posición por encima de 60 | −1 |

| Suma cohesión | Puntos |
|---|---|
| Turno sin contacto y con enlace | +5 |
| Reabastecida y heridos evacuados | +10 |
| Relevo | Vuelve a la inicial menos 10 por cada 10 % de bajas |

Umbrales con fuente: 40 % defensor y 20 % atacante (FM 105-5 vía Dupuy Institute), rotación rusa al 30 % (RUSI, feb 2025), por debajo del 50 % solo defiende y del 30 % sale del combate (C-WAM, US Army), 60 días de permanencia (orden de Syrskyi, abr 2026). Los puntos y los factores de fuego son estimación: no hay estudio público que diga cuánto reduce la supresión el fuego.

## J. Secuencias por tipo de operación — **validado (D-041)**

| Operación | Pasos |
|---|---|
| **Defensa** (modelo ucraniano) | 1 Vigilar en profundidad · 2 Desgastar en la aproximación · 3 Obstaculizar · 4 Contener en posiciones · 5 Aislar la penetración · 6 Contraatacar · 7 Limpiar y reconstituir |
| **Defensa** (variante rusa) | 1 Fortificar y minar · 2 Vigilar y tirar · 3 Interdicción de rutas con fibra · 4 Bombardeo de zona · 5 Contraataque inmediato · 6 Contraofensiva |
| **Infiltración** (modelo ruso) | 1 Buscar huecos · 2 Filtrarse en grupos de 1-3 · 3 Ocultarse y acumular · 4 Golpear la retaguardia · 5 Asaltar desde dentro · 6 Consolidar o quedar aislados |
| **Reconocimiento** | 1 Planificar sensores · 2 Aire primero · 3 Espectro · 4 Confirmación terrestre · 5 Fusionar · 6 Entregar el objetivo (3-5 min) · 7 Valorar el daño · 8 Exfiltrar |

Detalle, duraciones y fuentes en `templates/misiones/`.

## K. Órdenes de la IA enemiga — **resuelto (D-037): lista aceptada sin cambios**

No tienes que dar nada técnico. Lo único que necesito es que revises **qué acciones puede hacer cada ficha** (`ai/acciones-por-ficha.md`): el juego solo acepta órdenes de esa lista, y sirve igual para ti, para la IA del juego y para Claude. Hay 19 acciones (moverse rápido o oculto, ocultarse, observar, fuego, suprimir, asaltar, lanzar dron, emboscar con fibra, perturbar, detectar, minar, desminar, fortificar, abastecer, evacuar, relevar, replegarse y esperar) repartidas en 18 tipos de ficha. Dime si quitas o añades alguna.

## L. Tiro directo, terreno y vegetación (corrección de Balú, 2026-10-05) — **validado (D-036)**

**Decisión de Balú (D-033):** el alcance del tiro directo depende sobre todo del terreno, y los árboles y la vegetación también lo limitan. **D-034:** los 9 km de «carro como artillería» quedan rechazados.

**Regla propuesta.** Alcance de tiro = el menor entre el alcance eficaz del arma y la distancia hasta donde llega la línea de vista. La línea de vista se calcula con un rayo sobre el mapa de curvas de nivel, entre el ojo del tirador y el punto más alto visible del blanco, comprobando cada 20 m el relieve más la altura de lo que haya encima (bosque, lesosmuga, cultivo, edificio).

| Elemento | Efecto en la línea de vista | Fuente |
|---|---|---|
| Relieve | Lo calcula el mapa: crestas, vaguadas y contrapendientes | — |
| Bosque caducifolio con hoja (mayo-octubre) | Se ve 30 m dentro (23-38) | Natick Labs, 1967 |
| Bosque caducifolio sin hoja (noviembre-abril) | Se ve 65 m dentro (56-76) | Natick Labs, 1967 |
| Conífera densa / abierta | 25 m / 100 m todo el año | Natick Labs, 1964 |
| Linde del bosque | Quien está a 10 m o menos del borde ve y tira hacia fuera | Estimación |
| Lesosmuga (11 m de ancho, 15 m de alto, cada 700 m) | Con hoja corta siempre; sin hoja deja ver si mide 15 m o menos, con la detección a la mitad | IUAF; Kovalenko 2021; altura estimada |
| Maíz y girasol (2 m, julio-septiembre) | Tapan a la infantería en cualquier postura; un carro ve por encima, pero de otro carro solo ve la torre | FAO-56 |
| Trigo (1 m, mayo-julio) | Tapa al tumbado y al de rodillas | FAO-56 |
| Zona urbana | Edificios opacos; a pie, 100 m como máximo; el 90 % de los blancos a 50 m o menos | FM 3-06.11 |
| Disparar a través de follaje | Oculta pero no protege: fuego de zona con impacto ×0,5 sobre un blanco ya detectado | FM 90-5; factor estimado |

Alturas del ojo: visor de carro 2,2 m, VCI 2,0 m; a pie, de pie 1,6, de rodillas 1,0, tumbado 0,4. Blanco carro 2,2 m; en desenfilada de casco solo 1,0 m.

**Alcance del arma (techo, no lo normal):** 125 mm 2.500 m de día y 1.000 m de noche sin térmica; 120 mm 3.000 m; 30 mm del BMP-2 1.500 m contra blindaje ligero; misiles contracarro hasta 5.000 m, pero solo si la línea de vista dura todo el vuelo.

**Comprobación del motor:** con puntos al azar, la probabilidad de línea de vista en llanura con setos debe salir en torno a 0,18 y el tramo visible medio en unos 180 m; en terreno ondulado y boscoso, 0,39 y unos 370 m (estudios TETAM de AMSAA). En Ucrania los carros apoyan a unos 2 km y combaten entre sí a 1 km o menos (RUSI). Si el motor da a menudo combates a más de 2,5 km, la capa de vegetación está mal.

**Tiro indirecto de carro:** desactivado por defecto. Si un escenario lo activa: dron propio sobre el blanco, carro parado y oculto, 4 km por defecto (máximo 8), error del primer disparo de 50-100 m, 2-4 disparos de corrección, efecto de supresión como un mortero de 120 y desgaste del tubo (unos 1.000 disparos de vida).

**Consecuencia para el generador de terreno:** cada mapa necesita, además de las curvas de nivel, una capa de vegetación y obstáculos (bosque por tipo, lesosmugas, cultivos según la estación, poblaciones) y la estación del año entre los desplegables de la pantalla de creación.
