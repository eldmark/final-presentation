// Descarga una sola vez los mosaicos del mapa que usa la intro (mosaicos estándar de OpenStreetMap, © colaboradores de OpenStreetMap).
// Quedan en public/map/tiles para que la presentación funcione sin internet.
// Uso: node tools/fetch-map-tiles.mjs
import fs from "node:fs";
import path from "node:path";

const cfg = JSON.parse(fs.readFileSync("public/data/map.json", "utf8"));
const [C, Z3] = [cfg.center, cfg.focus];
const MIN = cfg.zoomStart, MAX = cfg.zoomEnd;
const worldPx = (z) => 256 * 2 ** z;
const px = (lat, lng, z) => {
  const s = Math.sin((lat * Math.PI) / 180);
  return [((lng + 180) / 360) * worldPx(z), (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldPx(z)];
};
const need = new Set();
for (let z = Math.round(MIN); z <= Math.round(MAX); z++) {
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const lat = C.lat + (Z3.lat - C.lat) * t, lng = C.lng + (Z3.lng - C.lng) * t;
    const [cx, cy] = px(lat, lng, z);
    const n = 2 ** z;
    for (let x = Math.floor(cx / 256 - 4.1); x <= Math.floor(cx / 256 + 4.1); x++)
      for (let y = Math.floor(cy / 256 - 2.6); y <= Math.floor(cy / 256 + 2.6); y++)
        if (y >= 0 && y < n) need.add(`${z}/${((x % n) + n) % n}/${y}`);
  }
}
const list = [...need].sort();
console.log(list.length, "mosaicos");
let ok = 0;
for (const t of list) {
  const out = path.join("public/map/tiles", t + ".png");
  if (fs.existsSync(out) && fs.statSync(out).size > 100) { ok++; continue; }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const url = `https://tile.openstreetmap.org/${t}.png`;
  const r = await fetch(url, { headers: { "User-Agent": "bodega-presentacion-universidad/1.0 (proyecto academico)" } });
  if (!r.ok) { console.log("falla", t, r.status); continue; }
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  ok++;
  await new Promise((s) => setTimeout(s, 300));
}
fs.writeFileSync("public/map/tiles.json", JSON.stringify(list));
console.log("listos", ok);
