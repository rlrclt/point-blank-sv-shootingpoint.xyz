"""Wire the full Kar98k Aztec texture set into both materials.

  diff  -> Base Color
  norm  -> Normal Map
  ref   -> Roughness  (PB 'ref' = reflectance mask, dark = rough; rough = 1 - 4*ref)
  spec  -> Specular IOR Level (scaled x4, clamped)
  emissive is pure black for this skin -> not connected
"""
import bpy
import os

HERE = r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\kar98k_aztec_basic"
TEX = os.path.join(HERE, "tex", "sea3123_kar98k_aztec_basic")


def load(name):
    img = bpy.data.images.get(name)
    if img:
        return img
    img = bpy.data.images.load(os.path.join(TEX, name), check_existing=False)
    try:
        img.pack()
    except Exception:
        pass
    return img


def build(mat, diff_name, norm_name, ref_name, spec_name):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (600, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (300, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = load(diff_name)
    tex.location = (-400, 200)
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])

    tn = nt.nodes.new("ShaderNodeTexImage")
    tn.image = load(norm_name)
    tn.image.colorspace_settings.name = "Non-Color"
    tn.location = (-700, -150)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.location = (-350, -150)
    nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])

    # roughness = clamp(1 - 4*ref)
    tr = nt.nodes.new("ShaderNodeTexImage")
    tr.image = load(ref_name)
    tr.image.colorspace_settings.name = "Non-Color"
    tr.location = (-700, -420)
    mul = nt.nodes.new("ShaderNodeMixRGB") if hasattr(bpy.types, "ShaderNodeMixRGB") else nt.nodes.new("ShaderNodeMix")
    mul.blend_type = "MULTIPLY"
    mul.inputs["Fac"].default_value = 1.0
    mul.inputs[2].default_value = (4.0, 4.0, 4.0, 1.0)
    mul.location = (-450, -420)
    nt.links.new(tr.outputs["Color"], mul.inputs[1])

    inv = nt.nodes.new("ShaderNodeInvert")
    inv.location = (-250, -420)
    nt.links.new(mul.outputs["Color"], inv.inputs["Color"])
    nt.links.new(inv.outputs["Color"], bsdf.inputs["Roughness"])

    # specular from spec map (x4)
    ts = nt.nodes.new("ShaderNodeTexImage")
    ts.image = load(spec_name)
    ts.image.colorspace_settings.name = "Non-Color"
    ts.location = (-700, -680)
    ms = nt.nodes.new("ShaderNodeMixRGB") if hasattr(bpy.types, "ShaderNodeMixRGB") else nt.nodes.new("ShaderNodeMix")
    ms.blend_type = "MULTIPLY"
    ms.inputs["Fac"].default_value = 1.0
    ms.inputs[2].default_value = (4.0, 4.0, 4.0, 1.0)
    ms.location = (-450, -680)
    nt.links.new(ts.outputs["Color"], ms.inputs[1])
    if "Specular IOR Level" in bsdf.inputs:
        nt.links.new(ms.outputs["Color"], bsdf.inputs["Specular IOR Level"])
    elif "Specular" in bsdf.inputs:
        nt.links.new(ms.outputs["Color"], bsdf.inputs["Specular"])


build(bpy.data.materials["kar98k_aztec_basic_diff"],
      "kar98k_aztec_basic_diff.png", "kar98k_aztec_basic_norm.png",
      "kar98k_aztec_basic_ref.png", "kar98k_aztec_basic_spec.png")
build(bpy.data.materials["zf39_aztec_basic_diff"],
      "zf39_aztec_basic_diff.png", "zf39_aztec_basic_norm.png",
      "zf39_aztec_basic_ref.png", "zf39_aztec_basic_spec.png")

bpy.ops.wm.save_mainfile()
for a in bpy.context.screen.areas:
    if a.type == "VIEW_3D":
        a.tag_redraw()
bpy.ops.screen.screenshot(filepath=os.path.join(HERE, "scene_pbr.png"))
_result = {"ok": [m.name for m in bpy.data.materials],
           "images": [(i.name, tuple(i.size), bool(i.packed_file)) for i in bpy.data.images]}
