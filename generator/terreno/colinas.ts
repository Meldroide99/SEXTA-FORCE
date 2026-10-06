// Generador de terreno de colinas (fase 1, entrega 1).
//
// Orden de construcción:
// 1. Relieve de lomas (ruido fractal con el dominio deformado y una caída regional).
// 2. Red de drenaje: relleno de hoyas, dirección de flujo y área drenada.
// 3. Balkas: se excavan las vaguadas según el área que drenan y se vuelve a calcular el drenaje,
//    así los arroyos bajan por el fondo de las balkas y los espolones quedan entre ellas.
// 4. Vegetación: bosque en las laderas de las balkas y manchas en la meseta, pinares de repoblación.
// 5. Pueblos alargados junto a los arroyos, con casas, huertos y arbolado.
// 6. Campos en parcelas orientadas, con lesosmugas (y sus huecos) y caminos de tierra.
// 7. Carretera y caminos por el trazado de menor coste; puentes y vados donde cruzan agua.
// 8. Topónimos: cotas, pueblos y balkas.

import { crearAzar, hashTexto, type Azar } from "../../engine/azar";
import type { Parametros } from "../../engine/parametros";
import { Veg, type Elemento, type Punto, type Terreno, type Toponimo } from "../../engine/terreno/tipos";
import { crearRuido, fbm } from "../ruido";
import { aEstrella, celdasDeLinea, longitud, simplificar, suavizar } from "./caminos";
import { CONFIG_COLINAS, type ConfigColinas } from "./config-colinas";
import { arbolDrenaje, areaArbol, distanciaA, pendientePct } from "./hidrologia";

const NOMBRES_PUEBLO = ["Zelenyi Hai", "Stepove", "Vyshneve", "Kamianka", "Lozove", "Berezove", "Tykhe", "Pishchane", "Dibrova", "Krynychne"];
const NOMBRES_BALKA = ["Balka Hlyboka", "Balka Suha", "Balka Kruta", "Balka Dovha", "Balka Kamiana", "Balka Lysa", "Balka Ternova", "Balka Ozerna"];

