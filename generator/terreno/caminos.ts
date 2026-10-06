// Trazado de carreteras y caminos por el camino de menor coste (A*) sobre una rejilla gruesa,
// y utilidades de polilíneas (simplificar, suavizar, rasterizar).

import type { Punto } from "../../engine/terreno/tipos";

class Cola {
  private k: number[] = [];
  private p: number[] = [];
  get vacia() {
    return this.k.length === 0;
  }
  meter(k: number, p: number) {
    this.k.push(k);
    this.p.push(p);
    let n = this.k.length - 1;
    while (n > 0) {
      const m = (n - 1) >> 1;
      if (this.p[n] < this.p[m]) {
        this.cambiar(n, m);
        n = m;
      } else break;
    }
  }
  sacar(): number {
    const top = this.k[0];
    const k = this.k.pop()!;
    const p = this.p.pop()!;
    if (this.k.length) {
      this.k[0] = k;
      this.p[0] = p;
      let n = 0;
      for (;;) {
        const a = 2 * n + 1;
        const b = a + 1;
        let m = n;
        if (a < this.k.length && this.p[a] < this.p[m]) m = a;
        if (b < this.k.length && this.p[b] < this.p[m]) m = b;
        if (m === n) break;
        this.cambiar(n, m);
        n = m;
      }
    }
    return top;
  }
  private cambiar(a: number, b: number) {
    [this.k[a], this.k[b]] = [this.k[b], this.k[a]];
    [this.p[a], this.p[b]] = [this.p[b], this.p[a]];
  }
}

/**
 * Camino de menor coste entre dos celdas de una rejilla nx × ny (8 vecinos).
 * `coste(k)` es el coste por metro de atravesar la celda k (≥ 1).
 */
export function aEstrella(
  nx: number,
  ny: number,
  paso_m: number,
  coste: (k: number) => number,
  desde: number,
  hasta: number,
): number[] {
  const n = nx * ny;
  const g = new Float64Array(n).fill(Infinity);
  const de = new Int32Array(n).fill(-1);
  const cerrado = new Uint8Array(n);
  const hi = hasta % nx;
  const hj = (hasta - hi) / nx;
  const h = (k: number) => {
    const i = k % nx;
    const j = (k - i) / nx;
    return Math.hypot(i - hi, j - hj) * paso_m;
  };
  const cola = new Cola();
  g[desde] = 0;
  cola.meter(desde, h(desde));
  while (!cola.vacia) {
    const k = cola.sacar();
    if (cerrado[k]) continue;
    if (k === hasta) break;
    cerrado[k] = 1;
    const i = k % nx;
    const j = (k - i) / nx;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const a = i + di;
        const b = j + dj;
        if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
        const q = b * nx + a;
        if (cerrado[q]) continue;
        const largo = (di && dj ? Math.SQRT2 : 1) * paso_m;
        const ng = g[k] + largo * 0.5 * (coste(k) + coste(q));
        if (ng < g[q]) {
          g[q] = ng;
          de[q] = k;
          cola.meter(q, ng + h(q));
        }
      }
    }
  }
  const camino: number[] = [];
  for (let k = hasta; k >= 0; k = de[k]) {
    camino.push(k);
    if (k === desde) break;
  }
  return camino.reverse();
}

/** Simplificación de Douglas-Peucker con tolerancia en metros. */
export function simplificar(p: Punto[], tol: number): Punto[] {
  if (p.length < 3) return p.slice();
  const marca = new Uint8Array(p.length);
  marca[0] = marca[p.length - 1] = 1;
  const pila: [number, number][] = [[0, p.length - 1]];
  while (pila.length) {
    const [a, b] = pila.pop()!;
    let dmax = 0;
    let idx = -1;
    const ax = p[a].x, ay = p[a].y, bx = p[b].x, by = p[b].y;
    const L = Math.hypot(bx - ax, by - ay) || 1e-9;
    for (let q = a + 1; q < b; q++) {
      const d = Math.abs((bx - ax) * (ay - p[q].y) - (ax - p[q].x) * (by - ay)) / L;
      if (d > dmax) { dmax = d; idx = q; }
    }
    if (dmax > tol && idx > 0) {
      marca[idx] = 1;
      pila.push([a, idx], [idx, b]);
    }
  }
  return p.filter((_, q) => marca[q]);
}

/** Suavizado de Chaikin (conserva los extremos). */
export function suavizar(p: Punto[], iteraciones = 2): Punto[] {
  let r = p;
  for (let it = 0; it < iteraciones; it++) {
    if (r.length < 3) return r;
    const s: Punto[] = [r[0]];
    for (let q = 0; q < r.length - 1; q++) {
      const a = r[q];
      const b = r[q + 1];
      s.push({ x: 0.75 * a.x + 0.25 * b.x, y: 0.75 * a.y + 0.25 * b.y });
      s.push({ x: 0.25 * a.x + 0.75 * b.x, y: 0.25 * a.y + 0.75 * b.y });
    }
    s.push(r[r.length - 1]);
    r = s;
  }
  return r;
}

/** Celdas (índices) que toca una polilínea, sin huecos entre celdas vecinas (recorrido por bordes). */
export function celdasDeLinea(p: Punto[], nx: number, ny: number, g: number): number[] {
  const out: number[] = [];
  const add = (i: number, j: number) => {
    if (i >= 0 && j >= 0 && i < nx && j < ny) out.push(j * nx + i);
  };
  for (let q = 0; q < p.length - 1; q++) {
    const x0 = p[q].x / g, y0 = p[q].y / g, x1 = p[q + 1].x / g, y1 = p[q + 1].y / g;
    let i = Math.floor(x0), j = Math.floor(y0);
    const i1 = Math.floor(x1), j1 = Math.floor(y1);
    const dx = x1 - x0, dy = y1 - y0;
    const si = dx > 0 ? 1 : -1, sj = dy > 0 ? 1 : -1;
    let tMaxX = dx !== 0 ? ((dx > 0 ? i + 1 - x0 : x0 - i) / Math.abs(dx)) : Infinity;
    let tMaxY = dy !== 0 ? ((dy > 0 ? j + 1 - y0 : y0 - j) / Math.abs(dy)) : Infinity;
    const tdx = dx !== 0 ? 1 / Math.abs(dx) : Infinity;
    const tdy = dy !== 0 ? 1 / Math.abs(dy) : Infinity;
    add(i, j);
    let guard = 0;
    while ((i !== i1 || j !== j1) && guard++ < 100000) {
      if (tMaxX < tMaxY) { tMaxX += tdx; i += si; } else { tMaxY += tdy; j += sj; }
      add(i, j);
    }
  }
  return out;
}

export function longitud(p: Punto[]): number {
  let L = 0;
  for (let q = 1; q < p.length; q++) L += Math.hypot(p[q].x - p[q - 1].x, p[q].y - p[q - 1].y);
  return L;
}
