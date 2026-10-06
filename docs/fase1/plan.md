# Fase 1 · Primera partida · Plan propuesto

Aprobado por Balú el 6 de octubre de 2026 (D-053). Entrega 1 hecha: ver `entrega-1-terreno.md`. Objetivo de la fase (hoja de ruta, apartado 10): jugar una operación completa desde el paso 1, con la misma semilla y las mismas órdenes dando el mismo resultado, y con toda cifra que influye visible en el panel.

La fase se hace en 5 entregas. Cada una termina con una página en claude.ai que se puede abrir y probar.

| Entrega | Qué se hace | Qué puedes probar |
|---|---|---|
| 1 · Terreno | Generador de colinas: relieve en rejilla de 10 m, curvas cada 10 m, capa de vegetación (bosque, lesosmugas, cultivos según estación), caminos, arroyo, vados, edificios y topónimos con cota. Cálculo de línea de vista | Generar mapas con distinta semilla y estación; pinchar un punto y ver lo que se ve desde él, de pie, tumbado o desde un dron |
| 2 · Fichas, órdenes y sensores | Símbolos APP-6, SGT de asalto (M3) y defensor ruso; órdenes de mover rápido o lento, ocultarse y observar; fases de órdenes, sensores y maniobra; niebla por detección; minas | Mover tus fichas por turnos y ver qué detectas y qué te detecta |
| 3 · Drones, EW, fuegos y transmisiones | FPV de radio y de fibra, bombarderos, morteros y artillería con su tiempo de sensor a golpe; perturbación, escucha y localización; plan PACE y emisión | Cadena sensor-tirador completa; perder drones en una zona perturbada; ser localizado por emitir |
| 4 · Combate, logística, moral e IA enemiga | Combate próximo, consumo y abastecimiento (UGV, dron, a pie), evacuación, cohesión y estados de moral; IA propia con perfil ruso (defensa por pasos, variante rusa) | La IA defiende, contraataca y repliega; tus fichas se desgastan |
| 5 · Partida completa | Pantalla de creación (opciones no hechas marcadas como «próximamente»), panel de parámetros, guardado, ramas desde un turno, indicadores de los 7 pasos y AAR básico calculado por el juego (sin Claude) | Una operación completa de ataque de SGT, Ucrania contra Rusia, del paso 1 al 7, y su corrección |

**Cómo se construye.** El motor se escribe aparte de la pantalla y con pruebas automáticas para cada regla, para que un cambio no rompa lo anterior. Las pruebas comprueban también que la misma semilla con las mismas órdenes da siempre el mismo resultado. Todo se guarda en el repositorio y te llega en un bundle, como hasta ahora.

**Claude** (jefe enemigo, árbitro e instructor) entra en la fase 4 del proyecto, como dice la hoja de ruta. En esta fase el enemigo es la IA propia.
