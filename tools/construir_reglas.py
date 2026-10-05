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
    # Apartado E de la fase 0 (5 oct 2026)
    "fpv_fibra_2026.json": 7, "apoyos_2026.json": 8, "mando_moral.json": 9,
    "tiro_directo_terreno.json": 10,
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
    # Apartado E (5 oct 2026)
    "apoyos.asalto.perdidas_con_metodo_pct": "fuegos.asalto.tasa_bajas_terreno_favorable_pct",
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
    # Apartado E (5 oct 2026)
    "drones.fpv_fibra.alcance_efectivo_2026_km", "drones.fpv_fibra.bobina_max_km", "drones.fpv_fibra.coste_usd",
    "drones.fpv_fibra.cuota_fpv_pct", "drones.fpv_fibra.redes_carretera_km", "drones.fpv_fibra.barrera_cortacables_pct",
    "apoyos.carros.fpv_para_neutralizar_carro", "apoyos.carros.carros_asalto_compania_ru",
    "apoyos.blindados.perdidas_asalto_mecanizado_ru_pct", "apoyos.blindados.distancia_reserva_km",
    "apoyos.ugv.misiones_mes", "apoyos.ugv.contratados_2026", "apoyos.ugv.reparto_logistica_pct",
    "apoyos.ugv.cuota_logistica_frontal_pct", "apoyos.ugv.carga_semanal_brigada_t",
    "apoyos.artilleria.obuses_brigada_18km", "apoyos.artilleria.cuota_golpes_drones_pct",
    "apoyos.drones.fpv_dia_ucrania", "apoyos.drones.drones_sobre_blanco_hora", "apoyos.ew.inhibidores_grupo_moto_ru",
    "apoyos.asalto.ratio_apoyo_por_asaltante",
    "mando.moral.bajas_en_retaguardia_pct", "mando.moral.dotacion_brigadas_ua_pct", "mando.moral.supresion_por_impacto_s",
    "mando.moral.prisioneros_defensor_abierto_pct",
    # Tiro directo y terreno (5 oct 2026): calibración, no reglas del motor
    "fuegos.carro.apoyo_directo_ucrania_m", "fuegos.carro.carro_contra_carro_ucrania_m", "fuegos.carro.combate_bosque_m",
    "fuegos.carro.historico_2gm_m", "fuegos.carro.indirecto_alcance_reportado_m", "fuegos.carro.indirecto_dispersion_m",
    "terreno.visibilidad.plos_ondulado_boscoso", "terreno.visibilidad.plos_llano_setos",
    "terreno.visibilidad.los_max_posicion_elegida_m", "terreno.visibilidad.urbano_blancos_50m_pct",
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
    # A1 · Profundidad de la zona batida (D-015)
    "drones.zona_muerte.fpv_profundidad_km": {"fecha": "2026-10-05", "decision": "D-015",
        "motivo": "Validado por Balú (A1): franja de dominio FPV de 12,5 km desde la línea de contacto."},
    "drones.zona_muerte.vehiculos_profundidad_km": {"fecha": "2026-10-05", "decision": "D-015", "valor": 20, "rango_min": 15, "rango_max": 30,
        "motivo": "Validado por Balú (A1): 20 km por defecto para vehículos y logística, editable hasta 30 km (previsión para finales de 2026)."},
    # A4 · Tiempo de sensor a golpe (D-016)
    "drones.sensor_tirador.con_delta_min": {"fecha": "2026-10-05", "decision": "D-016",
        "motivo": "Validado por Balú (A4): 4 min de detección a golpe con enlace digital activo (Delta)."},
    "drones.sensor_tirador.sin_digital_min": {"fecha": "2026-10-05", "decision": "D-016",
        "motivo": "Validado por Balú (A4): 15 min sin integración digital."},
    "drones.sensor_tirador.solo_ew_min": {"fecha": "2026-10-05", "decision": "D-016",
        "motivo": "Validado por Balú (A4): 30 min si el objetivo solo se ha detectado por EW (hay que confirmarlo con otro sensor antes de batirlo)."},
    # B4 · Radio de trabajo del Mavic (D-017)
    "drones.reco_multirrotor.alcance_km": {"fecha": "2026-10-05", "decision": "D-017",
        "motivo": "Validado por Balú (B4): enlace máximo de 15 km; limita el vuelo, no el trabajo útil."},
    "drones.reco_multirrotor.radio_trabajo_km": {"fecha": "2026-10-05", "decision": "D-017",
        "motivo": "Validado por Balú (B4): radio de trabajo de 6 km para observar 15 min sobre el objetivo; más allá, solo pasadas rápidas."},
    # C1 · Movimiento encubierto bajo drones (D-018)
    "movimiento.tactico.sigilo_antidron_kmh": {"fecha": "2026-10-05", "decision": "D-018",
        "motivo": "Validado por Balú (C1): 1 km/h en movimiento encubierto. Cada turno el jugador elige «rápido y visible» o «lento y oculto»."},
    # Cierre de la fase 0 (5 oct 2026): C2-C5, F1-F5, FPV con guiado terminal y modificadores térmicos
    "movimiento.infiltracion.perdidas_esperadas_frac": {"fecha": "2026-10-05", "decision": "D-019", "nombre": "Tolerancia a bajas de la IA «Rusia 2026» en infiltración (fracción que acepta perder antes de abandonar)",
        "motivo": "Validado por Balú (C2): no es regla de combate; es la tolerancia a bajas de la IA enemiga con perfil «Rusia 2026»."},
    "deteccion.senuelos.reduccion_dano_pct": {"fecha": "2026-10-05", "decision": "D-020", "uso": "referencia",
        "motivo": "Validado por Balú (C3): sin porcentaje fijo; el señuelo se modela como contacto falso en la imagen enemiga. Este dato queda como referencia."},
    "deteccion.senuelos.contactos_falsos_por_senuelo": {"fecha": "2026-10-05", "decision": "D-020",
        "motivo": "Validado por Balú (C3): cada señuelo genera un contacto falso que el enemigo tiene que confirmar o batir."},
    "deteccion.camuflaje.poncho_antitermico_reduccion_pct": {"fecha": "2026-10-05", "decision": "D-021", "uso": "referencia",
        "motivo": "Validado por Balú (C4): el 96 % es dato de fabricante; queda como referencia y el motor usa los factores ×0,3 quieto y ×0,7 en movimiento."},
    "deteccion.camuflaje.poncho_factor_quieto": {"fecha": "2026-10-05", "decision": "D-021",
        "motivo": "Validado por Balú (C4): firma térmica ×0,3 con poncho antitérmico, quieto."},
    "deteccion.camuflaje.poncho_factor_movimiento": {"fecha": "2026-10-05", "decision": "D-021",
        "motivo": "Validado por Balú (C4): firma térmica ×0,7 con poncho antitérmico, en movimiento."},
    "fuegos.supresion.duracion_tras_cese_min": {"fecha": "2026-10-05", "decision": "D-022", "valor": 1, "rango_min": 0, "rango_max": 2, "unidad": "turno", "nombre": "Duración de la supresión después de que cesa el fuego (turnos cortos)",
        "motivo": "Validado por Balú (C5): la supresión dura mientras cae el fuego y un turno corto más."},
    "fuegos.art155.m777_he_m795.alcance_km": {"fecha": "2026-10-05", "decision": "D-023",
        "motivo": "Validado por Balú (F1): munición disponible en el juego (HE, base-bleed, RAP y Excalibur)."},
    "fuegos.art155.m777_base_bleed.alcance_km": {"fecha": "2026-10-05", "decision": "D-023",
        "motivo": "Validado por Balú (F1): munición disponible en el juego (HE, base-bleed, RAP y Excalibur)."},
    "fuegos.art155.m777_rap_m549a1.alcance_km": {"fecha": "2026-10-05", "decision": "D-023",
        "motivo": "Validado por Balú (F1): munición disponible en el juego (HE, base-bleed, RAP y Excalibur)."},
    "fuegos.art155.m777_excalibur.alcance_km": {"fecha": "2026-10-05", "decision": "D-023",
        "motivo": "Validado por Balú (F1): munición disponible en el juego (HE, base-bleed, RAP y Excalibur)."},
    "fuegos.art155.cal52_he_estandar.alcance_km": {"fecha": "2026-10-05", "decision": "D-023",
        "motivo": "Validado por Balú (F1): munición disponible en el juego (HE, base-bleed, RAP y Excalibur)."},
    "fuegos.art155.cal52_excalibur.alcance_km": {"fecha": "2026-10-05", "decision": "D-023",
        "motivo": "Validado por Balú (F1): munición disponible en el juego (HE, base-bleed, RAP y Excalibur)."},
    "fuegos.art155.cal52_vlap.alcance_km": {"fecha": "2026-10-05", "decision": "D-023", "uso": "referencia",
        "motivo": "Validado por Balú (F1): V-LAP fuera del juego por escasez; queda como referencia."},
    "fuegos.art155.excalibur_bajo_ew.tasa_exito_pct": {"fecha": "2026-10-05", "decision": "D-024",
        "motivo": "Validado por Balú (F2): en zona con perturbación GNSS el Excalibur se comporta como proyectil sin guiar."},
    "fuegos.art155.ucrania.ventana_desplazamiento_min": {"fecha": "2026-10-05", "decision": "D-025",
        "motivo": "Validado por Balú (F3): la pieza tiene que moverse en 3 min tras disparar o queda expuesta a contrabatería y Lancet."},
    "fuegos.art155.pieza_ucrania.disparos_dia_n": {"fecha": "2026-10-05", "decision": "D-025",
        "motivo": "Validado por Balú (F3): tope práctico de unos 10 disparos por pieza y día."},
    "fuegos.art155.rusia.proyectiles_dia_2025_n": {"fecha": "2026-10-05", "decision": "D-026",
        "motivo": "Validado por Balú (F4): consumo de todo el frente, solo como referencia; el motor no lo usa."},
    "fuegos.art155.rusia.proyectiles_dia_2026_n": {"fecha": "2026-10-05", "decision": "D-026",
        "motivo": "Validado por Balú (F4): consumo de todo el frente, solo como referencia; el motor no lo usa."},
    "fuegos.art155.ucrania.proyectiles_155_dia_n": {"fecha": "2026-10-05", "decision": "D-026",
        "motivo": "Validado por Balú (F4): consumo de todo el frente, solo como referencia; el motor no lo usa."},
    "fuegos.art155.ucrania.distancia_piezas_frente_km": {"fecha": "2026-10-05", "decision": "D-027",
        "motivo": "Validado por Balú (F5): baterías a unos 15 km de la línea."},
    "fuegos.art155.bateria.separacion_piezas_m": {"fecha": "2026-10-05", "decision": "D-027",
        "motivo": "Validado por Balú (F5): piezas separadas al menos 500 m y que tiran por separado."},
    "ew.fpv.acierto_con_guiado_terminal_pct": {"fecha": "2026-10-05", "decision": "D-028", "nombre": "Tasa de acierto del FPV con guiado terminal (tipo aparte, aguanta la EW en los últimos metros)",
        "motivo": "Validado por Balú: tipo aparte «FPV con guiado terminal», 75 % de acierto; más caro y escaso que el FPV normal."},
    "deteccion.termica_dron.factor_movimiento": {"fecha": "2026-10-05", "decision": "D-029",
        "motivo": "Validado por Balú: una persona en movimiento se detecta a ×3 la distancia base (750 m)."},
    "deteccion.termica_dron.factor_cruce_termico": {"fecha": "2026-10-05", "decision": "D-029",
        "motivo": "Validado por Balú: en el cruce térmico (amanecer y atardecer) la detección térmica baja a ×0,3-0,5."},
    # Apartado E (5 oct 2026)
    "mando.ordenes.retardo_min": {"fecha": "2026-10-05", "decision": "D-032",
        "motivo": "Decisión de Balú: las órdenes son inmediatas (se ejecutan el mismo turno). Una unidad sin enlace sigue sin recibir órdenes nuevas."},
    # Corrección de Balú sobre los carros (5 oct 2026)
    "apoyos.carros.distancia_tiro_indirecto_km": {"fecha": "2026-10-05", "decision": "D-034", "estado": "rechazado", "uso": "referencia",
        "motivo": "Rechazado por Balú: los carros no tiran tan lejos. El tiro directo depende del terreno y la vegetación (D-033); el tiro indirecto de carro queda como opción excepcional desactivada por defecto."},
}

