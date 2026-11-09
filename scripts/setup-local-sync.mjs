import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const local=path.join(root,'.local');
fs.mkdirSync(local,{recursive:true});
const configPath=path.join(local,'feishu-sync.json');
const config=fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath,'utf8')):{
  key:crypto.randomBytes(32).toString('hex'),
  cli:'C:/nvm4w/nodejs/node_modules/@larksuite/cli/bin/lark-cli.exe',
  profile:'非生知识库资料整理',
  baseToken:'AeiqbcBOZaJadDsMv3OcwbUSngd',tableId:'tblguPbOvJXCkZkV',
  url:'https://ucno4b5cca2z.feishu.cn/wiki/NqQjwvm0cipPp8kfS9RcpoyFnPg?table=tblguPbOvJXCkZkV&view=vewcdYCGAs',
  origins:['chrome-extension://nihjbghbgkmfdeagbpaebmjpbhkdglfm']
};
fs.writeFileSync(configPath,JSON.stringify(config,null,2));
const installed=path.join(root,'dist','glean-0.2.1','extension');
if(!fs.existsSync(path.join(installed,'manifest.json')))throw Error('Existing extension directory not found');
for(const name of fs.readdirSync(path.join(root,'extension'))){
  if(name.startsWith('qa-') || name==='local-sync-config.js')continue;
  fs.cpSync(path.join(root,'extension',name),path.join(installed,name),{recursive:true});
}
fs.writeFileSync(path.join(installed,'local-sync-config.js'),'globalThis.GleanSyncConfig = '+JSON.stringify({key:config.key})+';\n');
const startup=path.join(process.env.APPDATA,'Microsoft','Windows','Start Menu','Programs','Startup');
const command='"'+process.execPath+'" "'+path.join(root,'sync','server.cjs')+'"';
const vbs='CreateObject("WScript.Shell").Run "'+command.replaceAll('"','""')+'", 0, False\r\n';
fs.writeFileSync(path.join(local,'start-sync.vbs'),'\ufeff'+vbs,'utf16le');
fs.writeFileSync(path.join(startup,'札记飞书同步.vbs'),'\ufeff'+vbs,'utf16le');
console.log('本机同步助手已配置，已更新原插件目录并设置登录时隐藏启动。');
