/**
 * Mensajes entre la ventana de la presentación, la vista del presentador y el celular.
 * - Mismo navegador: BroadcastChannel (sin servidor).
 * - Otros dispositivos: WebSocket contra el servidor de la presentación (server/server.mjs), con un token.
 * Cada mensaje lleva un id, así que si llega por los dos caminos se procesa una sola vez.
 */
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

export type Cmd = "next" | "prev" | "nextScene" | "prevScene" | "toggleMode" | "start" | "goStep" | "resetTimer";

export interface CmdMsg {
  type: "cmd";
  cmd: Cmd;
  index?: number;
}

export interface HelloMsg {
  type: "hello";
}

export type Msg = (StateMsg | CmdMsg | HelloMsg) & { id?: string };

export const TOKEN_KEY = "bodega-k";

/** Token del control remoto: viene en la URL (?k=) y se recuerda en la pestaña. */
export function readToken(): string | null {
  const fromUrl = new URLSearchParams(location.search).get("k");
  if (fromUrl) sessionStorage.setItem(TOKEN_KEY, fromUrl);
  return fromUrl ?? sessionStorage.getItem(TOKEN_KEY);
}

const rid = (): string => Math.random().toString(36).slice(2) + Date.now().toString(36);

export class Link {
  private readonly bc = new BroadcastChannel(CHANNEL);
  private ws: WebSocket | null = null;
  private readonly seen: string[] = [];
  private readonly handlers: ((m: Msg) => void)[] = [];
  private readonly statusHandlers: ((remote: boolean) => void)[] = [];
  private retry = 0;

  constructor(private readonly token: string | null) {
    this.bc.onmessage = (e: MessageEvent<Msg>) => this.receive(e.data);
    if (token) this.connect();
  }

  get remoteConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onMessage(fn: (m: Msg) => void): void {
    this.handlers.push(fn);
  }

  onStatus(fn: (remote: boolean) => void): void {
    this.statusHandlers.push(fn);
  }

  send(msg: Msg): void {
    const m: Msg = { ...msg, id: rid() };
    this.remember(m.id!);
    this.bc.postMessage(m);
    if (this.remoteConnected) this.ws!.send(JSON.stringify(m));
  }

  private remember(id: string): boolean {
    if (this.seen.includes(id)) return false;
    this.seen.push(id);
    if (this.seen.length > 300) this.seen.splice(0, 100);
    return true;
  }

  private receive(m: Msg | undefined): void {
    if (!m || !m.type) return;
    if (m.id && !this.remember(m.id)) return; // ya procesado por el otro camino
    for (const h of this.handlers) h(m);
  }

  private connect(): void {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}/ws?k=${encodeURIComponent(this.token!)}`);
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.statusHandlers.forEach((f) => f(true));
      this.send({ type: "hello" });
    };
    ws.onmessage = (e) => {
      try {
        this.receive(JSON.parse(String(e.data)) as Msg);
      } catch {
        /* mensaje ajeno: se ignora */
      }
    };
    ws.onclose = () => {
      this.statusHandlers.forEach((f) => f(false));
      this.retry = Math.min(5000, this.retry + 800);
      window.setTimeout(() => this.connect(), this.retry || 800);
    };
    ws.onerror = () => ws.close();
  }
}
