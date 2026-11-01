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
  /** nombre del objeto de pantalla del modelo (scr_*) al que la cámara se acerca mientras dure este subtítulo */
  focus?: string;
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

export type CardLayout = "left" | "right" | "large";

/** Tarjeta con una imagen, cifras destacadas o un código QR. */
export interface ImageCard {
  at: number;
  dur?: number;
  image?: string;
  facts?: Fact[];
  logos?: { name: string; src: string }[]; // cuadrícula de logos (síntesis de tecnologías)
  qr?: string; // URL que se codifica en un QR
  layout?: CardLayout; // left por omisión; large = imagen grande al centro; right = panel a la derecha
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
  card?: { image?: string; facts?: Fact[]; logos?: { name: string; src: string }[]; qr?: string; layout?: CardLayout; caption: string };
  focus?: string; // pantalla a la que se acerca la cámara
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
