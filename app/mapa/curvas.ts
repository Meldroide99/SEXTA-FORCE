// Curvas de nivel por «marching squares» sobre la rejilla de cotas.
// Devuelve segmentos en metros (x hacia el este, y hacia el norte).

export interface Segmento {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function curvasDeNivel(
  z: Float32Array,
  nx: number,
  ny: number,
  g: number,
  equidistancia: number,
): Map<number, Segmento[]> {
  const porNivel = new Map<number, Segmento[]>();
  let min = Infinity;
  let max = -Infinity;
  for (const v of z) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const primero = Math.ceil(min / equidistancia) * equidistancia;
  for (let nivel = primero; nivel <= max; nivel += equidistancia) porNivel.set(nivel, []);
  const cx = (i: number) => (i + 0.5) * g;
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = z[j * nx + i];
      const b = z[j * nx + i + 1];
      const c = z[(j + 1) * nx + i + 1];
      const d = z[(j + 1) * nx + i];
      const lo = Math.min(a, b, c, d);
      const hi = Math.max(a, b, c, d);
      for (let nivel = Math.ceil(lo / equidistancia) * equidistancia; nivel <= hi; nivel += equidistancia) {
        if (nivel === lo && nivel === hi) continue;
        const t = (p: number, q: number) => (nivel - p) / (q - p || 1e-9);
        // puntos de corte en los cuatro lados: abajo (a-b), derecha (b-c), arriba (d-c), izquierda (a-d)
        const pts: [number, number][] = [];
        if ((a < nivel) !== (b < nivel)) pts.push([cx(i) + t(a, b) * g, cx(j)]);
        if ((b < nivel) !== (c < nivel)) pts.push([cx(i + 1), cx(j) + t(b, c) * g]);
        if ((d < nivel) !== (c < nivel)) pts.push([cx(i) + t(d, c) * g, cx(j + 1)]);
        if ((a < nivel) !== (d < nivel)) pts.push([cx(i), cx(j) + t(a, d) * g]);
        const lista = porNivel.get(nivel);
        if (!lista) continue;
        if (pts.length === 2) {
          lista.push({ x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1] });
        } else if (pts.length === 4) {
          lista.push({ x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1] });
          lista.push({ x1: pts[2][0], y1: pts[2][1], x2: pts[3][0], y2: pts[3][1] });
        }
      }
    }
  }
  return porNivel;
}
