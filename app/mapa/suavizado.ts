// Dibujo suave de una rejilla de clases (vegetación, zona vista).
//
// El motor trabaja con celdas de 10 m, pero en pantalla no queremos escalones: cada clase se convierte en
// un campo continuo (su presencia suavizada), se interpola entre centros de celda y en cada píxel gana la
// clase con más presencia, con una transición de un par de píxeles en el borde. El resultado son manchas de
// bordes redondeados y finos, sin cambiar ni una celda de lo que usa el motor.

export type RGBA = [number, number, number, number];

/** Suavizado gaussiano separable 1-4-6-4-1, `pasadas` veces. */
function difuminar(campo: Float32Array, nx: number, ny: number, pasadas: number): void {
  const tmp = new Float32Array(campo.length);
  const k = [1 / 16, 4 / 16, 6 / 16, 4 / 16, 1 / 16];
  for (let p = 0; p < pasadas; p++) {
    for (let j = 0; j < ny; j++) {
      const f = j * nx;
      for (let i = 0; i < nx; i++) {
        let s = 0;
        for (let d = -2; d <= 2; d++) s += k[d + 2] * campo[f + Math.min(nx - 1, Math.max(0, i + d))];
        tmp[f + i] = s;
      }
    }
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        let s = 0;
        for (let d = -2; d <= 2; d++) s += k[d + 2] * tmp[Math.min(ny - 1, Math.max(0, j + d)) * nx + i];
        campo[j * nx + i] = s;
      }
    }
  }
}

/**
 * Pinta una rejilla de clases (fila 0 = sur) a `factor` píxeles por celda, con bordes suaves.
 * `colores[c]` es el color de la clase c; `luz` (opcional, por celda) multiplica el color (sombreado).
 * Devuelve los píxeles con la fila 0 arriba (norte), listos para un ImageData.
 */
export function rasterSuave(
  clases: Uint8Array,
  nx: number,
  ny: number,
  factor: number,
  colores: Record<number, RGBA>,
  opciones: { luz?: Float32Array; pasadas?: number; borde?: number } = {},
): { ancho: number; alto: number; datos: Uint8ClampedArray<ArrayBuffer> } {
  const pasadas = opciones.pasadas ?? 1;
  const borde = opciones.borde ?? 0.12;
  const presentes = [...new Set(clases)].filter((c) => colores[c] !== undefined).sort((a, b) => a - b);
  const campos = presentes.map((c) => {
    const f = new Float32Array(nx * ny);
    for (let k = 0; k < f.length; k++) f[k] = clases[k] === c ? 1 : 0;
    difuminar(f, nx, ny, pasadas);
    return f;
  });
  const W = nx * factor;
  const H = ny * factor;
  const datos = new Uint8ClampedArray(W * H * 4);
  const luz = opciones.luz;
  const nC = presentes.length;
  for (let py = 0; py < H; py++) {
    // fila de píxeles de arriba (norte) abajo; en celdas, y crece hacia el norte
    const fy = (H - py - 0.5) / factor - 0.5;
    let j0 = Math.floor(fy);
    let ty = fy - j0;
    if (j0 < 0) { j0 = 0; ty = 0; }
    if (j0 >= ny - 1) { j0 = ny - 2; ty = 1; }
    for (let px = 0; px < W; px++) {
      const fx = (px + 0.5) / factor - 0.5;
      let i0 = Math.floor(fx);
      let tx = fx - i0;
      if (i0 < 0) { i0 = 0; tx = 0; }
      if (i0 >= nx - 1) { i0 = nx - 2; tx = 1; }
      const k = j0 * nx + i0;
      const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
      let b1 = -1, v1 = -1, b2 = -1, v2 = -1;
      for (let q = 0; q < nC; q++) {
        const f = campos[q];
        const v = f[k] * w00 + f[k + 1] * w10 + f[k + nx] * w01 + f[k + nx + 1] * w11;
        if (v > v1) { b2 = b1; v2 = v1; b1 = q; v1 = v; }
        else if (v > v2) { b2 = q; v2 = v; }
      }
      const c1 = colores[presentes[b1]];
      let r = c1[0], g = c1[1], b = c1[2], a = c1[3];
      if (b2 >= 0) {
        // transición suave en el borde entre las dos clases con más presencia
        const d = Math.min(1, (v1 - v2) / borde);
        const w = 0.5 + 0.5 * d * d * (3 - 2 * d);
        const c2 = colores[presentes[b2]];
        r = r * w + c2[0] * (1 - w);
        g = g * w + c2[1] * (1 - w);
        b = b * w + c2[2] * (1 - w);
        a = a * w + c2[3] * (1 - w);
      }
      if (luz) {
        const l = luz[k] * w00 + luz[k + 1] * w10 + luz[k + nx] * w01 + luz[k + nx + 1] * w11;
        r *= l; g *= l; b *= l;
      }
      const o = (py * W + px) * 4;
      datos[o] = r; datos[o + 1] = g; datos[o + 2] = b; datos[o + 3] = a;
    }
  }
  return { ancho: W, alto: H, datos };
}

/**
 * Sustituye las clases que se dibujan como líneas o símbolos (lesosmuga, agua, edificio) por la clase de
 * superficie más frecuente alrededor, para que debajo de la línea no quede una franja de otro color.
 */
export function rellenarConVecinos(clases: Uint8Array, nx: number, ny: number, quitar: Set<number>): Uint8Array {
  let actual = Uint8Array.from(clases);
  for (let pasada = 0; pasada < 6; pasada++) {
    let quedan = 0;
    const sig = Uint8Array.from(actual);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (!quitar.has(actual[k])) continue;
        const cuenta = new Map<number, number>();
        for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) {
          const ii = i + a, jj = j + b;
          if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
          const c = actual[jj * nx + ii];
          if (!quitar.has(c)) cuenta.set(c, (cuenta.get(c) ?? 0) + 1);
        }
        let mejor = -1, n = 0;
        for (const [c, m] of cuenta) if (m > n || (m === n && c < mejor)) { mejor = c; n = m; }
        if (mejor >= 0) sig[k] = mejor;
        else quedan++;
      }
    }
    actual = sig;
    if (!quedan) break;
  }
  return actual;
}
