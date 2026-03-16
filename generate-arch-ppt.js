const puppeteer = require('puppeteer');
const pptxgen   = require('pptxgenjs');
const path      = require('path');
const fs        = require('fs');

const BASE  = 'F:/chargo_order';
const HTML  = `file:///${BASE}/AI研发架构图_ppt.html`.replace(/\\/g, '/');
const IMG   = path.join(BASE.replace(/\//g,'\\'), 'arch_screenshot.png');
const OUT   = path.join(BASE.replace(/\//g,'\\'), 'AI研发架构图.pptx');

const C = {
    bg:'050f1e', card:'0b1f38', bdr:'1a3a5c',
    cyan:'00d4ff', blue:'3b82f6', purple:'a855f7',
    green:'10b981', orange:'f97316',
    white:'ffffff', text:'e2e8f0', sub:'94a3b8', dim:'64748b',
};
const FONT = 'Microsoft YaHei';
function tx(s,text,x,y,w,h,o){
    s.addText(text,Object.assign({x,y,w,h,fontFace:FONT,color:C.text},o||{}));
}

async function screenshot() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox','--disable-setuid-sandbox','--font-render-hinting=none'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
    console.log('Loading HTML:', HTML);
    await page.goto(HTML, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500)); // wait for fonts
    await page.screenshot({ path: IMG, type: 'png', clip: {x:0,y:0,width:1600,height:900} });
    await browser.close();
    console.log('Screenshot saved:', IMG);
    return IMG;
}

async function buildPPT(imgPath) {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';

    // ── SLIDE 1: Architecture diagram (full screen image) ──
    const s1 = pptx.addSlide();
    s1.background = { fill: C.bg };
    s1.addImage({ path: imgPath, x: 0, y: 0, w: 10, h: 5.625 });
    // subtle top accent
    s1.addShape(pptx.ShapeType.rect,{x:0,y:0,w:10,h:0.04,fill:C.cyan,line:{type:'none'}});

    // ── SLIDE 2: Key path description ──
    const s2 = pptx.addSlide();
    s2.background = { fill: C.bg };
    s2.addShape(pptx.ShapeType.rect,{x:0,y:0,w:10,h:0.04,fill:C.cyan,line:{type:'none'}});

    tx(s2,'\u5173\u952e\u8def\u5f84\u8bf4\u660e  \u00b7  AI \u8d4b\u80fd\u5168\u94fe\u8def\u7814\u53d1\u6d41\u7a0b',0,0.2,10,0.55,
        {align:'center',fontSize:22,bold:true,color:C.white});
    tx(s2,'\u79fb\u52a8\u50a8\u80fd\u673a\u5668\u4eba\u8fd0\u8425\u4e2d\u5fc3  \u00b7  \u4ece\u9700\u6c42\u5230\u4ea4\u4ed8\u7684\u5b8c\u6574\u72ec\u7acb\u7cfb\u7edf\u7814\u53d1\u8fc7\u7a0b',0,0.75,10,0.4,
        {align:'center',fontSize:14,color:C.sub});

    const steps = [
        [C.sub,   '01 \u8f93\u5165\u5c42',
                  '\u9700\u6c42\u6587\u6863\u300a\u8ba2\u5355\u5206\u6790\u62a5\u8868.docx\u300b+ \u8fd0\u8425\u4e2d\u5fc3\u539f\u578b UI \u622a\u56fe\uff0c\u4e24\u7c7b\u8d44\u4ea7\u5171\u540c\u4f5c\u4e3a AI \u7684\u591a\u6a21\u6001\u8f93\u5165'],
        [C.cyan,  '02-04 \u2605 AI \u5206\u6790 \u00b7 \u67b6\u6784\u751f\u6210 \u00b7 \u5168\u6808\u7814\u53d1',
                  'AI \u8bfb\u53d6\u6587\u6863\u8bed\u4e49\u3001\u8bc6\u522b\u539f\u578b\u5e03\u5c40\uff0c\u81ea\u52a8\u751f\u6210 Vite+React+Tailwind \u524d\u7aef\u5de5\u7a0b\u53ca Spring Boot MVC \u540e\u7aef\u5de5\u7a0b\uff0c\u9a71\u52a8\u5b9e\u73b0 7 \u4e2a\u56fe\u8868\u6a21\u5757\u3001\u5168\u5c40\u5f02\u5e38\u5904\u7406\u3001CloudApiClient \u6284\u8c61\u5c42\u7b49\u5168\u6808\u529f\u80fd'],
        [C.green, '05 \u524d\u540e\u7aef\u63a5\u53e3\u8054\u8c03',
                  'Vite Proxy \u4ee3\u7406\u8f6c\u53d1\uff0c\u7edf\u4e00 Result<T> \u8fd4\u56de\u683c\u5f0f\uff0c\u524d\u7aef Axios \u62e6\u622a\u5668\u81ea\u52a8\u89e3\u5305\u3002\u7ad9\u70b9\u9009\u62e9\u3001\u65f6\u95f4\u7b5b\u9009\u901a\u8fc7 siteId/days \u53c2\u6570\u6ce8\u5165\uff0c\u5b9e\u73b0\u5168\u56fe\u8868\u8054\u52a8\u5237\u65b0'],
        [C.cyan,  '06 \u2605 AI \u5143\u6570\u636e\u63d0\u53d6 \u2192 \u63a5\u53e3\u6587\u6863\u8bbe\u8ba1',
                  'AI \u4ece OrderRecord\u3001RobotRecord \u7b49 DTO \u6a21\u578b\u4e2d\u63d0\u53d6\u5b57\u6bb5\u5b9a\u4e49\u3001\u679a\u4e3e\u5024\u3001\u8ba1\u7b97\u903b\u8f91\uff0c\u81ea\u52a8\u751f\u6210\u4e91\u5e73\u53f0\u63a5\u53e3\u6587\u6863\uff0cGET /api/orders\u3001/api/robots\u3001/api/sites \u5b57\u6bb5\u5982\u5b9e\u6807\u6ce8'],
        [C.orange,'07 \u4e91\u5e73\u53f0\u4f20\u7edf\u5f00\u53d1 + \u8054\u8c03',
                  '\u4e91\u5e73\u53f0\u56e2\u961f\u6309\u63a5\u53e3\u6587\u6863\u5b9e\u73b0\u8ba2\u5355\u7ba1\u7406\u3001\u673a\u5668\u4eba\u8c03\u5ea6\u3001\u7ad9\u70b9\u7ba1\u7406\u4e09\u4e2a\u5b50\u7cfb\u7edf\uff0c\u5c06 application.properties \u4e2d cloud.api.mock \u6539\u4e3a false \u5373\u53ef\u65e0\u7f1d\u5207\u6362\u81f3\u771f\u5b9e\u6570\u636e\u6e90'],
        [C.green, '08 \u7cfb\u7edf\u4ea4\u4ed8',
                  '\u5b8c\u6574\u72ec\u7acb\u8fd0\u8425\u4e2d\u5fc3\u770b\u677f\u7cfb\u7edf\u4e0a\u7ebf\uff0c7 \u4e2a\u56fe\u8868\u6a21\u5757\u3001\u591a\u7ad9\u70b9\u7b5b\u9009\u3001\u5168\u94fe\u8def\u8caf\u901a\uff0cAI \u5168\u7a0b\u5c06\u4f20\u7edf\u7814\u53d1\u6548\u7387\u63d0\u5347 6~10\u500d'],
    ];

    steps.forEach((step, i) => {
        const y = 1.3 + i * 0.65;
        // Color bar
        s2.addShape(pptx.ShapeType.rect,{x:0.35,y,w:0.06,h:0.48,fill:step[0],line:{type:'none'}});
        // Stage label
        tx(s2,step[1],0.52,y,2.8,0.28,{fontSize:12,bold:true,color:step[0],valign:'bottom'});
        // Description
        tx(s2,step[2],0.52,y+0.28,9.1,0.32,{fontSize:11,color:C.sub,valign:'top'});
    });

    // Bottom note
    tx(s2,'\u2605 \u6807\u6ce8\u4e3a AI \u4e3b\u9a71\u52a8\u9636\u6bb5\uff1b\u5176\u4f59\u9636\u6bb5\u4e3a\u4eba\u5de5\u6216\u4e91\u5e73\u53f0\u56e2\u961f\u534f\u540c\u5b8c\u6210',
        0,5.25,10,0.28,{align:'center',fontSize:11,color:C.dim,italic:true});

    await pptx.writeFile({fileName: OUT});
    console.log('PPT saved:', OUT);
}

async function main() {
    const imgPath = await screenshot();
    await buildPPT(imgPath);
    console.log('\nDone! Files created:');
    console.log(' ', IMG);
    console.log(' ', OUT);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
