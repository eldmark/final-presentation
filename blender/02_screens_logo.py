# Aplica las capturas a las pantallas del diorama y el logo a los letreros.
# Requiere haber corrido 01_greybox.py y blender/prepare_textures.py.
import bpy, math
from mathutils import Euler, Vector

PROJECT = "/home/dmark123/Documents/software/final-presentation"
TEX = f"{PROJECT}/blender/textures"
SPACING = 9.0

# limpiar una corrida anterior
for o in list(bpy.data.objects):
    if o.name.startswith(("scr_", "logo_")):
        bpy.data.objects.remove(o, do_unlink=True)

def img_material(name, filename, emission=0.8, alpha=False):
    m = bpy.data.materials.get(name)
    if m:
        bpy.data.materials.remove(m)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(f"{TEX}/{filename}", check_existing=True)
    tex.interpolation = "Cubic"
    nt.links.new(tex.outputs["Color"], p.inputs["Base Color"])
    if emission:
        nt.links.new(tex.outputs["Color"], p.inputs["Emission Color"])
        p.inputs["Emission Strength"].default_value = emission
    p.inputs["Roughness"].default_value = 0.4
    if alpha:
        nt.links.new(tex.outputs["Alpha"], p.inputs["Alpha"])
    return m, tex.image

def coll_of(name):
    return bpy.data.collections.get(name) or bpy.context.scene.collection

def screen(coll, name, filename, center, box_w, box_h, rot=(math.radians(90), 0, 0), lift=0.008, emission=0.8):
    """Plano con la imagen, ajustado (contain) al rectángulo box_w x box_h y apoyado sobre la superficie."""
    m, im = img_material("m_" + name, filename, emission)
    aspect = im.size[0] / im.size[1]
    w, h = (box_w, box_w / aspect)
    if h > box_h:
        w, h = (box_h * aspect, box_h)
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1)
    o.rotation_euler = Euler(rot)
    normal = o.rotation_euler.to_matrix() @ Vector((0, 0, 1))
    o.location = Vector(center) + normal * lift
    o.data.materials.append(m)
    for c in o.users_collection:
        c.objects.unlink(o)
    coll.objects.link(o)
    return o

def logo(coll, name, center, box_w, box_h, rot=(math.radians(90), 0, 0)):
    return screen(coll, name, "logo.png", center, box_w, box_h, rot, lift=0.01, emission=0.15)

def remove(name):
    o = bpy.data.objects.get(name)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)

def station(i):
    return coll_of(next((c.name for c in bpy.data.collections if c.name.startswith(f"S{i}_")), ""))

X = lambda i: i * SPACING
R90 = math.radians(90)

# ---------- S4 · cliente después: laptop con el catálogo ----------
x = X(4)
tilt = math.radians(-12)
screen(station(4), "scr_laptop_catalogo", "catalogo.jpg", (x, 0.975, 1.35), 1.0, 0.72, rot=(R90 + tilt, 0, 0), lift=0.012)

# ---------- S5 · tienda después: tablet con pedidos + logo en el letrero ----------
x = X(5)
screen(station(5), "scr_tablet_pedidos", "pedidos.jpg", (x + 0.9, 0.44, 1.125), 0.62, 0.43, rot=(math.radians(20), 0, 0), lift=0.012)
logo(station(5), "logo_sign_S5", (x, 1.44, 2.6), 2.6, 0.82)

# ---------- S1 · tienda antes: letrero con el logo en la pared ----------
x = X(1)
mb = bpy.data.materials.get("burgundy")
bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 3.4, 2.95))
b = bpy.context.active_object
b.name = "logo_S1_board"
b.scale = (2.6, 0.06, 0.7)
b.data.materials.append(mb)
for c in b.users_collection:
    c.objects.unlink(b)
station(1).objects.link(b)
logo(station(1), "logo_S1", (x, 3.36, 2.95), 2.4, 0.62)

# ---------- S3 · puente: pantalla de Almacén 3.1 sobre un soporte ----------
x = X(3)
dark = bpy.data.materials.get("dark")
bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 3.0, 0.5))
st = bpy.context.active_object
st.name = "scr_stand_S3"
st.scale = (0.2, 0.2, 1.0)
st.data.materials.append(dark)
for c in st.users_collection:
    c.objects.unlink(st)
station(3).objects.link(st)
bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 3.0, 1.75))
fr = bpy.context.active_object
fr.name = "scr_frame_S3"
fr.scale = (2.6, 0.08, 1.5)
fr.data.materials.append(dark)
for c in fr.users_collection:
    c.objects.unlink(fr)
station(3).objects.link(fr)
screen(station(3), "scr_almacen", "almacen.jpg", (x, 2.96, 1.75), 2.45, 1.35)

# ---------- S6 · administradora: pared de monitores ----------
x = X(6)
wall = {
    (1, 0): "grafana_inventario.jpg", (1, 1): "umami_overview.jpg", (1, 2): "umami_events.jpg",
    (0, 0): "campanas.jpg", (0, 1): "carrusel.jpg", (0, 2): "oferta_editor.jpg",
}
for (r, col), fn in wall.items():
    screen(station(6), f"scr_monitor_{r}{col}", fn, (x - 1.9 + col * 1.9, 2.34, 1.0 + r * 1.2), 1.55, 0.85, lift=0.02)

# ---------- S7 · seguridad: pantalla grande con el tablero de Seguridad ----------
x = X(7)
remove("panel_screen")
bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 3.0, 1.9))
fr2 = bpy.context.active_object
fr2.name = "scr_frame_S7"
fr2.scale = (3.5, 0.1, 2.0)
fr2.data.materials.append(dark)
for c in fr2.users_collection:
    c.objects.unlink(fr2)
station(7).objects.link(fr2)
screen(station(7), "scr_seguridad", "grafana_seguridad.jpg", (x, 2.95, 1.9), 3.35, 1.85)

# ---------- S8 · cierre: letrero grande con el logo ----------
x = X(8)
bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 3.2, 1.9))
fr3 = bpy.context.active_object
fr3.name = "logo_S8_board"
fr3.scale = (3.6, 0.1, 1.9)
fr3.data.materials.append(mb)
for c in fr3.users_collection:
    c.objects.unlink(fr3)
station(8).objects.link(fr3)
logo(station(8), "logo_S8", (x, 3.14, 1.9), 3.3, 1.6)

# cámaras más cerradas donde la pantalla es pequeña
for name, loc, aim in (("cam_S4", (X(4) + 0.4, -5.2, 2.6), (X(4), 0.8, 1.15)),
                       ("cam_S5", (X(5) + 0.6, -5.4, 2.9), (X(5), 0.5, 1.2))):
    bpy.data.objects[name].location = loc
    bpy.data.objects["aim_S" + name[-1]].location = aim

print("OK pantallas y logos:", len([o for o in bpy.data.objects if o.name.startswith(("scr_", "logo_"))]))
