import { Veg, type Terreno } from "../engine/terreno/tipos";

/** Terreno llano de prueba: nx × ny celdas de 10 m a cota 100, todo abierto. */
export function terrenoLlano(nx = 200, ny = 50): Terreno {
  return {
    tipo: "prueba",
    semilla: 0,
    nx,
    ny,
    rejilla_m: 10,
    z: new Float32Array(nx * ny).fill(100),
    veg: new Uint8Array(nx * ny).fill(Veg.Abierto),
    elementos: [],
    toponimos: [],
    estacional: {
      alturas_cultivo_m: {
        trigo: { primavera: 0.5, verano: 1, otono: 0, invierno: 0 },
        cultivo_alto: { primavera: 0, verano: 2, otono: 2, invierno: 0 },
        cultivo_bajo: { primavera: 0.6, verano: 0.6, otono: 0, invierno: 0 },
      },
      hoja: { primavera: true, verano: true, otono: true, invierno: false },
      altura_edificio_m: 6,
    },
  };
}

/** Pone una franja vertical (columnas i0..i1) de una clase en todo el alto del mapa. */
export function franja(t: Terreno, i0: number, i1: number, clase: number): void {
  for (let j = 0; j < t.ny; j++) for (let i = i0; i <= i1; i++) t.veg[j * t.nx + i] = clase;
}

/** Levanta una loma de altura h en las columnas i0..i1. */
export function loma(t: Terreno, i0: number, i1: number, h: number): void {
  for (let j = 0; j < t.ny; j++) for (let i = i0; i <= i1; i++) t.z[j * t.nx + i] += h;
}
