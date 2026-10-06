// Ruido de gradiente 2D con semilla (tipo Perlin), suma fractal y deformación del dominio.
// Todo sale del generador con semilla: misma semilla, mismo terreno.

import type { Azar } from "../engine/azar";

export interface Ruido2D {
  (x: number, y: number): number; // aproximadamente en [-1, 1]
}

export function crearRuido(azar: Azar): Ruido2D {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(azar.siguiente() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const gx = new Float32Array(256);
  const gy = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const a = azar.siguiente() * Math.PI * 2;
    gx[i] = Math.cos(a);
    gy[i] = Math.sin(a);
  }
  const suave = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const h00 = perm[perm[X] + Y];
    const h10 = perm[perm[X + 1] + Y];
    const h01 = perm[perm[X] + Y + 1];
    const h11 = perm[perm[X + 1] + Y + 1];
    const n00 = gx[h00] * xf + gy[h00] * yf;
    const n10 = gx[h10] * (xf - 1) + gy[h10] * yf;
    const n01 = gx[h01] * xf + gy[h01] * (yf - 1);
    const n11 = gx[h11] * (xf - 1) + gy[h11] * (yf - 1);
    const u = suave(xf);
    const v = suave(yf);
    const a = n00 + u * (n10 - n00);
    const b = n01 + u * (n11 - n01);
    return (a + v * (b - a)) * 1.414;
  };
}

/** Suma fractal (fBm): `octavas` capas, cada una al doble de frecuencia y `ganancia` de amplitud. */
export function fbm(r: Ruido2D, x: number, y: number, octavas: number, ganancia = 0.5): number {
  let suma = 0;
  let amp = 1;
  let norma = 0;
  let f = 1;
  for (let o = 0; o < octavas; o++) {
    suma += amp * r(x * f + o * 17.3, y * f - o * 9.1);
    norma += amp;
    amp *= ganancia;
    f *= 2;
  }
  return suma / norma;
}
