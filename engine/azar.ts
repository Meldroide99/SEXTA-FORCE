// Generador de números aleatorios con semilla (sfc32 sembrado con splitmix32).
// Misma semilla → misma secuencia en cualquier navegador u ordenador (D-001).

export interface Azar {
  /** Número en [0, 1). */
  siguiente(): number;
  /** Entero en [min, max], ambos incluidos. */
  entero(min: number, max: number): number;
  /** Número en [min, max). */
  rango(min: number, max: number): number;
  /** Elige un elemento según pesos. */
  ponderado<T>(opciones: ReadonlyArray<readonly [T, number]>): T;
  /** Estado interno, para guardar la partida. */
  estado(): string;
}

function splitmix32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export function crearAzar(semilla: number | string, estadoGuardado?: string): Azar {
  let a: number, b: number, c: number, d: number;
  if (estadoGuardado) {
    [a, b, c, d] = estadoGuardado.split(",").map((s) => Number(s) | 0);
  } else {
    const sm = splitmix32(typeof semilla === "number" ? semilla : hashTexto(semilla));
    a = sm(); b = sm(); c = sm(); d = sm();
  }
  const siguiente = (): number => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  return {
    siguiente,
    entero: (min, max) => min + Math.floor(siguiente() * (max - min + 1)),
    rango: (min, max) => min + siguiente() * (max - min),
    ponderado<T>(opciones: ReadonlyArray<readonly [T, number]>): T {
      const total = opciones.reduce((s, [, p]) => s + p, 0);
      let r = siguiente() * total;
      for (const [v, p] of opciones) {
        r -= p;
        if (r < 0) return v;
      }
      return opciones[opciones.length - 1][0];
    },
    estado: () => [a, b, c, d].map((x) => x | 0).join(","),
  };
}

/** Hash FNV-1a de 32 bits de un texto. */
export function hashTexto(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Hash FNV-1a de 32 bits de un bloque de datos (para comprobar que dos partidas son iguales). */
export function hashDatos(datos: ArrayBufferView): string {
  const bytes = new Uint8Array(datos.buffer, datos.byteOffset, datos.byteLength);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
