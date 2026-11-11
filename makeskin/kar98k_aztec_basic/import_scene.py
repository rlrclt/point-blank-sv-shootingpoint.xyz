"""Import Kar98k Aztec Basic into a fresh scene, pack textures, save."""
import bpy
import os

HERE = r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\kar98k_aztec_basic"
GLB = os.path.join(HERE, "sea3123_kar98k_aztec_basic.glb")
BLEND = os.path.join(HERE, "kar98k_aztec_basic.blend")

bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)

for img in bpy.data.images:
    if img.source == "FILE":
        try:
            img.pack()
        except Exception as e:
            print("pack failed:", img.name, e)

bpy.ops.wm.save_as_mainfile(filepath=BLEND)

rows = []
for o in bpy.data.objects:
    rows.append("%-26s %-7s parent=%s" % (o.name, o.type, o.parent.name if o.parent else "-"))
print("\n".join(sorted(rows)))
print("materials:", [m.name for m in bpy.data.materials])
print("images:", [(i.name, tuple(i.size), bool(i.packed_file)) for i in bpy.data.images])
print("saved:", BLEND)
