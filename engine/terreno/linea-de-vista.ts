// Línea de vista (D-033 y D-036).
//
// - Relieve: el rayo va del ojo del observador a la parte visible del blanco y se comprueba cada
//   terreno.los.paso_muestreo_m metros. Por encima de 3 km se resta la curvatura terrestre (0,067·d², d en km).
// - Vegetación y edificios: se comprueban celda a celda (10 m), para no saltarse una lesosmuga de 11 m.
//   · Bosque: si el rayo pasa bajo las copas, solo se ve a través de la distancia de visibilidad del tipo de
//     bosque (frondosas con hoja, sin hoja, pinar). Se suman los tramos de bosque del rayo.
//   · Lesosmuga: con hoja corta siempre; sin hoja deja pasar la vista si el tramo dentro es ≤ 15 m, con la
//     detección a la mitad.
//   · Cultivos: tapan lo que queda por debajo de su altura en esa estación.
//   · Edificios: opacos hasta su altura.
//   · Desde el aire (observador por encima de las copas), el bosque donde está el blanco no corta la vista:
//     el blanco queda «bajo el dosel» y la térmica solo detecta la mitad.
// - Tirar a través de follaje (sin que corte la vista) tiene la mitad de acierto y el follaje no protege.

import type { Parametros } from "../parametros";
import { Veg, cota, type Estacion, type Terreno } from "./tipos";

export interface Observador {
  x: number;
  y: number;
  /** Altura del ojo, del visor o del dron sobre el suelo, en metros. */
  h: number;
}

export type EstadoLdV = "visible" | "parcial" | "oculta";

export type MotivoCorte = "relieve" | "bosque" | "lesosmuga" | "cultivo" | "edificio";

export interface Factor {
  tipo: "a_traves_follaje" | "lesosmuga_sin_hoja" | "bajo_dosel";
  texto: string;
  parametro: string;
  valor: number;
}

export interface ResultadoLdV {
  estado: EstadoLdV;
  distancia_m: number;
  /** Qué corta la vista, si está oculta. */
  motivo?: MotivoCorte;
  /** Distancia desde el observador al punto donde se corta. */
  corte_en_m?: number;
  factores: Factor[];
}

/** Valores de la regla preparados para una estación, para no consultarlos en cada rayo. */
export interface ReglasLdV {
  paso: number;
  hBosque: number;
  visHoja: number;
  visSinHoja: number;
  visConifera: number;
  hLesosmuga: number;
  pasoLesoSinHoja: number;
  hoja: boolean;
  hEdificio: number;
  hCultivo: Float32Array; // por clase de vegetación
  curvaturaDesde: number;
  curvaturaK: number; // m por km²
  factorFollaje: number;
  doselTermicaPct: number;
}

export function prepararReglas(t: Terreno, P: Parametros, est: Estacion): ReglasLdV {
  const hCultivo = new Float32Array(16);
  hCultivo[Veg.Trigo] = t.estacional.alturas_cultivo_m.trigo[est];
  hCultivo[Veg.CultivoAlto] = t.estacional.alturas_cultivo_m.cultivo_alto[est];
  hCultivo[Veg.CultivoBajo] = t.estacional.alturas_cultivo_m.cultivo_bajo[est];
  return {
    paso: P.v("terreno.los.paso_muestreo_m"),
    hBosque: P.v("terreno.vegetacion.altura_bosque_m"),
    visHoja: P.v("terreno.vegetacion.bosque_hoja_m"),
    visSinHoja: P.v("terreno.vegetacion.bosque_sin_hoja_m"),
    visConifera: P.v("terreno.vegetacion.bosque_conifera_m"),
    hLesosmuga: P.v("terreno.vegetacion.lesosmuga_altura_m"),
    pasoLesoSinHoja: P.v("terreno.vegetacion.lesosmuga_paso_sin_hoja_m"),
    hoja: t.estacional.hoja[est],
    hEdificio: t.estacional.altura_edificio_m,
    hCultivo,
    curvaturaDesde: 3000,
    curvaturaK: 0.067,
    factorFollaje: P.v("terreno.vegetacion.factor_fuego_a_traves"),
    doselTermicaPct: P.v("deteccion.vegetacion.dosel_bosque_termica_deteccion_pct"),
  };
}

/** Altura del obstáculo de cada clase sobre el suelo en esta estación (para dibujar perfiles). */
export function alturaObstaculo(R: ReglasLdV, clase: number): number {
  switch (clase) {
    case Veg.BosqueHoja:
    case Veg.BosqueConifera:
      return R.hBosque;
    case Veg.Lesosmuga:
      return R.hLesosmuga;
    case Veg.Edificio:
      return R.hEdificio;
    default:
      return R.hCultivo[clase] ?? 0;
  }
}

const esBosque = (c: number) => c === Veg.BosqueHoja || c === Veg.BosqueConifera;

