// Red de drenaje: relleno de hoyas, dirección de flujo D8 y área drenada.
// Con esto los arroyos y vaguadas bajan siempre hasta el borde del mapa y las lomas y espolones quedan
// entre ellos, como en un terreno real.

const DI = [1, 1, 0, -1, -1, -1, 0, 1];
const DJ = [0, 1, 1, 1, 0, -1, -1, -1];
const DIST = [1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2, 1, Math.SQRT2];

/** Montículo binario de mínimos sobre índices de celda, ordenado por cota. */
class Monticulo {
  private datos: number[] = [];
  constructor(private readonly z: Float32Array) {}
  get tamano() {
    return this.datos.length;
  }
  meter(k: number) {
    const d = this.datos;
    d.push(k);
    let n = d.length - 1;
    while (n > 0) {
      const p = (n - 1) >> 1;
      if (this.menor(d[n], d[p])) {
        [d[n], d[p]] = [d[p], d[n]];
        n = p;
      } else break;
    }
  }
  sacar(): number {
    const d = this.datos;
    const top = d[0];
    const ult = d.pop()!;
    if (d.length) {
      d[0] = ult;
      let n = 0;
      for (;;) {
        const a = 2 * n + 1;
        const b = a + 1;
        let m = n;
        if (a < d.length && this.menor(d[a], d[m])) m = a;
        if (b < d.length && this.menor(d[b], d[m])) m = b;
        if (m === n) break;
        [d[n], d[m]] = [d[m], d[n]];
        n = m;
      }
    }
    return top;
  }
  private menor(a: number, b: number) {
    return this.z[a] < this.z[b] || (this.z[a] === this.z[b] && a < b);
  }
}

/** Rellena las hoyas (priority-flood con pendiente mínima) para que toda celda drene al borde. */
export function rellenarHoyas(z: Float32Array, nx: number, ny: number, epsilon = 0.01): Float32Array {
  const out = Float32Array.from(z);
  const visto = new Uint8Array(nx * ny);
  const m = new Monticulo(out);
  for (let i = 0; i < nx; i++) {
    for (const j of [0, ny - 1]) {
      const k = j * nx + i;
      if (!visto[k]) { visto[k] = 1; m.meter(k); }
    }
  }
  for (let j = 0; j < ny; j++) {
    for (const i of [0, nx - 1]) {
      const k = j * nx + i;
      if (!visto[k]) { visto[k] = 1; m.meter(k); }
    }
  }
  while (m.tamano) {
    const k = m.sacar();
    const i = k % nx;
    const j = (k - i) / nx;
    for (let d = 0; d < 8; d++) {
      const a = i + DI[d];
      const b = j + DJ[d];
      if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
      const q = b * nx + a;
      if (visto[q]) continue;
      visto[q] = 1;
      if (out[q] <= out[k]) out[q] = out[k] + epsilon * DIST[d];
      m.meter(q);
    }
  }
  return out;
}

/** Dirección D8 de cada celda (0-7) o -1 si sale por el borde. Requiere un relieve sin hoyas. */
export function direccionD8(z: Float32Array, nx: number, ny: number, g: number): Int8Array {
  const dir = new Int8Array(nx * ny).fill(-1);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      if (i === 0 || j === 0 || i === nx - 1 || j === ny - 1) {
        dir[k] = -1;
        continue;
      }
      let mejor = 0;
      let dmejor = -1;
      for (let d = 0; d < 8; d++) {
        const q = (j + DJ[d]) * nx + (i + DI[d]);
        const p = (z[k] - z[q]) / (DIST[d] * g);
        if (p > mejor) {
          mejor = p;
          dmejor = d;
        }
      }
      dir[k] = dmejor;
    }
  }
  return dir;
}

export function vecino(k: number, d: number, nx: number): number {
  return k + DJ[d] * nx + DI[d];
}

/** Área drenada (en celdas) de cada celda, incluida ella misma. */
export function areaDrenada(z: Float32Array, dir: Int8Array, nx: number, ny: number): Float32Array {
  const n = nx * ny;
  const orden = new Uint32Array(n);
  for (let k = 0; k < n; k++) orden[k] = k;
  orden.sort((a, b) => z[b] - z[a] || a - b); // de arriba abajo
  const acc = new Float32Array(n).fill(1);
  for (let q = 0; q < n; q++) {
    const k = orden[q];
    const d = dir[k];
    if (d >= 0) acc[vecino(k, d, nx)] += acc[k];
  }
  return acc;
}

