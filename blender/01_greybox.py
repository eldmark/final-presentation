# Greybox del diorama de la presentación (Bodega de Licores).
# Se ejecuta dentro de Blender: exec(open(RUTA).read()).
# Unidades: metros. Nueve estaciones en fila a lo largo de X, una por acto.
import bpy, math
from mathutils import Vector

PROJECT = "/home/dmark123/Documents/software/final-presentation"
SPACING = 9.0

# ---------- limpieza ----------
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    bpy.data.collections.remove(c)

# ---------- materiales ----------
def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4)) + (1.0,)

_mats = {}
def mat(name, hexcolor, rough=0.55, metal=0.0, emit=None, emit_strength=2.0, alpha=None):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    p.inputs["Base Color"].default_value = hexrgb(hexcolor)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emit:
        p.inputs["Emission Color"].default_value = hexrgb(emit)
        p.inputs["Emission Strength"].default_value = emit_strength
    if alpha is not None:
        p.inputs["Alpha"].default_value = alpha
    _mats[name] = m
    return m

BURGUNDY = mat("burgundy", "#841C26")
CREAM    = mat("cream", "#F5F0EB", 0.8)
DARK     = mat("dark", "#2B2020", 0.6)
WOOD     = mat("wood", "#8A5A3B", 0.7)
GREY     = mat("grey", "#9A9A9A", 0.8)
PAPER    = mat("paper", "#FFFFFF", 0.9)
AMBER    = mat("amber_glass", "#8A3B0E", 0.15, 0.0)
SCREEN   = mat("screen", "#0F1A24", 0.3, emit="#7FB5FF", emit_strength=1.5)
GREEN    = mat("green", "#3E8E5A", 0.5)
RED      = mat("red", "#C23B3B", 0.5, emit="#C23B3B", emit_strength=1.0)
BLUEGLOW = mat("blueglow", "#2C6BD6", 0.3, emit="#2C6BD6", emit_strength=1.0)
WA_GREEN = mat("whatsapp", "#25D366", 0.4, emit="#25D366", emit_strength=1.0)
GOLD     = mat("gold", "#D4A53C", 0.35, 0.8)

# ---------- helpers ----------
def link(o, coll):
    for c in o.users_collection:
        c.objects.unlink(o)
    coll.objects.link(o)
    return o

