# Fase 0 · Reglas del turno

Cómo resuelve el motor cada turno, en lenguaje claro. Todas las cifras salen del juego de reglas «Ucrania 2026» v0.5.0 y se pueden cambiar en el panel de parámetros; entre paréntesis va el nombre del parámetro cuando ayuda a localizarlo. Lo marcado **[propuesta]** es nuevo y necesita tu visto bueno.

## 0. Fundamentos

**Mapa.** [propuesta] El terreno es una rejilla de 10 m (relieve y capa de vegetación y obstáculos), pero las fichas se mueven en coordenadas continuas, sin hexágonos. Las distancias, la línea de vista y los alcances se miden en metros reales.

**Tiempo.** La duración del turno depende del paso de la operación: 120 min en reconocer, aislar y degradar; 15 min en fijar y suprimir; 10 min en cerrar y destruir y en consolidar. Se puede cambiar.

**Fichas.** Cada ficha es un elemento real de la plantilla (escuadra, binomio, puesto UAS, pieza, vehículo, UGV). Lleva posición, efectivos, munición, baterías y drones, cohesión, enlace, postura (de pie, de rodillas, tumbado, enmascarada), firma y su orden actual y tarea permanente.

**Simultaneidad.** Los dos bandos dan las órdenes a la vez y en secreto. Después el motor resuelve las 8 fases en orden y aplica los resultados de cada fase antes de pasar a la siguiente.

**Azar.** Hay tiradas (detectar, impactar, fallar), pero todas salen de la semilla de la partida: misma semilla y mismas órdenes dan el mismo resultado.

**Niebla.** Cada bando solo ve sus fichas y los contactos que ha detectado, con su certeza y su antigüedad. La IA enemiga y Claude reciben exactamente lo mismo que vería su jefe.

## 1. Órdenes

1. Cada ficha recibe como máximo una orden de la lista de acciones de su tipo (D-037). Puede tener además una **tarea permanente** que repite cada turno sin que se la vuelvas a dar: vigilar una zona con un dron, mortero en espera sobre un punto de referencia, EW escuchando, FPV de fibra emboscado en una ruta.
2. **Órdenes inmediatas** (D-032): si la ficha tiene enlace, la orden se ejecuta este turno.
3. **Sin enlace:** la ficha no recibe órdenes nuevas y sigue con la última orden o su tarea permanente.
4. **Comprobación:** el motor rechaza la orden imposible antes de resolver (sin munición, dron fuera de enlace o batería, acción no permitida para esa ficha o para su estado de moral) y dice por qué. A la IA o a Claude se le devuelve una vez; si vuelve a fallar, la ficha espera.

## 2. Sensores

Para cada sensor y cada ficha enemiga dentro de su alcance:

1. **Línea de vista** (D-033): rayo sobre el relieve más la capa de vegetación, desde la altura del sensor hasta la parte visible del blanco. Un dron a 150 m de altura ve por encima de casi todo, pero bajo el dosel del bosque solo detecta la mitad de las personas con térmica. Si no hay línea de vista, no hay detección (salvo escucha electrónica, radar, sonido o fogonazo).
2. **Distancia base de detección** por sensor y tipo de blanco. Ejemplos: térmica de Mavic, persona 250 m y vehículo 680 m; ojo de día, individuos a 1.500 m y silueta a 600 m; de noche a simple vista ×0,14; radar de vigilancia, personal a 6 km.
3. **Modificadores de la distancia:** moverse ×3; poncho ×0,3 quieto y ×0,7 moviéndose; cruce térmico ×0,4; niebla (la térmica rinde 4 veces más que el ojo); disparar de noche, el fogonazo se ve a 1.750 m.
4. **Tirada:** la probabilidad de detectar en el turno es alta dentro de la distancia modificada y cae a cero fuera. [propuesta] 90 % hasta la mitad de la distancia, bajando en línea recta hasta 0 en la distancia completa.
5. **Resultado:** un contacto con posición, tipo estimado (detectado o reconocido), certeza y hora. El contacto envejece: si no se vuelve a ver, su posición se va haciendo más incierta.
6. **Señuelos:** cada señuelo genera un contacto falso hasta que un sensor más fino lo descarta (D-020).

## 3. EW

1. **Perturbación:** cada inhibidor activo crea una zona (portátil 250 m, vehicular 700 m, táctico direccional hasta 20 km, Pole-21 ruso 25 km).
   - Dentro de la zona, los FPV y drones por radio pierden el enlace: no golpean y vuelven o caen.
   - La fibra no se perturba (D-038).
   - **También afecta a los drones propios** si no hay un corredor coordinado de frecuencia y tiempo.
   - Las radios portátiles se suprimen hasta 10 km por delante de la línea rusa.
2. **Escucha y radiogoniometría:** todo lo que emite (radios, enlaces de dron, inhibidores, Starlink) puede ser localizado hasta 15 km, con un error de unos 87 m. Un emisor localizado es un contacto «solo EW» y tarda 30 min en convertirse en fuego (D-016).
3. **Coste de emitir:** un inhibidor encendido se detecta enseguida y atrae fuego (lección de la BPAC II). La autonomía de un inhibidor portátil es de 2 h.

## 4. Fuegos

1. **Tiempo de sensor a golpe** (D-016): 4 min con enlace digital, 15 min sin él, 30 min si el blanco solo se conoce por EW. En los turnos cortos esto significa que el fuego pedido llega en el turno siguiente.
2. **FPV:**
   - De radio: 30 % de eficacia, 8 min de autonomía, 12 km de alcance; no golpea en zona perturbada.
   - De fibra: 45 % de impacto, 12 km de radio, 20 min, emboscada de 12 h, la red reduce el impacto a la mitad.
   - Con guiado terminal: 75 %.
   - Cada FPV se gasta.
