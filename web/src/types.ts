export interface TourKey {
  t: number;
  pos: [number, number, number]; // coordenadas de Blender (Z hacia arriba)
  aim: [number, number, number];
}

export interface TourSegment {
  id: string;
  station: number;
  start: number;
  end: number;
  speaker: string;
  scene: string;
}

export interface TourData {
  fps: number;
  duration: number;
  spacing: number;
  segments: TourSegment[];
  keys: TourKey[];
}

export interface Cue {
  at: number; // segundo absoluto de la presentación
  dur?: number; // solo informativo
  text: string;
}

export interface Quote {
  at: number;
  dur?: number;
  who: string; // rol, nunca nombre
  text: string;
}

export interface Fact {
  value: string;
  label: string;
}

/** Tarjeta con una imagen o con cifras destacadas. */
export interface ImageCard {
  at: number;
  dur?: number;
  image?: string;
  facts?: Fact[];
  caption: string;
}

export interface SegmentContent {
  cues: Cue[];
  quotes: Quote[];
  cards: ImageCard[];
}

export interface ContentData {
  title: string;
  disclaimer: string[];
  segments: Record<string, SegmentContent>;
}

export interface BubbleSpec {
  text: string;
  from: "cliente" | "tienda" | "sistema";
  at: number;
  until: number;
  station: number;
  slot: number; // posición en la pila
}

/** Un "paso" es lo que ve el público tras una pulsación: subtítulo, cita, tarjeta y burbujas. */
export interface Step {
  t: number; // segundo de la línea de tiempo al que se llega
  seg: number; // índice de segmento (estación)
  cue?: string;
  quote?: { who: string; text: string };
  card?: { image?: string; facts?: Fact[]; caption: string };
  label?: string; // resumen corto del paso para la vista del presentador
  bubbles?: string[]; // burbujas de chat que aparecen en este paso (para la vista del presentador)
  arrival?: boolean;
}

export interface Chapter {
  number: number;
  title: string;
  speaker: string;
  start: number;
  end: number;
  firstSeg: number;
}
