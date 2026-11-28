"""Application-level source guard; excludes authored content, user data and runtime AI output."""
from pathlib import Path
root=Path(__file__).resolve().parents[2]
app=(root/'src/App.tsx').read_text(encoding='utf-8')
for raw in [
 'placeholder="Search your library"', 'aria-label="Search your library"',
 'title="Open demo textbook"', 'title="Toggle larger text"', 'aria-label="Toggle larger text"',
 'title="Bookmark section"', 'aria-label="Bookmark section"', 'title="Save a note"',
 'aria-label="Save lesson note"', 'aria-label="Hide explanation"',
 'aria-label="Choose compound"', 'title="Delete note"', 'aria-label="Close text preview"',
 "notes.length?'No matching notes':'No notes saved yet'",
 "notes.length?'Try a different search.':'Open a lesson, select a passage, and save a real note to this browser.'",
 "item==='English'?'Original demo content':'Language applied to the interface'",
]:
    assert raw not in app, f'Hardcoded UI language: {raw}'
html=(root/'index.html').read_text(encoding='utf-8')
assert 'data-elk-release="8.5"' in html and 'data-elk-drawer-release="8.5.1"' in html, 'Native compatibility markers must be preserved'
assert 'data-elk-polish-release="8.6"' in html, 'V8.6 deployment marker is required'
assert "import './v8/theme86.css'" in (root/'src/main.tsx').read_text(encoding='utf-8')
assert 'app-shell-v86' in (root/'public/sw.js').read_text(encoding='utf-8')
print('[PASS] App translation source guard, V8.6 cache and native marker compatibility')
