# Exporta el diorama a glTF binario para la presentación web (Three.js).
# Las burbujas de WhatsApp NO van en el modelo: se dibujan por código en web/src/bubbles.ts.
# Cámaras, luces y animaciones tampoco: el recorrido se reproduce desde tour.json.
import bpy, os, shutil

_PROJECT = "/home/dmark123/Documents/software/final-presentation"
_glb = f"{_PROJECT}/web/public/models/diorama.glb"
os.makedirs(os.path.dirname(_glb), exist_ok=True)

_props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
_want = dict(filepath=_glb, export_format="GLB", export_apply=True, export_cameras=False,
             export_lights=False, export_animations=False, use_visible=True, export_yup=True,
             export_image_format="AUTO")
bpy.ops.export_scene.gltf(**{k: v for k, v in _want.items() if k in _props})

# el recorrido que lee la web es el mismo que se calculó en Blender
_tour = f"{_PROJECT}/blender/tour.json"
if os.path.exists(_tour):
    shutil.copy(_tour, f"{_PROJECT}/web/public/data/tour.json")

print("GLB:", os.path.getsize(_glb) // 1024, "KB")