def aplicar_validacion(r):
    if r["id"] in VALIDACIONES:
        v = VALIDACIONES[r["id"]]
        for k in ("valor", "rango_min", "rango_max", "nombre", "unidad", "uso"):
            if k in v:
                r[k] = v[k]
        r["estado"] = v.get("estado", "validado")
        r["validacion"] = {"fecha": v["fecha"], "decision": v["decision"], "motivo": v["motivo"]}
    return r

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
    {"id": "drones.sensor_tirador.solo_ew_min", "categoria": "Drones", "nombre": "Tiempo de detección a golpe cuando el objetivo solo se ha detectado por EW",
     "valor": 30, "unidad": "min", "rango_min": 15, "rango_max": 60, "fuente": "Decisión de diseño de la fase 0 (pendiente A4)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Fuegos",
     "nota": "Una localización solo por radiogoniometría tiene error de cientos de metros; hace falta confirmar con dron u otro sensor antes de batir."},
    {"id": "drones.reco_multirrotor.radio_trabajo_km", "categoria": "Drones", "nombre": "Radio de trabajo del multirrotor de reconocimiento con 15 min de observación sobre el objetivo",
     "valor": 6, "unidad": "km", "rango_min": 4, "rango_max": 8, "fuente": "Cálculo de la fase 0 (pendiente B4): autonomía 25-35 min, tránsito a ~15 m/s", "url": None,
     "fecha": "2026-10", "confianza": "media", "fase_turno": "Sensores",
     "nota": "Más allá de este radio el dron solo hace pasadas rápidas; el enlace máximo (15 km) limita el vuelo, no el trabajo útil."},
    {"id": "deteccion.senuelos.contactos_falsos_por_senuelo", "categoria": "Detección y sensores", "nombre": "Contactos falsos que genera cada señuelo en la imagen enemiga",
     "valor": 1, "unidad": "contacto", "rango_min": 0, "rango_max": 1, "fuente": "Decisión de diseño de la fase 0 (pendiente C3)", "url": None,
     "fecha": "2026-10", "confianza": "media", "fase_turno": "Sensores",
     "nota": "El enemigo gasta sensores o munición en confirmarlo o batirlo; un sensor más preciso (térmica cercana, identificación) lo descarta."},
    {"id": "deteccion.camuflaje.poncho_factor_quieto", "categoria": "Detección y sensores", "nombre": "Factor de firma térmica con poncho antitérmico, quieto",
     "valor": 0.3, "unidad": "factor", "rango_min": 0.1, "rango_max": 0.5, "fuente": "Decisión de diseño de la fase 0 (pendiente C4)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Sensores", "nota": "Multiplica la distancia de detección térmica."},
    {"id": "deteccion.camuflaje.poncho_factor_movimiento", "categoria": "Detección y sensores", "nombre": "Factor de firma térmica con poncho antitérmico, en movimiento",
     "valor": 0.7, "unidad": "factor", "rango_min": 0.5, "rango_max": 1, "fuente": "Decisión de diseño de la fase 0 (pendiente C4)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Sensores", "nota": "En movimiento el poncho se abre y el contraste del cuerpo se ve por los bordes."},
    {"id": "deteccion.termica_dron.factor_movimiento", "categoria": "Detección y sensores", "nombre": "Factor de detección térmica de una persona en movimiento",
     "valor": 3, "unidad": "factor", "rango_min": 2, "rango_max": 4, "fuente": "Decisión de diseño de la fase 0 (pendiente B3)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Sensores", "nota": "Multiplica los 250 m base: 750 m. El movimiento atrae la vista del operador."},
    {"id": "deteccion.termica_dron.factor_cruce_termico", "categoria": "Detección y sensores", "nombre": "Factor de detección térmica durante el cruce térmico (amanecer y atardecer)",
     "valor": 0.4, "unidad": "factor", "rango_min": 0.3, "rango_max": 0.5, "fuente": "Decisión de diseño de la fase 0 (pendiente B3)", "url": None,
     "fecha": "2026-10", "confianza": "baja", "fase_turno": "Sensores", "nota": "Cuerpo y fondo casi a la misma temperatura; dura unos 20 min dos veces al día."},
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
        salida.append(aplicar_validacion(r))
    for d in DISENO:
        d = dict(d, origen="tools/construir_reglas.py", uso="parametro", estado="propuesto")
        salida.append(aplicar_validacion(d))
    faltan = set(VALIDACIONES) - {r["id"] for r in salida}
    assert not faltan, f"Validaciones sin fila: {faltan}"
    salida.sort(key=lambda r: (r["categoria"], r["id"]))
    juego = {
        "id": "ucrania-2026",
        "nombre": "Ucrania 2026",
        "version": "0.4.0-propuesta",
        "fecha": datetime.date.today().isoformat(),
        "estado": "fase 0: validación de parámetros cerrada el 5 oct 2026 (v0.3.0); apartado E (fibra, apoyos, moral) propuesto y pendiente de validar",
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
