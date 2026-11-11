"""Wire glow (emissive) for the Pindad SS3 neon skin.

PB client shader: c += emissiveMap.rgb * emissiveColor * 4.0   (define PB_EMISSIVE)
- the shader takes the file path from mesh.userData.pbEmissive  (base + path)
- tint from material/mesh userData.pbEmissiveColor (default 1,1,1)

So we do BOTH:
  1. standard glTF emissive (Blender Principled Emission) -> works in three.js / fallback path
  2. PB custom properties (extras) pbEmissive / pbEmissiveColor -> works in the PB shader path

Run via Flue bridge (blender open with pindad_ss3.blend).
"""
import bpy
import os

HERE = r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\pindad_ss3"
EMIS = os.path.join(HERE, "tex", "sea3123_pindad_ss3", "emissive")

# material -> (emissive file, pbEmissive relative path)
CONFIG = {
    "pindad_ss3_diff": (
        "pindad_ss3_emissive.png",
        "tex/sea3123_pindad_ss3/pindad_ss3_emissive.png",
    ),
    "combat_sight_mepro_x6_diff": (
        "combat_sight_mepro_x6_emissive.png",
        "tex/sea3123_pindad_ss3/combat_sight_mepro_x6_emissive.png",
    ),
}
# which mesh uses which material (for the mesh-level extras PB reads)
MESH_MAT = {
    "Pindad_SS3": "pindad_ss3_diff",
    "Model_Handle": "pindad_ss3_diff",
    "Model_Magazine": "pindad_ss3_diff",
    "Combat_Sight_Mepro_X6": "combat_sight_mepro_x6_diff",
}

for mat_name, (fname, rel) in CONFIG.items():
    m = bpy.data.materials[mat_name]
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    img = bpy.data.images.load(os.path.join(EMIS, fname), check_existing=False)
    img.name = "emissive_" + fname
    img.reload()
    img.pack()

    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.name = "Emissive"
    tex.image = img
    tex.location = (-400, -900)
    if "Emission Color" in bsdf.inputs:
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 1.0
    else:  # older socket names
        nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission"])
        bsdf.inputs["Emission Strength"].default_value = 1.0

for obj_name, mat_name in MESH_MAT.items():
    o = bpy.data.objects.get(obj_name)
    if not o:
        continue
    fname, rel = CONFIG[mat_name]
    o["pbEmissive"] = rel
    o["pbEmissiveColor"] = [1.0, 1.0, 1.0]
    for ms in o.material_slots:
        if ms.material:
            ms.material["pbEmissive"] = rel
            ms.material["pbEmissiveColor"] = [1.0, 1.0, 1.0]

bpy.ops.wm.save_mainfile()

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
OUT = os.path.join(HERE, "pindad_ss3_neon_glow.glb")
with bpy.context.temp_override(window=win, screen=screen, area=area, region=region,
                              active_object=root, object=root, selected_objects=selected,
                              selected_editable_objects=selected):
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format="GLB", use_selection=True,
        export_apply=True, export_image_format="AUTO",
        export_yup=True, export_cameras=False, export_lights=False,
        export_extras=True,
    )

for a in bpy.context.screen.areas:
    if a.type == "VIEW_3D":
        a.tag_redraw()
bpy.ops.screen.screenshot(filepath=os.path.join(HERE, "scene_glow.png"))

_result = {"glb": OUT, "size": os.path.getsize(OUT),
           "images": [(i.name, tuple(i.size)) for i in bpy.data.images if "emissive" in i.name]}
