#!/usr/bin/env python3
"""Construye rules/ucrania-2026.json y docs/fase0/matriz-parametros.md a partir de research/fase0/*.json.

Uso:  python3 tools/construir_reglas.py
Reglas:
  - research/fase0/ guarda la investigación en bruto (no se edita a mano).
  - Este script elimina duplicados, añade los parámetros de diseño y marca qué filas son
    parámetros del motor y cuáles son datos de referencia (calibración y AAR).
  - Para cambiar un valor de juego se edita rules/ucrania-2026.json (o se crea otro juego de reglas)
    y se anota el motivo en docs/decisiones.md.
"""
import json, glob, os, datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATEGORIAS = {  # fichero -> orden de presentación
    "drones.json": 1, "ew_comunicaciones.json": 2, "deteccion.json": 3,
    "fuegos.json": 4, "artilleria_155.json": 5, "movimiento_logistica.json": 6,
}

# Duplicados entre equipos de investigación: se conserva la fila indicada como canónica.
DUPLICADOS = {
    "ew.fibra_optica.alcance_km": "drones.fpv_fibra.alcance_km",
    "c2.delta.kill_chain_min": "drones.sensor_tirador.con_delta_min",
    "deteccion.cadena_fuego.deteccion_impacto_min": "drones.sensor_tirador.con_delta_min",
    "fuegos.fpv.tasa_fallo_pct": "drones.fpv.tasa_eficacia_pct",
    "ew.fpv.perdidas_por_ew_pct": "drones.fpv.tasa_eficacia_pct",
    "fuegos.drones.porcentaje_bajas_personal": "drones.efecto.bajas_atribuidas_pct",
    # Artillería de 155 mm (añadida el 2026-10-04): se conserva la fila más específica o de mejor fuente.
    "fuegos.art155.objetivo_seccion.disparos_sin_dron_n": "fuegos.ajuste_dron.proyectiles_para_destruir",
    "ew.localizacion_a_fuego.tiempo_min": "fuegos.art155.rusia.contrabateria_ciclo_min",
    "c2.kropyva.mision_no_planificada_min": "fuegos.art155.kropyva.deteccion_a_fuego_s",
}

# Datos que no son un parámetro del motor sino referencia para calibrar resultados y corregir en el AAR.
REFERENCIA = {
    "drones.fpv_fibra.coste_relativo", "drones.consumo.ucrania_dia", "drones.consumo.fpv_brigada_mes",
    "drones.efecto.bajas_atribuidas_pct", "drones.fpv.impactos_para_destruir_carro",
    "ew.uav.perdidas_mes_ucrania_2023", "ew.rus.densidad_sistemas_km_frente", "com.starlink.corte_ruso_adaptacion_meses",
    "com.hf_mochila.alcance_km", "ew.detector_aerostato.alcance_km",
    "deteccion.johnson.deteccion_pares_lineas", "deteccion.johnson.reconocimiento_pares_lineas",
    "deteccion.johnson.identificacion_pares_lineas", "deteccion.supervivencia.posicion_oculta_dias",
    "deteccion.supervivencia.trinchera_expuesta_horas", "deteccion.transparencia.zona_letal_km_2026",
    "fuegos.drones.porcentaje_bajas_personal_2026", "fuegos.asalto.tasa_bajas_terreno_favorable_pct",
    "fuegos.asalto.tasa_bajas_terreno_desfavorable_pct", "fuegos.asalto.tasa_bajas_asalto_fallido_pct",
    "fuegos.artilleria.dispersion_largo_alcance_m", "sanidad.agua.ingesta_max_dia_l",
    "mando.rotacion.max_reglamentario_dias", "mando.rotacion.real_observada_dias",
    "movimiento.a_pie.jornada_normal_km", "logistica.ugv.cuota_suministro_pct",
    "fuegos.art155.rusia.proyectiles_dia_2025_n", "fuegos.art155.rusia.proyectiles_dia_2026_n",
    "fuegos.art155.ucrania.proyectiles_155_dia_n", "fuegos.art155.lancet.ataques_contra_artilleria_pct",
    "fuegos.art155.drones.bajas_sistemas_pct",
}

# Decisiones de Balú (validación de la fase 0). Cada entrada fija el estado «validado» y, si procede, el valor.
VALIDACIONES = {
    "drones.fpv.tasa_eficacia_pct": {"fecha": "2026-10-04", "decision": "D-010",
        "motivo": "Validado por Balú: 30 % de eficacia del FPV por radio por defecto."},
    "drones.fpv_fibra.alcance_km": {"fecha": "2026-10-04", "decision": "D-011", "valor": 10, "rango_min": 10, "rango_max": 40,
        "nombre": "Radio eficaz del FPV de fibra óptica",
        "motivo": "Validado por Balú: 10 km eficaces. La bobina puede llegar a 20-40 km, pero la autonomía y la velocidad limitan el empleo real."},
    "deteccion.termica_dron.persona_deteccion_m": {"fecha": "2026-10-04", "decision": "D-012",
        "motivo": "Validado por Balú: 250 m para detectar una persona de pie con la térmica de un Mavic 3T."},
    "fuegos.art155.cal52_base_bleed.alcance_km": {"fecha": "2026-10-04", "decision": "D-013",
        "motivo": "Validado por Balú: la artillería pesada de referencia es el 155 mm de 52 calibres con base-bleed, hasta 40 km."},
}

