#!/usr/bin/env python3
"""Bundle the app into one self-contained HTML file (dist/tap-and-paint.html).

Handy for places that only take a single page, like a Claude artifact.
The single file has no offline/home-screen support (that needs sw.js and
the manifest), but everything else works.
"""
import base64, pathlib, re

root = pathlib.Path(__file__).parent

def module(name, var):
    """Turn an ES module into `const var = (() => {...; return {exports}})();`"""
    src = (root / 'js' / name).read_text()
    exports = re.findall(r'^export (?:async )?(?:const|function|let) (\w+)', src, re.M)
    src = re.sub(r'^export ', '', src, flags=re.M)
    return f'const {var} = (() => {{\n{src}\nreturn {{ {", ".join(exports)} }};\n}})();\n'

app = (root / 'js' / 'app.js').read_text()
imports = re.search(r"import \{([^}]*)\} from './environments.js';", app)
names = ', '.join(n.strip() for n in imports.group(1).split(',') if n.strip())
app = app.replace(imports.group(0), f'const {{ {names} }} = worldsModule;')
app = re.sub(r"^import \* as (\w+) from '\./([\w-]+)\.js';\n", '', app, flags=re.M)

script = (module('environments.js', 'worldsModule') + module('album-db.js', 'album')
          + module('audio.js', 'sound') + app)

html = (root / 'index.html').read_text()
icon = base64.b64encode((root / 'icons' / 'icon.svg').read_bytes()).decode()
html = re.sub(r'\s*<link rel="manifest"[^>]*>', '', html)
html = re.sub(r'\s*<link rel="apple-touch-icon"[^>]*>', '', html)
html = html.replace('href="icons/icon.svg"', f'href="data:image/svg+xml;base64,{icon}"')
html = html.replace('<link rel="stylesheet" href="styles.css">',
                    '<style>\n' + (root / 'styles.css').read_text() + '</style>')
html = html.replace('<script type="module" src="js/app.js"></script>',
                    '<script type="module">\n' + script.replace('</script', '<\\/script') + '</script>')

out = root / 'dist' / 'tap-and-paint.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html)
print(f'wrote {out} ({out.stat().st_size // 1024} KB)')
