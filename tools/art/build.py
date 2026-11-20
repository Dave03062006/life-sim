"""Builds public/art/*.webp and src/styles/art-manifest.json from design/art-source/. Run from the repo root."""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import *

SRC, OUT = 'design/art-source', 'public/art'
os.makedirs(OUT, exist_ok=True)
def webp(im, name, q=88, lossless=False): im.save(os.path.join(OUT, name), 'WEBP', quality=q, lossless=lossless, method=6)
def web(name): return '/art/' + name
def load(name): return Image.open(f'{SRC}/{name}.png').convert('RGB')
names = json.load(open('tools/art/names.json'))
manifest = {'icons': {'sheet': {}, 'index': {}}, 'scenes': {}, 'ambient': {}, 'games': {}, 'events': {}}
# pixel grid per wide kind
GRID = {'game': (360, 240), 'event': (384, 256)}

for fn in sorted(os.listdir(SRC)):
    m = re.fullmatch(r'(scene|game|event)-(.+)-flat\.png', fn)
    if not m: continue
    kind, key = m.groups()
    section = {"scene": "scenes", "game": "games", "event": "events"}[kind]
    f, p = load(f'{kind}-{key}-flat'), load(f'{kind}-{key}-pixel')
    if kind == 'scene':
        webp(f.resize((720, 720), Image.LANCZOS), f'{kind}-{key}-flat.webp')
        webp(upscale(snap_to_grid(p, 160, 160, 40), 4), f'{kind}-{key}-pixel.webp', lossless=True)
        webp(ambient(f, 48, 6), f'ambient-{key}-flat.webp', 80)
        webp(upscale(snap_to_grid(p, 24, 24, 24), 8), f'ambient-{key}-pixel.webp', lossless=True)
        manifest['ambient'][key] = {s: web(f'ambient-{key}-{s}.webp') for s in ('flat', 'pixel')}
    else:
        lw, lh = GRID[kind]
        webp(f.resize((1440, 960), Image.LANCZOS), f'{kind}-{key}-flat.webp', 86)
        webp(upscale(snap_to_grid(p, lw, lh, 40), 4), f'{kind}-{key}-pixel.webp', lossless=True)
    manifest[section][key] = {s: web(f'{kind}-{key}-{s}.webp') for s in ('flat', 'pixel')}

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
found = {s: find_icons(Image.open(f'{SRC}/icons-0{s}-pixel.png')) for s in (1, 2, 3, 4)}
S = min(256, max(max(w, h) for s in found for _, _, w, h, _c in found[s][1]) / 0.88)
print('pixel uniform crop side', round(S, 1))
for s in (1, 2, 3, 4):
    imf = Image.open(f'{SRC}/icons-0{s}-flat.png').convert('RGB'); bgf, bf = find_icons(imf)
    med = float(np.median([max(w, h) for _, _, w, h, _c in bf])) / 0.78
    imp = Image.open(f'{SRC}/icons-0{s}-pixel.png').convert('RGB'); bgp, bp = found[s]
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
manifest['icons']['sheet'] = {s: web(f'icons-{s}.webp') for s in ('flat', 'pixel')}
manifest['icons']['index'] = {n: i * 16 + j for i, sheet in enumerate(sorted(names)) for j, n in enumerate(names[sheet])}
with open('src/styles/art-manifest.json', 'w') as fh: json.dump(manifest, fh, indent=2); fh.write(chr(10))
for f in sorted(os.listdir(OUT)): print(f, Image.open(os.path.join(OUT, f)).size, os.path.getsize(os.path.join(OUT, f)))
