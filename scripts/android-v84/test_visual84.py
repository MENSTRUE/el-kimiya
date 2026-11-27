"""Source regression contract and contrast of explicit dark foreground/background pairs."""
from pathlib import Path
import sys,re
root=Path(sys.argv[1] if len(sys.argv)>1 else 'ui84/src')
app=(root/'App.tsx').read_text(); splash=(root/'v8/SessionBoundary.tsx').read_text()
main=(root/'main.tsx').read_text(); lang=(root/'lib/language.tsx').read_text()
cssfile=root/'v8/visual84.css'; css=cssfile.read_text() if cssfile.exists() else ''
rules=re.findall(r'([^{}]+)\{([^{}]+)\}',re.sub(r'/\*.*?\*/','',css,flags=re.S))
def ratio(f,b):
    def lum(h):
        v=[int(h[i:i+2],16)/255 for i in (1,3,5)]
        return sum(w*(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4) for x,w in zip(v,[.2126,.7152,.0722]))
    a,c=sorted([lum(f),lum(b)])
    return (c+.05)/(a+.05)
required=[
'.secondary-button','.badge','.badge-gold','.badge-neutral','.coefficient-stepper',
'.coefficient-equation','.source-box','.inline-alert','.scenario-list button.active',
'.segmented-stack button.active','.live-result','.answer-grid button.selected',
'.answer-grid button.correct','.answer-grid button.incorrect','.v63-source-note'
]
checks={
'session boundary uses splash component': 'v84-session-splash' in splash,
'session gate intact': 'ready&&(!user||roleReady)&&!roleIssue' in splash and 'bindLearningScope(target)' in splash and 'window.location.reload()' in splash,
'root theme set before render': main.find("document.documentElement.dataset.elkTheme")>=0 and main.find("document.documentElement.dataset.elkTheme")<main.find("ReactDOM.createRoot"),
'hybrid scenario labels bilingual': '{t(item.title)}' in app and '{t(item.note)}' in app and '{t(mode)}' in app,
'practice controls bilingual': 't(hint?' in app and 't(ph<7?' in app and 't(equationCorrect?' in app,
'practice dictionary direction corrected': '"Use + and − to change coefficients. The atom counts update immediately.",' not in lang.split('const idSources')[1],
'tutor metadata bilingual': 't("Question about private PDF excerpts")' in app,
'splash covers viewport and centres content': '.v84-session-splash' in css and 'min-height:100dvh' in css and 'place-items:center' in css,
'dark pH contrast explicit': '.dark .ph-value span' in css and '.dark .range-labels' in css,
'composer reserves normal-flow space': '.composer' in css and 'position:relative' in css and '.mobile-nav' in css,
}
for label in required:
    pairs=[]
    for selector,decl in rules:
        if '.app.dark '+label in [x.strip() for x in selector.split(',')]:
            fg=re.search(r'(?<![\w-])color\s*:\s*(#[0-9a-f]{6})(?![0-9a-f])',decl,re.I)
            bg=re.search(r'(?<![\w-])background(?:-color)?\s*:\s*(#[0-9a-f]{6})(?![0-9a-f])',decl,re.I)
            if fg and bg: pairs.append(ratio(fg[1],bg[1]))
    checks['explicit contrast '+label]=bool(pairs) and min(pairs)>=4.5
for name,ok in checks.items():
    print(('PASS' if ok else 'FAIL')+' '+name)
raise SystemExit(0 if all(checks.values()) else 1)