def box(coll, name, loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    o.data.materials.append(m)
    return link(o, coll)

def cyl(coll, name, loc, r, h, m, rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(m)
    return link(o, coll)

def sph(coll, name, loc, r, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=32, ring_count=16)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.data.materials.append(m)
    return link(o, coll)

def text(coll, name, loc, s, size=0.5, m=None, rot=(math.radians(90), 0, 0), align="CENTER"):
    c = bpy.data.curves.new(name, "FONT")
    c.body = s
    c.size = size
    c.align_x = align
    o = bpy.data.objects.new(name, c)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(m or DARK)
    coll.objects.link(o)
    return o

def station(i, key, title):
    coll = bpy.data.collections.new(f"S{i}_{key}")
    bpy.context.scene.collection.children.link(coll)
    x = i * SPACING
    cyl(coll, f"S{i}_plate", (x, 0, -0.15), 4.0, 0.3, CREAM, verts=64)
    cyl(coll, f"S{i}_rim", (x, 0, -0.32), 4.15, 0.12, BURGUNDY, verts=64)
    text(coll, f"S{i}_label", (x, -4.4, 0.02), title, 0.42, BURGUNDY, rot=(0, 0, 0))
    return coll, x

def back_wall(coll, x, h=3.4, w=7.0):
    box(coll, "back_wall", (x, 3.5, h / 2), (w, 0.15, h), mat("wall", "#E6D9CC", 0.9))

def bottle(coll, loc, scale=1.0):
    x, y, z = loc
    cyl(coll, "bottle_body", (x, y, z + 0.30 * scale), 0.11 * scale, 0.6 * scale, AMBER)
    cyl(coll, "bottle_shoulder", (x, y, z + 0.66 * scale), 0.07 * scale, 0.12 * scale, AMBER)
    cyl(coll, "bottle_neck", (x, y, z + 0.80 * scale), 0.035 * scale, 0.2 * scale, AMBER)
    cyl(coll, "bottle_cap", (x, y, z + 0.92 * scale), 0.04 * scale, 0.05 * scale, BURGUNDY)
    box(coll, "bottle_label", (x, y - 0.111 * scale, z + 0.32 * scale), (0.12 * scale, 0.005, 0.2 * scale), CREAM)

def phone(coll, loc, rot=(0, 0, 0)):
    box(coll, "phone_body", loc, (0.35, 0.02, 0.7), DARK, rot)
    box(coll, "phone_screen", (loc[0], loc[1] - 0.012, loc[2]), (0.31, 0.005, 0.62), SCREEN, rot)

def counter(coll, x, y=0.0):
    box(coll, "counter_body", (x, y, 0.5), (3.2, 1.0, 1.0), WOOD)
    box(coll, "counter_top", (x, y, 1.03), (3.4, 1.2, 0.06), DARK)

def shelf(coll, x, y):
    box(coll, "shelf_frame", (x, y, 1.1), (2.8, 0.4, 2.2), WOOD)
    for k in range(4):
        box(coll, f"shelf_board{k}", (x, y - 0.05, 0.4 + k * 0.55), (2.7, 0.45, 0.04), DARK)
        for j in range(5):
            cyl(coll, f"shelf_bottle{k}_{j}", (x - 1.0 + j * 0.5, y - 0.1, 0.55 + k * 0.55), 0.08, 0.3, AMBER if (j + k) % 2 else GREEN)

# ---------- estaciones ----------
# 0 · ANTES · cliente
c, x = station(0, "antes_cliente", "1 · Antes · El cliente")
back_wall(c, x)
box(c, "sofa_base", (x - 1.5, 1.0, 0.3), (2.2, 0.9, 0.6), GREY)
box(c, "sofa_back", (x - 1.5, 1.4, 0.7), (2.2, 0.2, 0.8), GREY)
box(c, "side_table", (x + 1.2, -0.3, 0.35), (1.0, 1.0, 0.7), WOOD)
phone(c, (x + 1.2, -0.3, 1.1), (math.radians(-10), 0, 0))
box(c, "landline_base", (x + 2.3, -0.5, 0.15), (0.7, 0.5, 0.3), DARK)
box(c, "landline_handset", (x + 2.3, -0.5, 0.38), (0.9, 0.18, 0.14), DARK)
# Las burbujas de WhatsApp se dibujan en JavaScript (web/src/bubbles.ts), no en Blender.
cyl(c, "wall_clock", (x - 1.6, 3.35, 2.4), 0.4, 0.06, CREAM, rot=(math.radians(90), 0, 0))
bottle(c, (x + 1.2, -0.3, 0.7), 1.0)

# 1 · ANTES · tienda (tres islas)
c, x = station(1, "antes_tienda", "2 · Antes · La tienda")
back_wall(c, x)
counter(c, x, 0.6)
shelf(c, x, 2.6)
for k, dx in enumerate((-2.6, 0, 2.6)):
    box(c, f"island_book{k}", (x + dx, -1.8, 0.1), (0.9, 0.7, 0.2), PAPER)
    cyl(c, f"island_ring{k}", (x + dx, -1.8, 0.02), 0.85, 0.04, RED)
phone(c, (x + 1.3, 0.45, 1.45), (math.radians(-15), 0, 0))
bottle(c, (x - 0.8, 0.6, 1.06), 1.0)

# 2 · ANTES · administradora
c, x = station(2, "antes_admin", "3 · Antes · La administradora")
back_wall(c, x)
box(c, "desk_top", (x, 0.5, 0.9), (3.0, 1.4, 0.08), WOOD)
for sx in (-1.3, 1.3):
    box(c, f"desk_leg{sx}", (x + sx, 0.5, 0.45), (0.1, 1.2, 0.9), WOOD)
for k, dx in enumerate((-0.9, 0.0, 0.9)):
    box(c, f"report{k}", (x + dx, 0.4, 0.97), (0.7, 0.5, 0.04), PAPER, (0, 0, math.radians(8 * (k - 1))))
box(c, "chair_seat", (x, -1.2, 0.5), (0.9, 0.9, 0.1), DARK)
box(c, "chair_back", (x, -1.6, 0.78), (0.9, 0.1, 0.45), DARK)
text(c, "question", (x, 0.5, 2.7), "?", 1.6, RED, rot=(math.radians(90), 0, 0))
bottle(c, (x + 1.1, 0.4, 0.94), 0.8)

# 3 · PUENTE · datos
c, x = station(3, "puente_datos", "4 · Los datos se juntan")
cyl(c, "db_top", (x, 0, 1.55), 0.9, 0.5, BLUEGLOW)
cyl(c, "db_mid", (x, 0, 0.95), 0.9, 0.5, BURGUNDY)
cyl(c, "db_bot", (x, 0, 0.35), 0.9, 0.5, BLUEGLOW)
for k, ang in enumerate((200, 270, 340)):
    a = math.radians(ang)
    px, py = x + 3.0 * math.cos(a), 3.0 * math.sin(a)
    box(c, f"branch{k}", (px, py, 0.4), (0.8, 0.8, 0.8), WOOD)
    box(c, f"branch_roof{k}", (px, py, 0.9), (0.95, 0.95, 0.12), BURGUNDY)
    mx, my = (px + x) / 2, (py + 0) / 2
    length = math.hypot(px - x, py)
    pipe = cyl(c, f"pipe{k}", (mx, my, 0.12), 0.07, length, BLUEGLOW,
               rot=(0, math.radians(90), math.atan2(py, px - x)))
bottle(c, (x, 0, 1.8), 0.9)

# 4 · DESPUÉS · cliente
c, x = station(4, "despues_cliente", "5 · Después · El cliente")
back_wall(c, x)
box(c, "desk_top", (x, 0.8, 0.8), (2.6, 1.2, 0.08), WOOD)
box(c, "laptop_base", (x, 0.6, 0.88), (1.1, 0.75, 0.04), GREY)
box(c, "laptop_screen", (x, 1.0, 1.35), (1.1, 0.04, 0.8), DARK, (math.radians(-12), 0, 0))
box(c, "laptop_display", (x, 0.975, 1.35), (1.0, 0.01, 0.7), SCREEN, (math.radians(-12), 0, 0))
phone(c, (x + 1.5, 0.3, 1.2), (math.radians(-60), 0, 0))
box(c, "chair_seat", (x, -0.8, 0.5), (0.9, 0.9, 0.1), DARK)
box(c, "chair_back", (x, -1.25, 0.78), (0.9, 0.1, 0.45), DARK)
bottle(c, (x - 1.0, 0.7, 0.84), 0.8)

# 5 · DESPUÉS · tienda
c, x = station(5, "despues_tienda", "6 · Después · La tienda")
back_wall(c, x)
counter(c, x, 0.6)
shelf(c, x, 2.6)
box(c, "tablet", (x + 0.9, 0.45, 1.12), (0.7, 0.5, 0.03), DARK, (math.radians(20), 0, 0))
box(c, "tablet_screen", (x + 0.9, 0.44, 1.125), (0.62, 0.43, 0.01), SCREEN, (math.radians(20), 0, 0))
box(c, "logo_sign", (x, 1.5, 2.6), (2.8, 0.1, 0.9), BURGUNDY)
box(c, "order_box0", (x - 1.0, 0.4, 1.2), (0.4, 0.4, 0.3), GOLD)
box(c, "order_box1", (x - 1.0, 0.4, 1.5), (0.4, 0.4, 0.3), GOLD)
bottle(c, (x - 0.2, 0.55, 1.06), 1.0)

# 6 · DESPUÉS · administradora (pared de monitores)
c, x = station(6, "despues_admin", "7 · Después · La administradora")
back_wall(c, x)
for r in range(2):
    for col in range(3):
        box(c, f"mon{r}{col}", (x - 1.9 + col * 1.9, 2.4, 1.0 + r * 1.2), (1.7, 0.08, 1.0), DARK)
        box(c, f"mon_screen{r}{col}", (x - 1.9 + col * 1.9, 2.34, 1.0 + r * 1.2), (1.55, 0.02, 0.85), SCREEN)
box(c, "desk_top", (x, -0.2, 0.9), (2.8, 1.1, 0.08), WOOD)
for sx in (-1.2, 1.2):
    box(c, f"desk_leg{sx}", (x + sx, -0.2, 0.45), (0.1, 0.9, 0.9), WOOD)
box(c, "chair_seat", (x, -1.6, 0.5), (0.9, 0.9, 0.1), DARK)
box(c, "chair_back", (x, -2.05, 0.78), (0.9, 0.1, 0.45), DARK)
bottle(c, (x + 1.0, -0.2, 0.94), 0.8)

# 7 · SEGURIDAD
c, x = station(7, "seguridad", "8 · Seguridad")
for k, r in enumerate((3.4, 2.5, 1.6)):
    bpy.ops.mesh.primitive_torus_add(location=(x, 0, 0.25 + k * 0.05), major_radius=r, minor_radius=0.14, major_segments=64, minor_segments=12)
    t = bpy.context.active_object
    t.name = f"shield_ring{k}"
    t.data.materials.append(BLUEGLOW if k % 2 == 0 else BURGUNDY)
    link(t, c)
for k, dx in enumerate((-0.6, 0.0, 0.6)):
    box(c, f"rack{k}", (x + dx, 0, 1.0), (0.5, 0.7, 1.9), DARK)
    box(c, f"rack_led{k}", (x + dx, -0.36, 1.6), (0.35, 0.02, 0.06), GREEN)
box(c, "panel_screen", (x + 3.0, 0, 1.3), (0.1, 1.8, 1.1), SCREEN)
text(c, "attacker", (x - 3.6, -2.6, 1.0), "!", 1.4, RED)
bottle(c, (x, -0.95, 0.0), 0.9)

# 8 · CIERRE · mapa
c, x = station(8, "cierre_mapa", "9 · Cierre")
box(c, "map_plane", (x, 0, 0.02), (6.5, 6.5, 0.04), CREAM)
for k, (px, py) in enumerate(((-1.8, 1.2), (0.6, -0.4), (1.8, 1.8))):
    cyl(c, f"pin_stem{k}", (x + px, py, 0.5), 0.05, 0.9, BURGUNDY)
    sph(c, f"pin_head{k}", (x + px, py, 1.05), 0.25, BURGUNDY)
    cyl(c, f"pin_ring{k}", (x + px, py, 0.06), 0.55, 0.04, BLUEGLOW)
# líneas de luz entre pines
pts = [Vector((x - 1.8, 1.2, 0.1)), Vector((x + 0.6, -0.4, 0.1)), Vector((x + 1.8, 1.8, 0.1)), Vector((x - 1.8, 1.2, 0.1))]
for a, b in zip(pts[:-1], pts[1:]):
    mid = (a + b) / 2
    d = b - a
    cyl(c, "link", mid, 0.04, d.length, BLUEGLOW, rot=(0, math.radians(90), math.atan2(d.y, d.x)))
bottle(c, (x + 0.6, -0.4, 0.0), 1.2)

# ---------- suelo, mundo, luz, cámara ----------
bg = bpy.data.collections.new("scene_base")
bpy.context.scene.collection.children.link(bg)
box(bg, "ground", (4 * SPACING, 0, -0.55), (9 * SPACING + 8, 14, 0.2), mat("ground", "#3B2327", 0.85))
w = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = w
w.use_nodes = True
bgn = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bgn.inputs["Color"].default_value = hexrgb("#2A1A1D")
bgn.inputs["Strength"].default_value = 0.55

sun = bpy.data.lights.new("sun", "SUN")
sun.energy = 2.6
so = bpy.data.objects.new("sun", sun)
so.location = (30, -20, 25)
so.rotation_euler = (math.radians(50), 0, math.radians(30))
bg.objects.link(so)

cam = bpy.data.cameras.new("cam_overview")
cam.lens = 28
co = bpy.data.objects.new("cam_overview", cam)
co.location = (4 * SPACING, -46, 24)
co.rotation_euler = (math.radians(62), 0, 0)
bg.objects.link(co)
bpy.context.scene.camera = co
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080

vs = bpy.context.scene.view_settings
vs.view_transform = "Standard"
vs.exposure = -0.3
cams = bpy.data.collections.new("cameras")
bpy.context.scene.collection.children.link(cams)
for i in range(9):
    x = i * SPACING
    tgt = bpy.data.objects.new(f"aim_S{i}", None)
    tgt.location = (x, 0.3, 1.0)
    cams.objects.link(tgt)
    cd = bpy.data.cameras.new(f"cam_S{i}")
    cd.lens = 35
    cobj = bpy.data.objects.new(f"cam_S{i}", cd)
    cobj.location = (x + 1.2, -8.0, 4.4)
    cams.objects.link(cobj)
    t = cobj.constraints.new("TRACK_TO")
    t.target = tgt
    t.track_axis = "TRACK_NEGATIVE_Z"
    t.up_axis = "UP_Y"
bpy.context.scene.camera = bpy.data.objects["cam_S0"]

print("OK:", len(bpy.data.objects), "objetos,", len(bpy.data.collections), "colecciones")
