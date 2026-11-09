const crypto = require('node:crypto');
const G = require('../extension/core.js');
function item(input) {
  const record = G.validateRecord(input.record);
  const deleted = input.deleted === true;
  return {record, deleted};
}
function fingerprint(value) {
  return crypto.createHash('sha256').update(JSON.stringify(item(value))).digest('hex');
}
function fields(input) {
  const {record:r, deleted} = item(input);
  return {'记录ID':r.id, '原文':r.quote, '我的想法':r.thought,
    '标签':G.recordTags(r).map(t=>G.tags[t]), '来源标题':r.title, '来源链接':r.url,
    '上下文':r.context, '原文前缀':r.prefix, '原文后缀':r.suffix,
    '记录时间':r.createdAt, '更新时间':r.updatedAt,
    '处理状态':({unprocessed:'未处理',converted:'已转化',archived:'已归档'}[r.status]||'未处理'), '收藏':r.favorite, '已删除':deleted,
    '同步数据':JSON.stringify(r)};
}
module.exports = {item, fingerprint, fields};
