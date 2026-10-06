// Tipos del terreno. Coordenadas en metros: x hacia el este, y hacia el norte, origen en la esquina suroeste.
// El relieve y la vegetación son rejillas de celdas de 10 m (D-043); la celda (i, j) tiene su centro en
// x = (i + 0,5)·rejilla, y = (j + 0,5)·rejilla.

export type Estacion = "primavera" | "verano" | "otono" | "invierno";

/** Clases de la capa de vegetación y obstáculos. */
export const enum Veg {
  Abierto = 0, // pasto, rastrojo, barbecho, huertos sin árboles
  Trigo = 1, // cereal de invierno
  CultivoAlto = 2, // girasol o maíz
  CultivoBajo = 3, // colza o remolacha
  BosqueHoja = 4, // frondosas (pierde la hoja)
  BosqueConifera = 5, // pinar de repoblación
  Lesosmuga = 6, // franja de árboles cortavientos
  Edificio = 7,
  Agua = 8,
}

export const NOMBRE_VEG: Record<number, string> = {
  0: "abierto",
  1: "trigo",
  2: "girasol o maíz",
  3: "colza o remolacha",
  4: "bosque de frondosas",
  5: "pinar",
  6: "lesosmuga",
  7: "edificio",
  8: "agua",
};

export interface Punto {
  x: number;
  y: number;
}

export type TipoElemento =
  | "carretera"
  | "camino"
  | "arroyo"
  | "rio"
  | "vado"
  | "puente"
  | "edificio"
  | "lesosmuga"
  | "bosque"
  | "cultivo"
  | "campo_minas";

export interface Elemento {
  tipo: TipoElemento;
  nombre?: string;
  geometria: Punto[];
}

export interface Toponimo {
  nombre: string;
  posicion: Punto;
  cota_m?: number;
  clase: "cota" | "pueblo" | "balka" | "paraje";
}

/** Datos del terreno que dependen de la estación (alturas de cultivo, hoja). */
export interface Estacional {
  /** Altura de cada cultivo en metros por estación. */
  alturas_cultivo_m: Record<"trigo" | "cultivo_alto" | "cultivo_bajo", Record<Estacion, number>>;
  /** Si las frondosas y las lesosmugas tienen hoja en cada estación. */
  hoja: Record<Estacion, boolean>;
  /** Altura de los edificios (una planta con tejado). */
  altura_edificio_m: number;
}

export interface Terreno {
  tipo: string;
  semilla: number;
  /** Celdas en x y en y. */
  nx: number;
  ny: number;
  rejilla_m: number;
  /** Cota del suelo en metros, nx·ny, fila a fila desde el sur. */
  z: Float32Array;
  /** Clase de vegetación u obstáculo (Veg), nx·ny. */
  veg: Uint8Array;
  elementos: Elemento[];
  toponimos: Toponimo[];
  estacional: Estacional;
}

export function indice(t: Terreno, i: number, j: number): number {
  return j * t.nx + i;
}

export function anchoM(t: Terreno): number {
  return t.nx * t.rejilla_m;
}

export function altoM(t: Terreno): number {
  return t.ny * t.rejilla_m;
}

/** Cota del suelo en un punto cualquiera (interpolación bilineal entre centros de celda). */
export function cota(t: Terreno, x: number, y: number): number {
  const fx = x / t.rejilla_m - 0.5;
  const fy = y / t.rejilla_m - 0.5;
  let i0 = Math.floor(fx);
  let j0 = Math.floor(fy);
  let dx = fx - i0;
  let dy = fy - j0;
  if (i0 < 0) { i0 = 0; dx = 0; }
  if (j0 < 0) { j0 = 0; dy = 0; }
  if (i0 >= t.nx - 1) { i0 = t.nx - 2; dx = 1; }
  if (j0 >= t.ny - 1) { j0 = t.ny - 2; dy = 1; }
  const k = j0 * t.nx + i0;
  const z00 = t.z[k];
  const z10 = t.z[k + 1];
  const z01 = t.z[k + t.nx];
  const z11 = t.z[k + t.nx + 1];
  return z00 * (1 - dx) * (1 - dy) + z10 * dx * (1 - dy) + z01 * (1 - dx) * dy + z11 * dx * dy;
}

/** Clase de vegetación en la celda que contiene el punto. */
export function vegEn(t: Terreno, x: number, y: number): number {
  const i = Math.min(t.nx - 1, Math.max(0, Math.floor(x / t.rejilla_m)));
  const j = Math.min(t.ny - 1, Math.max(0, Math.floor(y / t.rejilla_m)));
  return t.veg[j * t.nx + i];
}

export function dentro(t: Terreno, p: Punto): boolean {
  return p.x >= 0 && p.y >= 0 && p.x <= anchoM(t) && p.y <= altoM(t);
}
