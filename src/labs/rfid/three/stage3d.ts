// A 3D stage for the RFID panels: renderer, a camera that orbits on drag, labels that follow
// 3D points. No React: the panel creates it once three.js has loaded and calls tick() per frame.
import type * as Three from "three";

export type ThreeModule = typeof Three;

export interface StageOptions {
  /** The point the camera orbits around and looks at. */
  readonly target: { readonly x: number; readonly y: number; readonly z: number };
  readonly radius: number;
  readonly az?: number;
  readonly el?: number;
  readonly spin?: boolean;
  readonly reduce: boolean;
}

interface Label {
  readonly node: HTMLSpanElement;
  readonly at: Three.Vector3 | (() => Three.Vector3);
  readonly show: () => boolean;
}

export class Stage3d {
  readonly scene: Three.Scene;
  readonly camera: Three.PerspectiveCamera;
  readonly renderer: Three.WebGLRenderer;
  readonly view: { az: number; el: number; radius: number; spinning: boolean; dragging: boolean };
  readonly reduce: boolean;
  #box: HTMLElement;
  #labelsEl: HTMLElement;
  #labels: Label[] = [];
  #target: Three.Vector3;
  #v: Three.Vector3;
  #ro: ResizeObserver;
  #px = 0;
  #py = 0;
  #moved = 0;
  #frame: (t: number, dt: number) => void = () => {};

  constructor(
    T: ThreeModule,
    box: HTMLElement,
    canvas: HTMLCanvasElement,
    labelsEl: HTMLElement,
    o: StageOptions,
  ) {
    this.#box = box;
    this.#labelsEl = labelsEl;
    this.#target = new T.Vector3(o.target.x, o.target.y, o.target.z);
    this.#v = new T.Vector3();
    this.reduce = o.reduce;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(36, 1.6, 0.1, 200);
    this.scene.add(new T.HemisphereLight(0xffffff, 0x445566, 1.6));
    const sun = new T.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 9, 6);
    this.scene.add(sun);
    this.view = {
      az: o.az ?? 0.7,
      el: o.el ?? 0.62,
      radius: o.radius,
      spinning: (o.spin ?? true) && !o.reduce,
      dragging: false,
    };
    this.#ro = new ResizeObserver(this.#resize);
    this.#ro.observe(box);
    this.#resize();
    box.addEventListener("pointerdown", this.#down);
    box.addEventListener("pointermove", this.#move);
    box.addEventListener("pointerup", this.#up);
    box.addEventListener("pointercancel", this.#up);
  }

  #resize = () => {
    const w = this.#box.clientWidth;
    const h = this.#box.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  #down = (e: PointerEvent) => {
    this.view.dragging = true;
    this.#px = e.clientX;
    this.#py = e.clientY;
    this.#moved = 0;
    this.#box.setPointerCapture?.(e.pointerId);
  };

  #move = (e: PointerEvent) => {
    if (!this.view.dragging) return;
    const dx = e.clientX - this.#px;
    const dy = e.clientY - this.#py;
    this.#px = e.clientX;
    this.#py = e.clientY;
    this.#moved += Math.abs(dx) + Math.abs(dy);
    this.view.az += dx * 0.008;
    this.view.el = Math.min(1.45, Math.max(0.08, this.view.el + dy * 0.006));
  };

  #up = () => {
    this.view.dragging = false;
  };

  /** True when the last pointer press barely moved: a click, not a drag. */
  wasClick = () => this.#moved < 6;

  /** A label pinned to a 3D point (or a moving one). */
  label(text: string, at: Label["at"], show: () => boolean = () => true) {
    const node = document.createElement("span");
    node.textContent = text;
    this.#labelsEl.appendChild(node);
    this.#labels.push({ node, at, show });
  }

  /** Scene animation, called every frame with seconds and the frame time. */
  onFrame(frame: (t: number, dt: number) => void) {
    this.#frame = frame;
  }

  tick(nowMs: number, dt: number) {
    const v = this.view;
    const step = Math.min(0.05, dt);
    if (v.spinning && !v.dragging) v.az += step * 0.12;
    const t = this.#target;
    this.camera.position.set(
      t.x + v.radius * Math.cos(v.el) * Math.cos(v.az),
      t.y + v.radius * Math.sin(v.el),
      t.z + v.radius * Math.cos(v.el) * Math.sin(v.az),
    );
    this.camera.lookAt(t);
    this.#frame(nowMs / 1000, step);
    this.renderer.render(this.scene, this.camera);
    this.#drawLabels();
  }

  #drawLabels() {
    const w = this.#box.clientWidth;
    const h = this.#box.clientHeight;
    for (const l of this.#labels) {
      this.#v.copy(typeof l.at === "function" ? l.at() : l.at).project(this.camera);
      const visible = l.show() && this.#v.z < 1;
      l.node.style.opacity = visible ? "1" : "0";
      l.node.style.left = `${((this.#v.x + 1) / 2) * w}px`;
      l.node.style.top = `${((1 - this.#v.y) / 2) * h - 10}px`;
    }
  }

  dispose() {
    this.#ro.disconnect();
    const box = this.#box;
    box.removeEventListener("pointerdown", this.#down);
    box.removeEventListener("pointermove", this.#move);
    box.removeEventListener("pointerup", this.#up);
    box.removeEventListener("pointercancel", this.#up);
    this.#labels.forEach((l) => l.node.remove());
    this.#labels = [];
    this.scene.traverse((o) => {
      const mesh = o as Partial<Three.Mesh>;
      mesh.geometry?.dispose();
      const m = mesh.material;
      (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => x.dispose());
    });
    this.renderer.dispose();
  }
}

/** A rounded rectangle in the XZ plane, as points (for coils and traces). */
export function roundedRect(
  T: ThreeModule,
  cx: number,
  y: number,
  cz: number,
  hw: number,
  hd: number,
  r: number,
  n = 10,
): Three.Vector3[] {
  const pts: Three.Vector3[] = [];
  const corners = [
    [hw - r, hd - r, 0],
    [-(hw - r), hd - r, Math.PI / 2],
    [-(hw - r), -(hd - r), Math.PI],
    [hw - r, -(hd - r), Math.PI * 1.5],
  ] as const;
  for (const [x, z, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push(new T.Vector3(cx + x + r * Math.cos(a), y, cz + z + r * Math.sin(a)));
    }
  return pts;
}
