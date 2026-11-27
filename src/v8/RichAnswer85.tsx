import React, {useMemo, type ReactNode} from 'react';
import Markdown, {type Components} from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex, {type KatexOptions} from 'katex';
import type {Element, Root} from 'hast';
import 'katex/contrib/mhchem';
import 'katex/dist/katex.min.css';
import './rich85.css';

const MAX_ANSWER_LENGTH = 100_000;
const escapedAt = (text:string,at:number) => {
  let run=0;
  while(at>0 && text[--at]==='\\')run++;
  return run%2===1;
};

/**
 * remark-math supports dollar delimiters. Gemini can emit \\(…\\) and
 * \\[…\\] too: normalize those outside code, leaving already-valid Markdown
 * and unmatched expressions alone. The established parser handles everything
 * else (not a regex-based HTML renderer).
 */
export function normalizeTexDelimiters85(source:string):string {
  const chunks:string[]=[];
  let i=0;
  let fence:{char:string;length:number}|undefined;
  const missingMath=new Set<string>();
  const missingTicks=new Set<number>();
  function closeOf(token:string,start:number):number {
    if(missingMath.has(token))return -1;
    let end=source.indexOf(token,start);
    while(end>=0 && escapedAt(source,end))end=source.indexOf(token,end+token.length);
    if(end<0)missingMath.add(token);
    return end;
  }
  while(i<source.length){
    if(i===0||source[i-1]==='\n'){
      const end=source.indexOf('\n',i);
      const lineEnd=end<0?source.length:end+1;
      const line=source.slice(i,lineEnd);
      const marker=line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
      if(fence){
        chunks.push(line);i=lineEnd;
        if(marker && marker[1][0]===fence.char&&marker[1].length>=fence.length&&!marker[2].trim())fence=undefined;
        continue;
      }
      if(marker){
        fence={char:marker[1][0],length:marker[1].length};
        chunks.push(line);i=lineEnd;continue;
      }
      // Literal indented code (including tabs): no TeX delimiter rewriting.
      if(/^(?: {4}|\t)/.test(line)){
        chunks.push(line);i=lineEnd;continue;
      }
    }
    if(source[i]==='`'&&!escapedAt(source,i)){
      const ticks=source.slice(i).match(/^`+/)![0];
      let cursor=i+ticks.length,closing=-1;
      if(!missingTicks.has(ticks.length)){
        while(cursor<source.length){
          const at=source.indexOf('`',cursor);
          if(at<0)break;
          const run=source.slice(at).match(/^`+/)![0];
          if(run.length===ticks.length){closing=at+run.length;break;}
          cursor=at+run.length;
        }
      }
      if(closing>=0){
        chunks.push(source.slice(i,closing));i=closing;continue;
      }
      missingTicks.add(ticks.length);
      chunks.push(ticks);i+=ticks.length;continue;
    }
    const pair=source.slice(i,i+2);
    if((pair==='\\('||pair==='\\[')&&!escapedAt(source,i)){
      const closing=pair==='\\('?'\\)':'\\]';
      const end=closeOf(closing,i+2);
      if(end>=0){
        const body=source.slice(i+2,end);
        const before=source.slice(source.lastIndexOf('\n',i-1)+1,i);
        const afterIndex=source.indexOf('\n',end+2);
        const after=source.slice(end+2,afterIndex<0?source.length:afterIndex);
        if(body.trim()){
          const display=pair==='\\[';
          const longest=Math.max(0,...(body.match(/\$+/g)||[]).map(run=>run.length));
          const delimiter='$'.repeat(Math.max(display?2:1,longest+1));
          // Use genuine display math when the entire display expression owns its lines.
          if(display&&!before.trim()&&!after.trim())chunks.push(delimiter+'\n'+body.trim()+'\n'+delimiter);
          else chunks.push(delimiter+body.trim()+delimiter);
          i=end+2;continue;
        }
      }
      // Incomplete LaTeX remains text, including its delimiter backslash.
      chunks.push('\\'+pair);i+=2;continue;
    }
    if((pair==='\\)'||pair==='\\]')&&!escapedAt(source,i)){
      chunks.push('\\'+pair);i+=2;continue;
    }
    chunks.push(source[i++]);
  }
  return chunks.join('');
}

function Heading85({level,children}:{level:number;children:ReactNode}){
  const Heading=(level<=2?'h4':level===3?'h5':'h6') as 'h4'|'h5'|'h6';
  return <Heading className="rich85-heading" data-level={level}>{children}</Heading>;
}

const components: Components = {
  h1:({children})=><Heading85 level={1}>{children}</Heading85>,
  h2:({children})=><Heading85 level={2}>{children}</Heading85>,
  h3:({children})=><Heading85 level={3}>{children}</Heading85>,
  h4:({children})=><Heading85 level={4}>{children}</Heading85>,
  h5:({children})=><Heading85 level={5}>{children}</Heading85>,
  h6:({children})=><Heading85 level={6}>{children}</Heading85>,
  table:({children})=><div className="rich85-table-scroll"><table>{children}</table></div>,
  pre:({children})=><div className="rich85-codeblock"><pre>{children}</pre></div>,
  a:({children})=><span className="rich85-inert-link">{children}</span>,
  img:({alt})=><span className="rich85-inert-image">{alt || '[image]'}</span>,
  // Task-list markers are display only, never an interactive control from model output.
  input:({checked})=><span aria-label={checked?'checked':'unchecked'}>{checked?'☑':'☐'}</span>,
};

// KaTeX's ordinary throwOnError=false rendering can hide braces/arguments of an
// unknown command. Preflight with the public strict parser so invalid input stays
// visibly complete. Valid equations still use the standard rehype-katex output.
const katexSettings: KatexOptions = {
  // Always deny privileged TeX actions, not just JavaScript URL schemes.
  trust:()=>{throw new Error('Privileged TeX commands are disabled');},
  strict:'ignore',
  maxExpand:500,
  maxSize:20,
  globalGroup:false,
  output:'htmlAndMathml',
};
const MAX_MATH_LENGTH = 12_000;
function mathClass(node:Element){
  const classes=Array.isArray(node.properties.className)?node.properties.className:[];
  return classes.includes('language-math')||classes.includes('math-inline')||classes.includes('math-display');
}
function rehypeGuardMath85(){
  return (tree:Root)=>{
    function textOf(element:Element):string{
      return element.children.map(node=>node.type==='text'?node.value:node.type==='element'?textOf(node):'').join('');
    }
    function walk(parent:Root|Element){
      parent.children.forEach((child,i)=>{
        if(child.type!=='element')return;
        const fenced=child.tagName==='pre'
          ?child.children.find((node):node is Element=>node.type==='element'&&node.tagName==='code'&&mathClass(node)):undefined;
        const equation=fenced??(mathClass(child)?child:undefined);
        if(equation){
          const display=!!fenced||(Array.isArray(equation.properties.className)&&equation.properties.className.includes('math-display'));
          const raw=textOf(equation);
          try{
            if(raw.length>MAX_MATH_LENGTH)throw Error('Formula exceeds render limit');
            katex.renderToString(raw,{...katexSettings,displayMode:display,throwOnError:true});
          }catch{
            const delimiter=display?'$$':'$';
            parent.children[i]={
              type:'element',tagName:display?'div':'span',
              properties:{className:['katex-error','rich85-math-plain']},
              children:[{type:'text',value:delimiter+raw+delimiter}],
            };
          }
          return;
        }
        walk(child);
      });
    }
    walk(tree);
  };
}

/** Untrusted answer: no raw HTML parser and no active generated link, image, or embed. */
export function RichAnswer85({text}:{text:string}){
  const content=useMemo(()=>{
    if(text.length>MAX_ANSWER_LENGTH)return <div className="rich85-plain">{text}</div>;
    try{
      // Markdown is the pinned synchronous rendering API. Catch processing failures
      // here so the entire original answer remains readable rather than losing it.
      return Markdown({
        children:normalizeTexDelimiters85(text),
        remarkPlugins:[remarkGfm,remarkMath],
        rehypePlugins:[rehypeGuardMath85,[rehypeKatex,katexSettings]],
        // Raw HTML is escaped literal text (no rehype-raw); all generated URL
        // properties are suppressed, and link/image components are inert.
        skipHtml:false,
        urlTransform:()=>'',
        disallowedElements:['script','iframe','object','embed','video','audio','source','link','style','form'],
        components,
      });
    }catch{
      return <div className="rich85-plain">{text}</div>;
    }
  },[text]);
  return <div className="rich-answer85" data-rich-answer85="true">{content}</div>;
}
