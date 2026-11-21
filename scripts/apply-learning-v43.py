#!/usr/bin/env python3
"""Guarded, repeatable integration into the existing V4.2 create_app."""
from __future__ import annotations

import ast
import pathlib
import sys

root=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path.cwd()
path=root/'backend/app/main.py'
code=path.read_text(encoding='utf-8')
if ('from .learning_api import make_learning_router' in code and
        'make_learning_router(' in code and
        'prefix="/api/v1/learning"' in code):
    ast.parse(code)
    print('[PASS] V4.3 learning router already installed')
    raise SystemExit(0)

old_import='from .similarity import FingerprintIndex'
new_import=old_import+'\nfrom .learning_api import make_learning_router'
old_sig='def create_app(db_path: Path | None = None, fps_path: Path | None = None) -> FastAPI:'
new_sig=('def create_app(db_path: Path | None = None, fps_path: Path | None = None, '
         'learning_progress_path: Path | None = None, learning_bank_path: Path | None = None) -> FastAPI:')
old_fps='    app.state.fps = FingerprintIndex(Path(fps_path or os.getenv("FINGERPRINT_DB", DEFAULT_FPS)))'
new_fps=old_fps+'\n'+'''    app.include_router(
        make_learning_router(
            bank_path=Path(learning_bank_path or os.getenv(
                "ELK_LEARNING_BANK", ROOT / "backend" / "data" / "chemistry_learning_bank_v1.json")),
            progress_path=Path(learning_progress_path or os.getenv(
                "ELK_LEARNING_PROGRESS_DB", ROOT / "private" / "learning" / "progress.sqlite")),
        ),
        prefix="/api/v1/learning", tags=["learning"],
    )'''
for needle,label in [(old_import,'import'),(old_sig,'create_app signature'),(old_fps,'router insertion')]:
    if code.count(needle)!=1:
        raise SystemExit(f'[ERROR] V4.2 main.py has unexpected {label}; no changes written')
result=code.replace(old_import,new_import).replace(old_sig,new_sig).replace(old_fps,new_fps)
ast.parse(result)
path.write_text(result,encoding='utf-8')
print('[PASS] V4.3 learning router mounted at /api/v1/learning')
