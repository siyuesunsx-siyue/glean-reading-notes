const {test}=require('node:test');
const assert=require('node:assert/strict');
const G=require('../extension/core.js');
const M=require('../sync/model.cjs');
test('Feishu mapping preserves original data and multiple tags',()=>{
  const record=G.record({quote:'测试原文',thought:'我的想法',tags:['content','business'],url:'https://example.com/read',status:'converted'});
  const f=M.fields({record,deleted:false});
  assert.equal(f['记录ID'],record.id);
  assert.deepEqual(f['标签'],['内容选题','非生业务']);
  assert.equal(f['处理状态'],'已转化');
  assert.deepEqual(JSON.parse(f['同步数据']),G.validateRecord(record));
});
test('delete and undo use the same identity with distinct delivery hashes',()=>{
  const record=G.record({thought:'独立记录'});
  assert.notEqual(M.fingerprint({record,deleted:false}),M.fingerprint({record,deleted:true}));
  assert.equal(M.fields({record,deleted:true})['记录ID'],record.id);
  assert.equal(M.fields({record,deleted:true})['已删除'],true);
  assert.equal(M.fields({record,deleted:false})['已删除'],false);
});
