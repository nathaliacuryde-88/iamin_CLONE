# Builds index.html (artifact page) and preview.html (local test) from src/.
import pathlib
here = pathlib.Path(__file__).parent; s = here / 'src'
order = ['core.js', 'feed.js', 'event.js', 'add.js', 'cal.js', 'cap.js', 'me.js', 'tab.js', 'home.js']
js = '\n'.join((s / f).read_text() for f in order if (s / f).exists())
page = (s / 'head.html').read_text() + (s / 'body.html').read_text() + '<script>\n' + (s / 'stickers.js').read_text() + '\nconst LUCIDE=' + (s / 'lucide.json').read_text() + ';\n</script>\n<script>\n(() => {\n' + js + '\ngo("feed");\n})();\n</script>\n'
(here / 'index.html').write_text(page)
(here / 'preview.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}</style></head><body>' + page + '</body></html>')
print('ok', len(page))
