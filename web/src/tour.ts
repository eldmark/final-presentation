import * as THREE from "three";
import type { Step, TourData, TourSegment } from "./types";
import { fromBlender } from "./stage";

const smooth = (u: number): number => u * u * (3 - 2 * u);
const easeInOut = (u: number): number => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

interface Anim {
  from: number;
  to: number;
  dur: number;
  elapsed: number;
}

/**
 * Reloj y cámara de la presentación.
 * - Modo manual (por omisión): cada pulsación lleva la línea de tiempo al siguiente paso.
 * - Modo automático: el tiempo corre solo y los pasos aparecen a su hora.
 */
export class Tour {
  time = 0;
  /** true = el tiempo corre solo (modo automático) */
  playing = false;
  auto = false;
  steps: Step[] = [];
  private anim: Anim | null = null;
  private readonly reduceMotion: boolean;

  constructor(readonly data: TourData) {
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  get duration(): number {
    return this.data.duration;
  }

  get busy(): boolean {
    return this.anim !== null;
  }

  get stepIndex(): number {
    let idx = 0;
    for (let i = 0; i < this.steps.length; i++) {
      if (this.steps[i].t <= this.time + 1e-3) idx = i;
      else break;
    }
    return idx;
  }

  get step(): Step {
    return this.steps[this.stepIndex];
  }

  get segmentIndex(): number {
    return this.step.seg;
  }

  get segment(): TourSegment {
    return this.data.segments[this.segmentIndex];
  }

  /** Posición del paso actual dentro de su escena (para los puntos de avance). */
  stepsInSegment(): { index: number; total: number } {
    const seg = this.step.seg;
    const inSeg = this.steps.filter((s) => s.seg === seg);
    return { index: inSeg.indexOf(this.step), total: inSeg.length };
  }

  update(dt: number): void {
    if (this.anim) {
      const a = this.anim;
      a.elapsed += dt;
      const p = Math.min(1, a.elapsed / a.dur);
      this.time = a.from + (a.to - a.from) * easeInOut(p);
      if (p >= 1) {
        this.time = a.to;
        this.anim = null;
      }
      return;
    }
    if (!this.playing) return;
    this.time = Math.min(this.duration, this.time + dt);
    if (this.time >= this.duration) this.playing = false;
  }

  seek(t: number): void {
    this.anim = null;
    this.time = Math.max(0, Math.min(this.duration, t));
  }

  private animateTo(index: number): void {
    const target = this.steps[Math.max(0, Math.min(this.steps.length - 1, index))];
    const from = this.anim ? this.anim.to : this.time;
    if (this.anim) this.time = this.anim.to; // completa el movimiento en curso
    const crossStation =
      this.data.segments[this.step.seg].station !== this.data.segments[target.seg].station;
    const delta = Math.abs(target.t - from);
    const dur = this.reduceMotion ? 0.01 : crossStation ? 2.4 : Math.min(1.8, Math.max(0.7, delta / 5));
    this.anim = { from: this.time, to: target.t, dur, elapsed: 0 };
  }

  private baseIndex(): number {
    // si hay un movimiento en curso, cuenta desde su destino
    if (this.anim) {
      const to = this.anim.to;
      let idx = 0;
      for (let i = 0; i < this.steps.length; i++) if (this.steps[i].t <= to + 1e-3) idx = i;
      return idx;
    }
    return this.stepIndex;
  }

  next(): void {
    const i = this.baseIndex();
    if (i >= this.steps.length - 1) return;
    this.animateTo(i + 1);
  }

  prev(): void {
    const i = this.baseIndex();
    // en mitad de un paso, "atrás" vuelve primero al inicio de ese paso
    const here = this.steps[i];
    if (!this.anim && this.time - here.t > 0.5) this.animateTo(i);
    else if (i > 0) this.animateTo(i - 1);
  }

  /** Salta al primer paso de la escena (capítulo) siguiente o anterior. */
  jumpScene(dir: 1 | -1): void {
    const cur = this.data.segments[this.steps[this.baseIndex()].seg];
    const curNumber = parseInt(cur.scene, 10);
    const segs = this.data.segments;
    let target = -1;
    if (dir === 1) target = segs.findIndex((s) => parseInt(s.scene, 10) > curNumber);
    else {
      const startOfCur = segs.findIndex((s) => parseInt(s.scene, 10) === curNumber);
      const here = this.steps[this.baseIndex()];
      const firstOfCur = this.steps.findIndex((s) => s.seg === startOfCur);
      // si ya avanzamos dentro de la escena, vuelve al inicio; si no, a la anterior
      if (this.steps.indexOf(here) > firstOfCur) {
        this.animateTo(firstOfCur);
        return;
      }
      for (let i = segs.length - 1; i >= 0; i--) {
        if (parseInt(segs[i].scene, 10) < curNumber) {
          target = segs.findIndex((s) => parseInt(s.scene, 10) === parseInt(segs[i].scene, 10));
          break;
        }
      }
    }
    if (target < 0) return;
    this.animateTo(this.steps.findIndex((s) => s.seg === target));
  }

  goToStart(): void {
    this.seek(0);
    this.playing = false;
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
