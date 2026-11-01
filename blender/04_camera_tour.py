# Recorrido de cámara de toda la presentación (13:30) con los tiempos del guion.
# Crea cam_tour + aim_tour animados, marcadores en la línea de tiempo y exporta tour.json
# para la versión web (Three.js). Requiere 01, 02 y 03.
import bpy, json, math
from mathutils import Vector

PROJECT = "/home/dmark123/Documents/software/final-presentation"
SPACING = 9.0
FPS = 30
TRAVEL = 3.0     # s que tarda la cámara en llegar a una estación nueva
PULLBACK = 8.0   # s finales de alejamiento para ver todo el diorama

# (id, estación, inicio s, fin s, quien narra, escena del guion)
SCHEDULE = [
    ("antes_cliente",  0,   0,  80, "Julián",     "1 · El antes (cliente)"),
    ("antes_tienda",   1,  80, 115, "Julián",     "1 · El antes (tienda)"),
    ("antes_admin",    2, 115, 150, "Julián",     "1 · El antes (administradora)"),
    ("cliente_elige",  4, 150, 240, "Lázaro",     "2 · El cliente encuentra y elige"),
    ("cliente_compra", 4, 240, 360, "Jorge",      "3 · Compra con confianza + resultados UX"),
    ("pedido_tienda",  5, 360, 410, "Marcelo",    "4 · El pedido llega a la tienda"),
    ("datos_juntos",   3, 410, 480, "Marcelo",    "4 · Los datos se juntan"),
    ("decisiones",     6, 480, 630, "Marco",      "5 · La administradora decide"),
    ("seguridad",      7, 630, 720, "Luis Ángel", "6 · El miedo a que lo hackeen"),
    ("valor",          0, 720, 765, "Julián",     "7 · Valor e impacto"),
    ("cierre",         8, 765, 810, "Lázaro",     "8 · Conclusiones"),
]
TOTAL = SCHEDULE[-1][3]

# limpiar corrida anterior
for n in ("cam_tour", "aim_tour"):
    o = bpy.data.objects.get(n)
    if o:
        bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.context.scene.timeline_markers):
    bpy.context.scene.timeline_markers.remove(m)

coll = bpy.data.collections.get("cameras")
aim = bpy.data.objects.new("aim_tour", None)
coll.objects.link(aim)
cd = bpy.data.cameras.new("cam_tour")
cd.lens = 35
cam = bpy.data.objects.new("cam_tour", cd)
coll.objects.link(cam)
tc = cam.constraints.new("TRACK_TO")
tc.target = aim
tc.track_axis = "TRACK_NEGATIVE_Z"
tc.up_axis = "UP_Y"

sc = bpy.context.scene
sc.render.fps = FPS
sc.frame_start = 1
sc.frame_end = int(TOTAL * FPS)

def base(i):
    return Vector(bpy.data.objects[f"cam_S{i}"].location), Vector(bpy.data.objects[f"aim_S{i}"].location)

def key(t, pos, target):
    f = 1 + round(t * FPS)
    cam.location = pos
    aim.location = target
    cam.keyframe_insert("location", frame=f)
    aim.keyframe_insert("location", frame=f)
    return {"t": t, "pos": [round(v, 3) for v in pos], "aim": [round(v, 3) for v in target]}

def drift(p0, a, k):
    return p0 + (a - p0) * k, a

keys, segments = [], []
prev_station, prev_end_pos, prev_end_aim = None, None, None
for idx, (sid, st, t0, t1, who, scene_name) in enumerate(SCHEDULE):
    p0, a0 = base(st)
    if prev_station is None:
        # entrada: empuja desde atrás hacia la primera estación
        keys.append(key(0.0, p0 + Vector((0, -4.0, 2.0)), a0))
        arrive = t0 + 4.0
        keys.append(key(arrive, p0, a0))
    elif st == prev_station:
        # misma estación: continúa la deriva sin viaje, acercándose un poco más
        p0, a0 = prev_end_pos, prev_end_aim
    else:
        keys.append(key(t0, prev_end_pos, prev_end_aim))
        keys.append(key(t0 + TRAVEL, p0, a0))
    amount = 0.10 if idx not in (3, 4) else 0.04
    p1, a1 = drift(p0, a0, amount)
    last = idx == len(SCHEDULE) - 1
    t_end = t1 - PULLBACK if last else t1
    keys.append(key(t_end, p1, a1))
    prev_station, prev_end_pos, prev_end_aim = st, p1, a1
    segments.append({"id": sid, "station": st, "start": t0, "end": t1, "speaker": who, "scene": scene_name})
    mk = sc.timeline_markers.new(f"{who} · {scene_name}", frame=1 + t0 * FPS)

# alejamiento final: ve todo el diorama
over_pos = Vector((4 * SPACING, -88.0, 42.0))
over_aim = Vector((4 * SPACING, 0.0, 0.0))
keys.append(key(TOTAL, over_pos, over_aim))

sc.camera = cam
sc.frame_set(1)

out = {
    "fps": FPS,
    "duration": TOTAL,
    "spacing": SPACING,
    "segments": segments,
    "keys": keys,
    "stations": {str(i): {"cam": [round(v, 3) for v in base(i)[0]], "aim": [round(v, 3) for v in base(i)[1]]} for i in range(9)},
}
with open(f"{PROJECT}/blender/tour.json", "w") as fh:
    json.dump(out, fh, ensure_ascii=False, indent=2)

print(f"OK recorrido: {len(keys)} claves, {len(segments)} segmentos, {sc.frame_end} cuadros ({TOTAL // 60}:{TOTAL % 60:02d})")