3. **Bombarderos:** 15 kg de carga, unos 20 km, una salida por hora y tripulación. También minan rutas (1 mina contracarro por salida) y reabastecen.
4. **Morteros y artillería:**
   - Tiran por piezas sueltas, como máximo 10 disparos por misión.
   - Error de 150 m a 24 km sin guiar; con un dron corrigiendo hacen falta unos 9 proyectiles para destruir.
   - Excalibur: 4 m de error, que pasa al de un proyectil sin guiar si hay perturbación del GNSS.
   - Tras disparar la pieza tiene 3 min para moverse; si no, queda expuesta a la contrabatería rusa, que llega a los 3 min.
5. **Tiro directo** (D-033): alcance = el menor entre el del arma y la línea de vista. Disparar a través de follaje tiene la mitad de acierto y el follaje no protege.
6. **Efecto:**
   - [propuesta] Cada impacto produce bajas según el radio letal del arma: mortero de 82 mm 35 m, de 120 mm 69 m, 155 mm 50 m.
   - El número de bajas se reduce por la protección: posición fortificada con cubierta, vehículo, sótano. La vegetación no protege.
   - Todo fuego que cae a menos del radio letal de una ficha la deja **Suprimida** ese turno, aunque no cause bajas (D-022).
7. **Fuego de reacción:** lo que se mueve o dispara bajo un dron enemigo con tirador disponible puede recibir fuego en el mismo turno.

## 5. Maniobra

1. **Velocidad:**
   - A pie: 4 km/h por carretera de día y 3,2 de noche; 2,4 km/h campo a través de día y 1,6 de noche.
   - **Movimiento encubierto bajo drones: 1 km/h** (D-018).
   - Los vehículos, según el terreno.
   - Más de un 7 % de pendiente o la vegetación densa ralentizan.
2. **Elección del jugador cada turno:** «rápido y visible» (velocidad de marcha, firma ×3) o «lento y oculto» (1 km/h, firma normal o reducida).
3. **Minas:** atravesar una zona minada sin paso abierto tiene una probabilidad de baja o de inmovilizar el vehículo. [propuesta] Las minas conocidas se ven en el mapa; las no detectadas, no.
4. **Distancias de seguridad:** nada de más de 5 junto (plantilla M3). Agrupar fichas aumenta su firma y el efecto del fuego.

## 6. Combate próximo

Solo cuando una ficha entra en una posición enemiga o a menos de [propuesta] 50 m de ella.

1. **Requisitos para asaltar:** el estado de moral tiene que ser **Firme**, y la ficha no puede llevar más del 20 % de bajas si es atacante (D-040).
2. **Resolución:** [propuesta] se comparan efectivos, granadas y munición disponibles, la sorpresa (¿el defensor estaba suprimido o ciego?), la fortificación y el estado de moral de cada uno. El resultado es la toma de la posición, el rechazo o el combate que sigue al turno siguiente.
3. **Calibración:** con la secuencia de 7 pasos bien hecha, el atacante pierde en torno a un 5 % en terreno favorable y un 10 % en desfavorable; mal coordinado, hasta un 50 % (Watling).

## 7. Logística

1. **Consumo por turno:** munición por cada fuego; baterías de dron (10 cargas al día por equipo, 75 min de recarga); drones gastados; agua (17 L por persona y día en clima árido); baterías de inhibidores.
2. **Abastecimiento:**
   - UGV: 300 kg, 22 km, de noche, se pierde de media en 7 misiones.
   - Dron: 15 kg por salida.
   - A pie: porteadores.
   - Una ficha sin munición no dispara; sin baterías, sus drones no vuelan.
3. **Evacuación:** los heridos se estabilizan en la posición (torniquete, máximo 2 h). Se evacúan por UGV o a pie hasta el puesto médico, a más de 7 km. El retraso típico es de 48 h y cada turno sin evacuarlos resta cohesión.

## 8. Mando y moral

1. **Enlace:**
   - Radio de mano 4 km, VHF portátil 10 km; Starlink y fibra no tienen límite de distancia, pero Starlink se puede perturbar en zona.
   - Una ficha sin enlace pierde cohesión y no recibe órdenes.
2. **Cohesión 0-100** (D-040):
   - Resta: bajas del turno, fuego supresor, pérdida del jefe, sin enlace, heridos sin evacuar, dron encima sin defensa, días en posición por encima de 60.
   - Suma: turno sin contacto, reabastecimiento y relevo.
3. **Estados:**

   | Estado | Fuego | Qué puede hacer |
   |---|---|---|
   | Firme | ×1 | Todo |
   | Tocado | ×0,75 | No asalta |
   | Suprimido | ×0,25 | Solo ocultarse, esperar o replegarse |
   | Roto | ×0,1 | Se repliega e ignora órdenes un turno |

4. **Rotura forzada:** el defensor se rompe al 40 % de bajas; la unidad de asalto rusa rota al 30 %.
5. **Informe del turno:** cada bando recibe lo que sabe: contactos, bajas propias, estado de sus fichas y los indicadores del paso de la operación (enemigo localizado, drones enemigos operativos y demás).

## 9. Decisiones que necesito de ti

1. **Mapa:** rejilla de 10 m para el terreno y movimiento libre de las fichas, sin hexágonos.
2. **Detección:** 90 % de probabilidad hasta la mitad de la distancia y bajando hasta 0 en la distancia completa.
3. **Efecto del fuego:** bajas según el radio letal del arma, reducidas por la protección, y supresión segura dentro del radio letal.
4. **Minas:** las no detectadas no se ven en el mapa.
5. **Combate próximo:** empieza a 50 m y se resuelve comparando efectivos, granadas, sorpresa, fortificación y moral.
