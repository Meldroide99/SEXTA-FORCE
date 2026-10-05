# Acciones por tipo de ficha (validada por Balú, D-037)

Esto es lo único que el juego permite ordenar, sea quien sea el jefe (tú, la IA del juego o Claude). Una orden fuera de esta tabla se rechaza.

## Acciones

| Acción | Qué hace |
|---|---|
| `mover_rapido` | Moverse rápido y visible (velocidad de marcha; firma alta) |
| `mover_oculto` | Moverse lento y oculto (1 km/h bajo drones; firma baja) |
| `ocultarse` | Quedarse quieto, enmascarado (poncho, red, sótano) |
| `observar` | Vigilar un sector con sus medios (vista, térmica, dron) |
| `fuego` | Hacer fuego directo o indirecto sobre un contacto |
| `suprimir` | Fuego continuo sobre una zona para fijar al enemigo |
| `asaltar` | Entrar en la posición enemiga (combate próximo) |
| `lanzar_dron` | Lanzar un dron (reconocimiento, FPV, bombardero, interceptor) |
| `emboscar_fibra` | Posar un FPV de fibra junto a una ruta y esperar |
| `perturbar` | Inhibir enlaces de drones o radios en un radio |
| `detectar` | Escuchar y localizar emisores (radiogoniometría) |
| `minar` | Sembrar minas (a mano, con dron o con UGV) |
| `desminar` | Abrir un paso en un campo de minas |
| `fortificar` | Mejorar la posición (cubierta superior, refugio) |
| `abastecer` | Llevar munición, agua, baterías o drones a otra ficha |
| `evacuar` | Recoger y llevar heridos al punto de evacuación |
| `relevar` | Sustituir a otra ficha en su posición |
| `replegar` | Retirarse a una posición a retaguardia |
| `esperar` | Mantener la tarea permanente de la ficha |

## Qué puede hacer cada ficha

| Ficha | Acciones permitidas |
|---|---|
| nodo_c2 | mover_oculto, ocultarse, observar, relevar, replegar, esperar |
| puesto_reco | mover_oculto, ocultarse, lanzar_dron, observar, replegar, esperar |
| calculo_fpv | mover_oculto, ocultarse, lanzar_dron, fuego, replegar, esperar |
| puesto_bombardero | mover_oculto, ocultarse, lanzar_dron, fuego, minar, abastecer, replegar, esperar |
| puesto_rele_fibra | mover_oculto, ocultarse, lanzar_dron, emboscar_fibra, fuego, replegar, esperar |
| celula_ew | mover_oculto, ocultarse, perturbar, detectar, replegar, esperar |
| escuadra_asalto | mover_rapido, mover_oculto, ocultarse, observar, fuego, suprimir, asaltar, fortificar, desminar, relevar, replegar, esperar |
| binomio_cc / binomio_lag / binomio_amp / pareja_precision | mover_rapido, mover_oculto, ocultarse, observar, fuego, suprimir, replegar, esperar |
| pieza_mortero | mover_rapido, ocultarse, fuego, suprimir, replegar, esperar |
| equipo_c_uas | mover_oculto, ocultarse, observar, fuego, lanzar_dron, esperar |
| porteadores | mover_rapido, mover_oculto, ocultarse, abastecer, evacuar, esperar |
| operadores_ugv | ocultarse, abastecer, evacuar, minar, desminar, esperar |
| paramedico | mover_oculto, ocultarse, evacuar, esperar |
| carro (apoyo) | mover_rapido, ocultarse, observar, fuego, suprimir, replegar, esperar |
| transporte / VCI (apoyo) | mover_rapido, ocultarse, abastecer, evacuar, replegar, esperar |
| ugv_armado (apoyo) | mover_rapido, ocultarse, observar, fuego, suprimir, esperar |
| pieza_artilleria (apoyo) | mover_rapido, ocultarse, fuego, suprimir, esperar |
| equipo_ingenieros (apoyo) | mover_oculto, ocultarse, minar, desminar, fortificar, esperar |

Esquema de la respuesta de la IA: `ai/esquemas/ordenes.schema.json`. Restricciones que el motor aplica siempre: ningún dron pasa de su enlace ni de su batería; un FPV por radio no golpea en zona perturbada; nadie dispara sin munición ni ve sin línea de vista o sensor; una unidad sin enlace no recibe órdenes nuevas; una unidad Suprimida solo puede ocultarse, esperar o replegarse; una Rota se repliega.