/**
 * Línea de vista entre un observador y un blanco. `hBlanco` es la altura de la parte visible del blanco
 * (de pie 1,6 m; tumbado 0,4 m; carro 2,2 m…).
 */
export function lineaDeVista(
  t: Terreno,
  R: ReglasLdV,
  obs: Observador,
  blanco: Observador,
): ResultadoLdV {
  const dx = blanco.x - obs.x;
  const dy = blanco.y - obs.y;
  const d = Math.hypot(dx, dy);
  const factores: Factor[] = [];
  if (d < 1) return { estado: "visible", distancia_m: d, factores };

  const curvar = d > R.curvaturaDesde;
  const k = R.curvaturaK / 1e6; // por m²
  const z0 = cota(t, obs.x, obs.y) + obs.h;
  const z1 = cota(t, blanco.x, blanco.y) + blanco.h - (curvar ? k * d * d : 0);
  const rayo = (s: number) => z0 + ((z1 - z0) * s) / d;
  const suelo = (s: number) => {
    const z = cota(t, obs.x + (dx * s) / d, obs.y + (dy * s) / d);
    return curvar ? z - k * s * s : z;
  };

  // 1. Relieve, cada `paso` metros.
  for (let s = R.paso; s < d; s += R.paso) {
    if (suelo(s) > rayo(s)) {
      return { estado: "oculta", distancia_m: d, motivo: "relieve", corte_en_m: s, factores };
    }
  }

  // 2. Vegetación y edificios, celda a celda, recorriendo del blanco hacia el observador para saber qué
  //    bosque rodea al blanco (dosel visto desde el aire).
  const g = t.rejilla_m;
  const aereo = obs.h > R.hBosque;
  const px = blanco.x / g;
  const py = blanco.y / g;
  let i = Math.min(t.nx - 1, Math.max(0, Math.floor(px)));
  let j = Math.min(t.ny - 1, Math.max(0, Math.floor(py)));
  const ux = -dx / d; // recorremos del blanco al observador
  const uy = -dy / d;
  const pasoI = ux > 0 ? 1 : -1;
  const pasoJ = uy > 0 ? 1 : -1;
  // metros a lo largo del rayo hasta el siguiente borde de celda en x y en y, y entre bordes
  let tMaxX = ux !== 0 ? ((ux > 0 ? i + 1 - px : px - i) * g) / Math.abs(ux) : Infinity;
  let tMaxY = uy !== 0 ? ((uy > 0 ? j + 1 - py : py - j) * g) / Math.abs(uy) : Infinity;
  const dX = ux !== 0 ? g / Math.abs(ux) : Infinity;
  const dY = uy !== 0 ? g / Math.abs(uy) : Infinity;

  let recorrido = 0; // metros desde el blanco
  let carga = 0; // fracción de visibilidad de bosque consumida (suma de L / visibilidad)
  let follaje = false;
  let enCorridaInicial = true; // seguimos en el bosque que rodea al blanco
  let dosel = false;
  let leso = 0; // metros dentro de la lesosmuga actual
  let lesoParcial = false;
  const ultimaCelda = {
    i: Math.min(t.nx - 1, Math.max(0, Math.floor(obs.x / g))),
    j: Math.min(t.ny - 1, Math.max(0, Math.floor(obs.y / g))),
  };
  let primera = true;

  while (recorrido < d) {
    const sig = Math.min(tMaxX, tMaxY, d);
    const L = sig - recorrido;
    if (L > 0) {
      const sMedioObs = d - (recorrido + sig) / 2; // distancia desde el observador
      const c = t.veg[j * t.nx + i];
      const ultima = i === ultimaCelda.i && j === ultimaCelda.j;
      const zr = rayo(sMedioObs);
      const zs = suelo(sMedioObs);
      const alto = zr - zs; // altura del rayo sobre el suelo

      if (esBosque(c)) {
        if (alto < R.hBosque) {
          if (aereo && enCorridaInicial) {
            dosel = true;
          } else {
            const vis = c === Veg.BosqueConifera ? R.visConifera : R.hoja ? R.visHoja : R.visSinHoja;
            carga += L / vis;
            follaje = true;
            if (carga > 1) {
              return { estado: "oculta", distancia_m: d, motivo: "bosque", corte_en_m: sMedioObs, factores };
            }
          }
        }
      } else if (c !== Veg.Lesosmuga) {
        enCorridaInicial = false;
      }

      if (c === Veg.Lesosmuga) {
        if (alto < R.hLesosmuga) {
          if (aereo && enCorridaInicial) {
            dosel = true;
          } else if (R.hoja) {
            return { estado: "oculta", distancia_m: d, motivo: "lesosmuga", corte_en_m: sMedioObs, factores };
          } else {
            leso += L;
            if (leso > R.pasoLesoSinHoja) {
              return { estado: "oculta", distancia_m: d, motivo: "lesosmuga", corte_en_m: sMedioObs, factores };
            }
            lesoParcial = true;
          }
        }
      } else {
        leso = 0;
      }

      if (c === Veg.Edificio && !primera && !ultima && alto < R.hEdificio) {
        return { estado: "oculta", distancia_m: d, motivo: "edificio", corte_en_m: sMedioObs, factores };
      }

      const hc = R.hCultivo[c];
      if (hc > 0 && alto < hc) {
        return { estado: "oculta", distancia_m: d, motivo: "cultivo", corte_en_m: sMedioObs, factores };
      }
    }
    recorrido = sig;
    primera = false;
    if (sig >= d) break;
    if (tMaxX < tMaxY) {
      tMaxX += dX;
      i += pasoI;
    } else {
      tMaxY += dY;
      j += pasoJ;
    }
    if (i < 0 || j < 0 || i >= t.nx || j >= t.ny) break;
  }

  if (follaje) {
    factores.push({
      tipo: "a_traves_follaje",
      texto: "A través de follaje: se ve, pero el tiro tiene la mitad de acierto y el follaje no protege",
      parametro: "terreno.vegetacion.factor_fuego_a_traves",
      valor: R.factorFollaje,
    });
  }
  if (lesoParcial) {
    factores.push({
      tipo: "lesosmuga_sin_hoja",
      texto: "A través de una lesosmuga sin hoja: la detección baja a la mitad",
      parametro: "terreno.vegetacion.lesosmuga_paso_sin_hoja_m",
      valor: 0.5,
    });
  }
  if (dosel) {
    factores.push({
      tipo: "bajo_dosel",
      texto: "Blanco bajo el dosel: desde el aire la térmica detecta la mitad",
      parametro: "deteccion.vegetacion.dosel_bosque_termica_deteccion_pct",
      valor: R.doselTermicaPct / 100,
    });
  }
  return { estado: factores.length ? "parcial" : "visible", distancia_m: d, factores };
}

