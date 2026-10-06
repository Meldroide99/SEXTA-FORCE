import { test } from "node:test";
import assert from "node:assert/strict";
import { reglasPorDefecto } from "../engine/parametros";
import { lineaDeVista, prepararReglas, zonaVista } from "../engine/terreno/linea-de-vista";
import { Veg } from "../engine/terreno/tipos";
import { franja, loma, terrenoLlano } from "./ayudas";

const P = reglasPorDefecto();
const DE_PIE = 1.6;
const TUMBADO = 0.4;
const DRON = 150;
// Fila central del mapa de prueba (y = 255 m) para no tocar bordes.
const Y = 255;
const obs = (x: number, h = DE_PIE) => ({ x, y: Y, h });

test("terreno llano y abierto: se ve", () => {
  const t = terrenoLlano();
  const R = prepararReglas(t, P, "verano");
  const r = lineaDeVista(t, R, obs(5), obs(1500));
  assert.equal(r.estado, "visible");
});

test("una loma de 5 m entre los dos corta la vista", () => {
  const t = terrenoLlano();
  loma(t, 70, 75, 5);
  const R = prepararReglas(t, P, "verano");
  const r = lineaDeVista(t, R, obs(5), obs(1500));
  assert.equal(r.estado, "oculta");
  assert.equal(r.motivo, "relieve");
});

test("curvatura: por encima de 3 km dos tiradores tumbados en llano dejan de verse", () => {
  const t = terrenoLlano(600, 50);
  const R = prepararReglas(t, P, "verano");
  // con los ojos a 0,4 m el horizonte de cada uno está a √(0,4/0,067) ≈ 2,4 km: a 5,5 km no se ven
  const r = lineaDeVista(t, R, obs(5, TUMBADO), obs(5505, TUMBADO));
  assert.equal(r.estado, "oculta");
  assert.equal(r.motivo, "relieve");
  // de pie (horizonte a 4,9 km cada uno) sí se ven
  assert.equal(lineaDeVista(t, R, obs(5), obs(5505)).estado, "visible");
  // a 2 km no se aplica curvatura
  assert.equal(lineaDeVista(t, R, obs(5, TUMBADO), obs(2005, TUMBADO)).estado, "visible");
});

test("bosque de frondosas con hoja: 20 m de bosque se ven a través (parcial), 40 m no", () => {
  const t = terrenoLlano();
  franja(t, 100, 101, Veg.BosqueHoja); // 20 m
  const R = prepararReglas(t, P, "verano");
  const r1 = lineaDeVista(t, R, obs(505), obs(1500));
  assert.equal(r1.estado, "parcial");
  assert.equal(r1.factores[0].tipo, "a_traves_follaje");
  franja(t, 102, 103, Veg.BosqueHoja); // 40 m en total
  assert.equal(lineaDeVista(t, R, obs(505), obs(1500)).motivo, "bosque");
});

test("el mismo bosque de 40 m sin hoja (invierno) deja ver; el pinar no cambia", () => {
  const t = terrenoLlano();
  franja(t, 100, 103, Veg.BosqueHoja);
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "invierno"), obs(505), obs(1500)).estado, "parcial");
  franja(t, 100, 103, Veg.BosqueConifera);
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "invierno"), obs(505), obs(1500)).motivo, "bosque");
});

test("desde el linde (10 m dentro del bosque) se ve hacia fuera", () => {
  const t = terrenoLlano();
  franja(t, 0, 60, Veg.BosqueHoja); // bosque hasta x = 610
  const R = prepararReglas(t, P, "verano");
  assert.notEqual(lineaDeVista(t, R, obs(601), obs(1500)).estado, "oculta");
  assert.equal(lineaDeVista(t, R, obs(560), obs(1500)).estado, "oculta");
});

