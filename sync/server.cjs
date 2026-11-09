// Local, single-computer -> Feishu mirror. Uses the user's existing CLI login.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');
const {timingSafeEqual} = require('node:crypto');
const model = require('./model.cjs');
const run = promisify(execFile);
const root = path.resolve(__dirname, '..');
const local = path.join(root, '.local');
const config = JSON.parse(fs.readFileSync(path.join(local, 'feishu-sync.json'), 'utf8'));
const stateFile = path.join(local, 'outbox.json');
let state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile,'utf8')) : {items:{}, delivered:{}, lastSuccess:null, error:null};
state.items=Object.assign(Object.create(null),state.items);
state.delivered=Object.assign(Object.create(null),state.delivered);
let busy = false;
function persist() {
  fs.writeFileSync(stateFile+'.tmp',JSON.stringify(state));
  fs.renameSync(stateFile+'.tmp',stateFile);
}
function pending() {return Object.values(state.items).filter(v=>state.delivered[v.record.id] !== model.fingerprint(v));}
function status() {return {configured:true, pending:pending().length, syncing:busy, lastSuccess:state.lastSuccess, error:state.error, url:config.url, direction:'upload'};}
async function cli(command, args=[]) {
  try {
    const {stdout} = await run(config.cli, ['--profile',config.profile,'base',command,'--base-token',config.baseToken,
      '--table-id',config.tableId,'--as','user',...args],
      {cwd:root,windowsHide:true,timeout:55000,maxBuffer:12*1024*1024,env:{...process.env,LARKSUITE_CLI_NO_UPDATE_NOTIFIER:'1',LARKSUITE_CLI_NO_SKILLS_NOTIFIER:'1'}});
    const result=JSON.parse(stdout);
    if(result.ok!==true) throw Error('飞书请求未成功');
    return result.data;
  } catch(error) {
    let detail;
    try { detail=JSON.parse(error.stderr).error; } catch {}
    const msg = detail?.type==='authorization' ? '飞书授权已失效或权限不足，请重新授权同步助手。' :
      '飞书同步失败，记录仍保存在本地；助手将自动重试。';
    throw Error(msg);
  }
}
async function upload(value) {
  // Query before every create, including retries after uncertain timeouts.
  const matches=await cli('+record-list',['--format','json','--limit','2','--filter-json',JSON.stringify({logic:'and',conditions:[['记录ID','==',value.record.id]]})]);
  const ids=matches.record_id_list || [];
  if(ids.length>1) throw Error('飞书存在重复记录ID，请处理重复项后重试。');
  fs.writeFileSync(path.join(local,'upload-payload.json'),JSON.stringify(model.fields(value)));
  const args=['--json','@.local/upload-payload.json'];
  if(ids[0]) args.push('--record-id',ids[0]);
  await cli('+record-upsert',args);
}
async function drain() {
  if(busy) return;
  busy=true;
  try {
    for(;;) {
      const next=pending()[0];
      if(!next) break;
      const hash=model.fingerprint(next);
      await upload(next);
      state.delivered[next.record.id]=hash;
      state.lastSuccess=new Date().toISOString();
      state.error=null;
      persist();
    }
  } catch(error) {state.error=error.message;persist();}
  finally {busy=false;}
}
function authorized(req) {
  if(req.headers.host !== '127.0.0.1:4174') return false;
  const origin=req.headers.origin;
  if(origin && !config.origins.includes(origin)) return false;
  const actual=Buffer.from(req.headers.authorization || '');
  const expected=Buffer.from('Bearer '+config.key);
  return actual.length===expected.length && timingSafeEqual(actual,expected);
}
http.createServer(async(req,res)=>{
  if(!authorized(req)) {res.writeHead(403);res.end();return;}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  try {
    if(req.method==='GET' && req.url==='/status') {res.end(JSON.stringify(status()));return;}
    if(req.method!=='POST' || req.url!=='/sync') {res.writeHead(404);res.end('{}');return;}
    let bytes=0;const chunks=[];
    for await(const chunk of req) {bytes+=chunk.length;if(bytes>30*1024*1024)throw Error('数据过大，请分批同步');chunks.push(chunk);}
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(!Array.isArray(data.items)||data.items.length>20000||!/^[-a-zA-Z0-9]{1,64}$/.test(data.clientId||''))throw Error('同步数据格式不正确');
    const valid=data.items.map(model.item);
    // Persist a first-contact backup before uploading existing browser records.
    const backups=path.join(local,'backups');
    fs.mkdirSync(backups,{recursive:true});
    const backup=path.join(backups,data.clientId+'.json');
    if(!fs.existsSync(backup) && valid.length) {
      fs.writeFileSync(backup,JSON.stringify({createdAt:new Date().toISOString(),items:valid},null,2));
    }
    for(const value of valid) {
      const old=state.items[value.record.id];
      if(!old || Date.parse(value.record.updatedAt)>=Date.parse(old.record.updatedAt)) state.items[value.record.id]=value;
    }
    persist();
    res.end(JSON.stringify(status()));
    void drain();
  } catch(error) {res.writeHead(400);res.end(JSON.stringify({error:error.message}));}
}).listen(4174,'127.0.0.1',()=>{console.log('札记飞书同步助手已启动：127.0.0.1:4174');void drain();});
setInterval(()=>void drain(),60000);