/**
 * Zona vista desde un punto: línea de vista a cada celda de una rejilla de `paso_m` metros.
 * Devuelve 0 = oculta, 1 = visible, 2 = parcial, 3 = fuera de alcance.
 */
export function zonaVista(
  t: Terreno,
  R: ReglasLdV,
  obs: Observador,
  hBlanco: number,
  paso_m: number,
  alcance_m = Infinity,
): { nx: number; ny: number; paso_m: number; datos: Uint8Array } {
  const ancho = t.nx * t.rejilla_m;
  const alto = t.ny * t.rejilla_m;
  const nx = Math.floor(ancho / paso_m);
  const ny = Math.floor(alto / paso_m);
  const datos = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x = (i + 0.5) * paso_m;
      const y = (j + 0.5) * paso_m;
      if (Math.hypot(x - obs.x, y - obs.y) > alcance_m) {
        datos[j * nx + i] = 3;
        continue;
      }
      const r = lineaDeVista(t, R, obs, { x, y, h: hBlanco });
      datos[j * nx + i] = r.estado === "visible" ? 1 : r.estado === "parcial" ? 2 : 0;
    }
  }
  return { nx, ny, paso_m, datos };
}

export interface PuntoPerfil {
  s: number;
  suelo: number;
  obstaculo: number; // cota de la parte alta de la vegetación o del edificio
  clase: number;
  rayo: number;
}

/** Perfil del terreno entre dos puntos, cada `paso` metros, con la vegetación de la estación. */
export function perfil(
  t: Terreno,
  R: ReglasLdV,
  obs: Observador,
  blanco: Observador,
  paso = t.rejilla_m,
): PuntoPerfil[] {
  const dx = blanco.x - obs.x;
  const dy = blanco.y - obs.y;
  const d = Math.hypot(dx, dy);
  const z0 = cota(t, obs.x, obs.y) + obs.h;
  const z1 = cota(t, blanco.x, blanco.y) + blanco.h;
  const n = Math.max(2, Math.ceil(d / paso));
  const puntos: PuntoPerfil[] = [];
  for (let q = 0; q <= n; q++) {
    const s = (d * q) / n;
    const x = obs.x + (dx * s) / Math.max(d, 1e-9);
    const y = obs.y + (dy * s) / Math.max(d, 1e-9);
    const zs = cota(t, x, y);
    const i = Math.min(t.nx - 1, Math.max(0, Math.floor(x / t.rejilla_m)));
    const j = Math.min(t.ny - 1, Math.max(0, Math.floor(y / t.rejilla_m)));
    const c = t.veg[j * t.nx + i];
    puntos.push({ s, suelo: zs, obstaculo: zs + alturaObstaculo(R, c), clase: c, rayo: z0 + ((z1 - z0) * s) / Math.max(d, 1e-9) });
  }
  return puntos;
}
