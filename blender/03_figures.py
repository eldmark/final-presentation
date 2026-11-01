# Figuras redondeadas (cápsulas y elipsoides): cliente, empleada, administradora y la silueta del "atacante".
# Son maniquíes neutros (mismo tono arcilla): ilustran lo que narramos, no representan a nadie.
# Requiere 01_greybox.py (y opcionalmente 02_screens_logo.py).
import bpy, math

SPACING = 9.0
X = lambda i: i * SPACING

for o in list(bpy.data.objects):
    if o.name.startswith("fig_"):
        bpy.data.objects.remove(o, do_unlink=True)
    elif o.name == "attacker":
        bpy.data.objects.remove(o, do_unlink=True)

def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

def fmat(name, hexcolor, rough=0.7, emit=None):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    p.inputs["Base Color"].default_value = hexrgb(hexcolor)
    p.inputs["Roughness"].default_value = rough
    if emit:
        p.inputs["Emission Color"].default_value = hexrgb(emit)
        p.inputs["Emission Strength"].default_value = 2.0
    return m

SKIN = fmat("fig_skin", "#E8D2BC")
CREAM = fmat("fig_cream", "#F5F0EB", 0.8)

import bmesh

def _smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True

def _capsule_mesh(name, rx, ry, H, segs=28, rings=14):
    """Cápsula (cilindro con extremos redondeados) a lo largo de Z, de alto total H.
    Radios rx, ry: con rx != ry queda elíptica (torso, hombros). Sin esquinas."""
    cap = min(H / 2, max(rx, ry))
    straight = H - 2 * cap
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    for v in bm.verts:
        z = v.co.z
        v.co.x *= rx
        v.co.y *= ry
        v.co.z = z * cap + (straight / 2 if z >= 0 else -straight / 2)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me

def part(root, coll, name, kind, loc, size, m, rot=(0, 0, 0)):
    """kind: cap = cápsula (rx, ry, alto) · ell = elipsoide (rx, ry, rz) · sph = esfera (r,)"""
    oname = f"{root.name}_{name}"
    if kind == "cap":
        o = bpy.data.objects.new(oname, _capsule_mesh(oname, *size))
    else:
        rx, ry, rz = (size[0],) * 3 if len(size) == 1 else size
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=1.0)
        for v in bm.verts:
            v.co.x *= rx
            v.co.y *= ry
            v.co.z *= rz
        me = bpy.data.meshes.new(oname)
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new(oname, me)
    o.data.materials.append(m)
    coll.objects.link(o)
    _smooth(o)
    o.parent = root
    o.location = loc
    o.rotation_euler = rot
    return o

H90 = math.pi / 2

