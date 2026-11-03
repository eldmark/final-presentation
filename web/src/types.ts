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

/** Una tecnología del slide final. Se edita en content.json (segments.cierre.cards[].logos). */
export interface Logo {
  name: string;
  src: string;
  use?: string; // para qué se usó (se ve al pasar el cursor)
  group?: string; // id de grupo: "proyecto" o "presentacion"
  hints?: string[]; // palabras clave de por qué se eligió (solo en la vista del presentador)
}

export type CardLayout = "left" | "right" | "large" | "objetivos" | "gallery";

/** Una captura de la galería (varias pantallas lado a lado, con su etiqueta). */
export interface Shot {
  src: string;
  label: string;
}

/** Tarjeta con una imagen, cifras destacadas o un código QR. */
export interface ImageCard {
  at: number;
  dur?: number;
  image?: string;
  facts?: Fact[];
  logos?: Logo[]; // cuadrícula de logos (síntesis de tecnologías)
  gallery?: Shot[]; // varias capturas lado a lado (layout "gallery")
  groups?: { id: string; title: string }[]; // títulos de los grupos de logos (por Logo.group)
  qr?: string; // URL que se codifica en un QR
  layout?: CardLayout; // left por omisión; large = imagen grande al centro; right = panel a la derecha
  reveal?: boolean; // sus cifras entran de una en una, un paso cada una, mientras dure la tarjeta
  caption: string;
}

export interface SegmentContent {
  /** Video mudo en bucle que se muestra entre dos instantes del recorrido (p. ej. la demo durante las conclusiones). */
  video?: { src: string; from: number; until: number };
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

/** Lo que muestra una tarjeta en un paso. */
export interface StepCard {
  image?: string;
  facts?: Fact[];
  logos?: Logo[];
  gallery?: Shot[];
  groups?: { id: string; title: string }[];
  qr?: string;
  layout?: CardLayout;
  caption: string;
  reveal?: boolean;
  until?: number; // segundo en que deja de mostrarse (para las que se revelan por pasos)
  shown?: number; // cuántas cifras se ven en este paso (tarjetas que se revelan)
}

/** Un "paso" es lo que ve el público tras una pulsación: subtítulo, cita, tarjeta y burbujas. */
export interface Step {
  t: number; // segundo de la línea de tiempo al que se llega
  seg: number; // índice de segmento (estación)
  cue?: string;
  quote?: { who: string; text: string };
  card?: StepCard;
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