/** Pendiente en tanto por ciento (diferencias centradas). */
export function pendientePct(z: Float32Array, nx: number, ny: number, g: number): Float32Array {
  const out = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = Math.max(0, i - 1);
      const b = Math.min(nx - 1, i + 1);
      const c = Math.max(0, j - 1);
      const e = Math.min(ny - 1, j + 1);
      const gxv = (z[j * nx + b] - z[j * nx + a]) / ((b - a) * g);
      const gyv = (z[e * nx + i] - z[c * nx + i]) / ((e - c) * g);
      out[j * nx + i] = 100 * Math.hypot(gxv, gyv);
    }
  }
  return out;
}

/**
 * Distancia (m) de cada celda a la celda marcada más cercana y el índice de esa celda.
 * Transformada de distancia por barrido doble (chaflán 3-4), suficiente para el generador.
 */
export function distanciaA(marcas: Uint8Array, nx: number, ny: number, g: number): { dist: Float32Array; origen: Int32Array } {
  const n = nx * ny;
  const dist = new Float32Array(n).fill(Infinity);
  const origen = new Int32Array(n).fill(-1);
  for (let k = 0; k < n; k++) if (marcas[k]) { dist[k] = 0; origen[k] = k; }
  const prueba = (k: number, q: number) => {
    const o = origen[q];
    if (o < 0) return;
    const oi = o % nx, oj = (o - oi) / nx;
    const ki = k % nx, kj = (k - ki) / nx;
    const dd = Math.hypot(ki - oi, kj - oj) * g;
    if (dd < dist[k]) { dist[k] = dd; origen[k] = o; }
  };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    if (i > 0) prueba(k, k - 1);
    if (j > 0) { prueba(k, k - nx); if (i > 0) prueba(k, k - nx - 1); if (i < nx - 1) prueba(k, k - nx + 1); }
  }
  for (let j = ny - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i;
    if (i < nx - 1) prueba(k, k + 1);
    if (j < ny - 1) { prueba(k, k + nx); if (i < nx - 1) prueba(k, k + nx + 1); if (i > 0) prueba(k, k + nx - 1); }
  }
  return { dist, origen };
}

/**
 * Árbol de drenaje por inundación ordenada: desde las salidas del borde, cada celda se une a la vecina
 * por la que llega el agua. La prioridad es el relieve más un ruido fino, de modo que los cauces se
 * ramifican y serpentean como los reales en vez de ir en línea recta.
 * Devuelve el padre (celda aguas abajo, -1 en las salidas), el orden de llegada y la distancia al padre.
 */
export function arbolDrenaje(
  prioridad: Float32Array,
  nx: number,
  ny: number,
  esSalida: (k: number) => boolean,
): { padre: Int32Array; orden: Uint32Array; paso: Float32Array } {
  const n = nx * ny;
  const padre = new Int32Array(n).fill(-1);
  const paso = new Float32Array(n);
  const orden = new Uint32Array(n);
  const visto = new Uint8Array(n);
  const m = new Monticulo(prioridad);
  for (let k = 0; k < n; k++) {
    const i = k % nx;
    const j = (k - i) / nx;
    if ((i === 0 || j === 0 || i === nx - 1 || j === ny - 1) && esSalida(k)) {
      visto[k] = 1;
      m.meter(k);
    }
  }
  let q = 0;
  while (m.tamano) {
    const k = m.sacar();
    orden[q++] = k;
    const i = k % nx;
    const j = (k - i) / nx;
    for (let d = 0; d < 8; d++) {
      const a = i + DI[d];
      const b = j + DJ[d];
      if (a < 0 || b < 0 || a >= nx || b >= ny) continue;
      const v = b * nx + a;
      if (visto[v]) continue;
      visto[v] = 1;
      padre[v] = k;
      paso[v] = DIST[d];
      m.meter(v);
    }
  }
  return { padre, orden, paso };
}

/** Área drenada (en celdas) sobre el árbol de drenaje. */
export function areaArbol(padre: Int32Array, orden: Uint32Array): Float32Array {
  const acc = new Float32Array(padre.length).fill(1);
  for (let q = orden.length - 1; q >= 0; q--) {
    const k = orden[q];
    if (padre[k] >= 0) acc[padre[k]] += acc[k];
  }
  return acc;
}
