"""Export the open .blend (AxisRotate subtree) to GLB using a proper context override."""
import bpy
import os

HERE = r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\sakura_aug_a3_dark_cupid"
OUT = os.path.join(HERE, "sakura_aug_a3_dark_cupid.glb")

root = bpy.data.objects["AxisRotate"]
bpy.ops.object.select_all(action="DESELECT")


def sel(o):
    o.select_set(True)
    for c in o.children:
        sel(c)


sel(root)

win = bpy.context.window_manager.windows[0]
screen = win.screen
area = next(a for a in screen.areas if a.type == "VIEW_3D")
region = next(r for r in area.regions if r.type == "WINDOW")
selected = [o for o in bpy.data.objects if o.select_get()]

with bpy.context.temp_override(window=win, screen=screen, area=area, region=region,
                              active_object=root, object=root, selected_objects=selected,
                              selected_editable_objects=selected):
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format="GLB", use_selection=True,
        export_apply=True, export_image_format="AUTO",
        export_yup=True, export_cameras=False, export_lights=False,
    )
    bpy.ops.wm.save_mainfile()

_result = {"glb": OUT, "size": os.path.getsize(OUT), "blend": bpy.data.filepath}
