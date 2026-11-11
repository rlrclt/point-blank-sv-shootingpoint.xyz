"""Sakura reskin for AUG A3 Dark Cupid: import GLB, swap all material textures, save + export.

Run inside Blender via Flue bridge:
  Get-Content sakura_apply.py -Raw | python adapters/blender_adapter/blender_bridge.py --stdin
"""
import bpy
import os

HERE = r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\sakura_aug_a3_dark_cupid"
GLB = os.path.join(HERE, "sea3123_aug_a3_dark_cupid.glb")
TEX = os.path.join(HERE, "sakura_diff_1024.png")
BLEND = os.path.join(HERE, "sakura_aug_a3_dark_cupid.blend")
OUT = os.path.join(HERE, "sakura_aug_a3_dark_cupid.glb")

# 1. fresh scene + import
bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

# 2. one sakura image datablock shared by every material
img = bpy.data.images.load(TEX, check_existing=False)
img.name = "sakura_diff_1024.png"
for m in bpy.data.materials:
    if not m.node_tree:
        continue
    for n in m.node_tree.nodes:
        if n.type == "TEX_IMAGE":
            n.image = img
img.pack()

# 3. save
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

# 4. export subtree
root = bpy.data.objects["AxisRotate"]
bpy.ops.object.select_all(action="DESELECT")


def sel(o):
    o.select_set(True)
    for c in o.children:
        sel(c)


sel(root)
bpy.context.view_layer.objects.active = root
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", use_selection=True,
    export_apply=True, export_image_format="AUTO",
    export_yup=True, export_cameras=False, export_lights=False,
)

_result = {
    "materials": [m.name for m in bpy.data.materials],
    "images": [(i.name, tuple(i.size)) for i in bpy.data.images],
    "blend": BLEND, "glb": OUT, "glb_size": os.path.getsize(OUT),
}
