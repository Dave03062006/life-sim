import sys, os
from artlib import *
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
def webp(im, name, q=88, lossless=False): im.save(os.path.join(OUT, name), 'WEBP', quality=q, lossless=lossless, method=6)

# ---- hero scenes
hf = Image.open('raw/hero-flat.png').convert('RGB')
webp(hf.resize((720, 720), Image.LANCZOS), 'hero-flat.webp')
webp(ambient(hf, 48, 6), 'amb-flat.webp', 80)
hp = Image.open('raw/hero-pixel.png').convert('RGB')
hero_px = snap_to_grid(hp, 160, 160, 40)
webp(upscale(hero_px, 4), 'hero-pixel.webp', lossless=True)
webp(upscale(snap_to_grid(hp, 24, 24, 24), 8), 'amb-pixel.webp', lossless=True)

# ---- wide scenes
for name, (lw, lh) in (('futsal', (360, 240)), ('event', (300, 200))):
    f = Image.open(f'raw/{name}-flat.png').convert('RGB')
    webp(f.resize((1440, 960), Image.LANCZOS), f'{name}-flat.webp', 86)
    p = Image.open(f'raw/{name}-pixel.png').convert('RGB')
    webp(upscale(snap_to_grid(p, lw, lh, 40), 4), f'{name}-pixel.webp', lossless=True)

# ---- icon sheets -> one 8x8 sprite per style, 128px tiles
T = 128
def flood_alpha(rgb, bg, tol=30):
    a = np.asarray(rgb).astype(int); h, w, _ = a.shape
    near = np.abs(a - np.array(bg)).sum(2) <= tol
    seen = np.zeros((h, w), bool); stack = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    while stack:
        y, x = stack.pop()
        if 0 <= y < h and 0 <= x < w and near[y, x] and not seen[y, x]:
            seen[y, x] = True; stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    fg = ~seen; lum = a @ np.array([.299, .587, .114])
    body = fg & (lum > 28)
    if body.any() and lum[body].mean() < 92:
        k = min(1.9, 112 / lum[body].mean()); a = np.where(body[..., None], np.clip(a * k + 10, 0, 255), a)
    out = np.dstack([a, np.where(seen, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

flat = Image.new('RGB', (8 * T, 8 * T), (255, 255, 255))
pix = Image.new('RGBA', (8 * T, 8 * T), (0, 0, 0, 0))
found = {s: find_icons(Image.open(f'raw/icons{s}-pixel.png')) for s in (1, 2, 3, 4)}
S = min(256, max(max(w, h) for s in found for _, _, w, h, _c in found[s][1]) / 0.88)
print('pixel uniform crop side', round(S, 1))
for s in (1, 2, 3, 4):
    imf = Image.open(f'raw/icons{s}-flat.png').convert('RGB'); bgf, bf = find_icons(imf)
    med = float(np.median([max(w, h) for _, _, w, h, _c in bf])) / 0.78
    imp = Image.open(f'raw/icons{s}-pixel.png').convert('RGB'); bgp, bp = found[s]
    for i in range(16):
        n = (s - 1) * 16 + i; pos = ((n % 8) * T, (n // 8) * T)
        cx, cy, w, h, cell = bf[i]
        side = max(max(w, h) / 0.78, 0.86 * med)
        flat.paste(crop_square(imf, cx, cy, side, (255, 255, 255), cell).resize((T, T), Image.LANCZOS), pos)
        cx, cy, w, h, cell = bp[i]
        g = snap_to_grid(crop_square(imp, cx, cy, S, bgp, cell), 32, 32, 24)
        pix.paste(upscale(flood_alpha(g, bgp), 4), pos)
webp(flat, 'icons-flat.webp', 90)
webp(pix, 'icons-pixel.webp', lossless=True)
for f in sorted(os.listdir(OUT)):
    if f.endswith('.webp'): print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
# contact sheet for review
cs = Image.new('RGB', (1536, 1536), (40, 40, 40))
for i, f in enumerate(['hero-flat.webp', 'hero-pixel.webp', 'futsal-flat.webp', 'futsal-pixel.webp', 'event-flat.webp', 'event-pixel.webp']):
    im = Image.open(os.path.join(OUT, f)).convert('RGB'); im.thumbnail((512, 512))
    cs.paste(im, ((i % 2) * 512, (i // 2) * 512))
cs.paste(Image.open(os.path.join(OUT, 'icons-flat.webp')).convert('RGB').resize((512, 512), Image.LANCZOS), (1024, 0))
ip = Image.new('RGB', (8 * T, 8 * T), (12, 26, 75)); ip.paste(pix, (0, 0), pix); cs.paste(ip.resize((512, 512), Image.NEAREST), (1024, 512))
cs.paste(Image.open(os.path.join(OUT, 'amb-flat.webp')).convert('RGB').resize((256, 256), Image.BICUBIC), (1024, 1024))
cs.paste(Image.open(os.path.join(OUT, 'amb-pixel.webp')).convert('RGB').resize((256, 256), Image.NEAREST), (1280, 1024))
cs.save('test/contact.png')
