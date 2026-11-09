const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
test('ebook chapter engine held outside Vue em is captured without changing reader return values',()=>{
 const events={}, timers=[], messages=[];
 const engine={container:{isConnected:true},menu:{isShow:true},getSelectText:()=> '电子书测试摘录'};
 const reader={initEasymarker:()=>engine,renderEasymarkerNote:()=>42};
 const root={__vue__:reader};
 const window={addEventListener:(n,f)=>events[n]=f,postMessage:m=>messages.push(m)};
 vm.runInNewContext(fs.readFileSync('extension/dedao-selection.js','utf8'),{window,document:{querySelectorAll:s=>s==='*'?[root]:[],body:{}},location:{href:'https://www.dedao.cn/ebook/reader?id=test',origin:'https://www.dedao.cn'},setInterval:()=>{},setTimeout:f=>{timers.push(f);return 1},clearTimeout:()=>{}});
 assert.equal(reader.initEasymarker(),engine);assert.equal(reader.renderEasymarkerNote(engine),42);
 events.pointerup({composedPath:()=>[]});while(timers.length)timers.shift()();
 assert.equal(messages.length,1);assert.equal(messages[0].quote,'电子书测试摘录');
 engine.container.isConnected=false;events.pointerdown({composedPath:()=>[]});events.pointerup({composedPath:()=>[]});while(timers.length)timers.shift()();assert.equal(messages.length,1);
});

test('closing Glean suppresses stale Dedao selection but permits a later selection',()=>{
 let now=1000;
 const events={}, timers=[], messages=[];
 const engine={container:{isConnected:true},menu:{isShow:true},getSelectText:()=> '仍被得到菜单保留的摘录'};
 const root={__vue__:{em:engine}};
 const window={addEventListener:(n,f)=>events[n]=f,postMessage:m=>messages.push(m)};
 vm.runInNewContext(fs.readFileSync('extension/dedao-selection.js','utf8'),{
  window,
  document:{querySelectorAll:s=>s==='*'?[root]:[],body:{}},
  location:{href:'https://www.dedao.cn/ebook/reader?id=test',origin:'https://www.dedao.cn'},
  Date:{now:()=>now},
  setInterval:()=>{},
  setTimeout:f=>{timers.push(f);return 1},
  clearTimeout:()=>{},
 });
 events.message({source:window,origin:'https://www.dedao.cn',data:{channel:'glean-dedao-control',action:'suppress-selection'}});
 events.pointerup({composedPath:()=>[]});
 while(timers.length)timers.shift()();
 assert.equal(messages.length,0);

 now=2000;
 events.pointerdown({composedPath:()=>[]});
 events.pointerup({composedPath:()=>[]});
 while(timers.length)timers.shift()();
 assert.equal(messages.length,1);
 assert.equal(messages[0].quote,'仍被得到菜单保留的摘录');
});
