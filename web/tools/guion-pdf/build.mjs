// Arma docs/guion-completo.pdf con lo capturado por capture.mjs + guion de docs/personas + docs/12-tecnologias-y-ventajas.md
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { chromium } from "playwright-core";

const R = new URL("../../../", import.meta.url).pathname; // raíz del repo
const OUT = new URL("./out/", import.meta.url).pathname;
const steps = JSON.parse(fs.readFileSync(OUT + "steps.json", "utf8"));
const notes = JSON.parse(fs.readFileSync(R + "web/public/data/notes.json", "utf8")).chapters;
const tour = JSON.parse(fs.readFileSync(R + "web/public/data/tour.json", "utf8"));
const md = (f) => fs.readFileSync(`${R}docs/personas/${f}`, "utf8");
const b64 = (f) => fs.readFileSync(f).toString("base64");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const section = (txt, head) => {
  const i = txt.indexOf(head);
  if (i < 0) return "";
  const rest = txt.slice(i + head.length);
  const m = rest.search(/\n#{1,2} /);
  return head.replace(/^#+ /, "") + "\n\n" + (m < 0 ? rest : rest.slice(0, m));
};
const jul = md("01-julian.md"), laz = md("02-lazaro.md");
const scripts = {
  1: [jul, "## Texto"], 2: [laz, "## Texto"], 3: [md("03-jorge.md"), "## Texto"], 4: [md("04-marcelo.md"), "## Texto"],
  5: [md("05-marco.md"), "## Texto"], 6: [md("06-luis-angel.md"), "## Texto"], 7: [jul, "# Escena 7"], 8: [laz, "## Conclusiones"],
};
const titles = { 1: "El antes", 2: "El cliente encuentra y elige", 3: "Compra con confianza + resultados UX", 4: "El pedido llega a la tienda y los datos se juntan", 5: "La administradora decide", 6: "El miedo a que lo hackeen", 7: "Valor e impacto", 8: "Conclusiones" };
const chapters = {};
for (const s of tour.segments) {
  const n = parseInt(s.scene, 10);
  chapters[n] ??= { n, speaker: s.speaker, start: s.start, end: s.end };
  chapters[n].end = s.end;
}
const t = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}`;

const css = `
@page { size: A4; margin: 14mm 13mm }
body { font: 10.5pt/1.45 "Poppins", "DejaVu Sans", sans-serif; color: #2b2020 }
h1 { font-family: Georgia, serif; font-size: 34pt; color: #841c26; margin: 0 }
h2.ch { font-family: Georgia, serif; font-size: 21pt; color: #fff; background: #841c26; padding: 10px 16px; border-radius: 10px; margin: 0 0 8px; break-after: avoid }
.meta { color: #841c26; font-weight: 600; margin: 0 0 10px }
h3 { margin: 14px 0 6px; font-size: 12pt; color: #841c26; break-after: avoid }
.cover { height: 250mm; display: flex; flex-direction: column; justify-content: center }
.cover p { font-size: 13pt; margin: 6px 0 }
table.idx, .tech table { border-collapse: collapse; width: 100%; margin-top: 10px }
table.idx td, table.idx th { border-bottom: 1px solid #ddd; padding: 6px 8px; text-align: left }
.step { display: grid; grid-template-columns: 96mm 1fr; gap: 10px; margin: 0 0 10px; break-inside: avoid; border: 1px solid #e3d8d2; border-radius: 8px; padding: 6px; background: #fbf8f5 }
.step img { width: 96mm; border-radius: 6px; display: block }
.step .n { display: inline-block; background: #841c26; color: #fff; border-radius: 50%; width: 22px; height: 22px; text-align: center; font-size: 9pt; line-height: 22px; font-weight: 700; margin-right: 6px }
.step b.k { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: #841c26; margin-top: 6px }
.step p { margin: 2px 0 }
.quote { border-left: 3px solid #841c26; padding-left: 8px; font-family: Georgia, serif; font-style: italic }
.say { background: #fff6dd; border: 1px solid #f0d58a; border-radius: 8px; padding: 4px 14px; margin: 6px 0 }
.say p { margin: 6px 0 }
.box { border-radius: 8px; padding: 6px 12px; margin: 6px 0; break-inside: avoid }
.box ul { margin: 2px 0; padding-left: 18px }
.data { background: #eef7f0 } .avoid { background: #fdeeee } .hand { background: #f4ecf7 }
.pb { break-before: page }
.tech { font-size: 8.6pt; line-height: 1.35 }
.tech h1 { font-size: 15pt; font-family: Georgia, serif; color: #841c26 }
.tech h2 { font-size: 12pt; color: #841c26; margin: 12px 0 4px; break-after: avoid }
.tech table { font-size: 8pt } .tech th, .tech td { border: 1px solid #e0d5cf; padding: 4px 6px; vertical-align: top; text-align: left }
.tech th { background: #f3e7e3 } .tech tr { break-inside: avoid }
.tech blockquote { margin: 6px 0; padding: 4px 10px; border-left: 3px solid #d4a53c; background: #fff8e6 }
.tech h2.ch { color: #fff; font-size: 17pt; margin: 0 0 8px }
.wide { width: 100%; border-radius: 8px; margin: 6px 0; border: 1px solid #e3d8d2 }
`;

const mapSteps = [
  ["map_b_mid.jpg", "Después del telón, el mapa parte de Guatemala y se acerca solo hasta Quetzaltenango.", "Julián: “Esto es Bodega de Licores, en Quetzaltenango.” No pulses nada; el mapa avanza solo (unos 7 s)."],
  ["map_d_pins.jpg", "Llegan los tres marcadores: Zona 9, Zona 3 y El Calvario. Pulsa → para ver las fotos.", "Mientras aparecen los marcadores: “Son tres sucursales en la ciudad.” Pausa corta."],
  ["map_f_cards.jpg", "Las tres fotos de las sucursales aparecen una tras otra, con nombre y dirección.", "“Tres tiendas, tres mostradores, cada una con su propio registro.” Gancho para la escena 1 (cada sucursal era una isla). Pulsa → para continuar."],
  ["map_g_zoom.jpg", "El mapa se acerca a la Zona 3 y se disuelve en el render 3D de la tienda.", "Sin hablar: dejar que el zoom termine. Al disolverse sale la cinta “1 · El antes” y arranca Julián."],
];
const introHtml = `<section class="pb"><h2 class="ch">Intro · El mapa</h2><p class="meta">Habla: Julián (apertura) · ≈ 0:20 antes de la escena 1</p>
<div class="box"><b>Qué pasa</b><ul><li>Cuando se abre el telón aparece un mapa de Guatemala que se acerca a Quetzaltenango.</li><li>Se marcan las 3 sucursales (Zona 3, Zona 9 y El Calvario) y salen sus fotos reales.</li><li>El mapa se acerca a la tienda y se disuelve en el render 3D: ahí empieza la escena 1.</li></ul></div>
<div class="box hand"><b>Controles:</b> en modo paso a paso son 3 pulsaciones de → (fotos, acercamiento a la tienda y después la escena 1). En modo automático corre solo. Con ?autoplay=1 se salta la intro.</div>
<h3>Paso a paso: lo que se muestra</h3>
${mapSteps.map(([f, what, say], i) => `<div class="step"><img src="data:image/jpeg;base64,${b64(OUT + f)}"><div><p><span class="n">${i + 1}</span><b>${esc(what)}</b></p><b class="k">Qué decir</b><p>${esc(say)}</p></div></div>`).join("")}</section>`;

let html = `<!doctype html><html lang="es"><meta charset="utf-8"><style>${css}</style><body>
<section class="cover"><h1>Bodega de Licores</h1><p><b>Guion completo de la presentación final</b></p>
<p>Ingeniería de Software · UVG · Grupo 7 · martes 3 de noviembre de 2026 · máximo 14 minutos</p>
<p>Antes de la escena 1 hay una intro con el mapa de Quetzaltenango, y al final una slide con las tecnologías (con su justificación). Cada escena trae: quién habla, lo que se dice, las ideas clave, y cada paso con una captura de lo que se ve en pantalla.</p>
<table class="idx"><tr><th>Escena</th><th>Quién habla</th><th>Tema</th><th>Pasos</th></tr>
${Object.values(chapters).map((c) => `<tr><td>${c.n}</td><td>${c.speaker}</td><td>${titles[c.n]}</td><td>${steps.filter((s) => s.scene === c.n).length}</td></tr>`).join("")}</table>
<p style="margin-top:16px;font-size:10pt">Controles: → / Espacio avanza un paso · ← retrocede · Shift + flechas cambia de escena · P presentador · M modo · F pantalla completa.<br>Los datos son reales y anonimizados; el nombre y el logo se usan con autorización.</p></section>`;
html += introHtml;
for (const c of Object.values(chapters)) {
  const nt = notes[c.n] ?? {};
  const [file, head] = scripts[c.n];
  html += `<section class="pb"><h2 class="ch">${c.n} · ${titles[c.n]}</h2><p class="meta">Habla: ${c.speaker} · ${t(c.start)} a ${t(c.end)} (guion de referencia)</p>
  <h3>Qué se dice</h3><div class="say">${marked.parse(section(file, head).replace(/^.*\n\n/, ""))}</div>
  <div class="box"><b>Ideas clave</b><ul>${(nt.ideas ?? []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>
  ${nt.data?.length ? `<div class="box data"><b>Datos que respaldan</b><ul>${nt.data.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
  ${nt.avoid?.length ? `<div class="box avoid"><b>No digas</b><ul>${nt.avoid.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>` : ""}
  ${nt.handoff ? `<div class="box hand"><b>Pasa la palabra:</b> ${esc(nt.handoff)}</div>` : ""}
  <h3>Paso a paso: lo que se muestra</h3>`;
  for (const s of steps.filter((x) => x.scene === c.n)) {
    const lab = s.label;
    html += `<div class="step"><img src="data:image/jpeg;base64,${b64(OUT + s.file)}"><div><p><span class="n">${s.idx}</span><b>${esc(s.cue || (s.logos ? "Esto fue todo lo que utilizamos" : lab))}</b></p>
    ${s.quote ? `<b class="k">Cita en pantalla</b><p class="quote">${esc(s.quote.replace(/ENTREVISTA.*$/i, "").trim())}</p>` : ""}
    ${s.card && !s.logos ? `<b class="k">Tarjeta</b><p>${esc(s.card)}</p>` : ""}
    ${s.logos ? `<b class="k">Slide de tecnologías</b><p>${s.logos} logos. Al pasar el cursor o girar la rueda sobre uno, sale para qué se usó (detalle en la sección «Tecnologías»).</p>` : ""}
    ${s.facts?.length ? `<b class="k">Cifras</b><p>${s.facts.map(esc).join(" · ")}</p>` : ""}
    ${lab.startsWith("💬") ? `<b class="k">Burbuja de chat</b><p>${esc(lab.slice(2))}</p>` : ""}
    </div></div>`;
  }
  html += "</section>";
}
const techMd = fs.readFileSync(R + "docs/12-tecnologias-y-ventajas.md", "utf8").replace(/^# .*\n/, "");
html += `<section class="pb tech"><h2 class="ch">Tecnologías · para qué y por qué</h2>
<img class="wide" src="data:image/jpeg;base64,${b64(OUT + "logos_hover.jpg")}">
${marked.parse(techMd)}</section></body></html>`;

fs.writeFileSync(OUT + "guion.html", html);
const exe = process.env.CHROMIUM ?? (() => {
  const root = path.join(process.env.HOME, ".cache/ms-playwright");
  const d = fs.readdirSync(root).filter((x) => x.startsWith("chromium-")).sort().pop();
  return path.join(root, d, "chrome-linux64/chrome");
})();
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage();
await p.goto("file://" + OUT + "guion.html");
await p.pdf({ path: R + "docs/guion-completo.pdf", format: "A4", printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: "<span></span>",
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888">Bodega de Licores · Guion completo · <span class="pageNumber"></span>/<span class="totalPages"></span></div>' });
await b.close();
console.log(steps.length, "pasos → docs/guion-completo.pdf");
