# Builds index.html from src.html by inlining the sticker set and the Lucide icons.
import json, sys, pathlib
here = pathlib.Path(__file__).parent
stickers = pathlib.Path(sys.argv[1]).read_text()
lucide = pathlib.Path(sys.argv[2]).read_text()
src = (here / 'src.html').read_text()
out = src.replace('/*STICKERS*/', stickers).replace('/*LUCIDE*/', 'const LUCIDE=' + lucide + ';')
(here / 'index.html').write_text(out)
# local preview with a document skeleton
(here / 'preview.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}</style></head><body>' + out + '</body></html>')
print(len(out))
