// Empaqueta la página de prueba del terreno en un solo HTML (dist/terreno.html).
// Uso: node tools/construir_app.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let esbuild;
try {
  esbuild = require("esbuild");
} catch {
  esbuild = require("/opt/npm-tools/node_modules/esbuild");
}

const r = await esbuild.build({
  entryPoints: ["app/terreno/main.ts"],
  bundle: true,
  format: "iife",
  minify: true,
  target: "es2020",
  write: false,
  legalComments: "none",
});
const js = r.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const plantilla = readFileSync("app/terreno/plantilla.html", "utf8");
mkdirSync("dist", { recursive: true });
writeFileSync("dist/terreno.html", plantilla.replace("<!--APP-->", `<script>\n${js}</script>`));
console.log(`dist/terreno.html: ${(Buffer.byteLength(js) / 1024).toFixed(0)} KB de código`);
