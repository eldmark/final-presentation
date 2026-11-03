import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/playfair-display/700.css";
import "./acerca.css";
import type { ContentData } from "./types";

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const TEAM: [string, string][] = [
  ["Marcelo Detlefsen", "Pedidos y reservas, sincronización con Almacén 3.1, servidor en GCP, IAP, R2, Easy Orders"],
  ["Marco Díaz", "Cimientos, Grafana y Umami, exportes seguros, campañas de marketing, matriz de permisos, respaldos y CI"],
  ["Luis Ángel Girón", "APIs con validación y control de acceso, auditoría, protección de datos en logs, Sentry y trazabilidad"],
  ["Jorge Villeda", "Recomendaciones y Basket Analysis, carrito y reservas, dashboards, análisis del NeuroLab"],
  ["Julián Divas", "Campañas, notificaciones por correo, mapa de sucursales, caché, diseño inicial en Figma"],
  ["Lázaro Díaz", "Catálogo y búsqueda, editor visual de ofertas, un solo estilo en el panel, móvil y accesibilidad"],
];

async function main(): Promise<void> {
  const content = (await (await fetch("data/content.json")).json()) as ContentData;
  document.getElementById("app")!.innerHTML = `
    <header><img src="logo.svg" alt="Bodega de Licores" /><h1>Acerca de esta presentación</h1></header>
    <main>
      <section><h2>Sobre el diseño</h2><p>${esc(content.disclaimer[0])}</p></section>
      <section><h2>Sobre los datos y la marca</h2><p>${esc(content.disclaimer[1])}</p>
        <p>Las cifras de uso salen de un piloto de 90 días, con pruebas del equipo incluidas; no son tráfico de clientes.
        Las citas son textuales de las entrevistas del Corte 1 (enero de 2026), atribuidas por rol.</p></section>
      <section><h2>Sobre los modelos 3D</h2><p>${esc(content.disclaimer[2])}</p>
        <p>Las figuras ilustran lo que se narra: no representan a ninguna persona. El cliente, la empleada y la administradora
        son modelos animados de Quaternius (licencia CC0, tomados de Poly Pizza) con los colores de la presentación.</p></section>
      <section><h2>Quién hizo qué</h2>
        <table>${TEAM.map(([n, d]) => `<tr><th>${esc(n)}</th><td>${esc(d)}</td></tr>`).join("")}</table></section>
      <p class="foot">Ingeniería de Software · Grupo 7 · Universidad del Valle de Guatemala</p>
    </main>`;
}
void main();
