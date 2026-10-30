const test=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../src/reel.js');
const R=global.RepoReel;

test('extracts README headings, bullets, code, and a short opening',()=>{
 const r=R.parseReadme('# Demo Project\nA tool for teams.\n\n## Features\n- Fast local builds\n- No account required\n\n```js\nconst x = 1;\n```\n');
 assert.ok(r.features.includes('Fast local builds'));assert.ok(r.features.includes('No account required'));assert.match(r.code,/const x/);assert.match(r.opening,/Demo Project/);
});

test('builds a twelve-week commit histogram from dates',()=>{
 const now=Date.parse('2026-10-30T00:00:00Z');const commits=[{commit:{author:{date:new Date(now-2*86400000).toISOString()}}},{commit:{author:{date:new Date(now-2*86400000).toISOString()}}},{commit:{author:{date:new Date(now-50*86400000).toISOString()}}},{commit:{author:{date:new Date(now-200*86400000).toISOString()}}}];
 const h=R.commitHistogram(commits,12,now);assert.equal(h.length,12);assert.equal(h.reduce((a,b)=>a+b,0),3);assert.ok(h[11]>=2);
});

test('builds a render model from repository and README data',()=>{
 const m=R.buildModel({name:'demo',full_name:'acme/demo',description:'A useful tool',stargazers_count:42,forks_count:3,open_issues_count:1,language:'JavaScript',pushed_at:'2026-10-01',owner:{login:'acme'}},'## What it does\n- Works locally\n```js\nrun()\n```',[ ],{JavaScript:200});
 assert.equal(m.fullName,'acme/demo');assert.equal(m.stars,42);assert.equal(m.language,'JavaScript');assert.ok(m.features.includes('Works locally'));assert.match(m.code,/run/);
});

test('GIF encoder emits a valid GIF89a container signature and trailer',async()=>{
 const frame=new Uint8Array(16*16);for(let i=0;i<frame.length;i++)frame[i]=i%256;const blob=R.gifBlob([frame],16,16,10);const b=new Uint8Array(await blob.arrayBuffer());assert.equal(blob.type,'image/gif');assert.equal(new TextDecoder().decode(b.slice(0,6)),'GIF89a');assert.equal(b.at(-1),0x3b);
});
