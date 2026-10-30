(function(root){
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const number=n=>new Intl.NumberFormat('en').format(Number(n)||0);
  function parseReadme(markdown){
    const text=String(markdown||'').replace(/\r/g,'');
    const lines=text.split('\n');
    const features=[]; let inCode=false, codeLines=[], firstCode='';
    for(const line of lines){
      if(/^\s*(```|~~~)/.test(line)){if(inCode){if(!firstCode&&codeLines.length)firstCode=codeLines.join('\n');codeLines=[];inCode=false}else{inCode=true;codeLines=[]}continue}
      if(inCode){if(codeLines.length<12)codeLines.push(line);continue}
      const h=line.match(/^#{1,3}\s+(.{3,90})$/);
      if(h&&!/^(table of contents|contents|installation|license|contributing|documentation|features|key features|why.*)$/i.test(h[1].trim()))features.push(h[1].replace(/[`*_]/g,'').trim());
      const bullet=line.match(/^\s*[-*+]\s+(.{12,130})$/);
      if(bullet&&features.length<8)features.push(bullet[1].replace(/[`*_]/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').trim());
      // Continue through the file to capture a later fenced code sample.
    }
    const clean=lines.filter(l=>l.trim()&&!/^\s*(!\[|\[!)/.test(l)).map(l=>l.replace(/^#+\s*/,'').replace(/[`*_>#]/g,'').trim()).filter(Boolean);
    return {features:[...new Set(features)].slice(0,6),code:firstCode,opening:clean.slice(0,5).join(' ').slice(0,240)};
  }
  function commitHistogram(commits, weeks=12, now=Date.now()){
    const values=Array(weeks).fill(0), day=86400000, start=now-weeks*7*day;
    for(const c of commits||[]){const raw=c?.commit?.author?.date||c?.commit?.committer?.date||c?.author?.date;const ms=Date.parse(raw||'');if(!Number.isFinite(ms)||ms<start||ms>now+day)continue;const i=Math.floor((ms-start)/(7*day));if(i>=0&&i<weeks)values[i]++}
    return values;
  }
  function buildModel(repo, readme, commits, languages){
    const md=parseReadme(readme);
    const lang=Object.keys(languages||{}).sort((a,b)=>(languages[b]||0)-(languages[a]||0))[0]||repo.language||'Open source';
    return {name:repo.name,fullName:repo.full_name||repo.name,owner:repo.owner?.login||'',description:repo.description||'A project built in the open.',url:repo.html_url||'',stars:repo.stargazers_count||0,forks:repo.forks_count||0,issues:repo.open_issues_count||0,license:repo.license?.spdx_id||'',pushed:repo.pushed_at||'',language:lang,features:md.features.length?md.features:[repo.description||'A project built in the open.'],code:md.code||`// ${lang}\n// Explore ${repo.name} on GitHub`,opening:md.opening,activity:commitHistogram(commits),commitCount:(commits||[]).length};
  }
  const palette=()=>{const a=new Uint8Array(768);for(let i=0;i<256;i++){a[i*3]=((i>>5)&7)*255/7;a[i*3+1]=((i>>2)&7)*255/7;a[i*3+2]=(i&3)*255/3}return a};
  function lzw(indices){
    // Reset in short windows so codes stay 9-bit. Local dictionary matches still
    // compress repeated canvas colors without a larger variable-width decoder.
    const CLEAR=256,END=257,size=9,out=[];let acc=0,bits=0;
    const emit=code=>{acc|=code<<bits;bits+=size;while(bits>=8){out.push(acc&255);acc>>=8;bits-=8}};
    if(!indices.length){emit(CLEAR);emit(END);if(bits)out.push(acc&255);return new Uint8Array(out)}
    for(let i=0;i<indices.length;i+=200){
      const stop=Math.min(i+200,indices.length);emit(CLEAR);const dict=new Map();let next=258,prefix=indices[i];
      for(let j=i+1;j<stop;j++){const k=indices[j],key=(prefix<<8)|k,found=dict.get(key);if(found!==undefined){prefix=found;continue}emit(prefix);if(next<512)dict.set(key,next++);prefix=k}
      emit(prefix);
    }
    emit(END);if(bits)out.push(acc&255);return new Uint8Array(out);
  }
  function gifBlob(frames,width,height,delay=10){
    const chunks=[];const bytes=(...x)=>chunks.push(new Uint8Array(x));const word=n=>bytes(n&255,(n>>8)&255);const subBlocks=data=>{for(let i=0;i<data.length;i+=255){const block=data.subarray(i,Math.min(i+255,data.length));bytes(block.length);chunks.push(block)}bytes(0)};
    chunks.push(new TextEncoder().encode('GIF89a'));word(width);word(height);bytes(0xF7,0,0);chunks.push(palette());bytes(0x21,0xFF,0x0B);chunks.push(new TextEncoder().encode('NETSCAPE2.0'));bytes(3,1,0,0,0);
    for(const frame of frames){bytes(0x21,0xF9,4,0);word(delay);bytes(0,0);bytes(0x2C);word(0);word(0);word(width);word(height);bytes(0);bytes(8);subBlocks(lzw(frame))}
    bytes(0x3B);const size=chunks.reduce((n,c)=>n+c.length,0),out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length}return new Blob([out],{type:'image/gif'});
  }
  function roundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
  function drawFrame(ctx,m,t){
    const w=ctx.canvas.width,h=ctx.canvas.height,s=t/30,scene=Math.min(5,Math.floor(s*6)),local=s*6-scene;
    ctx.fillStyle='#111711';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#273127';ctx.lineWidth=1;for(let x=20;x<w;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=22;y<h;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    const glow=ctx.createRadialGradient(w*.72,h*.22,2,w*.72,h*.22,w*.75);glow.addColorStop(0,'#60744048');glow.addColorStop(1,'#11171100');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#b4c09c';ctx.font='bold 11px monospace';ctx.fillText('REPO REEL  /  OPEN SOURCE',22,33);ctx.fillStyle='#71806c';ctx.fillText(`${String(Math.floor(t)).padStart(2,'0')} : 30`,w-78,33);
    ctx.strokeStyle='#55614d';ctx.beginPath();ctx.moveTo(22,49);ctx.lineTo(w-22,49);ctx.stroke();
    const fade=clamp(local*3,0,1);ctx.globalAlpha=fade;
    if(scene===0){ctx.fillStyle='#dfe5d6';ctx.font='bold 35px Arial';ctx.fillText((m.name||'Repository').slice(0,17),22,162);ctx.fillStyle='#b4c09c';ctx.font='italic 27px Georgia';ctx.fillText('built in the open.',22,199);wrapText(ctx,m.description||'',22,244,w-44,17,5,'#a9b3a3','12px Arial');ctx.fillStyle='#788873';ctx.font='10px monospace';ctx.fillText(m.fullName||'',22,358)}
    if(scene===1){ctx.fillStyle='#8c9986';ctx.font='10px monospace';ctx.fillText('A PROJECT PEOPLE CHOSE',22,112);ctx.fillStyle='#eaf0e4';ctx.font='bold 50px Arial';ctx.fillText(number(m.stars),22,184);ctx.fillStyle='#b4c09c';ctx.font='13px monospace';ctx.fillText('★  STARS',24,210);ctx.fillStyle='#eaf0e4';ctx.font='bold 27px Arial';ctx.fillText(number(m.forks),22,278);ctx.fillStyle='#8c9986';ctx.font='11px monospace';ctx.fillText('FORKS   /   '+number(m.issues)+' OPEN ISSUES',22,302);drawStatLine(ctx,22,345,w-44,Math.min(1,m.stars/10000),m.language)}
    if(scene===2){ctx.fillStyle='#8c9986';ctx.font='10px monospace';ctx.fillText('WHY IT EXISTS',22,108);const lines=(m.features||[]).slice(0,4);lines.forEach((f,i)=>{const y=151+i*59;ctx.fillStyle='#b4c09c';ctx.font='bold 12px monospace';ctx.fillText(String(i+1).padStart(2,'0'),22,y);wrapText(ctx,f,58,y,w-80,16,2,'#e5e9de','13px Arial')})}
    if(scene===3){ctx.fillStyle='#8c9986';ctx.font='10px monospace';ctx.fillText('A GLIMPSE INSIDE',22,106);ctx.fillStyle='#b4c09c';ctx.font='10px monospace';ctx.fillText((m.language||'SOURCE').toUpperCase(),22,132);roundRect(ctx,18,150,w-36,206,8,'#1a231b','#43513f');const code=String(m.code||'').split('\n').slice(0,10);ctx.font='10px monospace';code.forEach((line,i)=>{ctx.fillStyle=i===0?'#b4c09c':i%3===0?'#e5aa77':'#d8dfd2';ctx.fillText(line.slice(0,43),31,176+i*17)})}
    if(scene===4){ctx.fillStyle='#8c9986';ctx.font='10px monospace';ctx.fillText('RECENT COMMIT ACTIVITY',22,107);const a=m.activity||Array(12).fill(0),max=Math.max(1,...a),baseY=333,barW=17,gap=6;ctx.strokeStyle='#52604e';ctx.beginPath();ctx.moveTo(22,baseY);ctx.lineTo(w-22,baseY);ctx.stroke();a.forEach((n,i)=>{const bh=15+(n/max)*112;ctx.fillStyle=i===a.length-1?'#b4c09c':'#718563';roundRect(ctx,24+i*(barW+gap),baseY-bh,barW,bh,3,ctx.fillStyle);});ctx.fillStyle='#e5e9df';ctx.font='bold 22px Arial';ctx.fillText(number(a.reduce((p,c)=>p+c,0)),22,386);ctx.fillStyle='#8c9986';ctx.font='10px monospace';ctx.fillText('LATEST 100 SAMPLE · LAST 12 WEEKS',22,405)}
    if(scene===5){ctx.fillStyle='#b4c09c';ctx.font='10px monospace';ctx.fillText('THE NEXT CHAPTER IS YOURS',22,130);ctx.fillStyle='#e9eee4';ctx.font='bold 29px Arial';ctx.fillText('Take a closer look.',22,189);ctx.fillStyle='#91a088';ctx.font='12px Arial';ctx.fillText('Star it. Fork it. Build on it.',22,217);roundRect(ctx,22,261,w-44,41,4,'#b4c09c');ctx.fillStyle='#192216';ctx.font='bold 12px monospace';ctx.fillText('VIEW ON GITHUB   ↗',34,286);ctx.fillStyle='#a1ac99';ctx.font='10px monospace';ctx.fillText((m.fullName||'github.com').slice(0,34),22,329);ctx.fillStyle='#65735f';ctx.font='9px monospace';ctx.fillText('MADE WITH REPO REEL',22,380)}
    ctx.globalAlpha=1;
    const barY=h-24;ctx.fillStyle='#303b30';ctx.fillRect(22,barY,w-44,2);ctx.fillStyle='#b4c09c';ctx.fillRect(22,barY,(w-44)*s,2);
  }
  function wrapText(ctx,text,x,y,maxW,lineH,maxLines,color,font){ctx.fillStyle=color;ctx.font=font;let line='',count=0;for(const word of String(text||'').split(/\s+/)){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxW&&line){ctx.fillText(line,x,y+count*lineH);line=word;count++;if(count>=maxLines-1)break}else line=test}if(line&&count<maxLines)ctx.fillText(line.slice(0,120),x,y+count*lineH)}
  function drawStatLine(ctx,x,y,w,pct,label){ctx.fillStyle='#3a4639';ctx.fillRect(x,y,w,3);ctx.fillStyle='#b4c09c';ctx.fillRect(x,y,w*clamp(pct,0,1),3);ctx.fillStyle='#8c9986';ctx.font='9px monospace';ctx.fillText(label||'OPEN SOURCE',x,y+23)}
  root.RepoReel={parseReadme,commitHistogram,buildModel,drawFrame,gifBlob,lzw,number};
})(typeof window!=='undefined'?window:globalThis);
