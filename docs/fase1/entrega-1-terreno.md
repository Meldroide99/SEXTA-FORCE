# Fase 1 · Entrega 1 · Terreno y línea de vista

Entregada el 6 de octubre de 2026. Página de prueba: «Terreno SEXTA-FORCE» en claude.ai (https://claude.ai/artifact/SGi5xG9mHmsqXa7JggZaqP).

## Qué hace

- **Genera un mapa de colinas de 4 × 4 km** con una semilla: misma semilla, mismo mapa.
  - Relieve en rejilla de 10 m y curvas cada 10 m, con maestras cada 50 m (D-043).
  - El relieve sale de la **red de drenaje**: primero se trazan los cauces desde el borde del mapa hacia arriba, ramificándose; después se excavan las balkas según lo que drena cada una. Así las vaguadas y los espolones son coherentes y el agua siempre baja.
  - Vegetación: bosque en las laderas de las balkas y en manchas de la meseta, pinares de repoblación, campos de trigo, girasol o maíz, colza o remolacha, y pasto.
  - Lesosmugas de 11 m de ancho, separadas unos 700-950 m, con huecos de 20-40 m.
  - Uno o dos pueblos alargados junto a un arroyo, con casas, huertos y arbolado.
  - Carretera por el trazado de menor coste (evita pendientes, bosque, agua y fondos de balka), caminos de tierra junto a las lesosmugas y desde los pueblos, puentes y vados.
  - Topónimos: cotas destacadas, pueblos y balkas.
- **Calcula la línea de vista** con la regla validada (D-033 y D-036):
  - Relieve cada 20 m y curvatura terrestre a partir de 3 km.
  - Vegetación y edificios **celda a celda** (10 m), para no saltarse una lesosmuga de 11 m.
  - Bosque: visibilidad interior de 30 m con hoja, 65 m sin hoja y 25 m en pinar. Desde el linde (10 m dentro) se ve hacia fuera.
  - Lesosmuga: con hoja corta siempre; sin hoja deja pasar la vista si el tramo dentro es de 15 m o menos, con la detección a la mitad.
  - Cultivos: tapan lo que queda por debajo de su altura en esa estación.
  - Edificios: opacos.
  - Dron: ve por encima de casi todo; un blanco dentro del bosque queda «bajo el dosel» (la térmica detecta la mitad).
  - Tirar a través de follaje que no corta la vista: mitad de acierto, sin protección.
- **Página de prueba:** semilla, estación, altura del observador (de pie, de rodillas, tumbado, visor de VCI, visor de carro, dron a 150 m) y del blanco. Dos modos:
  - **Zona vista:** todo lo que ve un observador, con anillos de 500 m, 1 km y 2 km y el porcentaje visible.
  - **Entre dos puntos:** si se ven, qué lo corta y a qué distancia, y el perfil del terreno con la vegetación y el rayo.
  - Panel con los parámetros que deciden el resultado y los valores del generador.

## Pruebas automáticas

`npm test` ejecuta 25 pruebas:
- Línea de vista: llano, loma, curvatura, bosque con y sin hoja, pinar, linde, lesosmuga perpendicular y oblicua, trigo y girasol, edificio, dron sobre bosque y sobre lesosmuga, simetría y zona vista.
- Generador: misma semilla y mismo mapa, tamaño, desnivel, que en 5 semillas haya de todo, que los arroyos bajen y que las lesosmugas no tengan huecos diagonales por los que se cuele la vista.

## Pendiente de tu visto bueno

Valores nuevos de esta entrega (estado «propuesto» en el juego de reglas v0.8.0):

| Parámetro | Valor | Por qué |
|---|---|---|
| `terreno.edificio.altura_m` | 6 m | Casa rural de una planta con tejado |
| `terreno.cultivo.trigo_primavera_m` | 0,5 m | El trigo llega a 1 m de mayo a julio; en otoño e invierno no tapa |
| `terreno.cultivo.bajo_m` | 0,6 m | Colza 0,6 m y remolacha 0,5 m (FAO), en primavera y verano |
| `terreno.cultivo.alto_otono_m` | 2 m | Girasol y maíz sin cosechar en septiembre-octubre; 0 si se quiere cosechado |
| `terreno.vegetacion.hoja_primavera` y `hoja_otono` | sí | Sin hoja solo en invierno |

`terreno.vegetacion.lesosmuga_paso_sin_hoja_m` (15 m) ya estaba en la regla validada (D-036) y se ha sacado como parámetro.

Valores de forma del mapa (no son reglas de combate, están en `generator/terreno/config-colinas.ts`): mapa de 4 × 4 km, desnivel de unos 55 m entre lomas, balkas de hasta 24 m de profundidad y 230 m de ancho, cultivos al 35 % trigo, 35 % girasol o maíz, 12 % colza o remolacha y 18 % pasto, 1 o 2 pueblos.

## Observación

En verano, un hombre de pie dentro de un campo de girasol o maíz (2 m) no se ve desde el suelo, y las lesosmugas con hoja cortan la vista. Por eso, desde una loma, un observador de pie ve poco del mapa en verano: en la semilla 1, alrededor del 4 % del mapa entero, frente a más del 70 % desde un dron a 150 m. Es consecuencia directa de las reglas aprobadas y del reparto de cultivos. Si te parece excesivo, lo que se toca es el reparto de cultivos del generador, no la regla.