def person(coll, name, base, face_to=None, yaw=0.0, shirt="#5B7C99", legs="#2B2A33",
           pose="stand", kind="cliente", scale=1.0):
    """base = punto del suelo (de pie) o de la parte superior del asiento (sentado).
    face_to = (x, y) hacia donde mira; por defecto mira al -Y (a la cámara).
    Todo son cápsulas y elipsoides: siluetas redondeadas y uniformes, sin cajas."""
    if face_to is not None:
        dx, dy = face_to[0] - base[0], face_to[1] - base[1]
        d = math.hypot(dx, dy) or 1
        yaw = math.atan2(dx / d, -dy / d)
    root = bpy.data.objects.new(f"fig_{name}", None)
    root.location = base
    root.rotation_euler = (0, 0, yaw)
    root.scale = (scale, scale, scale)
    coll.objects.link(root)
    sm, lm = fmat(f"fig_shirt_{shirt}", shirt), fmat(f"fig_legs_{legs}", legs)
    shoe = fmat("fig_shoe", "#231C1E", 0.6)
    if pose == "stand":
        part(root, coll, "legL", "cap", (-0.105, 0, 0.40), (0.082, 0.082, 0.80), lm)
        part(root, coll, "legR", "cap", (0.105, 0, 0.40), (0.082, 0.082, 0.80), lm)
        part(root, coll, "shoeL", "ell", (-0.105, -0.04, 0.045), (0.09, 0.15, 0.06), shoe)
        part(root, coll, "shoeR", "ell", (0.105, -0.04, 0.045), (0.09, 0.15, 0.06), shoe)
        part(root, coll, "torso", "cap", (0, 0, 1.11), (0.22, 0.14, 0.66), sm)
        part(root, coll, "armL", "cap", (-0.268, 0, 1.06), (0.055, 0.055, 0.60), sm)
        part(root, coll, "armR", "cap", (0.268, 0, 1.06), (0.055, 0.055, 0.60), sm)
        part(root, coll, "handL", "sph", (-0.268, 0, 0.75), (0.052,), SKIN)
        part(root, coll, "handR", "sph", (0.268, 0, 0.75), (0.052,), SKIN)
        hz, nz = 1.60, 1.46
    else:  # sit
        part(root, coll, "thighL", "cap", (-0.105, -0.25, 0.09), (0.082, 0.082, 0.52), lm, (H90, 0, 0))
        part(root, coll, "thighR", "cap", (0.105, -0.25, 0.09), (0.082, 0.082, 0.52), lm, (H90, 0, 0))
        part(root, coll, "shinL", "cap", (-0.105, -0.50, -0.17), (0.07, 0.07, 0.46), lm)
        part(root, coll, "shinR", "cap", (0.105, -0.50, -0.17), (0.07, 0.07, 0.46), lm)
        part(root, coll, "shoeL", "ell", (-0.105, -0.55, -0.37), (0.09, 0.15, 0.06), shoe)
        part(root, coll, "shoeR", "ell", (0.105, -0.55, -0.37), (0.09, 0.15, 0.06), shoe)
        part(root, coll, "torso", "cap", (0, 0, 0.43), (0.22, 0.14, 0.66), sm)
        part(root, coll, "armL", "cap", (-0.268, -0.22, 0.42), (0.055, 0.055, 0.52), sm, (H90, 0, 0))
        part(root, coll, "armR", "cap", (0.268, -0.22, 0.42), (0.055, 0.055, 0.52), sm, (H90, 0, 0))
        part(root, coll, "handL", "sph", (-0.268, -0.49, 0.42), (0.052,), SKIN)
        part(root, coll, "handR", "sph", (0.268, -0.49, 0.42), (0.052,), SKIN)
        hz, nz = 0.91, 0.77
    part(root, coll, "neck", "cap", (0, 0, nz), (0.05, 0.05, 0.14), SKIN)
    part(root, coll, "head", "ell", (0, 0, hz), (0.125, 0.135, 0.15), SKIN)
    if kind == "cliente":
        cap_m = fmat("fig_cap", "#841C26")
        part(root, coll, "cap", "ell", (0, -0.01, hz + 0.08), (0.138, 0.148, 0.095), cap_m)
        part(root, coll, "brim", "ell", (0, -0.14, hz + 0.06), (0.10, 0.09, 0.016), cap_m)
    elif kind == "empleada":
        part(root, coll, "apron", "cap", (0, -0.115, 1.0 if pose == "stand" else 0.33), (0.17, 0.03, 0.52), CREAM)
        part(root, coll, "hair", "ell", (0, 0.04, hz + 0.03), (0.135, 0.14, 0.135), fmat("fig_hair", "#3A2A22"))
    elif kind == "admin":
        hair = fmat("fig_hair", "#3A2A22")
        part(root, coll, "hair", "ell", (0, 0.035, hz + 0.03), (0.133, 0.14, 0.13), hair)
        part(root, coll, "bun", "sph", (0, 0.09, hz + 0.13), (0.065,), hair)
        part(root, coll, "glasses", "ell", (0, -0.125, hz + 0.01), (0.105, 0.02, 0.032), fmat("fig_glasses", "#1A1A1A"))
        part(root, coll, "lapel", "cap", (0, -0.14, 0.50 if pose == "sit" else 1.2), (0.06, 0.025, 0.42), CREAM)
    elif kind == "atacante":
        part(root, coll, "hood", "ell", (0, 0.025, hz + 0.02), (0.165, 0.175, 0.185), fmat("fig_hood", "#1A1214"))
        part(root, coll, "eyes", "ell", (0, -0.13, hz), (0.085, 0.02, 0.022), fmat("fig_eyes", "#C23B3B", 0.4, emit="#C23B3B"))
    return root

def coll(i):
    return next(c for c in bpy.data.collections if c.name.startswith(f"S{i}_"))

# ---- S0 · cliente de pie junto al teléfono (mira el celular) ----
x = X(0)
person(coll(0), "cliente_S0", (x + 0.2, -1.0, 0.0), face_to=(x + 1.2, -0.3), kind="cliente")

# ---- S1 · empleada atrás del mostrador ----
x = X(1)
person(coll(1), "empleada_S1", (x + 0.3, 1.55, 0.0), yaw=0.0, shirt="#841C26", kind="empleada")

# ---- S2 · administradora sentada ante los reportes ----
x = X(2)
person(coll(2), "admin_S2", (x, -1.25, 0.55), yaw=math.pi, shirt="#2F3B4C", kind="admin", pose="sit")

# ---- S4 · cliente sentado frente a la laptop ----
x = X(4)
person(coll(4), "cliente_S4", (x, -0.85, 0.55), yaw=math.pi, shirt="#5B7C99", kind="cliente", pose="sit")

# ---- S5 · empleada con la tablet ----
x = X(5)
person(coll(5), "empleada_S5", (x + 0.6, 1.55, 0.0), yaw=0.0, shirt="#841C26", kind="empleada")

# ---- S6 · administradora frente a la pared de monitores ----
x = X(6)
person(coll(6), "admin_S6", (x, -1.65, 0.55), yaw=math.pi, shirt="#2F3B4C", kind="admin", pose="sit")

# ---- S7 · el "atacante" frente a los anillos ----
x = X(7)
person(coll(7), "atacante_S7", (x - 2.4, -3.0, 0.0), face_to=(x, 0), shirt="#1A1214", legs="#1A1214", kind="atacante")

# ---- S8 · los tres, de espaldas a la cámara, mirando el logo ----
x = X(8)
person(coll(8), "cliente_S8", (x - 1.5, -3.0, 0.0), yaw=math.pi, kind="cliente")
person(coll(8), "empleada_S8", (x, -3.0, 0.0), yaw=math.pi, shirt="#841C26", kind="empleada")
person(coll(8), "admin_S8", (x + 1.5, -3.0, 0.0), yaw=math.pi, shirt="#2F3B4C", kind="admin")

print("OK figuras:", len([o for o in bpy.data.objects if o.name.startswith("fig_") and o.type == "EMPTY"]))
