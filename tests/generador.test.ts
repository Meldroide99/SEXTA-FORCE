import { test } from "node:test";
import assert from "node:assert/strict";
import { hashDatos } from "../engine/azar";
import { reglasPorDefecto } from "../engine/parametros";
import { Veg } from "../engine/terreno/tipos";
import { generarColinas } from "../generator/terreno/colinas";

const P = reglasPorDefecto();
const t1 = generarColinas(1, P);

test("misma semilla, mismo terreno; otra semilla, otro terreno", () => {
  const otra = generarColinas(1, reglasPorDefecto());
  assert.equal(hashDatos(t1.z), hashDatos(otra.z));
  assert.equal(hashDatos(t1.veg), hashDatos(otra.veg));
  assert.equal(JSON.stringify(t1.elementos), JSON.stringify(otra.elementos));
  const t2 = generarColinas(2, P);
  assert.notEqual(hashDatos(t1.z), hashDatos(t2.z));
});

test("rejilla de 10 m y mapa de 4 × 4 km", () => {
  assert.equal(t1.rejilla_m, 10);
  assert.equal(t1.nx * t1.rejilla_m, 4000);
  assert.equal(t1.ny * t1.rejilla_m, 4000);
});

test("relieve de colinas: desnivel entre 30 y 150 m", () => {
  let min = Infinity, max = -Infinity;
  for (const z of t1.z) { min = Math.min(min, z); max = Math.max(max, z); }
  assert.ok(max - min > 30 && max - min < 150, `desnivel ${max - min}`);
});

for (const semilla of [1, 2, 3, 4, 5]) {
  test(`semilla ${semilla}: hay arroyos, bosque, lesosmugas, cultivos, pueblo con casas, carretera y cotas`, () => {
    const t = semilla === 1 ? t1 : generarColinas(semilla, P);
    const cuenta = new Map<number, number>();
    for (const v of t.veg) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
    const pct = (c: number) => (100 * (cuenta.get(c) ?? 0)) / t.veg.length;
    assert.ok(pct(Veg.Agua) > 0, "agua");
    assert.ok(pct(Veg.BosqueHoja) + pct(Veg.BosqueConifera) > 3, "bosque");
    assert.ok(pct(Veg.Lesosmuga) > 0.3, "lesosmugas");
    assert.ok(pct(Veg.Trigo) + pct(Veg.CultivoAlto) + pct(Veg.CultivoBajo) > 25, "cultivos");
    assert.ok((cuenta.get(Veg.Edificio) ?? 0) > 20, "casas");
    assert.ok(t.elementos.some((e) => e.tipo === "carretera"), "carretera");
    assert.ok(t.elementos.some((e) => e.tipo === "arroyo"), "arroyo");
    assert.ok(t.toponimos.some((p) => p.clase === "pueblo"), "pueblo");
    assert.ok(t.toponimos.some((p) => p.clase === "cota"), "cota");
  });
}

test("los arroyos bajan siempre: cada cauce termina más bajo de lo que empieza", () => {
  const g = t1.rejilla_m;
  const zEn = (x: number, y: number) => t1.z[Math.min(t1.ny - 1, Math.floor(y / g)) * t1.nx + Math.min(t1.nx - 1, Math.floor(x / g))];
  for (const e of t1.elementos.filter((e) => e.tipo === "arroyo")) {
    const a = e.geometria[0];
    const b = e.geometria[e.geometria.length - 1];
    assert.ok(zEn(b.x, b.y) <= zEn(a.x, a.y) + 0.5);
  }
});

test("las lesosmugas no tienen huecos diagonales por los que se cuele la vista", () => {
  // cada celda de lesosmuga tiene al menos una vecina de lado (no solo en diagonal) si la franja sigue
  const { nx, ny, veg } = t1;
  let aisladasEnDiagonal = 0;
  for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const k = j * nx + i;
    if (veg[k] !== Veg.Lesosmuga) continue;
    const lado = [k - 1, k + 1, k - nx, k + nx].some((q) => veg[q] === Veg.Lesosmuga);
    const diag = [k - nx - 1, k - nx + 1, k + nx - 1, k + nx + 1].some((q) => veg[q] === Veg.Lesosmuga);
    if (!lado && diag) aisladasEnDiagonal++;
  }
  assert.equal(aisladasEnDiagonal, 0);
});