const sub = (semilla: number, etapa: string): Azar => crearAzar(hashTexto(`${semilla}:${etapa}`));
const limitar = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function generarColinas(semilla: number, P: Parametros, cfg: ConfigColinas = CONFIG_COLINAS): Terreno {
  const g = P.v("terreno.rejilla_m");
  const nx = Math.round(cfg.ancho_m / g);
  const ny = Math.round(cfg.alto_m / g);
  const n = nx * ny;
  const celdaKm2 = (g * g) / 1e6;
  const X = (k: number) => ((k % nx) + 0.5) * g;
  const Y = (k: number) => (Math.floor(k / nx) + 0.5) * g;

  // 1. Relieve de lomas
  const azR = sub(semilla, "relieve");
  const rLomas = crearRuido(azR);
  const rW1 = crearRuido(azR);
  const rW2 = crearRuido(azR);
  const rDet = crearRuido(azR);
  const ang = azR.rango(0, Math.PI * 2);
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const h0 = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const x = X(k);
    const y = Y(k);
    const wx = x + 380 * rW1(x / 1900, y / 1900);
    const wy = y + 380 * rW2(x / 1900 + 5.2, y / 1900 + 1.3);
    const lomas = fbm(rLomas, wx / cfg.onda_lomas_m, wy / cfg.onda_lomas_m, 4, 0.45);
    const caida = cfg.inclinacion_regional_m * ((x * ca + y * sa) / Math.max(cfg.ancho_m, cfg.alto_m));
    h0[k] = cfg.cota_base_m + cfg.amplitud_relieve_m * lomas + caida + 1.5 * rDet(x / 140, y / 140);
  }

  // 2. Árbol de drenaje: inundación ordenada desde las salidas más bajas del borde, con un ruido fino
  //    que hace que los cauces se ramifiquen y serpenteen.
  const rCauce = crearRuido(azR);
  const prioridad = new Float32Array(n);
  for (let k = 0; k < n; k++) prioridad[k] = h0[k] + 9 * fbm(rCauce, X(k) / 420, Y(k) / 420, 3);
  const bordes: number[] = [];
  for (let k = 0; k < n; k++) {
    const i = k % nx, j = Math.floor(k / nx);
    if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) bordes.push(prioridad[k]);
  }
  bordes.sort((a, b) => a - b);
  const corteSalida = bordes[Math.floor(bordes.length * 0.3)];
  const { padre, orden, paso: pasoArbol } = arbolDrenaje(prioridad, nx, ny, (k) => prioridad[k] <= corteSalida);
  const acc = areaArbol(padre, orden);

  // 3. Balkas excavadas a lo largo de los cauces según el área que drenan
  const esVaguada = new Uint8Array(n);
  const esArroyo = new Uint8Array(n);
  for (let k = 0; k < n; k++) {
    const A = acc[k] * celdaKm2;
    if (A >= cfg.cuenca_vaguada_km2) esVaguada[k] = 1;
    if (A >= cfg.cuenca_arroyo_km2) esArroyo[k] = 1;
  }
  const { dist: d0, origen: o0 } = distanciaA(esVaguada, nx, ny, g);
  const z = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    let excava = 0;
    const o = o0[k];
    if (o >= 0) {
      const A = acc[o] * celdaKm2;
      const s = limitar(Math.sqrt(A / cfg.cuenca_balka_plena_km2), 0.2, 1);
      const prof = cfg.profundidad_balka_m * s;
      const semiancho = (cfg.anchura_balka_m * Math.max(0.3, s)) / 2;
      const u = d0[k] / semiancho;
      const perfilBalka = u < 0.12 ? 1 : u < 1 ? Math.pow(1 - (u - 0.12) / 0.88, 1.5) : 0;
      excava = prof * perfilBalka;
    }
    z[k] = h0[k] - excava;
  }
  suavizarRelieve(z, nx, ny);
  suavizarRelieve(z, nx, ny);
  // El agua tiene que bajar siempre por el árbol: cada celda queda al menos un poco por encima de su padre.
  for (let q = 0; q < n; q++) {
    const k = orden[q];
    const p = padre[k];
    if (p >= 0 && z[k] < z[p] + 0.004 * pasoArbol[k] * g) z[k] = z[p] + 0.004 * pasoArbol[k] * g;
  }
  const zf = z;
  const pend = pendientePct(zf, nx, ny, g);
  const { dist: dv, origen: ov } = distanciaA(esVaguada, nx, ny, g);

  // 4. Vegetación natural
  const veg = new Uint8Array(n).fill(Veg.Abierto);
  const azV = sub(semilla, "vegetacion");
  const rBosque = crearRuido(azV);
  const rManchas = crearRuido(azV);
  const rPinar = crearRuido(azV);
  const umbralBalka = cuantilNormal(1 - cfg.bosque_cobertura_balka) * 0.28;
  const umbralManchas = cuantilNormal(1 - cfg.bosque_manchas_meseta) * 0.28;
  for (let k = 0; k < n; k++) {
    const x = X(k);
    const y = Y(k);
    const o = ov[k];
    let bosque = false;
    if (o >= 0) {
      const A = acc[o] * celdaKm2;
      if (A >= cfg.bosque_cuenca_min_km2) {
        const s = limitar(Math.sqrt(A / cfg.cuenca_balka_plena_km2), 0.3, 1);
        const semiancho = (cfg.anchura_balka_m * s) / 2;
        if (dv[k] < semiancho * 1.1 && (pend[k] > cfg.bosque_pendiente_pct || dv[k] < 25)) {
          bosque = fbm(rBosque, x / 280, y / 280, 3) > umbralBalka;
        }
      }
    }
    if (!bosque && pend[k] < 15 && fbm(rManchas, x / 650, y / 650, 3) > umbralManchas) bosque = true;
    if (bosque) veg[k] = fbm(rPinar, x / 900, y / 900, 2) > cuantilNormal(1 - cfg.pinar_fraccion) * 0.3 ? Veg.BosqueConifera : Veg.BosqueHoja;
  }
  for (let k = 0; k < n; k++) if (esArroyo[k]) veg[k] = Veg.Agua;

  const elementos: Elemento[] = [];
  const toponimos: Toponimo[] = [];

  // Cauces con agua, como polilíneas (de cabecera a desembocadura o confluencia)
  const cauces = trazarCauces(esArroyo, padre, nx, ny, g);
  for (const c of cauces) elementos.push({ tipo: "arroyo", geometria: c });

  // 5. Pueblos
  const azP = sub(semilla, "pueblos");
  const zonaPueblo = new Uint8Array(n);
  const centros: Punto[] = [];
  const nombres = barajar(NOMBRES_PUEBLO, azP);
  const numPueblos = azP.entero(cfg.pueblos[0], cfg.pueblos[1]);
  const caucesOrden = cauces
    .map((c, idx) => ({ c, idx, L: longitud(c) }))
    .filter((c) => c.L >= cfg.pueblo_largo_m[0] + 400)
    .sort((a, b) => b.L - a.L || a.idx - b.idx);
  const rHuerto = crearRuido(azP);
  for (let p = 0; p < numPueblos && p < caucesOrden.length; p++) {
    const cauce = caucesOrden[p].c;
    const largo = azP.rango(cfg.pueblo_largo_m[0], cfg.pueblo_largo_m[1]);
    const tramo = tramoInterior(cauce, largo, 400, cfg, azP);
    if (!tramo) continue;
    // la calle va paralela al arroyo, por la orilla menos empinada
    const lado = mediaPendienteLado(tramo, 70, pend, nx, ny, g) <= mediaPendienteLado(tramo, -70, pend, nx, ny, g) ? 1 : -1;
    const calle = suavizar(simplificar(desplazar(tramo, 70 * lado), 4), 2);
    const celdasCalle = new Uint8Array(n);
    for (const k of celdasDeLinea(calle, nx, ny, g)) celdasCalle[k] = 1;
    const { dist: dc } = distanciaA(celdasCalle, nx, ny, g);
    for (let k = 0; k < n; k++) {
      if (dc[k] < 75 && veg[k] !== Veg.Agua) {
        zonaPueblo[k] = 1;
        veg[k] = dc[k] > 28 && fbm(rHuerto, X(k) / 60, Y(k) / 60, 2) > 0.12 ? Veg.BosqueHoja : Veg.Abierto;
      }
    }
    // casas a los dos lados de la calle
    for (const casa of casasALoLargo(calle, cfg.casas_separacion_m, azP)) {
      for (const k of celdasDeLinea(casa, nx, ny, g)) if (veg[k] !== Veg.Agua) veg[k] = Veg.Edificio;
    }
    elementos.push({ tipo: "camino", nombre: `Calle de ${nombres[p]}`, geometria: calle });
    const medio = calle[Math.floor(calle.length / 2)];
    centros.push(medio);
    toponimos.push({ nombre: nombres[p], posicion: medio, cota_m: Math.round(zf[celdaDe(medio, nx, ny, g)]), clase: "pueblo" });
  }

  // 6. Campos, lesosmugas y caminos de tierra
  const azC = sub(semilla, "campos");
  const S = P.v("terreno.vegetacion.lesosmuga_separacion_m");
  const theta = azC.rango(0, Math.PI);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const U = (x: number, y: number) => x * ct + y * st;
  const V = (x: number, y: number) => -x * st + y * ct;
  const esquinas = [[0, 0], [cfg.ancho_m, 0], [0, cfg.alto_m], [cfg.ancho_m, cfg.alto_m]];
  const umin = Math.min(...esquinas.map(([x, y]) => U(x, y)));
  const umax = Math.max(...esquinas.map(([x, y]) => U(x, y)));
  const vmin = Math.min(...esquinas.map(([x, y]) => V(x, y)));
  const vmax = Math.max(...esquinas.map(([x, y]) => V(x, y)));
  const lineasU: number[] = [];
  for (let u = umin + azC.rango(0, S); u < umax; u += S * azC.rango(0.9, 1.35)) lineasU.push(u);
  const franjas: { v: number[]; cultivo: string[] }[] = [];
  for (let q = 0; q <= lineasU.length; q++) {
    const v: number[] = [];
    const cultivo: string[] = [];
    for (let w = vmin - azC.rango(0, cfg.parcela_largo_m[1]); w < vmax; w += azC.rango(cfg.parcela_largo_m[0], cfg.parcela_largo_m[1])) {
      v.push(w);
      cultivo.push(azC.ponderado(cfg.cultivos.map(([c, p]) => [c, p] as const)));
    }
    franjas.push({ v, cultivo });
  }
  const claseCultivo: Record<string, number> = { trigo: Veg.Trigo, cultivo_alto: Veg.CultivoAlto, cultivo_bajo: Veg.CultivoBajo, abierto: Veg.Abierto };
  const apto = (k: number) =>
    veg[k] === Veg.Abierto && !zonaPueblo[k] && pend[k] < 16 && dv[k] > 35;
  for (let k = 0; k < n; k++) {
    if (!apto(k)) continue;
    const x = X(k), y = Y(k);
    const q = buscar(lineasU, U(x, y));
    const fr = franjas[q];
    const m = Math.max(0, buscar(fr.v, V(x, y)) - 1);
    veg[k] = claseCultivo[fr.cultivo[Math.min(m, fr.cultivo.length - 1)]];
  }
  const esCampo = (k: number) =>
    (veg[k] === Veg.Trigo || veg[k] === Veg.CultivoAlto || veg[k] === Veg.CultivoBajo || veg[k] === Veg.Abierto) &&
    !zonaPueblo[k] && pend[k] < 16 && dv[k] > 35;
  const ponerLesosmuga = (a: Punto, b: Punto, conCamino: boolean) => {
    const tramos = tramosAptos(a, b, 10, (p) => {
      if (!dentroMapa(p, cfg)) return false;
      return esCampo(celdaDe(p, nx, ny, g));
    }, 150);
    for (const t of tramos) {
      for (const pieza of conHuecos(t, cfg.lesosmuga_hueco_prob, azC)) {
        elementos.push({ tipo: "lesosmuga", geometria: pieza });
        for (const k of celdasDeLinea(pieza, nx, ny, g)) if (veg[k] !== Veg.Agua && veg[k] !== Veg.Edificio) veg[k] = Veg.Lesosmuga;
      }
      if (conCamino) {
        const nxv = ct; // normal a la lesosmuga: dirección u
        const nyv = st;
        const camino = t.map((p) => ({ x: p.x + 9 * nxv, y: p.y + 9 * nyv }));
        elementos.push({ tipo: "camino", geometria: simplificar(camino, 2) });
      }
    }
  };
  const aXY = (u: number, v: number): Punto => ({ x: u * ct - v * st, y: u * st + v * ct });
  for (const u of lineasU) ponerLesosmuga(aXY(u, vmin), aXY(u, vmax), azC.siguiente() < 0.55);
  for (let q = 0; q < franjas.length; q++) {
    const u0 = q === 0 ? umin : lineasU[q - 1];
    const u1 = q < lineasU.length ? lineasU[q] : umax;
    for (const v of franjas[q].v) {
      if (azC.siguiente() < cfg.lesosmuga_transversal) ponerLesosmuga(aXY(u0, v), aXY(u1, v), false);
    }
  }

  // 7. Carretera y caminos de enlace
  const azN = sub(semilla, "vias");
  const paso = 2 * g; // rejilla gruesa de 20 m
  const ncx = Math.floor(nx / 2);
  const ncy = Math.floor(ny / 2);
  const costeVia = (kc: number) => {
    const i = (kc % ncx) * 2;
    const j = Math.floor(kc / ncx) * 2;
    const k = j * nx + i;
    let c = 1 + Math.pow(pend[k] / 4, 2);
    const v = veg[k];
    if (v === Veg.BosqueHoja || v === Veg.BosqueConifera) c += 6;
    if (v === Veg.Agua) c += 40;
    if (v === Veg.Edificio) c += 80;
    if (v === Veg.Lesosmuga) c += 3;
    if (dv[k] < 60 && !zonaPueblo[k]) c += 3; // las carreteras evitan el fondo de las balkas
    return c;
  };
  const kc = (p: Punto) => {
    const i = limitar(Math.floor(p.x / paso), 0, ncx - 1);
    const j = limitar(Math.floor(p.y / paso), 0, ncy - 1);
    return j * ncx + i;
  };
  const pc = (k: number): Punto => ({ x: ((k % ncx) + 0.5) * paso, y: (Math.floor(k / ncx) + 0.5) * paso });
  const esteOeste = azN.siguiente() < 0.5;
  const borde = (lado: 0 | 1): Punto =>
    esteOeste
      ? { x: lado ? cfg.ancho_m - 1 : 1, y: azN.rango(0.25, 0.75) * cfg.alto_m }
      : { x: azN.rango(0.25, 0.75) * cfg.ancho_m, y: lado ? cfg.alto_m - 1 : 1 };
  const paradas = [borde(0), ...[...centros].sort((a, b) => (esteOeste ? a.x - b.x : a.y - b.y)), borde(1)];
  const carretera: Punto[] = [];
  for (let q = 0; q < paradas.length - 1; q++) {
    const ruta = aEstrella(ncx, ncy, paso, costeVia, kc(paradas[q]), kc(paradas[q + 1])).map(pc);
    carretera.push(...(q ? ruta.slice(1) : ruta));
  }
  const viaPrincipal = suavizar(simplificar(carretera, 6), 2);
  elementos.push({ tipo: "carretera", nombre: "Carretera regional", geometria: viaPrincipal });
  for (const c of centros) {
    const destino: Punto = esteOeste
      ? { x: limitar(c.x + azN.rango(-600, 600), 1, cfg.ancho_m - 1), y: c.y > cfg.alto_m / 2 ? cfg.alto_m - 1 : 1 }
      : { x: c.x > cfg.ancho_m / 2 ? cfg.ancho_m - 1 : 1, y: limitar(c.y + azN.rango(-600, 600), 1, cfg.alto_m - 1) };
    const ruta = aEstrella(ncx, ncy, paso, costeVia, kc(c), kc(destino)).map(pc);
    elementos.push({ tipo: "camino", geometria: suavizar(simplificar(ruta, 6), 2) });
  }

  // Puentes y vados donde las vías cruzan agua
  const cruces: Elemento[] = [];
  for (const e of elementos) {
    if (e.tipo !== "carretera" && e.tipo !== "camino") continue;
    for (const p of crucesDeAgua(e.geometria, veg, nx, ny, g)) {
      cruces.push({ tipo: e.tipo === "carretera" ? "puente" : "vado", geometria: [p] });
    }
  }
  elementos.push(...cruces);

  // 8. Topónimos: cotas y balkas
  toponimos.push(...cotasDestacadas(zf, nx, ny, g));
  const nombresBalka = barajar(NOMBRES_BALKA, sub(semilla, "toponimos"));
  cauces
    .map((c, idx) => ({ c, idx, L: longitud(c) }))
    .sort((a, b) => b.L - a.L || a.idx - b.idx)
    .slice(0, 3)
    .forEach(({ c }, q) => {
      const p = c[Math.floor(c.length * 0.45)];
      toponimos.push({ nombre: nombresBalka[q], posicion: p, clase: "balka" });
    });

  return {
    tipo: "colinas",
    semilla,
    nx,
    ny,
    rejilla_m: g,
    z: zf,
    veg,
    elementos,
    toponimos,
    estacional: {
      alturas_cultivo_m: {
        trigo: { primavera: P.v("terreno.cultivo.trigo_primavera_m"), verano: P.v("terreno.vegetacion.trigo_m"), otono: 0, invierno: 0 },
        cultivo_alto: { primavera: 0, verano: P.v("terreno.vegetacion.cultivo_alto_m"), otono: P.v("terreno.cultivo.alto_otono_m"), invierno: 0 },
        cultivo_bajo: { primavera: P.v("terreno.cultivo.bajo_m"), verano: P.v("terreno.cultivo.bajo_m"), otono: 0, invierno: 0 },
      },
      hoja: {
        primavera: P.v("terreno.vegetacion.hoja_primavera") === 1,
        verano: true,
        otono: P.v("terreno.vegetacion.hoja_otono") === 1,
        invierno: false,
      },
      altura_edificio_m: P.v("terreno.edificio.altura_m"),
    },
  };
}

