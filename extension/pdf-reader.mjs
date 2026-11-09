import {getDocument, GlobalWorkerOptions, TextLayer} from './vendor/pdfjs/pdf.mjs';
GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
const $ = s => document.querySelector(s), message = text => $('#status').textContent = text;
let pdf, bookTitle = '', pageNumber = 1, renderQueue = Promise.resolve();
const source = globalThis.GleanReadingSource;
function render() {
  renderQueue = renderQueue.catch(()=>{}).then(async () => {
    if (!pdf) return;
    const page = await pdf.getPage(pageNumber);
    const available = Math.max(200, document.body.clientWidth - 52);
    const scale = Math.min(Number($('#zoom').value),available / page.getViewport({scale:1}).width);
    const viewport = page.getViewport({scale});
    const box = $('.pdf-page'), canvas = $('canvas'), layer = $('.textLayer');
    layer.replaceChildren(); box.style.width = viewport.width+'px';box.style.height = viewport.height+'px';
    box.style.setProperty('--total-scale-factor',scale);box.style.setProperty('--scale-factor',scale);
    const dpr = devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width*dpr);canvas.height = Math.floor(viewport.height*dpr);
    canvas.style.width = viewport.width+'px';canvas.style.height = viewport.height+'px';
    await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[dpr,0,0,dpr,0,0]}).promise;
    const text = await page.getTextContent();
    await new TextLayer({textContentSource:text,container:layer,viewport}).render();
    $('#page').value = pageNumber;$('#total').textContent = '/ '+pdf.numPages;
    document.title = bookTitle + ' · 第 ' + pageNumber + ' 页 · 札记 PDF';
    $('#prev').disabled = pageNumber<=1;$('#next').disabled = pageNumber>=pdf.numPages;
    message(text.items.some(i=>i.str?.trim()) ? '选中文字即可在右侧记录。' : '这一页没有可选文字，可能是扫描页。暂不支持扫描页文字识别。');
  }).catch(e=>message('PDF 显示失败：'+e.message));
  return renderQueue;
}
async function open(data, name) {
  message('正在读取 PDF…');
  try {
    await renderQueue; if (pdf) await pdf.destroy();
    pdf = await getDocument({data,isEvalSupported:false,useWasm:false,
      wasmUrl:new URL('./vendor/pdfjs/wasm/',import.meta.url).href,
      cMapUrl:new URL('./vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,
      standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href}).promise;
    bookTitle=name;document.title=name+' · 札记 PDF';pageNumber=1;await render();
  } catch(e) { message('无法读取 PDF：'+e.message+'。可尝试下载后使用“打开本地 PDF”。'); }
}
async function loadRemote(requestPermission) {
  if (!source || !/^https?:/i.test(source)) {message('请选择本地 PDF 文件。');return;}
  try {
    const origin = new URL(source).origin+'/*';
    if (globalThis.chrome?.permissions) {
      const allowed = requestPermission
        ? await chrome.permissions.request({origins:[origin]})
        : await chrome.permissions.contains({origins:[origin]});
      if (!allowed) {message('点击“打开此 PDF”允许读取这个网站，或下载后打开本地文件。');return;}
    }
    message('正在下载 PDF…');
    const response = await fetch(source);
    if (!response.ok) throw Error('HTTP '+response.status);
    await open(new Uint8Array(await response.arrayBuffer()),decodeURIComponent(new URL(source).pathname.split('/').pop()));
  } catch(e) {message('未能加载：'+e.message+'。可以下载 PDF 后使用“打开本地 PDF”。');}
}
$('#load').onclick=()=>loadRemote(true);
$('#file').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  const data=await file.arrayBuffer();
  // Bind a local file to its bytes, so two books with the same filename do not mix.
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
  if (!(await globalThis.GleanSetReadingSource('file:///glean-pdf/'+digest+'/'+encodeURIComponent(file.name)))) return;
  await open(new Uint8Array(data),file.name);
};
$('#prev').onclick=()=>{if(pageNumber>1){pageNumber--;render();}};
$('#next').onclick=()=>{if(pdf&&pageNumber<pdf.numPages){pageNumber++;render();}};
$('#page').onchange=()=>{if(pdf){pageNumber=Math.max(1,Math.min(pdf.numPages,Number($('#page').value)||1));render();}};
$('#zoom').onchange=render;
loadRemote(false);
