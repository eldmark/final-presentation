# PDF del guion

Regenera `docs/guion-completo.pdf` (guion por escena + captura de cada paso + intro del mapa + tecnologías).

```bash
cd web && ./start.sh                 # la presentación debe estar corriendo
cd tools/guion-pdf
npm install                          # solo la primera vez
node capture.mjs                     # ~8 min: captura pasos, mapa y logos en out/
node build.mjs                       # arma el PDF
```

Usa el Chromium de Playwright (`npx playwright-core install chromium` si no está). `out/` no se sube a git.
