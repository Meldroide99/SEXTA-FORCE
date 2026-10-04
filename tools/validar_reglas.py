#!/usr/bin/env python3
"""Valida todos los juegos de reglas de rules/*.json contra rules/schema/juego-reglas.schema.json
y comprueba coherencia básica: ids únicos, valor dentro de su rango y URL presente salvo decisión de diseño.

Uso:  python3 tools/validar_reglas.py      (requiere: pip install jsonschema)
Sale con código 1 si hay errores.
"""
import json, glob, os, sys
from jsonschema import Draft202012Validator

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
esquema = json.load(open(os.path.join(RAIZ, "rules", "schema", "juego-reglas.schema.json"), encoding="utf-8"))
validador = Draft202012Validator(esquema)
errores = 0
for f in sorted(glob.glob(os.path.join(RAIZ, "rules", "*.json"))):
    juego = json.load(open(f, encoding="utf-8"))
    for e in validador.iter_errors(juego):
        errores += 1
        print(f"ESQUEMA {os.path.basename(f)}: {'/'.join(map(str, e.path))}: {e.message}")
    vistos = set()
    avisos = 0
    for p in juego.get("parametros", []):
        if p["id"] in vistos:
            errores += 1; print(f"DUPLICADO {p['id']}")
        vistos.add(p["id"])
        lo, hi = p.get("rango_min"), p.get("rango_max")
        if (lo is not None and p["valor"] < lo) or (hi is not None and p["valor"] > hi):
            errores += 1; print(f"FUERA DE RANGO {p['id']}: {p['valor']} no está en [{lo}, {hi}]")
        if not p.get("url") and "decisión de diseño" not in p["fuente"]:
            avisos += 1; print(f"aviso: sin URL pública {p['id']} ({p['fuente']})")
    n = len(juego.get("parametros", []))
    print(f"{os.path.basename(f)}: {n} filas, {avisos} avisos")
print("OK" if errores == 0 else f"{errores} errores")
sys.exit(1 if errores else 0)