// ---------- utilidades ----------

function suavizarRelieve(z: Float32Array, nx: number, ny: number): void {
  const t = Float32Array.from(z);
  for (let j = 1; j < ny - 1; j++) {
    for (let i = 1; i < nx - 1; i++) {
      let s = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) s += t[(j + b) * nx + i + a];
      z[j * nx + i] = s / 9;
    }
  }
}

/** Cuantil aproximado de la normal tipificada (para pasar una cobertura a un umbral de ruido). */
function cuantilNormal(p: number): number {
  const q = limitar(p, 1e-4, 1 - 1e-4);
  // aproximación de Abramowitz-Stegun 26.2.23
  const t = Math.sqrt(-2 * Math.log(q < 0.5 ? q : 1 - q));
  const x = t - (2.515517 + 0.802853 * t + 0.010328 * t * t) / (1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t);
  return q < 0.5 ? -x : x;
}

function celdaDe(p: Punto, nx: number, ny: number, g: number): number {
  const i = limitar(Math.floor(p.x / g), 0, nx - 1);
  const j = limitar(Math.floor(p.y / g), 0, ny - 1);
  return j * nx + i;
}

function dentroMapa(p: Punto, cfg: ConfigColinas): boolean {
  return p.x >= 0 && p.y >= 0 && p.x < cfg.ancho_m && p.y < cfg.alto_m;
}

