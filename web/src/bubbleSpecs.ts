import type { BubbleSpec } from "./types";

/** Mensajes de la escena "antes": lo que llegaba por WhatsApp y llamada. */
export const BUBBLE_SPECS: BubbleSpec[] = [
  // Estación 0 · el cliente pregunta (0:08 – 1:16)
  { text: "¿Cuánto cuesta el whisky 12 años?", from: "cliente", at: 8, until: 76, station: 0, slot: 0 },
  { text: "¿Hay en la Zona 1?", from: "cliente", at: 14, until: 76, station: 0, slot: 1 },
  { text: "¿Tienen para hoy?", from: "cliente", at: 21, until: 76, station: 0, slot: 2 },
  { text: "Dame un momento, reviso…", from: "tienda", at: 36, until: 76, station: 0, slot: 3 },
  { text: "☎ Llamada perdida", from: "sistema", at: 50, until: 76, station: 0, slot: 4 },
  // Estación 1 · la tienda atiende mensajes y llamadas a la vez (1:24 – 1:52)
  { text: "¿Precio del Zacapa?", from: "cliente", at: 84, until: 112, station: 1, slot: 0 },
  { text: "¿Abren hoy?", from: "cliente", at: 90, until: 112, station: 1, slot: 1 },
  { text: "¿Hay en Zona 9?", from: "cliente", at: 96, until: 112, station: 1, slot: 2 },
  { text: "☎ Llamada entrante", from: "sistema", at: 102, until: 112, station: 1, slot: 3 },
];
