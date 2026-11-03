// Captura cada paso de la presentación (y la intro del mapa y la slide de logos) para el PDF del guion.
// Requiere la presentación corriendo (web/start.sh) y Chromium de Playwright (~/.cache/ms-playwright).
// Uso: BASE=http://localhost:8088 K=<token> node capture.mjs
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:8088";
const K = process.env.K ?? fs.readFileSync(new URL("../../.env", import.meta.url), "utf8").match(/PRESENTER_TOKEN=(\S+)/)?.[1];
const OUT = new URL("./out/", import.meta.url).pathname;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT + "shots", { recursive: true });
const exe = process.env.CHROMIUM ?? (() => {
  const root = path.join(process.env.HOME, ".cache/ms-playwright");
  const d = fs.readdirSync(root).filter((x) => x.startsWith("chromium-")).sort().pop();
  return path.join(root, d, "chrome-linux64/chrome");
})();
const browser = await chromium.launch({ executablePath: exe, headless: true,
  args: ["--use-angle=swiftshader", "--use-gl=angle", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const newCtx = (w = 1280, h = 720) => browser.newContext({ viewport: { width: w, height: h } });
const ready = (page) => page.waitForFunction(() => document.querySelector(".step-info")?.textContent, null, { timeout: 240000 });

// ---- 1 · pasos de las 8 escenas (se salta la intro con autoplay) ----
{
  const ctx = await newCtx();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?k=${K}&autoplay=1&pause=1`);
  await ready(page);
  const pres = await ctx.newPage();
  await pres.goto(`${BASE}/presenter.html?k=${K}`);
  await page.bringToFront();
  await page.waitForTimeout(3000);
  const txt = (sel) => page.evaluate((s) => { const e = document.querySelector(s); return e && !e.hidden && getComputedStyle(e).display !== "none" ? e.textContent.trim() : ""; }, sel);
  const cardOn = () => page.evaluate(() => { const c = document.querySelector(".card"); return Boolean(c) && !c.hidden; });
  const out = [];
  for (let sc = 1; sc <= 8; sc++) {
    await pres.evaluate((k) => document.querySelectorAll("[data-scenes] li")[k].click(), sc - 1);
    await page.waitForTimeout(6000);
    const cnt = await pres.evaluate(() => document.querySelectorAll("[data-steps] li").length);
    for (let i = 0; i < cnt; i++) {
      await pres.waitForFunction((k) => document.querySelectorAll("[data-steps] li").length > k, i, { timeout: 30000 });
      await pres.evaluate((k) => document.querySelectorAll("[data-steps] li")[k].click(), i);
      await page.waitForTimeout(i === 0 ? 3500 : 1800);
      const rec = {
        n: out.length + 1, scene: sc, idx: i + 1, of: cnt,
        label: (await pres.evaluate((k) => document.querySelectorAll("[data-steps] li")[k].textContent, i)).trim().replace(/^\d+/, ""),
        info: await txt(".step-info"), cue: await txt(".subtitle"), quote: (await txt(".quote")).replace(/^“/, ""), card: await cardOn() ? await txt(".card figcaption") : "",
        facts: await cardOn() ? await page.evaluate(() => [...document.querySelectorAll(".card .facts:not([hidden]) div")].map((d) => [...d.children].map((c) => c.textContent.trim()).join(" "))) : [],
        logos: await cardOn() ? await page.evaluate(() => document.querySelectorAll(".card .logos:not([hidden]) li").length) : 0,
      };
      rec.file = `shots/${String(rec.n).padStart(3, "0")}.jpg`;
      await page.screenshot({ path: OUT + rec.file, type: "jpeg", quality: 82 });
      out.push(rec);
      console.log(rec.n, sc, `${i + 1}/${cnt}`, rec.label.slice(0, 50));
    }
  }
  fs.writeFileSync(OUT + "steps.json", JSON.stringify(out, null, 1));
  await ctx.close();
}

// ---- 2 · intro con mapa (portada → telón → mapa) ----
{
  const page = await (await newCtx()).newPage();
  await page.goto(`${BASE}/?k=${K}`);
  await page.waitForFunction(() => { const x = document.querySelector('[data-act="start-manual"]'); return x && !x.disabled; }, null, { timeout: 240000 });
  await page.click('[data-act="start-manual"]');
  const shot = async (n, ms) => { await page.waitForTimeout(ms); await page.screenshot({ path: `${OUT}map_${n}.jpg`, type: "jpeg", quality: 82 }); };
  await shot("b_mid", 6000);
  await shot("d_pins", 6500);
  await page.keyboard.press("ArrowRight");
  await shot("f_cards", 6000);
  await page.keyboard.press("ArrowRight");
  await shot("g_zoom", 2000);
  await page.context().close();
}

// ---- 3 · slide de logos (con un logo resaltado) ----
{
  const page = await (await newCtx(1600, 900)).newPage();
  await page.goto(`${BASE}/?k=${K}&autoplay=1&pause=1&t=797`);
  await page.waitForFunction(() => document.querySelector(".logos li"), null, { timeout: 240000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: OUT + "logos.jpg", type: "jpeg", quality: 85 });
  await page.hover(".logos li:nth-child(9)");
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + "logos_hover.jpg", type: "jpeg", quality: 85 });
}
await browser.close();
