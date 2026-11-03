import * as THREE from "three";

/**
 * Escena de seguridad (estación 7): un domo de energía cubre los servidores, los paquetes del atacante
 * (y de afuera) chocan contra él con una onda y un «BLOQUEADO», y los racks parpadean.
 * Todo se monta encima del modelo; la silueta encapuchada sigue siendo la de Blender.
 */
const CENTER = new THREE.Vector3(63, 0, 0); // estación 7: x = 7 · 9
const RADIUS = 2.3; // cubre los tres racks y la botella
const HITS = 6;

const domeVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPos = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;

const domeFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec4 uHits[${HITS}];
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormalW;
  void main() {
    vec3 v = normalize(cameraPosition - vPos);
    float rim = pow(1.0 - abs(dot(v, vNormalW)), 3.0);
    // líneas que suben despacio: se nota que es un campo activo
    float scan = smoothstep(0.46, 0.5, abs(fract(vPos.y * 5.0 - uTime * 0.35) - 0.5)) * 0.25;
    float hit = 0.0;
    for (int i = 0; i < ${HITS}; i++) {
      float age = uTime - uHits[i].w;
      if (age < 0.0 || age > 1.2) continue;
      float d = distance(vPos, uHits[i].xyz);
      hit += exp(-pow((d - age * 1.7) * 8.0, 2.0)) * (1.0 - age / 1.2) + exp(-d * d * 40.0) * max(0.0, 1.0 - age * 3.0);
    }
    float a = rim * 0.6 + scan * rim + hit * 0.95 + 0.02;
    gl_FragColor = vec4(uColor * (0.7 + hit * 1.6), a);
  }`;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

function label(): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 72;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#8f1d2b";
  ctx.beginPath();
  ctx.roundRect(4, 4, 248, 64, 32);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 40px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BLOQUEADO", 128, 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, color: new THREE.Color(0.86, 0.86, 0.86) }));
  s.scale.set(0.62, 0.175, 1);
  s.visible = false;
  s.renderOrder = 11;
  return s;
}

interface Packet {
  mesh: THREE.Mesh;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number; // 0 → 1 en vuelo
  speed: number; // fracción del trayecto por segundo
  wait: number; // segundos antes de volver a salir
}

export class Security {
  private readonly dome: THREE.ShaderMaterial;
  private readonly packets: Packet[] = [];
  private readonly tags: { sprite: THREE.Sprite; age: number; at: THREE.Vector3 }[] = [];
  private readonly leds: THREE.InstancedMesh;
  private readonly laptop: THREE.Vector3;
  private time = 0;
  private hit = 0;
  private ledClock = 0;

  constructor(scene: THREE.Scene) {
    const group = new THREE.Group();
    group.name = "security";
    scene.add(group);

    // domo de energía
    this.dome = new THREE.ShaderMaterial({
      vertexShader: domeVertex,
      fragmentShader: domeFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color("#5fa8ff") },
        uHits: { value: Array.from({ length: HITS }, () => new THREE.Vector4(0, -99, 0, -99)) },
        uTime: { value: 0 },
      },
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), this.dome);
    dome.position.copy(CENTER);
    dome.userData.noAO = true;
    dome.renderOrder = 3;
    group.add(dome);

    // el atacante, con su laptop de pantalla roja en una mesita, mirando hacia los servidores
    const attacker = new THREE.Vector3(60.6, 0, 3.0);
    const dir = CENTER.clone().sub(attacker).setY(0).normalize();
    const desk = new THREE.Group();
    desk.position.copy(attacker).addScaledVector(dir, 0.5);
    desk.rotation.y = Math.atan2(dir.x, dir.z);
    group.add(desk);
    const dark = new THREE.MeshStandardMaterial({ color: "#1a1214", roughness: 0.6 });
    const part = (geo: THREE.BufferGeometry, mat: THREE.Material, p: [number, number, number]) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...p);
      m.castShadow = true;
      desk.add(m);
      return m;
    };
    part(new THREE.BoxGeometry(0.55, 0.04, 0.4), dark, [0, 0.74, 0]);
    part(new THREE.BoxGeometry(0.04, 0.74, 0.04), dark, [0, 0.37, 0]);
    part(new THREE.BoxGeometry(0.34, 0.015, 0.23), dark, [0, 0.77, -0.02]);
    const screen = part(
      new THREE.PlaneGeometry(0.32, 0.21),
      new THREE.MeshStandardMaterial({ color: "#000000", emissive: new THREE.Color("#ff3344"), emissiveIntensity: 1.6, side: THREE.DoubleSide }),
      [0, 0.88, 0.09],
    );
    screen.rotation.x = 0.25;
    screen.castShadow = false;
    this.laptop = desk.position.clone().setY(0.9);

    // paquetes del ataque
    const packetMat = new THREE.MeshBasicMaterial({ color: "#ff4d4d" });
    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.065), packetMat);
      mesh.userData.noAO = true;
      mesh.visible = false;
      group.add(mesh);
      this.packets.push({ mesh, from: new THREE.Vector3(), to: new THREE.Vector3(), t: 1, speed: 0.5, wait: rnd(0, 2.5) });
    }
    for (let i = 0; i < 4; i++) {
      const sprite = label();
      group.add(sprite);
      this.tags.push({ sprite, age: 99, at: new THREE.Vector3() });
    }

    // luces de los racks (x = 62.4, 63, 63.6; frente en z = 0.35)
    const per = 3 * 7;
    this.leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.022, 0.01), new THREE.MeshBasicMaterial({ color: "#ffffff" }), per * 3);
    const m = new THREE.Matrix4();
    let k = 0;
    for (const rx of [62.4, 63, 63.6]) {
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 3; col++) {
          m.makeTranslation(rx - 0.12 + col * 0.12, 0.45 + row * 0.15, 0.357);
          this.leds.setMatrixAt(k, m);
          this.leds.setColorAt(k++, new THREE.Color(Math.random() < 0.8 ? "#3dff8a" : "#ffb347"));
        }
      }
    }
    group.add(this.leds);
  }

  /** Lanza un paquete desde la laptop del atacante o desde lejos, hacia un punto del domo. */
  private launch(p: Packet): void {
    const fromLaptop = Math.random() < 0.5;
    if (fromLaptop) p.from.copy(this.laptop);
    else {
      const a = rnd(0, Math.PI * 2);
      // desde arriba de la estación (no desde lejos: se verían en las escenas vecinas)
      p.from.set(CENTER.x + Math.cos(a) * rnd(2.5, 4), rnd(3, 4.4), CENTER.z + Math.sin(a) * rnd(1, 3));
    }
    // apunta al centro de los racks; se detiene en la superficie del domo
    const target = CENTER.clone().add(new THREE.Vector3(rnd(-0.4, 0.4), rnd(0.6, 1.5), rnd(-0.4, 0.4)));
    const ray = target.clone().sub(p.from).normalize();
    // intersección rayo-esfera (centro al nivel del piso)
    const oc = p.from.clone().sub(CENTER);
    const b = oc.dot(ray);
    const c = oc.lengthSq() - RADIUS * RADIUS;
    const disc = b * b - c;
    const dist = disc > 0 ? -b - Math.sqrt(disc) : p.from.distanceTo(target);
    p.to.copy(p.from).addScaledVector(ray, Math.max(0.1, dist));
    p.t = 0;
    p.speed = rnd(2.4, 3.4) / Math.max(0.5, dist);
    p.mesh.visible = true;
  }

  private impact(at: THREE.Vector3): void {
    (this.dome.uniforms.uHits.value as THREE.Vector4[])[this.hit++ % HITS].set(at.x, at.y, at.z, this.time);
    const tag = this.tags.reduce((a, b) => (b.age > a.age ? b : a));
    if (Math.random() < 0.45) {
      tag.age = 0;
      tag.at.copy(at);
    }
  }

  update(dt: number): void {
    this.time += dt;
    this.dome.uniforms.uTime.value = this.time;
    for (const p of this.packets) {
      if (p.t >= 1) {
        p.wait -= dt;
        if (p.wait <= 0) this.launch(p);
        continue;
      }
      p.t = Math.min(1, p.t + p.speed * dt);
      p.mesh.position.lerpVectors(p.from, p.to, p.t);
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 4;
      if (p.t >= 1) {
        p.mesh.visible = false;
        p.wait = rnd(0.2, 1.6);
        this.impact(p.to);
      }
    }
    for (const t of this.tags) {
      t.age += dt;
      t.sprite.visible = t.age < 1.3;
      if (!t.sprite.visible) continue;
      t.sprite.position.copy(t.at).add(new THREE.Vector3(0, 0.25 + t.age * 0.35, 0));
      t.sprite.material.opacity = Math.min(1, (1.3 - t.age) * 2.5);
    }
    // los racks parpadean
    this.ledClock += dt;
    if (this.ledClock > 0.12 && this.leds.instanceColor) {
      this.ledClock = 0;
      const c = new THREE.Color();
      for (let i = 0; i < 6; i++) {
        const k = Math.floor(Math.random() * this.leds.count);
        this.leds.setColorAt(k, c.set(Math.random() < 0.3 ? "#0f3d22" : Math.random() < 0.85 ? "#3dff8a" : "#ffb347"));
      }
      this.leds.instanceColor.needsUpdate = true;
    }
  }
}
