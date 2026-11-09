importScripts('local-sync-config.js');
let syncTimer, syncJob;
async function syncFeishu() {
  if(!globalThis.GleanSyncConfig) return {configured:false};
  if(syncJob) return syncJob;
  syncJob=(async()=>{
    const previous=(await chrome.storage.local.get('feishuSyncStatus')).feishuSyncStatus || {};
    try {
      const data=await chrome.storage.local.get(null);
      const clientId=data.feishuSyncClientId || crypto.randomUUID();
      if(!data.feishuSyncClientId)await chrome.storage.local.set({feishuSyncClientId:clientId});
      const items=[];
      for(const [key,value] of Object.entries(data)) {
        if(key.startsWith('record:')) items.push({record:value,deleted:false});
        if(key.startsWith('deleted:') && !data['record:'+value.id]) items.push({record:value,deleted:true});
      }
      const response=await fetch('http://127.0.0.1:4174/sync',{
        method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+GleanSyncConfig.key},
        body:JSON.stringify({items,clientId}),signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error('同步助手未连接');
      const result=await response.json();
      const current=await chrome.storage.local.get(null);
      // Changes during this request are not acknowledged by this snapshot.
      const changed=[...new Set([...Object.keys(current),...Object.keys(data)])].some(k=>(k.startsWith('record:')||k.startsWith('deleted:')) && JSON.stringify(current[k])!==JSON.stringify(data[k]));
      if(changed)result.pending=Math.max(1,result.pending||0);
      await chrome.storage.local.set({feishuSyncStatus:{...result,checkedAt:new Date().toISOString()}});
      if(changed)scheduleFeishu();
      return result;
    } catch {
      const result={...previous,configured:true,error:'同步助手未连接，记录已保存在本地。',checkedAt:new Date().toISOString()};
      await chrome.storage.local.set({feishuSyncStatus:result});
      return result;
    }
  })();
  try {return await syncJob;} finally {syncJob=null;}
}
function scheduleFeishu() {
  if(!globalThis.GleanSyncConfig)return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>void syncFeishu(),2500);
}
if (globalThis.chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local' && Object.keys(changes).some(k=>k.startsWith('record:')||k.startsWith('deleted:'))) scheduleFeishu();
  });
}
if (globalThis.chrome?.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='glean-feishu')void syncFeishu();});
}
if(globalThis.GleanSyncConfig && globalThis.chrome?.alarms?.create){
  try { Promise.resolve(chrome.alarms.create('glean-feishu',{periodInMinutes:1})).catch(()=>{}); } catch {}
  scheduleFeishu();
}
chrome.runtime.onMessage.addListener((message,sender,reply)=>{
  if(message.action==='feishuSyncNow') {syncFeishu().then(reply);return true;}
  if(message.action==='feishuSyncStatus') {
    chrome.storage.local.get('feishuSyncStatus').then(data=>reply({...data.feishuSyncStatus,configured:!!globalThis.GleanSyncConfig}));return true;
  }
});
