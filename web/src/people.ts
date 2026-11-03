import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

/**
 * Personajes animados (Quaternius, CC0) en lugar de los maniquíes de Blender.
 * Ocupan el lugar y la orientación de cada figura "fig_<rol>_S<n>" del diorama; el atacante se queda
 * como silueta sin cara a propósito.
 */
type Role = "cliente" | "empleada" | "admin";

interface Cast {
  url: string;
  height: number; // m, de pie
  stand: string;
  sit?: string; // sin clip: se sienta doblando las piernas por código
  /** por estación: otra animación (p. ej. saludar en el cierre) */
  byStation?: Record<number, string>;
  /** colores de la ropa y el pelo, por nombre de material */
  colors?: Record<string, string>;
  /** paleta de textura: color original → color nuevo */
  palette?: Record<string, string>;
}

const CAST: Record<Role, Cast> = {
  cliente: {
    url: "models/people/cliente.glb",
    height: 1.76,
    stand: "Idle",
    byStation: { 8: "Wave" },
    colors: { LightBrown: "#5b7c99" }, // la camiseta, del mismo azul que el maniquí original
  },
  empleada: {
    url: "models/people/empleada.glb",
    height: 1.66,
    stand: "Idle",
    palette: { "#e7655c": "#8f2230", "#d1c270": "#3a2a22", "#f0472f": "#2b2a33" },
  },
  admin: {
    url: "models/people/admin.glb",
    height: 1.68,
    stand: "Female_Idle",
    sit: "Female_Sitting",
    byStation: { 8: "Female_Clapping" },
    colors: { Hair: "#3a2a22", Jacket: "#2f3b4c", LightJacket: "#3b4a61", Shirt: "#f5f0eb" },
  },
};

const clipName = (c: THREE.AnimationClip) => c.name.split("|").pop() ?? c.name;

/** Cambia colores exactos de una textura-paleta (los modelos low-poly pintan con cuadros de color). */
function repaint(tex: THREE.Texture, palette: Record<string, string>): THREE.Texture {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const swap = new Map(
    Object.entries(palette).map(([from, to]) => [from.toLowerCase(), new THREE.Color(to).getHexString()]),
  );
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const hex = [px[i], px[i + 1], px[i + 2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    const to = swap.get(`#${hex}`);
    if (!to) continue;
    px[i] = parseInt(to.slice(0, 2), 16);
    px[i + 1] = parseInt(to.slice(2, 4), 16);
    px[i + 2] = parseInt(to.slice(4, 6), 16);
  }
  ctx.putImageData(data, 0, 0);
  const out = new THREE.CanvasTexture(canvas);
  out.flipY = tex.flipY;
  out.colorSpace = THREE.SRGBColorSpace;
  out.magFilter = THREE.NearestFilter;
  out.minFilter = THREE.NearestFilter;
  out.generateMipmaps = false;
  return out;
}

/** Ajusta los materiales una vez por modelo (las copias los comparten). */
function dress(gltf: GLTF, cast: Cast): void {
  gltf.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      const mat = m as THREE.MeshStandardMaterial;
      mat.metalness = 0;
      mat.roughness = 0.78;
      const tint = cast.colors?.[mat.name];
      if (tint) mat.color.set(tint);
      if (cast.palette && mat.map) mat.map = repaint(mat.map, cast.palette);
      mat.needsUpdate = true;
    }
  });
}

interface Actor {
  model: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  /** piernas y brazos que se doblan por código cuando no hay animación de sentado */
  bends: { bone: THREE.Bone; rest: THREE.Quaternion; angle: number }[];
  /** en estos esqueletos el pie es independiente (IK): se lleva bajo la rodilla */
  feet: { foot: THREE.Object3D; knee: THREE.Object3D; shin: number }[];
}

const tmpA = new THREE.Quaternion();
const tmpB = new THREE.Quaternion();
const tmpC = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const RIGHT = new THREE.Vector3(1, 0, 0);

export class People {
  private readonly actors: Actor[] = [];

  /** Reemplaza las figuras del diorama; devuelve cuántas cambió. */
  async load(root: THREE.Object3D): Promise<number> {
    const loader = new GLTFLoader();
    const roles = Object.keys(CAST) as Role[];
    const models = new Map<Role, GLTF>();
    await Promise.all(
      roles.map(async (r) => {
        const gltf = await loader.loadAsync(CAST[r].url);
        dress(gltf, CAST[r]);
        models.set(r, gltf);
      }),
    );

    const figures: THREE.Object3D[] = [];
    root.traverse((o) => {
      if (/^fig_(cliente|empleada|admin)_S\d$/.test(o.name)) figures.push(o);
    });
    for (const fig of figures) {
      const [, role, s] = /^fig_(\w+)_S(\d)$/.exec(fig.name)!;
      const station = Number(s);
      const sitting = Boolean(fig.getObjectByName(`${fig.name}_thighL`));
      this.actors.push(this.place(fig, models.get(role as Role)!, CAST[role as Role], station, sitting));
      fig.visible = false;
    }
    return figures.length;
  }