function buscar(orden: number[], v: number): number {
  let a = 0;
  let b = orden.length;
  while (a < b) {
    const m = (a + b) >> 1;
    if (orden[m] <= v) a = m + 1;
    else b = m;
  }
  return a;
}

function barajar<T>(lista: T[], azar: Azar): T[] {
  const r = lista.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(azar.siguiente() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function trazarCauces(esArroyo: Uint8Array, padre: Int32Array, nx: number, ny: number, g: number): Punto[][] {
  const n = nx * ny;
  const entra = new Uint8Array(n);
  for (let k = 0; k < n; k++) if (esArroyo[k] && padre[k] >= 0 && esArroyo[padre[k]]) entra[padre[k]] = 1;
  const visto = new Uint8Array(n);
  const cauces: Punto[][] = [];
  const pt = (k: number): Punto => ({ x: ((k % nx) + 0.5) * g, y: (Math.floor(k / nx) + 0.5) * g });
  for (let k = 0; k < n; k++) {
    if (!esArroyo[k] || entra[k]) continue;
    const linea: Punto[] = [];
    let c = k;
    for (;;) {
      linea.push(pt(c));
      if (visto[c]) break;
      visto[c] = 1;
      if (padre[c] < 0) {
        const p = pt(c);
        const i = c % nx;
        const j = Math.floor(c / nx);
        linea.push({ x: i === 0 ? 0 : i === nx - 1 ? nx * g : p.x, y: j === 0 ? 0 : j === ny - 1 ? ny * g : p.y });
        break;
      }
      c = padre[c];
    }
    if (linea.length > 2) cauces.push(suavizar(simplificar(linea, 3), 2));
  }
  return cauces;
}

function tramoInterior(linea: Punto[], largo: number, margen: number, cfg: ConfigColinas, azar: Azar): Punto[] | null {
  const dentroMargen = (p: Punto) => p.x > margen && p.y > margen && p.x < cfg.ancho_m - margen && p.y < cfg.alto_m - margen;
  const idx = linea.map((p, q) => (dentroMargen(p) ? q : -1)).filter((q) => q >= 0);
  if (!idx.length) return null;
  const acum = [0];
  for (let q = 1; q < linea.length; q++) acum.push(acum[q - 1] + Math.hypot(linea[q].x - linea[q - 1].x, linea[q].y - linea[q - 1].y));
  const candidatos = idx.filter((a) => {
    const b = idx.find((q) => acum[q] - acum[a] >= largo);
    if (b === undefined) return false;
    for (let q = a; q <= b; q++) if (!dentroMargen(linea[q])) return false;
    return true;
  });
  if (!candidatos.length) return null;
  const a = candidatos[Math.floor(azar.siguiente() * candidatos.length)];
  const b = idx.find((q) => acum[q] - acum[a] >= largo)!;
  return linea.slice(a, b + 1);
}

function normales(linea: Punto[]): Punto[] {
  return linea.map((_, q) => {
    const a = linea[Math.max(0, q - 1)];
    const b = linea[Math.min(linea.length - 1, q + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    return { x: -dy / L, y: dx / L };
  });
}

function desplazar(linea: Punto[], d: number): Punto[] {
  const nn = normales(linea);
  return linea.map((p, q) => ({ x: p.x + nn[q].x * d, y: p.y + nn[q].y * d }));
}

function mediaPendienteLado(linea: Punto[], d: number, pend: Float32Array, nx: number, ny: number, g: number): number {
  const pts = desplazar(linea, d);
  let s = 0;
  for (const p of pts) s += pend[celdaDe(p, nx, ny, g)];
  return s / pts.length;
}

/** Casas (como pequeños segmentos) a los dos lados de la calle. */
function casasALoLargo(calle: Punto[], sep: number, azar: Azar): Punto[][] {
  const casas: Punto[][] = [];
  const nn = normales(calle);
  let acumulado = 0;
  let siguiente = azar.rango(0, sep);
  for (let q = 1; q < calle.length; q++) {
    const a = calle[q - 1];
    const b = calle[q];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    while (acumulado + L >= siguiente) {
      const t = (siguiente - acumulado) / L;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const ux = (b.x - a.x) / L;
      const uy = (b.y - a.y) / L;
      for (const lado of [1, -1]) {
        if (azar.siguiente() < 0.15) continue; // solar vacío
        const off = lado * azar.rango(16, 22);
        const c = { x: p.x + nn[q].x * off, y: p.y + nn[q].y * off };
        const largo = azar.siguiente() < 0.4 ? 8 : 0; // casa con anexo
        casas.push([{ x: c.x - ux * largo, y: c.y - uy * largo }, { x: c.x + ux * 2, y: c.y + uy * 2 }]);
      }
      siguiente += sep * azar.rango(0.8, 1.25);
    }
    acumulado += L;
  }
  return casas;
}

/** Divide el segmento a-b en tramos donde `ok` es cierto, cada `paso` metros; descarta los cortos. */
function tramosAptos(a: Punto, b: Punto, paso: number, ok: (p: Punto) => boolean, minimo: number): Punto[][] {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.ceil(L / paso);
  const tramos: Punto[][] = [];
  let actual: Punto[] = [];
  for (let q = 0; q <= n; q++) {
    const t = q / n;
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    if (ok(p)) actual.push(p);
    else {
      if (actual.length * paso >= minimo) tramos.push([actual[0], actual[actual.length - 1]]);
      actual = [];
    }
  }
  if (actual.length * paso >= minimo) tramos.push([actual[0], actual[actual.length - 1]]);
  return tramos;
}

/** Corta huecos de 20-40 m en una lesosmuga recta (un tramo de dos puntos). */
function conHuecos(t: Punto[], prob: number, azar: Azar): Punto[][] {
  const [a, b] = t;
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / L;
  const uy = (b.y - a.y) / L;
  const piezas: Punto[][] = [];
  let ini = 0;
  for (let s = 200; s < L - 60; s += 200) {
    if (azar.siguiente() < prob) {
      const c = s + azar.rango(-80, 80);
      const hueco = azar.rango(20, 40);
      if (c - hueco / 2 - ini > 40) piezas.push([{ x: a.x + ux * ini, y: a.y + uy * ini }, { x: a.x + ux * (c - hueco / 2), y: a.y + uy * (c - hueco / 2) }]);
      ini = c + hueco / 2;
    }
  }
  if (L - ini > 40) piezas.push([{ x: a.x + ux * ini, y: a.y + uy * ini }, b]);
  return piezas;
}

function crucesDeAgua(linea: Punto[], veg: Uint8Array, nx: number, ny: number, g: number): Punto[] {
  const cruces: Punto[] = [];
  let dentro: Punto[] = [];
  for (let q = 1; q < linea.length; q++) {
    const a = linea[q - 1];
    const b = linea[q];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const m = Math.max(1, Math.ceil(L / 4));
    for (let s = 0; s < m; s++) {
      const t = s / m;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      const agua = veg[celdaDe(p, nx, ny, g)] === Veg.Agua;
      if (agua) dentro.push(p);
      else if (dentro.length) {
        cruces.push(dentro[Math.floor(dentro.length / 2)]);
        dentro = [];
      }
    }
  }
  if (dentro.length) cruces.push(dentro[Math.floor(dentro.length / 2)]);
  // dos cruces a menos de 60 m son el mismo
  return cruces.filter((p, q) => cruces.slice(0, q).every((r) => Math.hypot(r.x - p.x, r.y - p.y) > 60));
}

function cotasDestacadas(z: Float32Array, nx: number, ny: number, g: number): Toponimo[] {
  const radio = Math.round(250 / g);
  const radioProm = Math.round(600 / g);
  const cand: { k: number; z: number }[] = [];
  for (let j = radio; j < ny - radio; j += 2) {
    for (let i = radio; i < nx - radio; i += 2) {
      const k = j * nx + i;
      let max = true;
      for (let b = -radio; b <= radio && max; b += 2) for (let a = -radio; a <= radio; a += 2) {
        if (z[(j + b) * nx + i + a] > z[k]) { max = false; break; }
      }
      if (!max) continue;
      let min = Infinity;
      for (let b = -radioProm; b <= radioProm; b += 3) for (let a = -radioProm; a <= radioProm; a += 3) {
        const jj = j + b, ii = i + a;
        if (jj < 0 || ii < 0 || jj >= ny || ii >= nx) continue;
        min = Math.min(min, z[jj * nx + ii]);
      }
      if (z[k] - min >= 6) cand.push({ k, z: z[k] });
    }
  }
  cand.sort((a, b) => b.z - a.z || a.k - b.k);
  const elegidas: Toponimo[] = [];
  for (const c of cand) {
    const p = { x: ((c.k % nx) + 0.5) * g, y: (Math.floor(c.k / nx) + 0.5) * g };
    if (elegidas.every((e) => Math.hypot(e.posicion.x - p.x, e.posicion.y - p.y) > 700)) {
      elegidas.push({ nombre: `Cota ${Math.round(c.z)}`, posicion: p, cota_m: Math.round(c.z * 10) / 10, clase: "cota" });
    }
    if (elegidas.length >= 7) break;
  }
  return elegidas;
}