# Correcciones de valor por defecto aplicadas tras revisar la nota de la propia fuente.
AJUSTES = {
    "deteccion.diurna_dron_tele.persona_reconocimiento_m": {
        "valor": 1200, "rango_min": 1200, "rango_max": 2440,
        "motivo": "La nota del investigador recomienda 1.200 m como máximo práctico (bruma, vibración, compresión de vídeo); 2.440 m es el límite geométrico."},
}

# Parámetros de diseño de la simulación (hoja de ruta) y datos de RUSI leídos directamente.
WATLING = "https://www.rusi.org/explore-our-research/publications/insights-papers/emergent-approaches-combined-arms-manoeuvre-ukraine"
DISENO = [
    {"id": "operacion.turno.preparacion_min", "categoria": "Operación", "nombre": "Duración del turno en los pasos 1 a 3 (reconocer, aislar, degradar)",
     "valor": 120, "unidad": "min", "rango_min": 60, "rango_max": 240, "fuente": "Hoja de ruta, apartado 4 (decisión de diseño)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Operación", "nota": "Turnos largos porque en estos pasos solo actúan drones, sensores, EW y fuegos con tareas permanentes."},
    {"id": "operacion.turno.fijar_suprimir_min", "categoria": "Operación", "nombre": "Duración del turno en los pasos 4 y 5 (fijar, suprimir)",
     "valor": 15, "unidad": "min", "rango_min": 5, "rango_max": 30, "fuente": "Hoja de ruta, apartado 4 (decisión de diseño)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Operación", "nota": "Coincide con el ciclo de lanzamiento de un operador FPV (10-15 min, Militarnyi 2025)."},
    {"id": "operacion.turno.asalto_min", "categoria": "Operación", "nombre": "Duración del turno en los pasos 6 y 7 (cerrar y destruir, consolidar)",
     "valor": 10, "unidad": "min", "rango_min": 5, "rango_max": 15, "fuente": "Hoja de ruta, apartado 4 (decisión de diseño)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Operación", "nota": "Escala del combate próximo; a escala pelotón se baja a 5 min."},
    {"id": "operacion.duracion_sector_dias", "categoria": "Operación", "nombre": "Duración total de una operación de 7 pasos sobre un sector",
     "valor": 7.5, "unidad": "días", "rango_min": 5, "rango_max": 10, "fuente": "Watling (RUSI), Emergent Approaches to Combined Arms Manoeuvre in Ukraine", "url": WATLING,
     "fecha": "2025-10", "confianza": "alta", "fase_turno": "Operación", "nota": "Referencia para la escala temporal de la partida completa."},
    {"id": "operacion.pasos_1a3_h", "categoria": "Operación", "nombre": "Duración de los pasos 1 a 3 (preparación)",
     "valor": 36, "unidad": "h", "rango_min": 24, "rango_max": 48, "fuente": "UNITED24 Media, resumen del informe de RUSI", "url": "https://united24media.com/latest-news/drones-robots-and-a-7-phase-plan-how-ukraine-is-rewriting-the-rules-of-war-14047",
     "fecha": "2025-12", "confianza": "media", "fase_turno": "Operación", "nota": "\"The first three phases should take 24 to 48 hours\"."},
    {"id": "operacion.zona_contacto_km", "categoria": "Operación", "nombre": "Profundidad del área de combate de contacto",
     "valor": 15, "unidad": "km", "rango_min": None, "rango_max": None, "fuente": "Watling (RUSI), Emergent Approaches", "url": WATLING,
     "fecha": "2025-10", "confianza": "alta", "fase_turno": "Operación", "nota": "La zona media (apoyos enemigos) se extiende unos 30 km más allá."},
    {"id": "drones.fpv.zona_bajas_principal_km", "categoria": "Drones", "nombre": "Franja donde se producen la mayoría de bajas por FPV (± desde la línea propia)",
     "valor": 3, "unidad": "km", "rango_min": None, "rango_max": None, "fuente": "Watling (RUSI), Emergent Approaches", "url": WATLING,
     "fecha": "2025-10", "confianza": "alta", "fase_turno": "Fuegos", "nota": "Entre 3 km por detrás y 3 km por delante de las posiciones avanzadas propias."},
    {"id": "logistica.ugv.distancia_espera_km", "categoria": "Movimiento, logística y sanidad", "nombre": "Distancia a la que esperan los UGV respecto a las posiciones avanzadas",
     "valor": 3.5, "unidad": "km", "rango_min": 2, "rango_max": 5, "fuente": "Watling (RUSI), Emergent Approaches", "url": WATLING,
     "fecha": "2025-10", "confianza": "alta", "fase_turno": "Logística", "nota": "Se pilotan desde la retaguardia de la brigada; evacuación y abastecimiento."},
]

