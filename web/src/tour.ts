import * as THREE from "three";
import type { TourData, TourSegment } from "./types";
import { fromBlender } from "./stage";

const smooth = (u: number): number => u * u * (3 - 2 * u);

export class Tour {
  time = 0;
  playing = false;
  private readonly reduceMotion: boolean;
  /** Segundos que tarda la cámara en llegar a una estación nueva (igual que en Blender). */
  static readonly TRAVEL = 3;

  constructor(readonly data: TourData) {
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  get duration(): number {
    return this.data.duration;
  }

  get segmentIndex(): number {
    const i = this.data.segments.findIndex((s) => this.time >= s.start && this.time < s.end);
    return i === -1 ? this.data.segments.length - 1 : i;
  }

  get segment(): TourSegment {
    return this.data.segments[this.segmentIndex];
  }

  update(dt: number): void {
    if (!this.playing) return;
    this.time = Math.min(this.duration, this.time + dt);
    if (this.time >= this.duration) this.playing = false;
  }

  seek(t: number): void {
    this.time = Math.max(0, Math.min(this.duration, t));
  }

  /** Salta al inicio de una escena, ya con la cámara en su sitio. */
  goToSegment(index: number): void {
    const i = Math.max(0, Math.min(this.data.segments.length - 1, index));
    const s = this.data.segments[i];
    const sameStationAsPrev = i > 0 && this.data.segments[i - 1].station === s.station;
    this.seek(s.start + (i === 0 || sameStationAsPrev ? 0 : Tour.TRAVEL));
  }

  /** Posición y punto de mira de la cámara en el instante `t` (coordenadas de Three.js). */
  pose(t = this.time): { pos: THREE.Vector3; aim: THREE.Vector3 } {
    const keys = this.data.keys;
    let i = 0;
    while (i < keys.length - 2 && t >= keys[i + 1].t) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const span = Math.max(1e-6, b.t - a.t);
    let u = Math.min(1, Math.max(0, (t - a.t) / span));

    const pa = fromBlender(a.pos);
    const pb = fromBlender(b.pos);
    // con "reducir movimiento" los viajes largos entre estaciones son un corte, no un travelling
    if (this.reduceMotion && pa.distanceTo(pb) > 6) u = u < 0.5 ? 0 : 1;
    else u = smooth(u);

    return {
      pos: pa.lerp(pb, u),
      aim: fromBlender(a.aim).lerp(fromBlender(b.aim), u),
    };
  }
}
