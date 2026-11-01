# Figuras low-poly: cliente, empleada, administradora y la silueta del "atacante".
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

def part(root, coll, name, kind, loc, size, m, rot=(0, 0, 0)):
    if kind == "box":
        bpy.ops.mesh.primitive_cube_add(size=1)
        o = bpy.context.active_object
        o.scale = size
    elif kind == "sph":
        bpy.ops.mesh.primitive_uv_sphere_add(radius=size[0], segments=24, ring_count=12)
        o = bpy.context.active_object
    else:  # cyl: size = (radio, alto)
        bpy.ops.mesh.primitive_cylinder_add(radius=size[0], depth=size[1], vertices=24)
        o = bpy.context.active_object
    o.name = f"{root.name}_{name}"
    o.data.materials.append(m)
    for c in list(o.users_collection):
        c.objects.unlink(o)
    coll.objects.link(o)
    o.parent = root
    o.location = loc
    o.rotation_euler = rot
    return o

def person(coll, name, base, face_to=None, yaw=0.0, shirt="#5B7C99", legs="#2B2A33",
           pose="stand", kind="cliente", scale=1.0):
    """base = punto del suelo (de pie) o de la parte superior del asiento (sentado).
    face_to = (x, y) hacia donde mira; por defecto mira al -Y (a la cámara)."""
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
    if pose == "stand":
        part(root, coll, "legL", "box", (-0.11, 0, 0.40), (0.16, 0.18, 0.80), lm)
        part(root, coll, "legR", "box", (0.11, 0, 0.40), (0.16, 0.18, 0.80), lm)
        part(root, coll, "torso", "box", (0, 0, 1.11), (0.46, 0.26, 0.62), sm)
        part(root, coll, "armL", "box", (-0.31, 0, 1.08), (0.10, 0.12, 0.58), sm)
        part(root, coll, "armR", "box", (0.31, 0, 1.08), (0.10, 0.12, 0.58), sm)
        hz = 1.58
    else:  # sit
        part(root, coll, "thighL", "box", (-0.11, -0.25, 0.09), (0.16, 0.50, 0.14), lm)
        part(root, coll, "thighR", "box", (0.11, -0.25, 0.09), (0.16, 0.50, 0.14), lm)
        part(root, coll, "shinL", "box", (-0.11, -0.50, -0.17), (0.14, 0.14, 0.45), lm)
        part(root, coll, "shinR", "box", (0.11, -0.50, -0.17), (0.14, 0.14, 0.45), lm)
        part(root, coll, "torso", "box", (0, 0, 0.42), (0.46, 0.26, 0.62), sm)
        part(root, coll, "armL", "box", (-0.31, -0.22, 0.40), (0.10, 0.50, 0.10), sm)
        part(root, coll, "armR", "box", (0.31, -0.22, 0.40), (0.10, 0.50, 0.10), sm)
        hz = 0.89
    part(root, coll, "head", "sph", (0, 0, hz), (0.13,), SKIN)
    if kind == "cliente":
        part(root, coll, "cap", "cyl", (0, -0.02, hz + 0.11), (0.14, 0.05), fmat("fig_cap", "#841C26"))
        part(root, coll, "brim", "box", (0, -0.15, hz + 0.09), (0.22, 0.14, 0.02), fmat("fig_cap", "#841C26"))
    elif kind == "empleada":
        part(root, coll, "apron", "box", (0, -0.14, 1.0 if pose == "stand" else 0.35), (0.40, 0.02, 0.50), CREAM)
        part(root, coll, "hair", "sph", (0, 0.07, hz + 0.06), (0.09,), fmat("fig_hair", "#3A2A22"))
    elif kind == "admin":
        part(root, coll, "bun", "sph", (0, 0.09, hz + 0.1), (0.07,), fmat("fig_hair", "#3A2A22"))
        part(root, coll, "glasses", "box", (0, -0.13, hz + 0.01), (0.22, 0.02, 0.04), fmat("fig_glasses", "#1A1A1A"))
        part(root, coll, "lapel", "box", (0, -0.14, 0.50 if pose == "sit" else 1.2), (0.12, 0.02, 0.42), CREAM)
    elif kind == "atacante":
        part(root, coll, "hood", "sph", (0, 0.02, hz + 0.02), (0.17,), fmat("fig_hood", "#1A1214"))
        part(root, coll, "eyes", "box", (0, -0.14, hz), (0.16, 0.02, 0.03), fmat("fig_eyes", "#C23B3B", 0.4, emit="#C23B3B"))
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
