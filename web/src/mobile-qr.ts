import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/barlow-condensed/700.css";
import "./mobile-qr.css";
import QRCode from "qrcode";
import { readToken } from "./sync";

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

async function main(): Promise<void> {
  const app = document.getElementById("app")!;
  const token = readToken();

  let publicUrl = localStorage.getItem("bodega-host") ?? "";
  try {
    if (!publicUrl) publicUrl = ((await (await fetch("api/info")).json()) as { publicUrl?: string }).publicUrl ?? "";
  } catch {
    /* sin servidor de la presentación */
  }
  const base = (publicUrl || location.origin).replace(/\/$/, "");
  const local = /localhost|127\.0\.0\.1/.test(base);
  const link = token ? `${base}/remote?k=${encodeURIComponent(token)}` : "";

  app.innerHTML = `
    <header><img src="logo.svg" alt="Bodega de Licores" /><span>Conecta tu celular</span></header>
    <main>
      <section class="qr-box">
        ${token ? `<img class="qr" alt="Código QR para conectar el celular" />` : `<div class="noqr">Falta la llave de la sesión</div>`}
        <p class="status" data-status><i></i><span>Buscando celulares…</span></p>
      </section>
      <section class="steps">
        <h1>Controla la presentación<br />desde tu celular</h1>
        <ol>
          <li>Conéctate a <b>la misma red Wi-Fi</b> que el equipo de la presentación.</li>
          <li>Abre la <b>cámara</b> del celular y apunta al código.</li>
          <li>Toca el aviso. Debe decir <b>● Conectado</b>.</li>
        </ol>
        ${token ? `<p class="url">${esc(link)}</p>` : `<p class="warn">Abre esta página con la dirección que imprimió <code>start.sh</code> (lleva <code>?k=…</code>).</p>`}
        ${local && token ? `<p class="warn">La dirección dice <b>localhost</b>: el celular no puede abrirla. Escribe abajo la IP de este equipo en la red.</p>` : ""}
        <label class="host"><span>Dirección de este equipo en la red</span>
          <input data-host value="${esc(local ? "" : base)}" placeholder="http://192.168.0.2:8088" /></label>
      </section>
    </main>`;

  const draw = async (url: string): Promise<void> => {
    const img = app.querySelector<HTMLImageElement>("img.qr");
    if (img && url) img.src = await QRCode.toDataURL(url, { margin: 1, width: 900, color: { dark: "#2b2020", light: "#ffffff" } });
  };
  if (token) void draw(link);

  app.querySelector<HTMLInputElement>("[data-host]")!.addEventListener("change", (e) => {
    const v = (e.target as HTMLInputElement).value.trim().replace(/\/$/, "");
    if (!v) return;
    localStorage.setItem("bodega-host", v);
    location.reload();
  });

  // cuántos celulares hay conectados ahora mismo
  const status = app.querySelector<HTMLElement>("[data-status]")!;
  const poll = async (): Promise<void> => {
    try {
      const { remotes } = (await (await fetch("api/status", { cache: "no-store" })).json()) as { remotes: number };
      status.className = `status ${remotes > 0 ? "on" : ""}`;
      status.querySelector("span")!.textContent = remotes === 0 ? "Ningún celular conectado todavía" : remotes === 1 ? "1 celular conectado" : `${remotes} celulares conectados`;
    } catch {
      status.className = "status off";
      status.querySelector("span")!.textContent = "Sin conexión con el servidor de la presentación";
    }
  };
  void poll();
  window.setInterval(poll, 2000);
}

main().catch((e) => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="color:#fff;padding:20px">${String(e)}</pre>`);
});
