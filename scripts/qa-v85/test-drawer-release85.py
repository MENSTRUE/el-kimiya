"""V8.5.1 drawer architecture regression. Browser/physical QA is separate."""
from pathlib import Path
root=Path(__file__).resolve().parents[2]
app=(root/'src/App.tsx').read_text(encoding='utf-8')
mod=(root/'src/v8/Moduler81.tsx').read_text(encoding='utf-8')
for name,source in [('learner',app),('moduler',mod)]:
    assert '.showModal(' not in source and '<dialog ' not in source, f'{name}: native dialog still controls the drawer'
    assert '<Drawer851 ' in source, f'{name}: shared drawer absent'
drawer=(root/'src/v8/Drawer851.tsx').read_text(encoding='utf-8')
assert 'data-elk-drawer-open=' in drawer and 'aria-modal=' in drawer
assert 'Escape' in drawer and 'Tab' in drawer and 'inert' in drawer
assert 'data-elk-drawer-overlay' in drawer and 'data-elk-drawer-release="8.5.1"' in drawer
print('[PASS] Both roles share WebView-safe drawer and native back marker')