def cargar():
    filas = []
    for f, orden in sorted(CATEGORIAS.items(), key=lambda kv: kv[1]):
        for r in json.load(open(os.path.join(RAIZ, "research", "fase0", f), encoding="utf-8")):
            r["origen"] = f"research/fase0/{f}"
            filas.append(r)
    return filas

def main():
    filas = cargar()
    ids = {r["id"] for r in filas}
    for dup, canon in DUPLICADOS.items():
        assert dup in ids and canon in ids, (dup, canon)
    salida = []
    for r in filas:
        if r["id"] in DUPLICADOS:
            continue
        r = dict(r)
        if r["id"] in AJUSTES:
            a = AJUSTES[r["id"]]
            r["nota"] = (r.get("nota") or "") + f" AJUSTE: {a['motivo']}"
            for k in ("valor", "rango_min", "rango_max"):
                r[k] = a[k]
        r["uso"] = "referencia" if r["id"] in REFERENCIA else "parametro"
        r["estado"] = "propuesto"
        if r["id"] in VALIDACIONES:
            v = VALIDACIONES[r["id"]]
            for k in ("valor", "rango_min", "rango_max", "nombre"):
                if k in v:
                    r[k] = v[k]
            r["estado"] = "validado"
            r["validacion"] = {"fecha": v["fecha"], "decision": v["decision"], "motivo": v["motivo"]}
        salida.append(r)
    for d in DISENO:
        d = dict(d, origen="tools/construir_reglas.py", uso="parametro", estado="propuesto")
        salida.append(d)
    salida.sort(key=lambda r: (r["categoria"], r["id"]))
    juego = {
        "id": "ucrania-2026",
        "nombre": "Ucrania 2026",
        "version": "0.2.0-propuesta",
        "fecha": datetime.date.today().isoformat(),
        "estado": "pendiente de validación (fase 0)",
        "descripcion": "Juego de reglas por defecto. Valores de fuentes abiertas 2023-2026; cada fila lleva su fuente y su confianza.",
        "duplicados_eliminados": DUPLICADOS,
        "parametros": salida,
    }
    os.makedirs(os.path.join(RAIZ, "rules"), exist_ok=True)
    with open(os.path.join(RAIZ, "rules", "ucrania-2026.json"), "w", encoding="utf-8") as fh:
        json.dump(juego, fh, ensure_ascii=False, indent=2)
    escribir_matriz(salida)
    print(f"{len(salida)} filas ({sum(r['uso']=='parametro' for r in salida)} parámetros, "
          f"{sum(r['uso']=='referencia' for r in salida)} referencias); {len(DUPLICADOS)} duplicados eliminados")

def fmt(v):
    if v is None:
        return "—"
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return f"{v:,}".replace(",", ".") if isinstance(v, int) and abs(v) >= 10000 else str(v).replace(".", ",")

def escribir_matriz(filas):
    out = ["# Fase 0 · Matriz de parámetros (juego de reglas «Ucrania 2026»)", "",
           "Generado por `tools/construir_reglas.py` a partir de `research/fase0/`. No editar a mano: edita "
           "`rules/ucrania-2026.json` o el script y vuelve a generarlo.", "",
           "Confianza: **alta** = dato publicado por fuente fiable; **media** = estimación razonada o fuente secundaria; "
           "**baja** = supuesto a validar. Uso: **P** = parámetro del motor; **R** = referencia para calibrar y para el AAR.", ""]
    cat_actual = None
    for r in filas:
        if r["categoria"] != cat_actual:
            cat_actual = r["categoria"]
            out += ["", f"## {cat_actual}", "", "| Uso | Parámetro | Valor | Rango | Confianza | Fuente | Nota |", "|---|---|---|---|---|---|---|"]
        lo, hi = r.get("rango_min"), r.get("rango_max")
        rango = "—" if lo is None and hi is None else (f"≤ {fmt(hi)}" if lo is None else (f"≥ {fmt(lo)}" if hi is None else f"{fmt(lo)}–{fmt(hi)}"))
        fuente = f"[{r['fuente']}]({r['url']})" if r.get("url") else r["fuente"]
        nota = (r.get("nota") or "").replace("|", "/").replace("\n", " ")
        out.append(f"| {'P' if r['uso']=='parametro' else 'R'} | {r['nombre']} <br>`{r['id']}` | {fmt(r['valor'])} {r['unidad']} | {rango} | {r['confianza']} | {fuente} ({r.get('fecha') or 's.f.'}) | {nota} |")
    os.makedirs(os.path.join(RAIZ, "docs", "fase0"), exist_ok=True)
    with open(os.path.join(RAIZ, "docs", "fase0", "matriz-parametros.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")

if __name__ == "__main__":
    main()
