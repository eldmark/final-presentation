import type { BubbleSpec, Chapter, ContentData, Step, TourData } from "./types";

/** Eventos que caen a menos de este margen se funden en un mismo paso. */
const MERGE = 1.6;
/** Segundos que tarda la cámara en llegar a una estación nueva (igual que en Blender). */
export const TRAVEL = 3;

interface Ev {
  at: number;
  cue?: string;
  focus?: string;
  quote?: { who: string; text: string };
  card?: { image?: string; facts?: import("./types").Fact[]; logos?: import("./types").Logo[]; gallery?: import("./types").Shot[]; groups?: { id: string; title: string }[]; qr?: string; layout?: import("./types").CardLayout; caption: string };
  bubble?: string;
}

/**
 * Convierte subtítulos, citas, tarjetas y burbujas en pasos que se avanzan de uno en uno.
 * - El subtítulo se hereda hasta que llega otro; la cita y la tarjeta viven solo en su paso.
 * - Cada burbuja de chat se ajusta al instante de su paso, así que aparece una por pulsación.
 */
export function buildSteps(
  tour: TourData,
  content: ContentData,
  bubbles: BubbleSpec[],
): { steps: Step[]; bubbles: BubbleSpec[] } {
  const steps: Step[] = [];
  const retimed = bubbles.map((b) => ({ ...b }));

  tour.segments.forEach((seg, si) => {
    const c = content.segments[seg.id];
    const evs: Ev[] = [];
    c?.cues.forEach((x) => evs.push({ at: x.at, cue: x.text, focus: x.focus }));
    c?.quotes.forEach((x) => evs.push({ at: x.at, quote: { who: x.who, text: x.text } }));
    c?.cards.forEach((x) => evs.push({ at: x.at, card: { image: x.image, facts: x.facts, logos: x.logos, gallery: x.gallery, groups: x.groups, qr: x.qr, layout: x.layout, caption: x.caption } }));
    const segBubbles = retimed.filter((b) => b.at >= seg.start && b.at < seg.end);
    segBubbles.forEach((b) => evs.push({ at: b.at, bubble: b.text }));
    evs.sort((a, b) => a.at - b.at);

    const prev = tour.segments[si - 1];
    const arrival = si === 0 ? seg.start : seg.start + (prev.station === seg.station ? 0 : TRAVEL);

    let cue: string | undefined;
    let focus: string | undefined;
    let cur: Step = { t: arrival, seg: si, arrival: true };
    steps.push(cur);
    const stepOfEvent = new Map<number, Step>();

    for (const ev of evs) {
      if (ev.at - cur.t > MERGE) {
        cur = { t: ev.at, seg: si, cue, focus };
        steps.push(cur);
      }
      if (ev.cue) {
        cue = ev.cue;
        focus = ev.focus; // el foco se hereda mientras no cambie el subtítulo
        cur.cue = ev.cue;
        cur.focus = ev.focus;
        cur.label = ev.cue;
      }
      if (ev.quote) {
        cur.quote = ev.quote;
        cur.label ??= `Cita: “${ev.quote.text}”`;
      }
      if (ev.card) {
        cur.card = ev.card;
        cur.label ??= `Tarjeta: ${ev.card.caption}`;
      }
      if (ev.bubble) {
        (cur.bubbles ??= []).push(ev.bubble);
        cur.label ??= `💬 ${ev.bubble}`;
      }
      stepOfEvent.set(ev.at, cur);
    }
    // cada burbuja aparece cuando se llega a su paso
    for (const b of segBubbles) b.at = stepOfEvent.get(b.at)?.t ?? b.at;
  });

  return { steps, bubbles: retimed };
}

/** Agrupa los segmentos del recorrido en capítulos (una escena del guion = una persona). */
export function buildChapters(tour: TourData): Chapter[] {
  const chapters: Chapter[] = [];
  tour.segments.forEach((s, i) => {
    const number = parseInt(s.scene, 10);
    const last = chapters[chapters.length - 1];
    if (last && last.number === number) {
      last.end = s.end;
    } else {
      chapters.push({
        number,
        title: s.scene.replace(/^\d+\s·\s/, "").replace(/\s\(.*\)$/, ""),
        speaker: s.speaker,
        start: s.start,
        end: s.end,
        firstSeg: i,
      });
    }
  });
  return chapters;
}