  private place(fig: THREE.Object3D, gltf: GLTF, cast: Cast, station: number, sitting: boolean): Actor {
    const model = SkeletonUtils.clone(gltf.scene);
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // la caja de un modelo con huesos no sigue a la animación
      }
    });
    fig.updateWorldMatrix(true, false);
    const pos = fig.getWorldPosition(new THREE.Vector3());
    model.quaternion.copy(fig.getWorldQuaternion(new THREE.Quaternion()));
    fig.parent!.add(model);

    const clips = new Map(gltf.animations.map((c) => [clipName(c), c]));
    const mixer = new THREE.AnimationMixer(model);

    // escala por estatura, medida de pie (aunque luego se siente)
    const standing = mixer.clipAction(clips.get(cast.stand)!);
    standing.play();
    mixer.update(0);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model, true);
    model.scale.setScalar(cast.height / Math.max(0.01, box.max.y - box.min.y));
    standing.stop();

    const want = cast.byStation?.[station] ?? (sitting && cast.sit ? cast.sit : cast.stand);
    const clip = clips.get(want) ?? clips.get(cast.stand)!;
    const action = mixer.clipAction(clip);
    action.play();
    action.time = Math.random() * clip.duration; // que no respiren todos al mismo tiempo
    mixer.update(0);

    const bends: Actor["bends"] = [];
    const feet: Actor["feet"] = [];
    if (sitting && !cast.sit) {
      // sin clip de sentado: muslos al frente, piernas abajo y antebrazos hacia el escritorio
      // (GLTFLoader quita los puntos de los nombres: "UpperLeg.L" llega como "UpperLegL")
      const bone = (n: string) => model.getObjectByName(n) as THREE.Bone | undefined;
      const add = (n: string, angle: number) => {
        const b = bone(n);
        if (b) bends.push({ bone: b, rest: b.quaternion.clone(), angle });
      };
      for (const side of ["L", "R"]) {
        add(`UpperLeg${side}`, -Math.PI / 2);
        add(`LowerLeg${side}`, Math.PI / 2);
        add(`UpperArm${side}`, -0.55);
        add(`LowerArm${side}`, -0.75);
        const foot = bone(`Foot${side}`);
        const knee = bone(`LowerLeg${side}`);
        if (foot && knee && !knee.getObjectById(foot.id)) {
          model.updateMatrixWorld(true);
          const shin = knee.getWorldPosition(new THREE.Vector3()).distanceTo(foot.getWorldPosition(new THREE.Vector3()));
          feet.push({ foot, knee, shin });
        }
      }
    }
    const actor: Actor = { model, mixer, bends, feet };
    this.pose(actor);

    // apoya los pies en el piso o la cadera en el asiento
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);
    if (sitting) {
      // con el clip, la cadera queda sobre el asiento; doblado por código, el muslo (horizontal) se apoya en él
      const hips = model.getObjectByName("Hips")!.getWorldPosition(new THREE.Vector3());
      const seat = (bends.length ? model.getObjectByName("UpperLegL") : null)?.getWorldPosition(new THREE.Vector3()) ?? hips;
      model.position.set(pos.x - hips.x, pos.y + (bends.length ? 0.08 : 0.12) - seat.y, pos.z - hips.z);
    } else {
      const feet = new THREE.Box3().setFromObject(model, true);
      model.position.set(pos.x, pos.y - feet.min.y, pos.z);
    }
    return actor;
  }

  /** Dobla huesos en el espacio del personaje, encima de lo que dejó la animación. */
  private pose(actor: Actor): void {
    if (!actor.bends.length) return;
    const axis = RIGHT.clone().applyQuaternion(actor.model.getWorldQuaternion(tmpC));
    for (const { bone, angle } of actor.bends) {
      bone.updateWorldMatrix(true, false);
      const parent = bone.parent!.getWorldQuaternion(tmpA);
      const world = bone.getWorldQuaternion(tmpB).premultiply(tmpC.setFromAxisAngle(axis, angle));
      bone.quaternion.copy(parent.invert().multiply(world));
      bone.updateMatrixWorld(true);
    }
    for (const { foot, knee, shin } of actor.feet) {
      const at = knee.getWorldPosition(tmpV);
      at.y -= shin;
      foot.position.copy(foot.parent!.worldToLocal(at));
      foot.updateMatrixWorld(true);
    }
  }

  update(dt: number): void {
    for (const a of this.actors) {
      // los huesos doblados vuelven a su reposo para que el giro no se acumule entre cuadros
      for (const b of a.bends) b.bone.quaternion.copy(b.rest);
      a.mixer.update(dt);
      this.pose(a);
    }
  }
}
