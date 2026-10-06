// Acceso a los parámetros del juego de reglas activo («Ucrania 2026» por defecto).
// Todo número de las reglas sale de aquí, con su id, para que el panel lo muestre y se pueda cambiar.

import reglasUcrania from "../rules/ucrania-2026.json";

export interface FilaParametro {
  id: string;
  categoria: string;
  nombre: string;
  valor: number;
  unidad: string;
  fuente: string;
  nota?: string | null;
  estado: string;
  uso: string;
}

export interface JuegoDeReglas {
  id: string;
  nombre: string;
  version: string;
  parametros: FilaParametro[];
}

export class Parametros {
  private readonly valores = new Map<string, number>();
  private readonly filas = new Map<string, FilaParametro>();
  readonly usados = new Set<string>();

  constructor(readonly juego: JuegoDeReglas, cambios: Record<string, number> = {}) {
    for (const f of juego.parametros) {
      this.filas.set(f.id, f);
      this.valores.set(f.id, f.valor);
    }
    for (const [id, v] of Object.entries(cambios)) {
      if (!this.filas.has(id)) throw new Error(`Parámetro desconocido: ${id}`);
      this.valores.set(id, v);
    }
  }

  /** Valor de un parámetro. Falla si no existe: ninguna cifra se inventa en el código. */
  v(id: string): number {
    const valor = this.valores.get(id);
    if (valor === undefined) throw new Error(`Falta el parámetro ${id} en el juego de reglas`);
    this.usados.add(id);
    return valor;
  }

  fila(id: string): FilaParametro | undefined {
    return this.filas.get(id);
  }

  cambiar(id: string, valor: number): void {
    if (!this.filas.has(id)) throw new Error(`Parámetro desconocido: ${id}`);
    this.valores.set(id, valor);
  }
}

export function reglasPorDefecto(cambios: Record<string, number> = {}): Parametros {
  return new Parametros(reglasUcrania as unknown as JuegoDeReglas, cambios);
}