test("lesosmuga: con hoja corta siempre; sin hoja deja pasar en perpendicular con la detección a la mitad", () => {
  const t = terrenoLlano();
  franja(t, 100, 100, Veg.Lesosmuga); // 10 m de ancho
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "verano"), obs(505), obs(1500)).motivo, "lesosmuga");
  const r = lineaDeVista(t, prepararReglas(t, P, "invierno"), obs(505), obs(1500));
  assert.equal(r.estado, "parcial");
  assert.equal(r.factores[0].tipo, "lesosmuga_sin_hoja");
});

test("lesosmuga sin hoja vista muy en oblicuo: el tramo dentro pasa de 15 m y corta", () => {
  const t = terrenoLlano(200, 200);
  franja(t, 100, 100, Veg.Lesosmuga);
  const R = prepararReglas(t, P, "invierno");
  // rayo casi paralelo a la franja: recorre muchos metros dentro de ella
  const r = lineaDeVista(t, R, { x: 950, y: 50, h: DE_PIE }, { x: 1060, y: 1900, h: DE_PIE });
  assert.equal(r.motivo, "lesosmuga");
});

test("trigo de verano (1 m) tapa a un tirador tumbado; en otoño (rastrojo) no", () => {
  const t = terrenoLlano();
  franja(t, 140, 160, Veg.Trigo);
  const blanco = obs(1505, TUMBADO);
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "verano"), obs(5), blanco).motivo, "cultivo");
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "otono"), obs(5), blanco).estado, "visible");
  // de pie, el trigo no le tapa
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "verano"), obs(5), obs(1505)).estado, "visible");
});

test("girasol o maíz de 2 m tapa a un hombre de pie", () => {
  const t = terrenoLlano();
  franja(t, 140, 160, Veg.CultivoAlto);
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "verano"), obs(5), obs(1505)).motivo, "cultivo");
});

test("un edificio entre los dos corta la vista", () => {
  const t = terrenoLlano();
  franja(t, 80, 80, Veg.Edificio);
  assert.equal(lineaDeVista(t, prepararReglas(t, P, "verano"), obs(5), obs(1505)).motivo, "edificio");
});

test("dron a 150 m: ve al blanco dentro del bosque, pero bajo el dosel (térmica a la mitad)", () => {
  const t = terrenoLlano();
  franja(t, 140, 170, Veg.BosqueHoja);
  const R = prepararReglas(t, P, "verano");
  const r = lineaDeVista(t, R, obs(1000, DRON), obs(1555));
  assert.equal(r.estado, "parcial");
  assert.equal(r.factores[0].tipo, "bajo_dosel");
  // un observador en tierra no lo ve
  assert.equal(lineaDeVista(t, R, obs(1000), obs(1555)).motivo, "bosque");
});

test("dron a 150 m: ve por encima de una lesosmuga con hoja", () => {
  const t = terrenoLlano();
  franja(t, 120, 120, Veg.Lesosmuga);
  const R = prepararReglas(t, P, "verano");
  assert.equal(lineaDeVista(t, R, obs(800, DRON), obs(1500)).estado, "visible");
});

test("la línea de vista es la misma en los dos sentidos en terreno abierto", () => {
  const t = terrenoLlano(200, 200);
  loma(t, 90, 95, 3);
  const R = prepararReglas(t, P, "verano");
  const a = { x: 100, y: 300, h: DE_PIE };
  const b = { x: 1800, y: 1500, h: DE_PIE };
  assert.equal(lineaDeVista(t, R, a, b).estado, lineaDeVista(t, R, b, a).estado);
});

test("zona vista: una loma deja una zona oculta detrás", () => {
  const t = terrenoLlano(200, 50);
  loma(t, 50, 52, 8);
  const R = prepararReglas(t, P, "verano");
  const z = zonaVista(t, R, { x: 105, y: 255, h: DE_PIE }, DE_PIE, 20);
  const fila = Math.floor(255 / 20);
  assert.equal(z.datos[fila * z.nx + 20], 1); // x = 410 m, antes de la loma
  assert.equal(z.datos[fila * z.nx + 60], 0); // x = 1210 m, detrás
});
