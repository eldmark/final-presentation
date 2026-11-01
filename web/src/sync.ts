/** Mensajes entre la ventana de la presentación y la vista del presentador (mismo origen). */
export const CHANNEL = "bodega-presentacion";

export interface StateMsg {
  type: "state";
  started: boolean;
  auto: boolean;
  playing: boolean;
  time: number;
  stepIndex: number;
  elapsed: number; // segundos reales desde que se empezó
  sceneElapsed: number; // segundos reales en la escena actual
}

export type Cmd = "next" | "prev" | "nextScene" | "prevScene" | "toggleMode" | "start" | "goStep";

export interface CmdMsg {
  type: "cmd";
  cmd: Cmd;
  index?: number;
}

export interface HelloMsg {
  type: "hello";
}

export type Msg = StateMsg | CmdMsg | HelloMsg;

export function openChannel(): BroadcastChannel {
  return new BroadcastChannel(CHANNEL);
}
