# SEXTA-FORCE

Simulador táctico por turnos para instrucción en táctica contemporánea (drones, EW, fuegos y logística),
de pelotón a grupo táctico, basado en la práctica rusa y ucraniana de 2025-2026 y en fuentes abiertas.

**Estado:** fase 0 (especificación). Validación de parámetros cerrada el 5 oct 2026 (v0.3.0); quedan el contrato JSON de la IA y los temas por investigar. Aún no hay motor ni interfaz.

## Principios

1. **Motor determinista.** Las reglas y el estado viven en código: misma semilla y mismas órdenes, mismo
   resultado. Claude actúa como jefe enemigo, árbitro o instructor, nunca como motor (`docs/decisiones.md`, D-001).
2. **Todo número es un parámetro visible.** Cada cifra que influye en el resultado está en un juego de reglas
   (`rules/*.json`) con su fuente, fecha y confianza.
3. **Primero ver, perturbar y golpear; después moverse.** La operación ofensiva sigue los 7 pasos de Watling
   (RUSI, oct 2025) y cada turno resuelve sensores → EW → fuegos → maniobra.
4. **Solo fuentes abiertas.** Nada de documentos internos ni información clasificada.

## Estructura

| Carpeta | Contenido |
|---|---|
| `docs/` | Hoja de ruta, registro de decisiones y documentación de la fase 0 |
| `research/fase0/` | Investigación en bruto por categoría (no se edita a mano) |
| `rules/` | Juegos de reglas en JSON y su esquema (`rules/schema/`) |
| `templates/` | Plantillas de unidad, misiones (secuencias de pasos) y perfiles doctrinales |
| `ai/` | IA de utilidad y contratos con Claude (prompts y esquemas de respuesta) |
| `engine/` | Motor de reglas (fase 1) |
| `generator/` | Generador de partidas y terrenos (fase 1) |
| `app/` | Interfaz web (fase 1) |
| `tools/` | Scripts de construcción y validación |

## Cómo se cambia una regla o un parámetro

1. Edita el valor en `rules/<juego>.json` (o crea un juego nuevo copiando `ucrania-2026.json`).
2. Anota el cambio y su motivo en `docs/decisiones.md`.
3. Ejecuta `python3 tools/validar_reglas.py` (necesita `pip install jsonschema`).
4. Si cambias la investigación en bruto, regenera con `python3 tools/construir_reglas.py`.

## Documentos clave

- `docs/hoja-de-ruta.md`: qué se construye y en qué fases.
- `docs/fase0/matriz-parametros.md`: los 200 valores de la fase 0 con sus fuentes (juego de reglas «Ucrania 2026» v0.3.0, validación cerrada).
- `docs/fase0/pendientes-validacion.md`: conflictos y asimetrías a decidir antes de programar.
