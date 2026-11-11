"""Compose a weapon-skin diffuse atlas: ivory base + tonal band + gold pinstripes + small sakura petals.

Why: the AUG UV atlas is densely packed and meshes share UV space, so a large
single motif looks different on every part. A fine, uniform motif with broad
tonal structure reads as a designed skin at any texel density.

Run: python compose_sakura.py
Out: sakura_lattice_diff_1024.png
"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import math
import random

W = H = 1024
random.seed(7)

# ---------- 1. base: warm ivory with a soft diagonal charcoal band ----------
base = Image.new("RGB", (W, H), (243, 236, 226))
d = ImageDraw.Draw(base)
band = Image.new("L", (W, H), 0)
db = ImageDraw.Draw(band)
# broad diagonal band from lower-left to upper-right
db.polygon([(-200, 1180), (420, 1180), (1240, 380), (1240, -40), (820, -40)], fill=255)
band = band.filter(ImageFilter.GaussianBlur(26))
dark = Image.new("RGB", (W, H), (38, 36, 44))
base = Image.composite(dark, base, band)

# secondary soft tonal wash (bottom-right) to break flatness
wash = Image.new("L", (W, H), 0)
dw = ImageDraw.Draw(wash)
dw.ellipse([700, 620, 1250, 1200], fill=90)
wash = wash.filter(ImageFilter.GaussianBlur(70))
base = Image.composite(Image.new("RGB", (W, H), (198, 186, 176)), base, wash)

# ---------- 2. gold pinstripes (thin, crisp, with slight bloom) ----------
lines = Image.new("RGB", (W, H), (0, 0, 0))
mask = Image.new("L", (W, H), 0)
dl = ImageDraw.Draw(mask)
# three parallel diagonals echoing the band edge
for off in (0, 18, 320):
    dl.line([(-160 + off, 1200), (1240, 60 + off)], fill=255, width=4)
mask = mask.filter(ImageFilter.GaussianBlur(0.6))
gold = Image.new("RGB", (W, H), (196, 158, 84))
base = Image.composite(gold, base, mask)

# ---------- 3. sakura petals cut from the Flow-generated blossom ----------
SRC = r"C:\Users\YoruDekD\flow-agent\flow-agent\output\acct-68db5b88-55e.jpg"
src = Image.open(SRC).convert("RGB")
# pink mask: strong red, lower green, medium blue
px = src.load()
m = Image.new("L", src.size, 0)
mp = m.load()
for y in range(src.size[1]):
    for x in range(src.size[0]):
        r, g, b = px[x, y]
        if r > 215 and 110 < g < 200 and 140 < b < 220 and (r - g) > 45:
            mp[x, y] = 255
# largest blossom ~ crop around the densest area (centre of mass)
bbox = m.getbbox()
if bbox:
    x0, y0, x1, y1 = bbox
    # pick a single blossom: crop a square around the mask centroid
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    s = min(x1 - x0, y1 - y0)
    s = min(s, 220)
    crop = src.crop((cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2))
    cmask = m.crop((cx - s // 2, cy - s // 2, cx + s // 2, cy + s // 2)).filter(ImageFilter.GaussianBlur(1))
else:
    crop, cmask = src.crop((0, 0, 200, 200)), Image.new("L", (200, 200), 255)

petals = []
for scale in (46, 58, 72):
    p = crop.resize((scale, scale), Image.LANCZOS)
    pm = cmask.resize((scale, scale), Image.LANCZOS)
    petals.append((p, pm))

# scatter blossoms: dense near the diagonal, sparse elsewhere
placements = []
for i in range(46):
    t = random.random()
    # bias along the band edge
    x = random.randint(-40, W + 40)
    y = int(1180 - (x + 200) * 0.95) + random.randint(-260, 260)
    y = max(10, min(H - 10, y))
    placements.append((x, y, random.choice(petals), random.randint(0, 359)))

# dark leaf accents (small dashes)
for i in range(34):
    x, y = random.randint(0, W), random.randint(0, H)
    leaf = Image.new("RGBA", (26, 12), (0, 0, 0, 0))
    dlf = ImageDraw.Draw(leaf)
    dlf.ellipse([0, 0, 25, 11], fill=(44, 42, 50, 235))
    leaf = leaf.rotate(random.randint(0, 359), expand=True, resample=Image.BICUBIC)
    base.paste(leaf, (x, y), leaf)

for x, y, (p, pm), rot in placements:
    p2 = p.rotate(rot, expand=True, resample=Image.BICUBIC)
    m2 = pm.rotate(rot, expand=True, resample=Image.BICUBIC)
    base.paste(p2, (x - p2.size[0] // 2, y - p2.size[1] // 2), m2)

# ---------- 4. subtle grain so it doesn't look vector-flat ----------
noise = Image.effect_noise((W, H), 6).convert("L")
grain = Image.merge("RGB", (noise, noise, noise))
base = Image.blend(base, ImageChops.multiply(base, ImageChops.invert(grain)), 0.35)

# ---------- 5. final contrast nudge ----------
base = base.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55, threshold=2))
base.save(r"C:\Users\YoruDekD\Desktop\pb-esp-ext\makeskin\sakura_aug_a3_dark_cupid\sakura_lattice_diff_1024.png")
print("saved")
