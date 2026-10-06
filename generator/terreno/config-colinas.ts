// Valores de diseño del generador de terreno de colinas (estilo Donbás: lomas suaves cortadas por
// balkas boscosas, campos grandes con lesosmugas y pueblos alargados en el fondo de los valles).
// No son reglas de combate: dan forma al mapa. Se muestran en la página de prueba y se pueden cambiar.

export interface ConfigColinas {
  ancho_m: number;
  alto_m: number;
  cota_base_m: number;
  amplitud_relieve_m: number;
  onda_lomas_m: number;
  inclinacion_regional_m: number;
  profundidad_balka_m: number;
  anchura_balka_m: number;
  cuenca_vaguada_km2: number;
  cuenca_arroyo_km2: number;
  cuenca_balka_plena_km2: number;
  bosque_pendiente_pct: number;
  bosque_cobertura_balka: number;
  bosque_cuenca_min_km2: number;
  bosque_manchas_meseta: number;
  pinar_fraccion: number;
  parcela_largo_m: [number, number];
  lesosmuga_transversal: number;
  lesosmuga_hueco_prob: number;
  cultivos: [string, number][];
  pueblos: [number, number];
  pueblo_largo_m: [number, number];
  casas_separacion_m: number;
}

export const CONFIG_COLINAS: ConfigColinas = {
  ancho_m: 4000,
  alto_m: 4000,
  cota_base_m: 160,
  amplitud_relieve_m: 55,
  onda_lomas_m: 2600,
  inclinacion_regional_m: 25,
  profundidad_balka_m: 24,
  anchura_balka_m: 230,
  cuenca_vaguada_km2: 0.1,
  cuenca_arroyo_km2: 1.0,
  cuenca_balka_plena_km2: 3,
  bosque_pendiente_pct: 9,
  bosque_cobertura_balka: 0.7,
  bosque_cuenca_min_km2: 0.25,
  bosque_manchas_meseta: 0.05,
  pinar_fraccion: 0.15,
  parcela_largo_m: [500, 950],
  lesosmuga_transversal: 0.35,
  lesosmuga_hueco_prob: 0.12,
  cultivos: [
    ["trigo", 35],
    ["cultivo_alto", 35],
    ["cultivo_bajo", 12],
    ["abierto", 18],
  ],
  pueblos: [1, 2],
  pueblo_largo_m: [700, 1300],
  casas_separacion_m: 32,
};

/** Explicación de cada valor, para el panel. */
export const EXPLICACION_COLINAS: Record<keyof ConfigColinas, string> = {
  ancho_m: "Ancho del mapa (oeste-este)",
  alto_m: "Fondo del mapa (sur-norte)",
  cota_base_m: "Cota media del terreno",
  amplitud_relieve_m: "Desnivel típico entre lomas",
  onda_lomas_m: "Separación típica entre lomas",
  inclinacion_regional_m: "Caída general del terreno de un lado a otro del mapa",
  profundidad_balka_m: "Profundidad de una balka grande",
  anchura_balka_m: "Anchura de una balka grande, de borde a borde",
  cuenca_vaguada_km2: "Superficie que tiene que drenar una vaguada para marcarse",
  cuenca_arroyo_km2: "Superficie que tiene que drenar un cauce para llevar agua",
  cuenca_balka_plena_km2: "Superficie a partir de la cual la balka alcanza su tamaño completo",
  bosque_pendiente_pct: "Pendiente a partir de la cual las laderas de balka tienen bosque",
  bosque_cobertura_balka: "Parte de las laderas de balka cubiertas de bosque",
  bosque_cuenca_min_km2: "Las vaguadas más pequeñas no tienen bosque",
  bosque_manchas_meseta: "Parte de la meseta con manchas de bosque",
  pinar_fraccion: "Parte del bosque que es pinar de repoblación",
  parcela_largo_m: "Largo de las parcelas entre lesosmugas (mínimo y máximo)",
  lesosmuga_transversal: "Probabilidad de lesosmuga en los lados cortos de la parcela",
  lesosmuga_hueco_prob: "Probabilidad de un hueco de 20-40 m en cada tramo de 200 m de lesosmuga",
  cultivos: "Reparto de cultivos por parcela (en %)",
  pueblos: "Número de pueblos (mínimo y máximo)",
  pueblo_largo_m: "Largo de la calle de un pueblo (mínimo y máximo)",
  casas_separacion_m: "Separación entre casas a lo largo de la calle",
};
