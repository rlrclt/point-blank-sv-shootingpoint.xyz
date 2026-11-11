"""Pirate atlas v4 - game's alto tier loads 1024, so render 1024x512 but crisp:
Lanczos downscale from native 1440x720, then unsharp at final res.
Coordinates back to the original 1024x512 layout.
"""
import os
import math
import numpy as np
from PIL import Image, ImageFilter
from collections import deque

GEN_DIR = os.path.dirname(os.path.abspath(__file__))
MAKESKIN = os.path.dirname(GEN_DIR)                      # .../makeskin
SRC = os.path.join(MAKESKIN, "ref", "Gemini_Generated_Image_oqer0boqer0boqer.jpg")
ROGER = os.path.join(MAKESKIN, "ref_onepiece", "roger.jpg")
OUT = os.path.join(MAKESKIN, "tex", "sea3123_zombieslayer")
W, H = 1024, 512

src = Image.open(SRC).convert("RGB").resize((W, H), Image.LANCZOS)
a = np.asarray(src).astype(np.float32)
lum = a.mean(axis=2, keepdims=True)
a = np.clip(lum + (a - lum) * 1.18, 0, 255) * 0.97
a = np.clip(a, 0, 255)

# unsharp at the resolution the game actually samples
sharp = Image.fromarray(a.astype(np.uint8), "RGB").filter(
    ImageFilter.UnsharpMask(radius=1.2, percent=75, threshold=2))
a = np.asarray(sharp).astype(np.float32)

# ---------------- katana blade (UV strip of the bayonet) ---------------------
X0, X1, Y0, Y1 = 300, 700, 0, 42
bw, bh = X1 - X0, Y1 - Y0
yy, xx = np.mgrid[0:bh, 0:bw].astype(np.float32)
t = xx / (bw - 1.0)
w = yy / (bh - 1.0)

blade = np.zeros((bh, bw, 3), np.float32)
blade[:] = np.stack([34 + 26 * w, 36 + 26 * w, 42 + 26 * w], -1)
blade *= (0.72 + 0.28 * np.clip(w / 0.45, 0, 1))[..., None]
hamon = 0.62 + 0.035 * np.sin(t * 34.0) + 0.018 * np.sin(t * 89.0 + 0.7)
band = np.exp(-((w - hamon) ** 2) / (2 * 0.020 ** 2))
blade += (np.array([226, 214, 176], np.float32)) * band[..., None] * 0.72
glow = np.exp(-((w - hamon) ** 2) / (2 * 0.09 ** 2))
blade += (np.array([110, 98, 70], np.float32)) * glow[..., None] * 0.28
edge = np.clip((w - 0.90) / 0.10, 0, 1)
blade += (np.array([204, 206, 214], np.float32)) * edge[..., None] * 0.85
hab = np.clip((0.07 - t) / 0.07, 0, 1)
blade = blade * (1 - hab[..., None]) + np.array([180, 142, 66], np.float32) * hab[..., None]

zs = np.load(os.path.join(GEN_DIR, "zs_mask.npy"))
zs_own = zs[Y0:Y1, X0:X1]
src_strip = a[Y0:Y1, X0:X1]
a[Y0:Y1, X0:X1] = np.where(zs_own[..., None], blade, np.clip(src_strip, 0, 255))


# ---------------- straw-hat Jolly Roger on the receiver ----------------------
def cut_white(path):
    im = Image.open(path).convert("RGB")
    arr = np.asarray(im).astype(np.int16)
    bg = (arr.min(axis=2) > 232) & ((arr.max(axis=2) - arr.min(axis=2)) < 18)
    h, w = bg.shape
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    alpha = np.where(seen, 0, 255).astype(np.uint8)
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8)))
    return Image.fromarray(np.dstack([np.asarray(im), alpha]), "RGBA")


roger = cut_white(ROGER)
img = Image.fromarray(a.astype(np.uint8), "RGB").convert("RGBA")


def place_roger(cx, cy, size, alpha=255):
    s = roger.copy()
    s.thumbnail((size, int(size * 1.15)), Image.LANCZOS)
    if alpha != 255:
        s.putalpha(s.split()[3].point(lambda v: v * alpha // 255))
    img.alpha_composite(s, (int(cx - s.width / 2), int(cy - s.height / 2)))


place_roger(345, 100, 150)
place_roger(690, 300, 74, 200)

final = img.convert("RGB")
final.save(OUT + r"\skin_pirate_diff.png")

# ---------------- normal ------------------------------------------------------
g = np.asarray(final.convert("L")).astype(np.float32) / 255.0
g = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(
    ImageFilter.GaussianBlur(0.9))).astype(np.float32) / 255.0
gy, gx = np.gradient(g)
K = 3.4
nx, ny, nz = -gx * K, gy * K, np.ones_like(gx)
ln = np.sqrt(nx * nx + ny * ny + nz * nz)
nrm = np.stack([nx / ln * 0.5 + 0.5, ny / ln * 0.5 + 0.5, nz / ln * 0.5 + 0.5], -1)
Image.fromarray(np.clip(nrm * 255, 0, 255).astype(np.uint8), "RGB").save(
    OUT + r"\skin_pirate_norm.png")

# ---------------- ORM ---------------------------------------------------------
arr = np.asarray(final).astype(np.float32)
r, gg, b = arr[..., 0], arr[..., 1], arr[..., 2]
mx = arr.max(axis=2)
mn = arr.min(axis=2)
sat = (mx - mn) / np.maximum(mx, 1e-3)
brass = ((r > 90) & (gg > 70) & (b < gg * 0.78) & (sat > 0.22)).astype(np.float32)
brass = np.asarray(Image.fromarray((brass * 255).astype(np.uint8)).filter(
    ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255.0

steel = np.zeros((H, W), np.float32)
steel[Y0:Y1, X0:X1] = zs_own.astype(np.float32)
rough = 0.55 - 0.28 * brass
metal = 0.08 + 0.90 * brass
rough = rough * (1 - steel) + 0.18 * steel
metal = metal * (1 - steel) + 1.0 * steel
Image.fromarray((np.clip(np.stack([np.ones_like(rough), rough, metal], -1), 0, 1) * 255).astype(np.uint8),
                "RGB").save(OUT + r"\skin_pirate_orm.png")

print("pirate v4 written %dx%d (crisp for the game's 1024 tier)" % (W, H))
