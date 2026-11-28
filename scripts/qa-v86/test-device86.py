"""Physical QA source contract: incomplete/blocked fullscreen checks cannot pass."""
from pathlib import Path
root=Path(__file__).resolve().parents[2]
s=(root/'scripts/qa-v85/visual-qa-v85.mjs').read_text(encoding='utf-8')
assert "polish:flags.has('--polish')" in s
assert 'options.polish&&role' in s
assert '[data-elk-molecule-open="builder"]' in s
assert '[data-elk-molecule-fullscreen="builder"]' in s
assert 'V86_MARKER_MISSING' in s and 'MOLECULE_FULLSCREEN_GEOMETRY' in s
assert 'supplemental.pass===expectedDrawerChecks' in s
print('[PASS] Physical V8.6 QA requires drawer AND builder workspace checks')
