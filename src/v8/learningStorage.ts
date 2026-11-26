// Device-local namespaces, not an encryption or server security boundary.
// Bind once per document; a different authenticated UID requires a full reload.
const prefix = 'elk.v81.account:';
const globalKeys = new Set(['elk.dark','elk.language','elk.sidebar.collapsed','elk.reduceMotion']);
let scope: string | null = null;
export function getBoundScope() { return scope; }
export function bindLearningScope(value: string) {
  if (scope !== null && scope !== value) throw new Error('Learning scope changed; reload required');
  scope = value;
}
function physical(key: string): string | null {
  if (globalKeys.has(key)) return key;
  if (key.startsWith(prefix) || scope === null) return null;
  return `${prefix}${encodeURIComponent(scope)}:${key}`;
}
function visibleKeys(): string[] {
  const store = window.localStorage;
  const own = scope ? `${prefix}${encodeURIComponent(scope)}:` : null;
  const result: string[] = [];
  for(let i=0;i<store.length;i++) {
    const key=store.key(i); if(key===null)continue;
    if(globalKeys.has(key))result.push(key);
    else if(own && key.startsWith(own))result.push(key.slice(own.length));
  }
  return result;
}
export const learningStorage: Storage = {
  get length(){ return visibleKeys().length; },
  key(index:number){ return visibleKeys()[index] ?? null; },
  getItem(key:string){const p=physical(String(key));return p===null?null:window.localStorage.getItem(p);},
  setItem(key:string,value:string){const p=physical(String(key));if(p!==null)window.localStorage.setItem(p,String(value));},
  removeItem(key:string){const p=physical(String(key));if(p!==null)window.localStorage.removeItem(p);},
  clear(){for(const k of visibleKeys())if(!globalKeys.has(k))this.removeItem(k);},
};
