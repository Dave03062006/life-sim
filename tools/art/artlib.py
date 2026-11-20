"""Helpers that turn the AI-generated source art into game-ready assets.

flat  -> smooth resize, WebP
pixel -> snap to a true pixel grid (most common colour per block) with a limited palette
sheets-> find each icon in a 4x4 sheet and re-centre it in a uniform tile
"""
import numpy as np
from PIL import Image, ImageFilter

# Endesga 32, a widely used pixel-art palette
EDG32 = ["be4a2f","d77643","ead4aa","e4a672","b86f50","733e39","3e2731","a22633","e43b44","f77622",
         "feae34","fee761","63c74d","3e8948","265c42","193c3e","124e89","0099db","2ce8f5","ffffff",
         "c0cbdc","8b9bb4","5a6988","3a4466","262b44","181425","ff0044","68386c","b55088","f6757a",
         "e8b796","c28569"]

def hex2rgb(h): return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def palette_image(hexes):
    p = Image.new("P", (1, 1))
    flat = [c for h in hexes for c in hex2rgb(h)]
    p.putpalette(flat + flat[:3] * (256 - len(hexes)))
    return p

def quantize(im, colors=32, fixed=None):
    """Return a P-mode image, no dithering. fixed = list of hex colours, or None for an adaptive palette."""
    im = im.convert("RGB")
    if fixed:
        return im.quantize(palette=palette_image(fixed), dither=Image.Dither.NONE)
    return im.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

def snap_to_grid(im, w, h, colors=32, fixed=None):
    """Re-grid faux pixel art: quantize at full size, then take the most common colour in each block."""
    q = quantize(im, colors, fixed)
    idx = np.asarray(q).astype(np.int64)
    H, W = idx.shape
    K = int(idx.max()) + 1
    cx = (np.arange(W) * w // W)[None, :].repeat(H, 0)
    cy = (np.arange(H) * h // H)[:, None].repeat(W, 1)
    cell = cy * w + cx
    counts = np.bincount((cell * K + idx).ravel(), minlength=w * h * K).reshape(w * h, K)
    mode = counts.argmax(1).reshape(h, w).astype(np.uint8)
    out = Image.fromarray(mode, "P")
    out.putpalette(q.getpalette())
    return out.convert("RGB")

def upscale(im, k): return im.resize((im.width * k, im.height * k), Image.NEAREST)

def bg_colour(a):
    edge = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    return np.median(edge, axis=0)

def find_icons(im, rows=4, cols=4, tol=40):
    """Return (bg colour, list of (cx, cy, w, h)) for each icon in reading order."""
    a = np.asarray(im.convert("RGB")).astype(int)
    bg = bg_colour(a)
    mask = np.abs(a - bg).sum(2) > tol
    H, W = mask.shape
    def cuts(proj, n):
        L = len(proj); out = [0]
        sm = np.convolve(proj, np.ones(9) / 9, mode="same")
        for k in range(1, n):
            c = k * L // n; r = int(L / n * 0.28)
            seg = sm[c - r:c + r]
            lows = np.flatnonzero(seg <= seg.min() + 0.5)
            out.append(c - r + int(np.median(lows)))
        out.append(L); return out
    xs, ys = cuts(mask.sum(0), cols), cuts(mask.sum(1), rows)
    boxes = []
    for r in range(rows):
        for c in range(cols):
            sub = mask[ys[r]:ys[r + 1], xs[c]:xs[c + 1]]
            yy, xx = np.nonzero(sub)
            x0, x1, y0, y1 = xx.min() + xs[c], xx.max() + xs[c], yy.min() + ys[r], yy.max() + ys[r]
            boxes.append(((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 1, y1 - y0 + 1, (xs[c], ys[r], xs[c + 1], ys[r + 1])))
    return tuple(int(v) for v in bg), boxes

def crop_square(im, cx, cy, side, bg, cell=None):
    """Square crop centred on an icon; pixels outside the icon's own sheet cell are replaced by the background."""
    side = int(round(side)); x0 = int(round(cx - side / 2)); y0 = int(round(cy - side / 2))
    out = Image.new("RGB", (side, side), bg)
    src = im.convert("RGB")
    if cell:
        src = src.crop(cell); out.paste(src, (cell[0] - x0, cell[1] - y0))
    else:
        out.paste(src, (-x0, -y0))
    return out

def ambient(im, size=40, blur=5):
    return im.convert("RGB").resize((size, size), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur))
