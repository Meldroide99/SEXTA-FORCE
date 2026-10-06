// Página de prueba de la entrega 1: generador de terreno de colinas y línea de vista.

import { reglasPorDefecto, type Parametros } from "../../engine/parametros";
import {
  lineaDeVista,
  perfil,
  prepararReglas,
  type Observador,
  type ReglasLdV,
  type ResultadoLdV,
} from "../../engine/terreno/linea-de-vista";
import { NOMBRE_VEG, Veg, cota, vegEn, type Estacion, type Punto, type Terreno } from "../../engine/terreno/tipos";
import { generarColinas } from "../../generator/terreno/colinas";
import { CONFIG_COLINAS, EXPLICACION_COLINAS } from "../../generator/terreno/config-colinas";
import { curvasDeNivel, type Segmento } from "../mapa/curvas";
import { rasterSuave, rellenarConVecinos, type RGBA } from "../mapa/suavizado";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fmt = (v: number, dec = 0) => v.toLocaleString("es-ES", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const MOTIVO: Record<string, string> = {
  relieve: "el relieve",
  bosque: "el bosque",
  lesosmuga: "una lesosmuga",
  cultivo: "el cultivo",
  edificio: "un edificio",
};
const ESTADO: Record<string, string> = { visible: "Se ve", parcial: "Se ve con limitaciones", oculta: "No se ve" };

// ---------- colores de la hoja (papel: iguales en los dos temas) ----------
type RGB = [number, number, number];
function colorVeg(c: number, est: Estacion, hoja: boolean): RGB {
  switch (c) {
    case Veg.Abierto: return [236, 236, 222];
    case Veg.Trigo: return est === "verano" ? [238, 220, 140] : est === "primavera" ? [200, 222, 150] : [226, 220, 196];
    case Veg.CultivoAlto: return est === "verano" || est === "otono" ? [214, 196, 96] : [214, 204, 180];
    case Veg.CultivoBajo: return est === "primavera" || est === "verano" ? [214, 230, 120] : [222, 218, 196];
    case Veg.BosqueHoja: return hoja ? [128, 176, 104] : [168, 176, 140];
    case Veg.BosqueConifera: return [86, 140, 98];
    case Veg.Lesosmuga: return hoja ? [72, 128, 70] : [128, 140, 108];
    case Veg.Edificio: return [40, 36, 34];
    case Veg.Agua: return [120, 170, 220];
    default: return [236, 236, 222];
  }
}

// ---------- estado ----------
const P: Parametros = reglasPorDefecto();
let terreno: Terreno;
let curvas: Map<number, Segmento[]>;
let estacion: Estacion = "verano";
let R: ReglasLdV;
let modo: "zona" | "linea" = "zona";
let observador: Punto | null = null;
let A: Punto | null = null;
let B: Punto | null = null;
let esperandoB = false;
let zona: { nx: number; ny: number; paso: number; datos: Uint8Array; hecho: number } | null = null;
let trabajoZona = 0;
const base = document.createElement("canvas");
const capaZona = document.createElement("canvas");
const FACTOR_BASE = 4; // 2,5 m por píxel en la hoja base
const COLORES_ZONA: Record<number, RGBA> = { 0: [24, 28, 40, 125], 1: [60, 170, 80, 24], 2: [235, 170, 20, 115], 255: [0, 0, 0, 0] };
const lienzo = $<HTMLCanvasElement>("lienzo");
const ctx = lienzo.getContext("2d")!;
const vista = { escala: 1, ox: 0, oy: 0 };

const hObs = () => Number($<HTMLSelectElement>("obs").value);
const hBlanco = () => parseFloat($<HTMLSelectElement>("blanco").value);
const anchoM = () => terreno.nx * terreno.rejilla_m;
const altoM = () => terreno.ny * terreno.rejilla_m;

// ---------- generación ----------
function generar(semilla: number) {
  $("carga").hidden = false;
  setTimeout(() => {
    terreno = generarColinas(semilla, P);
    curvas = curvasDeNivel(terreno.z, terreno.nx, terreno.ny, terreno.rejilla_m, P.v("terreno.curvas_equidistancia_m"));
    R = prepararReglas(terreno, P, estacion);
    dibujarBase();
    prepararVectores();
    // situación inicial: observador en la cota más alta y línea hasta el pueblo
    const cotas = terreno.toponimos.filter((t) => t.clase === "cota");
    const pueblo = terreno.toponimos.find((t) => t.clase === "pueblo");
    observador = puntoDeObservacion(cotas[0]?.posicion ?? { x: anchoM() / 2, y: altoM() / 2 });
    A = observador;
    B = pueblo?.posicion ?? { x: anchoM() * 0.3, y: altoM() * 0.3 };
    esperandoB = false;
    encuadrar();
    calcularZona();
    actualizarLinea();
    pintarParametros();
    $("carga").hidden = true;
  }, 30);
}

// ---------- hoja base: colores y sombreado, una celda por píxel ----------
function dibujarBase() {
  const t = terreno;
  const { nx, ny } = t;
  const g = t.rejilla_m;
  const hoja = t.estacional.hoja[estacion];
  // sombreado del relieve por celda (luz del noroeste, suave)
  const luz = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const zl = t.z[j * nx + Math.max(0, i - 1)];
      const zr = t.z[j * nx + Math.min(nx - 1, i + 1)];
      const zd = t.z[Math.max(0, j - 1) * nx + i];
      const zu = t.z[Math.min(ny - 1, j + 1) * nx + i];
      const gx = (zr - zl) / (2 * g);
      const gy = (zu - zd) / (2 * g);
      luz[j * nx + i] = Math.max(0.74, Math.min(1.1, 0.95 + (-gx * 0.7 + gy * 0.7) * 1.4));
    }
  }
  // lesosmugas, arroyos y casas se dibujan como líneas y símbolos encima
  const superficie = rellenarConVecinos(t.veg, nx, ny, new Set([Veg.Lesosmuga, Veg.Agua, Veg.Edificio]));
  const colores: Record<number, RGBA> = {};
  for (const c of [Veg.Abierto, Veg.Trigo, Veg.CultivoAlto, Veg.CultivoBajo, Veg.BosqueHoja, Veg.BosqueConifera]) {
    colores[c] = [...colorVeg(c, estacion, hoja), 255] as RGBA;
  }
  const r = rasterSuave(superficie, nx, ny, FACTOR_BASE, colores, { luz, pasadas: 1, borde: 0.14 });
  base.width = r.ancho;
  base.height = r.alto;
  base.getContext("2d")!.putImageData(new ImageData(r.datos, r.ancho, r.alto), 0, 0);
}

