# Art tools

Turns the AI-generated source art into the WebP files in `public/art/` and writes `src/styles/art-manifest.json`.

- Needs Python 3 with Pillow and NumPy.
- Run from the repo root: `python tools/art/build.py`
- The source images (`design/art-source/`) are not in git. They live in the Figma file "Life-sim art".
