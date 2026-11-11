"""Import M1887 Element Water GLB into a fresh scene and save as .blend.

Run inside Blender (MCP / bridge) after the file is ready:
    exec(open(r"...\\import_scene.py", encoding="utf-8").read())

Does:
  1. new empty scene (File > New, keeps add-ons)
  2. import sea3123_m1887_element_water.glb
  3. report hierarchy / meshes / materials
  4. save makeskin/eva01_m1887_element_water.blend
"""
import bpy
import os

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\m1887_element_water"
GLB = os.path.join(HERE, "sea3123_m1887_element_water.glb")
BLEND = os.path.join(HERE, "eva01_m1887_element_water.blend")

# 1. fresh scene
bpy.ops.wm.read_homefile(use_empty=True)

# 2. import
bpy.ops.import_scene.gltf(filepath=GLB)
try:
    bpy.ops.ed.undo_push(message="Import M1887 Element Water")
except RuntimeError:
    pass  # bridge context has no undo stack

# 3. report
rows = []
for o in bpy.data.objects:
    par = o.parent.name if o.parent else "-"
    rows.append(f"{o.name:28s} {o.type:8s} parent={par}")
print("\n".join(sorted(rows)))
print("meshes:", len([o for o in bpy.data.objects if o.type == "MESH"]))
print("materials:", [m.name for m in bpy.data.materials])
print("images:", [(i.name, tuple(i.size)) for i in bpy.data.images])

# 4. save
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("saved:", BLEND)

