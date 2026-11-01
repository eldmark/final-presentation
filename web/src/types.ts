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
  dur: number;
  text: string;
}

export interface Quote {
  at: number;
  dur: number;
  who: string; // rol, nunca nombre
  text: string;
}

export interface ImageCard {
  at: number;
  dur: number;
  image: string;
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