// ---------- capas de líneas en metros (se dibujan nítidas a cualquier zoom) ----------
interface Vectores {
  curvas: Path2D;
  maestras: Path2D;
  rotulosCurva: { x: number; y: number; texto: string }[];
  arroyos: Path2D;
  caminos: Path2D;
  calles: Path2D;
  carretera: Path2D;
  lesosmugas: Path2D;
  puentes: Punto[];
  vados: Punto[];
  casas: Path2D;
}
let vec: Vectores;

function prepararVectores() {
  const linea = (path: Path2D, pts: Punto[]) => pts.forEach((p, q) => (q ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
  const v: Vectores = {
    curvas: new Path2D(), maestras: new Path2D(), rotulosCurva: [], arroyos: new Path2D(), caminos: new Path2D(),
    calles: new Path2D(), carretera: new Path2D(), lesosmugas: new Path2D(), puentes: [], vados: [], casas: new Path2D(),
  };
  for (const [nivel, segs] of curvas) {
    const maestra = nivel % 50 === 0;
    const path = maestra ? v.maestras : v.curvas;
    for (const sg of segs) { path.moveTo(sg.x1, sg.y1); path.lineTo(sg.x2, sg.y2); }
    if (maestra) {
      for (let q = 450; q < segs.length; q += 1100) {
        const sg = segs[q];
        v.rotulosCurva.push({ x: (sg.x1 + sg.x2) / 2, y: (sg.y1 + sg.y2) / 2, texto: String(nivel) });
      }
    }
  }
  for (const e of terreno.elementos) {
    if (e.tipo === "arroyo") linea(v.arroyos, e.geometria);
    else if (e.tipo === "camino") linea(e.nombre?.startsWith("Calle") ? v.calles : v.caminos, e.geometria);
    else if (e.tipo === "carretera") linea(v.carretera, e.geometria);
    else if (e.tipo === "lesosmuga") linea(v.lesosmugas, e.geometria);
    else if (e.tipo === "puente") v.puentes.push(e.geometria[0]);
    else if (e.tipo === "vado") v.vados.push(e.geometria[0]);
  }
  const g = terreno.rejilla_m;
  for (let k = 0; k < terreno.veg.length; k++) {
    if (terreno.veg[k] !== Veg.Edificio) continue;
    const x = (k % terreno.nx) * g;
    const y = Math.floor(k / terreno.nx) * g;
    v.casas.roundRect(x + 0.6, y + 0.6, g - 1.2, g - 1.2, 1.5);
  }
  vec = v;
}

function dibujarVectores(dpr: number) {
  const s = vista.escala;
  const hoja = terreno.estacional.hoja[estacion];
  ctx.save();
  // de metros (y hacia el norte) a píxeles del lienzo
  ctx.setTransform(dpr * s, 0, 0, -dpr * s, dpr * vista.ox, dpr * (vista.oy + altoM() * s));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const px = (n: number) => n / s;
  ctx.strokeStyle = "rgba(150, 100, 60, 0.55)";
  ctx.lineWidth = px(0.7);
  ctx.stroke(vec.curvas);
  ctx.strokeStyle = "rgba(140, 86, 44, 0.95)";
  ctx.lineWidth = px(1.4);
  ctx.stroke(vec.maestras);
  ctx.lineCap = "butt";
  ctx.strokeStyle = hoja ? "rgb(52, 108, 54)" : "rgb(104, 118, 86)";
  ctx.lineWidth = Math.max(px(2), P.v("terreno.vegetacion.lesosmuga_ancho_m"));
  ctx.stroke(vec.lesosmugas);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgb(52, 118, 196)";
  ctx.lineWidth = Math.max(px(1.8), 5);
  ctx.stroke(vec.arroyos);
  ctx.fillStyle = "rgb(44, 40, 38)";
  ctx.fill(vec.casas);
  ctx.strokeStyle = "rgb(110, 70, 36)";
  ctx.lineWidth = px(1.3);
  ctx.setLineDash([px(6), px(4)]);
  ctx.stroke(vec.caminos);
  ctx.setLineDash([]);
  ctx.lineWidth = px(2.2);
  ctx.stroke(vec.calles);
  ctx.strokeStyle = "rgb(70, 30, 20)";
  ctx.lineWidth = px(5);
  ctx.stroke(vec.carretera);
  ctx.strokeStyle = "rgb(226, 96, 48)";
  ctx.lineWidth = px(3);
  ctx.stroke(vec.carretera);
  ctx.restore();

  // símbolos y rótulos en píxeles de pantalla
  for (const p of vec.puentes) {
    const q = aPx(p);
    ctx.strokeStyle = "rgb(20, 20, 20)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(q.x - 5, q.y - 5, 10, 10);
  }
  for (const p of vec.vados) {
    const q = aPx(p);
    ctx.strokeStyle = "rgb(30, 80, 150)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 4.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.font = "600 10.5px 'IBM Plex Sans', sans-serif";
  for (const r of vec.rotulosCurva) {
    const q = aPx(r);
    halo(ctx, r.texto, q.x, q.y, "center", "rgb(140, 86, 44)");
  }
  // cuadrícula de 1 km
  const r0 = aPx({ x: 0, y: altoM() });
  const r1 = aPx({ x: anchoM(), y: 0 });
  ctx.strokeStyle = "rgba(20, 30, 40, 0.3)";
  ctx.lineWidth = 1;
  ctx.font = "500 11px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "alphabetic";
  for (let km = 0; km <= anchoM() / 1000; km++) {
    const x = aPx({ x: km * 1000, y: 0 }).x;
    ctx.beginPath(); ctx.moveTo(x, r0.y); ctx.lineTo(x, r1.y); ctx.stroke();
    halo(ctx, String(km).padStart(2, "0"), x + 3, Math.min(r1.y, lienzo.clientHeight) - 6, "left", "rgb(20, 30, 40)");
  }
  for (let km = 0; km <= altoM() / 1000; km++) {
    const y = aPx({ x: 0, y: km * 1000 }).y;
    ctx.beginPath(); ctx.moveTo(r0.x, y); ctx.lineTo(r1.x, y); ctx.stroke();
    halo(ctx, String(km).padStart(2, "0"), Math.max(r0.x, 0) + 4, y - 4, "left", "rgb(20, 30, 40)");
  }
  // topónimos
  ctx.textBaseline = "middle";
  for (const tp of terreno.toponimos) {
    const { x, y } = aPx(tp.posicion);
    if (tp.clase === "cota") {
      ctx.fillStyle = "rgb(20, 20, 20)";
      ctx.beginPath();
      ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); ctx.closePath();
      ctx.fill();
      ctx.font = "600 12px 'IBM Plex Sans', sans-serif";
      halo(ctx, String(Math.round(tp.cota_m ?? 0)), x + 8, y, "left");
    } else if (tp.clase === "pueblo") {
      ctx.font = "700 16px 'Barlow Condensed', sans-serif";
      halo(ctx, tp.nombre.toUpperCase(), x, y - 20, "center");
    } else {
      ctx.font = "italic 500 12.5px 'IBM Plex Sans', sans-serif";
      halo(ctx, tp.nombre, x + 10, y, "left", "rgb(30, 80, 150)");
    }
  }
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

/** Punto alto y despejado cerca de `p` (pasto o cultivo bajo), para la situación inicial. */
function puntoDeObservacion(p: Punto): Punto {
  const t = terreno;
  const g = t.rejilla_m;
  for (const radio of [400, 800, 1600, 3200]) {
    let mejor: Punto | null = null;
    let zm = -Infinity;
    for (let dy = -radio; dy <= radio; dy += g) for (let dx = -radio; dx <= radio; dx += g) {
      const q = { x: p.x + dx, y: p.y + dy };
      if (q.x < 0 || q.y < 0 || q.x >= anchoM() || q.y >= altoM() || Math.hypot(dx, dy) > radio) continue;
      const c = vegEn(t, q.x, q.y);
      if (R.hCultivo[c] >= 1.2 || c === Veg.BosqueHoja || c === Veg.BosqueConifera || c === Veg.Lesosmuga || c === Veg.Edificio || c === Veg.Agua) continue;
      const z = cota(t, q.x, q.y);
      if (z > zm) { zm = z; mejor = { x: Math.floor(q.x / g) * g + g / 2, y: Math.floor(q.y / g) * g + g / 2 }; }
    }
    if (mejor) return mejor;
  }
  return p;
}

function halo(c: CanvasRenderingContext2D, texto: string, x: number, y: number, al: CanvasTextAlign, color = "rgb(20, 20, 20)") {
  c.textAlign = al;
  c.lineWidth = 3.5;
  c.strokeStyle = "rgba(240, 240, 228, 0.9)";
  c.strokeText(texto, x, y);
  c.fillStyle = color;
  c.fillText(texto, x, y);
}

// ---------- zona vista (calculada por filas para no bloquear la página) ----------
function calcularZona() {
  if (!observador) return;
  const paso = 20;
  const nx = Math.floor(anchoM() / paso);
  const ny = Math.floor(altoM() / paso);
  zona = { nx, ny, paso, datos: new Uint8Array(nx * ny).fill(255), hecho: 0 };
  const yo = ++trabajoZona;
  const obs: Observador = { ...observador, h: hObs() };
  const hb = hBlanco();
  const filasPorTanda = 12;
  const tanda = () => {
    if (yo !== trabajoZona || !zona) return;
    const fin = Math.min(ny, zona.hecho + filasPorTanda);
    for (let j = zona.hecho; j < fin; j++) {
      for (let i = 0; i < nx; i++) {
        const r = lineaDeVista(terreno, R, obs, { x: (i + 0.5) * paso, y: (j + 0.5) * paso, h: hb });
        zona.datos[j * nx + i] = r.estado === "visible" ? 1 : r.estado === "parcial" ? 2 : 0;
      }
    }
    zona.hecho = fin;
    pintarCapaZona();
    dibujar();
    pintarResumen();
    if (fin < ny) requestAnimationFrame(tanda);
  };
  requestAnimationFrame(tanda);
}

function pintarCapaZona() {
  if (!zona) return;
  const { nx, ny, datos } = zona;
  const r = rasterSuave(datos, nx, ny, 4, COLORES_ZONA, { pasadas: 1, borde: 0.18 });
  capaZona.width = r.ancho;
  capaZona.height = r.alto;
  capaZona.getContext("2d")!.putImageData(new ImageData(r.datos, r.ancho, r.alto), 0, 0);
}

// ---------- dibujo del lienzo ----------
function tamanoLienzo() {
  const r = lienzo.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  lienzo.width = Math.round(r.width * dpr);
  lienzo.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return r;
}

function encuadrar() {
  const r = tamanoLienzo();
  vista.escala = Math.min(r.width / anchoM(), r.height / altoM());
  vista.ox = (r.width - anchoM() * vista.escala) / 2;
  vista.oy = (r.height - altoM() * vista.escala) / 2;
  dibujar();
}

const aPx = (p: Punto) => ({ x: vista.ox + p.x * vista.escala, y: vista.oy + (altoM() - p.y) * vista.escala });
const aM = (x: number, y: number): Punto => ({ x: (x - vista.ox) / vista.escala, y: altoM() - (y - vista.oy) / vista.escala });

function dibujar() {
  if (!terreno) return;
  const r = lienzo.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  ctx.fillStyle = "#e8e6da";
  ctx.fillRect(0, 0, r.width, r.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(base, vista.ox, vista.oy, anchoM() * vista.escala, altoM() * vista.escala);
  dibujarVectores(window.devicePixelRatio || 1);
  if (zona) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(capaZona, vista.ox, vista.oy, zona.nx * zona.paso * vista.escala, zona.ny * zona.paso * vista.escala);
  }
  // anillos de distancia alrededor del observador
  if (observador) {
    const o = aPx(observador);
    ctx.strokeStyle = "rgba(20, 24, 30, 0.55)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(20, 24, 30, 0.8)";
    for (const d of [500, 1000, 2000]) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, d * vista.escala, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillText(`${fmt(d)} m`, o.x + 3, o.y - d * vista.escala - 4);
    }
    ctx.setLineDash([]);
    marca(o, "rgb(20, 24, 30)", "O");
  }
  // línea entre dos puntos
  if (A) {
    const a = aPx(A);
    if (B) {
      const b = aPx(B);
      const res = resultadoLinea;
      const col = res?.estado === "visible" ? "rgb(40, 130, 60)" : res?.estado === "parcial" ? "rgb(200, 140, 10)" : "rgb(176, 50, 34)";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      if (res?.estado === "oculta" && res.corte_en_m !== undefined) {
        const t = res.corte_en_m / res.distancia_m;
        const c = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        ctx.strokeStyle = "rgb(40, 130, 60)";
        ctx.lineTo(c.x, c.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = col;
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(c.x - 6, c.y - 6); ctx.lineTo(c.x + 6, c.y + 6);
        ctx.moveTo(c.x + 6, c.y - 6); ctx.lineTo(c.x - 6, c.y + 6);
        ctx.stroke();
      } else {
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      marca(b, col, "B");
    }
    if (A !== observador) marca(a, "rgb(20, 24, 30)", "A");
  }
}

function marca(p: { x: number; y: number }, color: string, letra: string) {
  ctx.fillStyle = "rgba(250, 250, 245, 0.95)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "700 11px 'IBM Plex Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letra, p.x, p.y + 0.5);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// ---------- línea entre dos puntos ----------
let resultadoLinea: ResultadoLdV | null = null;
function actualizarLinea() {
  if (!A || !B) {
    resultadoLinea = null;
    pintarResultado();
    pintarPerfil();
    dibujar();
    return;
  }
  resultadoLinea = lineaDeVista(terreno, R, { ...A, h: hObs() }, { ...B, h: hBlanco() });
  pintarResultado();
  pintarPerfil();
  dibujar();
}

function lugar(p: Punto): string {
  return `X ${fmt(p.x)} · Y ${fmt(p.y)} m, cota ${fmt(cota(terreno, p.x, p.y))} m, ${NOMBRE_VEG[vegEn(terreno, p.x, p.y)]}`;
}

function pintarResultado() {
  const el = $("resultado");
  const obsTxt = $<HTMLSelectElement>("obs").selectedOptions[0].text;
  const blTxt = $<HTMLSelectElement>("blanco").selectedOptions[0].text;
  if (!resultadoLinea || !A || !B) {
    el.innerHTML = `<h2>Entre dos puntos</h2><p class="ayuda">${esperandoB ? "Ahora pincha el punto B (el blanco)." : "Elige «Entre dos puntos» y pincha A y B en el mapa."}</p>`;
    return;
  }
  const r = resultadoLinea;
  const corte = r.estado === "oculta"
    ? `<dt>Lo corta</dt><dd>${MOTIVO[r.motivo!]} a ${fmt(r.corte_en_m!)} m de A</dd>`
    : "";
  const factores = r.factores.length
    ? `<ul class="factores">${r.factores.map((f) => `<li>${f.texto} <code>${f.parametro}</code></li>`).join("")}</ul>`
    : "";
  el.innerHTML = `<h2>Entre dos puntos</h2>
    <span class="chip ${r.estado}">${ESTADO[r.estado]}</span>
    <dl>
      <dt>Distancia</dt><dd>${fmt(r.distancia_m)} m</dd>${corte}
      <dt>A</dt><dd>${lugar(A)}</dd>
      <dt>B</dt><dd>${lugar(B)}</dd>
      <dt>Alturas</dt><dd>${obsTxt} → ${blTxt}</dd>
    </dl>${factores}`;
}

function pintarResumen() {
  const el = $("resumen");
  if (!zona || !observador) { el.innerHTML = ""; return; }
  const { nx, ny, paso, datos, hecho } = zona;
  const anillos = [500, 1000, 2000];
  const tot = anillos.map(() => 0);
  const vis = anillos.map(() => 0);
  for (let j = 0; j < hecho; j++) for (let i = 0; i < nx; i++) {
    const d = Math.hypot((i + 0.5) * paso - observador.x, (j + 0.5) * paso - observador.y);
    const v = datos[j * nx + i];
    anillos.forEach((r, q) => { if (d <= r) { tot[q]++; if (v === 1 || v === 2) vis[q]++; } });
  }
  const pct = (q: number) => (tot[q] ? `${fmt((100 * vis[q]) / tot[q])} %` : "—");
  const progreso = hecho < ny ? `<p class="ayuda">Calculando… ${fmt((100 * hecho) / ny)} %</p>` : "";
  el.innerHTML = `<h2>Zona vista desde O</h2>
    <div class="cifras">${anillos.map((r, q) => `<div class="cifra"><b>${pct(q)}</b><span>visible a ≤ ${fmt(r)} m</span></div>`).join("")}</div>
    <dl><dt>O</dt><dd>${lugar(observador)}</dd></dl>
    <p class="ayuda">Oscuro: no se ve. Ámbar: se ve con limitaciones (follaje, lesosmuga sin hoja o bajo el dosel). Rejilla de cálculo de ${paso} m.</p>${progreso}`;
}

function pintarPerfil() {
  const el = $("perfil");
  if (!A || !B || !resultadoLinea) {
    el.innerHTML = `<h2>Perfil</h2><p class="perfil-vacio">Pincha dos puntos en el modo «Entre dos puntos» para ver el perfil del terreno.</p>`;
    return;
  }
  const pts = perfil(terreno, R, { ...A, h: hObs() }, { ...B, h: hBlanco() });
  const W = 900, H = 230, ml = 46, mr = 14, mt = 14, mb = 30;
  const d = pts[pts.length - 1].s;
  let zmin = Infinity, zmax = -Infinity;
  for (const p of pts) { zmin = Math.min(zmin, p.suelo); zmax = Math.max(zmax, p.obstaculo, p.rayo); }
  zmin = Math.floor((zmin - 5) / 10) * 10;
  zmax = Math.ceil((zmax + 5) / 10) * 10;
  const sx = (s: number) => ml + ((W - ml - mr) * s) / Math.max(d, 1);
  const sy = (z: number) => mt + ((H - mt - mb) * (zmax - z)) / (zmax - zmin);
  const suelo = pts.map((p, q) => `${q ? "L" : "M"}${sx(p.s).toFixed(1)},${sy(p.suelo).toFixed(1)}`).join("");
  const area = `${suelo}L${sx(d).toFixed(1)},${sy(zmin).toFixed(1)}L${sx(0).toFixed(1)},${sy(zmin).toFixed(1)}Z`;
  // vegetación y edificios como barras sobre el suelo
  const barras = pts.map((p, q) => {
    if (p.obstaculo - p.suelo < 0.3) return "";
    const ancho = Math.max(1, sx(pts[Math.min(q + 1, pts.length - 1)].s) - sx(p.s));
    const color = p.clase === Veg.Edificio ? "var(--tinta)" : p.clase === Veg.Trigo || p.clase === Veg.CultivoAlto || p.clase === Veg.CultivoBajo ? "var(--parcial)" : "var(--visible)";
    return `<rect x="${sx(p.s).toFixed(1)}" y="${sy(p.obstaculo).toFixed(1)}" width="${ancho.toFixed(1)}" height="${(sy(p.suelo) - sy(p.obstaculo)).toFixed(1)}" fill="${color}" opacity="0.55"/>`;
  }).join("");
  const r = resultadoLinea;
  const colRayo = r.estado === "visible" ? "var(--visible)" : r.estado === "parcial" ? "var(--parcial)" : "var(--oculta)";
  const z0 = pts[0].rayo;
  const z1 = pts[pts.length - 1].rayo;
  const ticksZ: number[] = [];
  const pasoZ = (zmax - zmin) > 80 ? 20 : 10;
  for (let z = zmin; z <= zmax; z += pasoZ) ticksZ.push(z);
  const pasoS = d > 3000 ? 1000 : d > 1200 ? 500 : d > 500 ? 200 : 100;
  const ticksS: number[] = [];
  for (let s = 0; s <= d; s += pasoS) ticksS.push(s);
  const corte = r.estado === "oculta" && r.corte_en_m !== undefined
    ? `<line x1="${sx(r.corte_en_m)}" x2="${sx(r.corte_en_m)}" y1="${mt}" y2="${H - mb}" stroke="var(--oculta)" stroke-dasharray="3 3"/>
       <text x="${sx(r.corte_en_m) + 4}" y="${mt + 10}" fill="var(--oculta)" font-size="12">corta ${MOTIVO[r.motivo!]}</text>`
    : "";
  el.innerHTML = `<h2>Perfil de A a B · ${fmt(d)} m</h2>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Perfil del terreno entre A y B">
    ${ticksZ.map((z) => `<line x1="${ml}" x2="${W - mr}" y1="${sy(z)}" y2="${sy(z)}" stroke="var(--linea)" stroke-width="0.6"/><text x="${ml - 6}" y="${sy(z) + 4}" text-anchor="end" font-size="11" fill="var(--tinta-suave)" font-family="var(--f-dato)">${z}</text>`).join("")}
    ${ticksS.map((s) => `<text x="${sx(s)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="var(--tinta-suave)" font-family="var(--f-dato)">${fmt(s)}</text>`).join("")}
    <text x="${W - mr}" y="${H - 10}" text-anchor="end" font-size="11" fill="var(--tinta-suave)">m</text>
    <path d="${area}" fill="var(--curva)" opacity="0.28"/>
    <path d="${suelo}" fill="none" stroke="var(--curva)" stroke-width="1.6"/>
    ${barras}
    <line x1="${sx(0)}" y1="${sy(z0)}" x2="${sx(d)}" y2="${sy(z1)}" stroke="${colRayo}" stroke-width="2"/>
    ${corte}
    <circle cx="${sx(0)}" cy="${sy(z0)}" r="4" fill="var(--tinta)"/><text x="${sx(0) + 6}" y="${sy(z0) - 6}" font-size="12" fill="var(--tinta)">A</text>
    <circle cx="${sx(d)}" cy="${sy(z1)}" r="4" fill="${colRayo}"/><text x="${sx(d) - 6}" y="${sy(z1) - 6}" text-anchor="end" font-size="12" fill="var(--tinta)">B</text>
  </svg>
  <p class="ayuda">Marrón: suelo (cotas en metros). Verde: copas de bosque o lesosmuga; ámbar: cultivo; oscuro: edificio. La línea es el rayo de la vista, del ojo de A a la parte visible de B. Escala vertical exagerada.</p>`;
}

function pintarParametros() {
  const filas = [...P.usados].sort().map((id) => P.fila(id)!).filter(Boolean);
  const cfg = CONFIG_COLINAS as unknown as Record<string, unknown>;
  $("parametros").innerHTML = `<summary>Parámetros que deciden lo que ves</summary>
  <p class="ayuda">Del juego de reglas «Ucrania 2026» v${P.juego.version}. Los validados ya los aprobaste; los propuestos son nuevos de esta entrega y esperan tu visto bueno.</p>
  <div class="tabla"><table>
    <thead><tr><th>Parámetro</th><th>Valor</th><th>Estado</th><th>Nota</th></tr></thead>
    <tbody>${filas.map((f) => `<tr><td>${f.nombre}<br><code>${f.id}</code></td><td class="num">${fmt(f.valor, f.valor % 1 ? 1 : 0)} ${f.unidad}</td><td><span class="estado-val ${f.estado}">${f.estado}</span></td><td>${f.nota ?? ""}</td></tr>`).join("")}</tbody>
  </table></div>
  <h2 style="margin-top:14px">Generador de colinas (forma del mapa)</h2>
  <div class="tabla"><table>
    <thead><tr><th>Qué es</th><th>Valor</th></tr></thead>
    <tbody>${Object.entries(EXPLICACION_COLINAS).map(([k, txt]) => {
      const v = cfg[k];
      const val = Array.isArray(v) ? (Array.isArray(v[0]) ? (v as [string, number][]).map(([a, b]) => `${a.replace("_", " ")} ${b}`).join(" · ") : (v as number[]).map((x) => fmt(x)).join(" – ")) : fmt(v as number, (v as number) % 1 ? 2 : 0);
      return `<tr><td>${txt}<br><code>${k}</code></td><td class="num">${val}</td></tr>`;
    }).join("")}</tbody>
  </table></div>`;
}

function pintarLeyenda() {
  const hoja = terreno ? terreno.estacional.hoja[estacion] : true;
  const items: [string, string][] = [
    [`rgb(${colorVeg(Veg.Trigo, estacion, hoja)})`, "Trigo"],
    [`rgb(${colorVeg(Veg.CultivoAlto, estacion, hoja)})`, "Girasol o maíz"],
    [`rgb(${colorVeg(Veg.CultivoBajo, estacion, hoja)})`, "Colza o remolacha"],
    [`rgb(${colorVeg(Veg.Abierto, estacion, hoja)})`, "Pasto o rastrojo"],
    [`rgb(${colorVeg(Veg.BosqueHoja, estacion, hoja)})`, "Frondosas"],
    [`rgb(${colorVeg(Veg.BosqueConifera, estacion, hoja)})`, "Pinar"],
    [`rgb(${colorVeg(Veg.Lesosmuga, estacion, hoja)})`, "Lesosmuga"],
    ["rgb(40, 36, 34)", "Edificio"],
    ["rgb(120, 170, 220)", "Arroyo"],
    ["rgb(226, 96, 48)", "Carretera"],
    ["rgba(24, 28, 40, 0.47)", "No se ve"],
    ["rgba(235, 170, 20, 0.43)", "Con limitaciones"],
  ];
  $("leyenda").innerHTML = items.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("") +
    `<span><i style="background:none;border:0;border-top:2px solid rgb(140,86,44)"></i>Curva cada 10 m</span><span><i style="background:none;border:1.5px solid #222"></i>Puente · ○ vado</span>`;
}

// ---------- interacción ----------
function ponerModo(m: "zona" | "linea") {
  modo = m;
  $("modo-zona").setAttribute("aria-pressed", String(m === "zona"));
  $("modo-linea").setAttribute("aria-pressed", String(m === "linea"));
  $("ayuda-modo").textContent = m === "zona"
    ? "Pincha en el mapa para colocar al observador. Se calcula todo lo que ve."
    : "Pincha el punto A (observador) y después el punto B (blanco).";
  if (m === "linea") { A = null; B = null; esperandoB = false; actualizarLinea(); }
}

function pinchar(p: Punto) {
  if (p.x < 0 || p.y < 0 || p.x > anchoM() || p.y > altoM()) return;
  if (modo === "zona") {
    observador = p;
    A = p;
    calcularZona();
    actualizarLinea();
  } else if (!esperandoB) {
    A = p; B = null; esperandoB = true;
    actualizarLinea();
  } else {
    B = p; esperandoB = false;
    actualizarLinea();
  }
}

const punteros = new Map<number, { x: number; y: number }>();
let arrastre: { x: number; y: number; ox: number; oy: number; movido: boolean } | null = null;
let pellizco: { d: number; escala: number; cx: number; cy: number; ox: number; oy: number } | null = null;

lienzo.addEventListener("pointerdown", (e) => {
  lienzo.setPointerCapture(e.pointerId);
  const r = lienzo.getBoundingClientRect();
  punteros.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
  if (punteros.size === 1) {
    arrastre = { x: e.clientX, y: e.clientY, ox: vista.ox, oy: vista.oy, movido: false };
  } else if (punteros.size === 2) {
    const [a, b] = [...punteros.values()];
    pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y), escala: vista.escala, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, ox: vista.ox, oy: vista.oy };
    arrastre = null;
  }
});
lienzo.addEventListener("pointermove", (e) => {
  const r = lienzo.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (punteros.has(e.pointerId)) punteros.set(e.pointerId, { x, y });
  if (pellizco && punteros.size === 2) {
    const [a, b] = [...punteros.values()];
    const f = Math.hypot(a.x - b.x, a.y - b.y) / pellizco.d;
    zoomEn(pellizco.cx, pellizco.cy, pellizco.escala * f, pellizco);
    return;
  }
  if (arrastre) {
    const dx = e.clientX - arrastre.x;
    const dy = e.clientY - arrastre.y;
    if (Math.hypot(dx, dy) > 4) arrastre.movido = true;
    if (arrastre.movido) {
      vista.ox = arrastre.ox + dx;
      vista.oy = arrastre.oy + dy;
      dibujar();
    }
  }
  if (terreno) {
    const p = aM(x, y);
    if (p.x >= 0 && p.y >= 0 && p.x <= anchoM() && p.y <= altoM()) $("cursor").textContent = lugar(p);
  }
});
const soltar = (e: PointerEvent) => {
  const r = lienzo.getBoundingClientRect();
  if (arrastre && !arrastre.movido && punteros.size === 1) pinchar(aM(e.clientX - r.left, e.clientY - r.top));
  punteros.delete(e.pointerId);
  if (punteros.size < 2) pellizco = null;
  arrastre = null;
};
lienzo.addEventListener("pointerup", soltar);
lienzo.addEventListener("pointercancel", (e) => { punteros.delete(e.pointerId); arrastre = null; pellizco = null; });
lienzo.addEventListener("wheel", (e) => {
  e.preventDefault();
  const r = lienzo.getBoundingClientRect();
  zoomEn(e.clientX - r.left, e.clientY - r.top, vista.escala * Math.exp(-e.deltaY * 0.0015));
}, { passive: false });

function zoomEn(cx: number, cy: number, escala: number, desde = { ox: vista.ox, oy: vista.oy, escala: vista.escala }) {
  const r = lienzo.getBoundingClientRect();
  const minimo = Math.min(r.width / anchoM(), r.height / altoM()) * 0.8;
  const nueva = Math.max(minimo, Math.min(minimo * 16, escala));
  vista.ox = cx - ((cx - desde.ox) * nueva) / desde.escala;
  vista.oy = cy - ((cy - desde.oy) * nueva) / desde.escala;
  vista.escala = nueva;
  dibujar();
}

$("mas").addEventListener("click", () => { const r = lienzo.getBoundingClientRect(); zoomEn(r.width / 2, r.height / 2, vista.escala * 1.5); });
$("menos").addEventListener("click", () => { const r = lienzo.getBoundingClientRect(); zoomEn(r.width / 2, r.height / 2, vista.escala / 1.5); });
$("encuadre").addEventListener("click", encuadrar);
$("modo-zona").addEventListener("click", () => ponerModo("zona"));
$("modo-linea").addEventListener("click", () => ponerModo("linea"));
$("generar").addEventListener("click", () => generar(Math.max(1, Math.floor(Number($<HTMLInputElement>("semilla").value) || 1))));
$("semilla").addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") $("generar").click(); });
$("azar").addEventListener("click", () => {
  const s = 1 + Math.floor(Math.random() * 999999);
  $<HTMLInputElement>("semilla").value = String(s);
  generar(s);
});
$("estacion").addEventListener("change", () => {
  estacion = $<HTMLSelectElement>("estacion").value as Estacion;
  R = prepararReglas(terreno, P, estacion);
  dibujarBase();
  pintarLeyenda();
  dibujar();
  calcularZona();
  actualizarLinea();
});
for (const id of ["obs", "blanco"]) {
  $(id).addEventListener("change", () => { calcularZona(); actualizarLinea(); });
}
window.addEventListener("resize", () => { if (terreno) encuadrar(); });

pintarLeyenda();
document.fonts?.ready.then(() => { if (terreno) dibujar(); });
generar(1);
