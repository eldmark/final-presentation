import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";

/**
 * Personajes animados (Quaternius, CC0) en lugar de los maniquíes de Blender.
 * Ocupan el lugar y la orientación de cada figura "fig_<rol>_S<n>" del diorama; el atacante se queda
 * como silueta sin cara a propósito. Las figuras del modelo se llaman cliente, empleada y admin; aquí
 * son el cliente, el empleado y el administrador.
 */
type Role = "cliente" | "empleada" | "admin";

interface Cast {
  url: string;
  height: number; // m, de pie
  idle: string; // animación de reposo (respirar); sentado o con el celular se dobla encima por código
  /** por estación: otra animación (p. ej. saludar en el cierre) */
  byStation?: Record<number, string>;
  /** colores de la ropa, por nombre de material */
  colors?: Record<string, string>;
}

const CAST: Record<Role, Cast> = {
  cliente: {
    url: "models/people/cliente.glb",
    height: 1.78,
    idle: "Idle",
    byStation: { 8: "Wave" },
    colors: { Purple: "#3d5a80" }, // el sudadero, azul como el maniquí original
  },
  empleada: {
    url: "models/people/empleado.glb",
    height: 1.74,
    idle: "Man_Idle",
    byStation: { 8: "Man_Clapping" },
    colors: { Shirt: "#8f2230", Pants: "#2b2a33" }, // camiseta vino tinto de uniforme
  },
  admin: {
    url: "models/people/admin.glb",
    height: 1.8,
    idle: "Idle",
    colors: { Tie: "#7a1a24" },
  },
};

type Pose = "stand" | "sit" | "sitLap" | "phone";

/** Giros (rad) sobre el eje derecho del personaje, encima de la animación de reposo. */
const LEGS: [string, number][] = [["UpperLegL", -Math.PI / 2], ["UpperLegR", -Math.PI / 2], ["LowerLegL", Math.PI / 2], ["LowerLegR", Math.PI / 2]];
const BENDS: Record<Exclude<Pose, "stand">, [string, number][]> = {
  // sentado con los antebrazos hacia la laptop
  sit: [...LEGS, ["UpperArmL", -0.55], ["UpperArmR", -0.55], ["LowerArmL", -0.75], ["LowerArmR", -0.75]],
  // sentado con las manos en el regazo (el escritorio del administrador queda lejos de la silla)
  sitLap: [...LEGS, ["UpperArmL", -0.3], ["UpperArmR", -0.3], ["LowerArmL", -0.5], ["LowerArmR", -0.5]],
  // el celular frente al pecho y la cabeza un poco abajo, mirándolo
  phone: [["UpperArmR", -0.3], ["LowerArmR", -1.8], ["Head", 0.3]],
};

const clipName = (c: THREE.AnimationClip) => c.name.split("|").pop() ?? c.name;

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
      mat.needsUpdate = true;
    }
  });
}

/** Celular de mano: el frente (con la pantalla encendida) mira hacia +Z. */
function handPhone(): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.15, 0.012), new THREE.MeshStandardMaterial({ color: "#1a1214", roughness: 0.4 })));
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.064, 0.132),
    new THREE.MeshStandardMaterial({ color: "#000000", emissive: new THREE.Color("#d9fdd3"), emissiveIntensity: 0.9 }),
  );
  screen.position.z = 0.0065;
  g.add(screen);
  return g;
}

interface Actor {
  model: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  /** huesos que se doblan por código encima de la animación */
  bends: { bone: THREE.Bone; rest: THREE.Quaternion; angle: number }[];
  /** en estos esqueletos el pie es independiente (IK): se lleva bajo la rodilla */
  feet: { foot: THREE.Object3D; knee: THREE.Object3D; shin: number }[];
  phone?: { mesh: THREE.Object3D; elbow: THREE.Object3D; wrist: THREE.Object3D; head: THREE.Object3D };
}

const tmpA = new THREE.Quaternion();
const tmpB = new THREE.Quaternion();
const tmpC = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpW = new THREE.Vector3();
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
      const pose: Pose = sitting ? (role === "admin" ? "sitLap" : "sit") : role === "cliente" && station === 0 ? "phone" : "stand";
      this.actors.push(this.place(fig, models.get(role as Role)!, CAST[role as Role], station, pose));
      fig.visible = false;
    }
    return figures.length;
  }

  private place(fig: THREE.Object3D, gltf: GLTF, cast: Cast, station: number, pose: Pose): Actor {
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
    const clip = clips.get(cast.byStation?.[station] ?? cast.idle) ?? clips.get(cast.idle)!;
    const action = mixer.clipAction(clip);
    action.play();
    action.timeScale = clip.name.endsWith("Idle") ? 0.7 : 1; // respirar despacio: que no se note el bucle
    action.time = Math.random() * clip.duration; // que no respiren todos al mismo tiempo
    mixer.update(0);

    // escala por estatura, medida de pie (antes de doblar nada)
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model, true);
    model.scale.setScalar(cast.height / Math.max(0.01, box.max.y - box.min.y));
    model.updateMatrixWorld(true);

    // (GLTFLoader quita los puntos de los nombres: "UpperLeg.L" llega como "UpperLegL")
    const bone = (n: string) => model.getObjectByName(n) as THREE.Bone | undefined;
    const bends: Actor["bends"] = [];
    for (const [n, angle] of pose === "stand" ? [] : BENDS[pose]) {
      const b = bone(n);
      if (b) bends.push({ bone: b, rest: b.quaternion.clone(), angle });
    }
    const feet: Actor["feet"] = [];
    const seated = pose === "sit" || pose === "sitLap";
    if (seated) {
      for (const side of ["L", "R"]) {
        const foot = bone(`Foot${side}`);
        const knee = bone(`LowerLeg${side}`);
        if (foot && knee && !knee.getObjectById(foot.id)) {
          const shin = knee.getWorldPosition(new THREE.Vector3()).distanceTo(foot.getWorldPosition(new THREE.Vector3()));
          feet.push({ foot, knee, shin });
        }
      }
    }
    const actor: Actor = { model, mixer, bends, feet };
    const [elbow, wrist, head] = [bone("LowerArmR"), bone("WristR"), bone("Head")];
    if (pose === "phone" && elbow && wrist && head) {
      const mesh = handPhone();
      fig.parent!.add(mesh);
      actor.phone = { mesh, elbow, wrist, head };
    }
    this.pose(actor);

    // apoya los pies en el piso o, sentado, el muslo (horizontal) en el asiento
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);
    if (seated) {
      const hips = model.getObjectByName("Hips")!.getWorldPosition(new THREE.Vector3());
      const seat = bone("UpperLegL")?.getWorldPosition(new THREE.Vector3()) ?? hips;
      model.position.set(pos.x - hips.x, pos.y + 0.08 - seat.y, pos.z - hips.z);
    } else {
      const floor = new THREE.Box3().setFromObject(model, true);
      model.position.set(pos.x, pos.y - floor.min.y, pos.z);
    }
    this.pose(actor);
    return actor;
  }

  /** Dobla huesos en el espacio del personaje, encima de lo que dejó la animación. */
  private pose(actor: Actor): void {
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
    const p = actor.phone;
    if (p) {
      // en la palma (un poco más allá de la muñeca) y con la pantalla hacia la cara
      const wrist = p.wrist.getWorldPosition(tmpV);
      const dir = tmpW.copy(wrist).sub(p.elbow.getWorldPosition(new THREE.Vector3())).normalize();
      p.mesh.position.copy(wrist).addScaledVector(dir, 0.07);
      p.mesh.lookAt(p.head.getWorldPosition(tmpW));
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
