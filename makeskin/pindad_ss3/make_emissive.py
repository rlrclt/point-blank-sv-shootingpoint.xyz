"""Build emissive (glow) maps from the neon diffuse atlases.

The PB client adds glow with: c += emissiveMap.rgb * emissiveColor * 4.0
so the emissive map must be black everywhere and bright only on the neon lines.

Run: python make_emissive.py
Out: tex/sea3123_pindad_ss3/emissive/{pindad_ss3,combat_sight_mepro_x6}_emissive.png
"""
from PIL import Image, ImageFilter
import numpy as np
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "tex", "sea3123_pindad_ss3", "skin ref")
OUT = os.path.join(HERE, "tex", "sea3123_pindad_ss3", "emissive")
os.makedirs(OUT, exist_ok=True)

FILES = ["pindad_ss3_diff.png", "combat_sight_mepro_x6_diff.png"]


def to_emissive(path, out_path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    mx = a.max(2)
    mn = a.min(2)
    sat = (mx - mn) / (mx + 1e-6)

    # neon = bright + saturated (lines, screens, stripes); ignore metal/plastic highlights
    mask = (mx > 0.35) & (sat > 0.45) & ((mx - mn) > 0.25)
    mask = mask.astype(np.float32)

    # keep the original hue, boost it, and add a soft falloff so it reads as glow
    color = a * mask[..., None]
    core = Image.fromarray((color * 255).astype(np.uint8))
    glow = core.filter(ImageFilter.GaussianBlur(radius=max(2, im.size[0] // 512)))
    bloom = Image.fromarray((np.asarray(glow).astype(np.float32) * 0.55).astype(np.uint8))

    # screen-blend core over bloom, then squash to keep the engine's x4 from clipping
    out = np.clip(np.asarray(core).astype(np.float32) + np.asarray(bloom).astype(np.float32), 0, 255)
    out = (out * 0.55).astype(np.uint8)
    Image.fromarray(out).save(out_path)
    covered = float(mask.mean()) * 100
    print(f"{os.path.basename(out_path)}  {im.size}  glow coverage {covered:.1f}%")


for f in FILES:
    to_emissive(os.path.join(SRC, f), os.path.join(OUT, f.replace("_diff", "_emissive")))
