/* eslint-disable */
const pptxgen = require('pptxgenjs');
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9'; // 10" x 5.625"

const C = {
    bg:'050f1e', card:'0b1f38', border:'1a3a5c',
    cyan:'00d4ff', blue:'3b82f6', purple:'a855f7',
    green:'10b981', orange:'f97316', red:'ef4444',
    white:'ffffff', text:'e2e8f0', sub:'94a3b8', dim:'64748b',
    cyanFill:'062830', blueFill:'0c1e3a', purpleFill:'180d2c',
    greenFill:'061e14', orangeFill:'281404', redFill:'280808',
    cyanBdr:'007090', blueBdr:'1e3d78', purpleBdr:'4a2868',
    greenBdr:'0a5030', orangeBdr:'6a2c04', redBdr:'6a1010',
};
const FONT = 'Microsoft YaHei';

function ns() {
    const s = pptx.addSlide();
    s.background = { fill: C.bg };
    s.addShape(pptx.ShapeType.rect, { x:0,y:0,w:10,h:0.05,fill:C.cyan,line:{type:'none'} });
    return s;
}
function hdr(s, num, title) {
    s.addShape(pptx.ShapeType.ellipse, {x:0.35,y:0.25,w:0.5,h:0.5,fill:C.blue,line:{type:'none'}});
    s.addText(num,   {x:0.35,y:0.25,w:0.5, h:0.5,  align:'center',valign:'middle',fontSize:15,bold:true,color:C.white,fontFace:FONT});
    s.addText(title, {x:0.95,y:0.25,w:8.7, h:0.5,  valign:'middle',fontSize:26,bold:true,color:C.white,fontFace:FONT});
    s.addShape(pptx.ShapeType.rect, {x:0.35,y:0.85,w:9.3,h:0.02,fill:C.border,line:{type:'none'}});
}
function box(s,x,y,w,h,bdr) {
    s.addShape(pptx.ShapeType.rect,{x,y,w,h,fill:C.card,line:{type:'solid',color:bdr||C.border,width:1}});
}
function abox(s,x,y,w,h,acc) {
    const f={[C.cyan]:C.cyanFill,[C.blue]:C.blueFill,[C.purple]:C.purpleFill,
             [C.green]:C.greenFill,[C.orange]:C.orangeFill,[C.red]:C.redFill}[acc]||C.card;
    const b={[C.cyan]:C.cyanBdr, [C.blue]:C.blueBdr, [C.purple]:C.purpleBdr,
             [C.green]:C.greenBdr,[C.orange]:C.orangeBdr,[C.red]:C.redBdr}[acc]||C.border;
    s.addShape(pptx.ShapeType.rect,{x,y,w,h,fill:f,line:{type:'solid',color:b,width:1}});
}
function tx(s,text,x,y,w,h,o) {
    s.addText(text,Object.assign({x,y,w,h,fontFace:FONT,color:C.text},o||{}));
}

// ---------------------------------------------------------------
// SLIDE 1 : Cover
// ---------------------------------------------------------------
const s1 = pptx.addSlide();
s1.background = {fill:C.bg};
s1.addShape(pptx.ShapeType.rect,{x:0,y:0,w:10,h:0.07,fill:C.cyan,line:{type:'none'}});
tx(s1,'AI CODING  \u00B7  \u5f00\u53d1\u5b9e\u8df5\u6c47\u62a5  \u00B7  2026',0,1.0,10,0.5,{align:'center',fontSize:16,color:C.cyan,charSpacing:3});
tx(s1,'\u501f\u52a9 AI Coding \u5de5\u5177\n\u6784\u5efa\u5168\u6808\u4e1a\u52a1\u7cfb\u7edf',1,1.7,8,1.7,{align:'center',fontSize:42,bold:true,color:C.white,lineSpacingMultiple:1.3});
tx(s1,'\u79fb\u52a8\u50a8\u80fd\u673a\u5668\u4eba\u8fd0\u8425\u4e2d\u5fc3  \u00B7  \u5f00\u53d1\u5168\u94fe\u8def\u590d\u76d8',0,3.6,10,0.5,{align:'center',fontSize:19,color:C.sub});
[['\u5de5\u5177','Cursor + Claude'],['\u6280\u672f\u6808','Spring Boot + React'],['\u4ea4\u4ed8\u5468\u671f','\u6781\u77ed\u9ad8\u8d28\u91cf']].forEach((m,i)=>{
    const mx=1.5+i*2.55;
    s1.addShape(pptx.ShapeType.rect,{x:mx,y:4.3,w:2.3,h:0.65,fill:C.card,line:{type:'solid',color:C.border,width:1}});
    tx(s1,m[0]+'\uff1a'+m[1],mx,4.3,2.3,0.65,{align:'center',valign:'middle',fontSize:13,color:C.sub});
});

// ---------------------------------------------------------------
// SLIDE 2 : Background
// ---------------------------------------------------------------
const s2=ns(); hdr(s2,'01','\u80cc\u666f\u4e0e\u6311\u6218');
abox(s2,0.35,1.0,4.5,2.05,C.cyan);
tx(s2,'[ \u4e1a\u52a1\u80cc\u666f ]',0.55,1.08,4.1,0.42,{fontSize:15,bold:true,color:C.cyan});
tx(s2,'\u00b7  \u79fb\u52a8\u50a8\u80fd\u673a\u5668\u4eba\u591a\u7ad9\u70b9\u8fd0\u8425\u7ba1\u7406\n\u00b7  \u9700\u5b9e\u65f6\u6398\u63e1\u5b8c\u6210\u7387\u3001\u5145\u7535\u6548\u7387\u3001\u8bbe\u5907\u72b6\u6001\n\u00b7  \u4ea4\u4ed8\u542b 7 \u4e2a\u56fe\u8868\u6a21\u5757\u7684\u8fd0\u8425\u4e2d\u5fc3\u770b\u677f',0.6,1.58,4.1,1.35,{fontSize:13,color:C.text,lineSpacingMultiple:1.6});

abox(s2,0.35,3.18,4.5,2.1,C.orange);
tx(s2,'[ \u4f20\u7edf\u5f00\u53d1\u75db\u70b9 ]',0.55,3.27,4.1,0.42,{fontSize:15,bold:true,color:C.orange});
tx(s2,'\u2717  \u5168\u6808\u5f00\u53d1\u9700\u591a\u4eba\u534f\u4f5c\uff0c\u6c9f\u901a\u6210\u672c\u9ad8\n\u2717  \u4ece\u539f\u578b\u5230\u4ee3\u7801\u8fd8\u539f\u6548\u7387\u4f4e\n\u2717  \u67b6\u6784\u8bbe\u8ba1\u4e0e\u4ee3\u7801\u8d28\u91cf\u96be\u4ee5\u517c\u987e\n\u2717  \u524d\u540e\u7aef\u63a5\u53e3\u8054\u8c03\u8017\u65f6\u957f',0.6,3.76,4.1,1.4,{fontSize:13,color:C.sub,lineSpacingMultiple:1.5});

abox(s2,5.15,1.0,4.5,2.3,C.blue);
tx(s2,'[ \u4ea4\u4ed8\u76ee\u6807 ]',5.35,1.08,4.1,0.42,{fontSize:15,bold:true,color:C.blue});
tx(s2,'\u00b7  \u524d\u7aef Dashboard\uff08React + ECharts \u6df1\u8272\u79d1\u6280\u98ce\uff09\n\u00b7  \u540e\u7aef API \u670d\u52a1\uff08Spring Boot MVC \u6807\u51c6\u5206\u5c42\uff09\n\u00b7  \u7ad9\u70b9 + \u65f6\u95f4\u53cc\u7ef4\u5ea6\u7b5b\u9009\uff0c\u5b9e\u65f6\u8054\u52a8\u5237\u65b0',5.4,1.58,4.1,1.5,{fontSize:13,color:C.text,lineSpacingMultiple:1.6});

abox(s2,5.15,3.43,4.5,1.85,C.green);
tx(s2,'[ AI Coding \u89e3\u6cd5 ]',5.35,3.52,4.1,0.42,{fontSize:15,bold:true,color:C.green});
tx(s2,'\u501f\u52a9 Cursor IDE + Claude \u5927\u6a21\u578b\uff0c\u5c06\u539f\u578b\u63cf\u8ff0\u2192\u9700\u6c42\u5206\u6790\u2192\u4ee3\u7801\u5b9e\u73b0\u2192\u95ee\u9898\u4fee\u590d\u5168\u94fe\u8def\u538b\u7f29\uff0c\u5355\u4eba\u5373\u53ef\u9ad8\u8d28\u91cf\u4ea4\u4ed8\u5b8c\u6574\u5168\u6808\u7cfb\u7edf\u3002',5.4,4.02,4.1,1.15,{fontSize:13,color:C.text,lineSpacingMultiple:1.5});

// ---------------------------------------------------------------
// SLIDE 3 : Cursor
// ---------------------------------------------------------------
const s3=ns(); hdr(s3,'02','AI Coding \u5de5\u5177\uff1aCursor');
box(s3,0.35,1.0,4.45,4.35);
tx(s3,'Cursor IDE  \u6838\u5fc3\u80fd\u529b',0.55,1.1,4.0,0.42,{fontSize:15,bold:true,color:C.cyan});
[
    [C.cyan,  'Agent \u6a21\u5f0f',  '\u7406\u89e3\u5168\u5c40\u4e0a\u4e0b\u6587\uff0c\u81ea\u4e3b\u5b8c\u6210\u591a\u6587\u4ef6\u7f16\u8f91\u4e0e\u9879\u76ee\u6784\u5efa'],
    [C.blue,  '\u591a\u6a21\u6001\u8f93\u5165','\u652f\u6301\u56fe\u7247\u3001\u6587\u6863\u76f4\u63a5\u8f93\u5165\uff0c\u5b9e\u73b0\u539f\u578b\u56fe\u2192\u4ee3\u7801\u7684\u76f4\u63a5\u8f6c\u6362'],
    [C.purple,'\u4ee3\u7801\u5e93\u611f\u77e5','\u81ea\u52a8\u7406\u89e3\u73b0\u6709\u7ed3\u6784\uff0c\u4fdd\u6301\u98ce\u683c\u4e00\u81f4\u6027\uff0c\u589e\u91cf\u6539\u9020\u65e0\u51b2\u7a81'],
    [C.green, '\u7ec8\u7aef\u96c6\u6210',  '\u76f4\u63a5\u6267\u884c\u6784\u5efa/\u542f\u52a8/\u8c03\u8bd5\u547d\u4ee4\uff0c\u5f62\u6210\u5b8c\u6574\u5f00\u53d1\u95ed\u73af'],
].forEach(([color,title,desc],i)=>{
    const y=1.68+i*0.9;
    tx(s3,'>> '+title,0.55,y,4.0,0.38,{fontSize:14,bold:true,color});
    tx(s3,desc, 0.75,y+0.38,3.8,0.42,{fontSize:12,color:C.sub});
});
[
    [C.cyan,  '\u539f\u578b\u56fe\u8bc6\u522b','\u622a\u56fe -> UI\u4ee3\u7801'],
    [C.blue,  '\u67b6\u6784\u751f\u6210',  '\u63cf\u8ff0 -> MVC\u9aa8\u67b6'],
    [C.purple,'\u95ee\u9898\u8bca\u65ad',  '\u622a\u56fe\u62a5\u9519 -> \u4fee\u590d'],
    [C.green, '\u8fed\u4ee3\u91cd\u6784',  '\u9700\u6c42\u53d8\u66f4 -> \u65e0\u7f1d\u6269\u5c55'],
].forEach(([color,title,desc],i)=>{
    const x=5.1+(i%2)*2.38, y=1.0+Math.floor(i/2)*1.6;
    abox(s3,x,y,2.25,1.45,color);
    tx(s3,title,x,y+0.22,2.25,0.38,{align:'center',fontSize:13,bold:true,color:C.white});
    tx(s3,desc, x,y+0.68,2.25,0.38,{align:'center',fontSize:11,color:C.sub});
});
abox(s3,5.1,4.28,4.63,1.07,C.cyan);
tx(s3,'>> \u6838\u5fc3\u4ea4\u4e92\u6a21\u5f0f',5.3,4.38,4.3,0.38,{fontSize:13,bold:true,color:C.cyan});
tx(s3,'\u81ea\u7136\u8bed\u8a00\u9700\u6c42 -> \u4ee3\u7801\u751f\u6210   |   \u622a\u56fe\u53cd\u9988 -> \u7cbe\u51c6\u4fee\u6539   |   \u53c2\u8003\u4ee3\u7801 -> \u89c4\u8303\u8fc1\u79fb',5.3,4.82,4.3,0.45,{fontSize:12,color:C.sub});

// ---------------------------------------------------------------
// SLIDE 4 : Workflow
// ---------------------------------------------------------------
const s4=ns(); hdr(s4,'03','\u5f00\u53d1\u5168\u94fe\u8def');
const sc=[C.cyan,C.blue,C.purple,C.green,C.orange];
const sd=[
    ['\u9700\u6c42\u5206\u6790','\u4e0a\u4f20\u6587\u6863\n\u539f\u578b\u622a\u56fe'],
    ['\u5de5\u7a0b\u641e\u5efa','AI\u751f\u6210\n\u9879\u76ee\u7ed3\u6784'],
    ['\u529f\u80fd\u5f00\u53d1','AI\u9a71\u52a8\n\u524d\u540e\u7aef\u7f16\u7801'],
    ['\u63a5\u53e3\u8054\u8c03','\u524d\u540e\u7aef\n\u5bf9\u63a5\u9002\u914d'],
    ['\u8fed\u4ee3\u4f18\u5316','\u622a\u56fe\u53cd\u9988\n\u7cbe\u51c6\u4fee\u590d'],
];
let bx=0.35; const bw=1.55,bh=1.65,gap=0.38;
sd.forEach(([title,desc],i)=>{
    abox(s4,bx,1.05,bw,bh,sc[i]);
    tx(s4,title,bx,1.25,bw,0.38,{align:'center',fontSize:13,bold:true,color:C.white});
    tx(s4,desc, bx,1.72,bw,0.6, {align:'center',fontSize:11,color:C.sub,lineSpacingMultiple:1.3});
    if(i<4) tx(s4,'->',bx+bw,1.55,gap,0.45,{align:'center',fontSize:20,color:C.cyan});
    bx+=bw+gap;
});
[
    [C.cyan,  '\u9636\u6bb51','\u9700\u6c42 -> \u5de5\u7a0b',
        ['\u4e0a\u4f20\u9700\u6c42\u6587\u6863 + \u539f\u578b\u622a\u56fe','AI \u751f\u6210\u524d\u7aef Vite+React+Tailwind \u5de5\u7a0b','AI \u751f\u6210 Spring Boot Maven \u9aa8\u67b6']],
    [C.blue,  '\u9636\u6bb52','\u529f\u80fd\u5b9e\u73b0',
        ['7 \u4e2a ECharts \u56fe\u8868\u7ec4\u4ef6\u9010\u4e00\u751f\u6210','\u540e\u7aef MVC \u4e09\u5c42\u67b6\u6784\u4ee3\u7801\u751f\u6210','CloudApiClient \u6284\u8c61\u5c42 + Mock \u6570\u636e']],
    [C.purple,'\u9636\u6bb53','\u8c03\u4f18\u6536\u5c3e',
        ['\u70ed\u529b\u56fe\u6e32\u67d3 Bug \u7cbe\u51c6\u4fee\u590d','\u7ad9\u70b9/\u65f6\u95f4\u7b5b\u9009\u5168\u94fe\u8def\u8caf\u901a','Axios \u62e6\u622a + \u5168\u5c40\u5f02\u5e38\u5144\u5e95']],
].forEach(([color,tag,title,items],i)=>{
    const px=0.35+i*3.22;
    abox(s4,px,2.88,3.05,2.5,color);
    s4.addShape(pptx.ShapeType.rect,{x:px+0.18,y:2.97,w:0.72,h:0.3,fill:color,line:{type:'none'}});
    tx(s4,tag,  px+0.18,2.97,0.72,0.3,{align:'center',valign:'middle',fontSize:11,bold:true,color:C.bg});
    tx(s4,title,px+1.02,2.97,1.85,0.3,{valign:'middle',fontSize:14,bold:true,color:C.white});
    items.forEach((item,j)=>{
        tx(s4,'* '+item,px+0.2,3.38+j*0.58,2.7,0.48,{fontSize:12,color:C.sub,lineSpacingMultiple:1.3});
    });
});

// ---------------------------------------------------------------
// SLIDE 5 : Architecture
// ---------------------------------------------------------------
const s5=ns(); hdr(s5,'04','\u7cfb\u7edf\u67b6\u6784');
box(s5,0.35,1.0,4.5,4.35);
tx(s5,'\u524d\u7aef  \u00b7  React SPA',0.35,1.0,4.5,0.45,{align:'center',valign:'middle',fontSize:16,bold:true,color:C.cyan});
[
    [C.cyan,  '\u89c6\u56fe\u5c42',['Dashboard','StatCard','ChartCard']],
    [C.blue,  '\u56fe\u8868\u5c42',['\u5b8c\u5355\u7387','\u70ed\u529b\u56fe','\u5806\u53e0\u6761','\u53d6\u6d88\u5206\u6790','\u9891\u6b21\u56fe']],
    [C.purple,'\u670d\u52a1\u5c42',['api.js','Axios\u62e6\u622a\u5668','Result\u89e3\u5305']],
].forEach(([color,name,items],i)=>{
    const ly=1.6+i*1.18;
    const fills={[C.cyan]:C.cyanFill,[C.blue]:C.blueFill,[C.purple]:C.purpleFill};
    const bdrs ={[C.cyan]:C.cyanBdr, [C.blue]:C.blueBdr, [C.purple]:C.purpleBdr};
    s5.addShape(pptx.ShapeType.rect,{x:0.55,y:ly,w:4.1,h:1.0,fill:fills[color],line:{type:'solid',color:bdrs[color],width:1}});
    tx(s5,name,           0.65,ly+0.08,0.95,0.38,{fontSize:12,bold:true,color,valign:'middle'});
    tx(s5,items.join(' / '),1.68,ly+0.08,2.9, 0.38,{fontSize:12,color:C.sub,valign:'middle'});
    if(i<2) tx(s5,'^',0.35,ly+1.02,4.5,0.18,{align:'center',fontSize:14,color:C.dim});
});
tx(s5,'Vite Proxy  ->  localhost:8080',0.35,5.05,4.5,0.28,{align:'center',fontSize:11,color:C.dim});

box(s5,5.15,1.0,4.5,4.35);
tx(s5,'\u540e\u7aef  \u00b7  Spring Boot 3',5.15,1.0,4.5,0.45,{align:'center',valign:'middle',fontSize:16,bold:true,color:C.blue});
[
    [C.cyan,  'Controller',['DashboardController','Result<T>','\u5168\u5c40\u5f02\u5e38\u5904\u7406']],
    [C.blue,  'Service',   ['DashboardService','siteId/days\u7b5b\u9009','\u805a\u5408\u8ba1\u7b97']],
    [C.purple,'Client',    ['CloudApiClient(\u63a5\u53e3)','MockImpl','HttpImpl']],
    [C.green, 'DTO',       ['OrderRecord','RobotRecord','SiteInfo']],
].forEach(([color,name,items],i)=>{
    const ly=1.6+i*0.91;
    const fills={[C.cyan]:C.cyanFill,[C.blue]:C.blueFill,[C.purple]:C.purpleFill,[C.green]:C.greenFill};
    const bdrs ={[C.cyan]:C.cyanBdr, [C.blue]:C.blueBdr, [C.purple]:C.purpleBdr, [C.green]:C.greenBdr};
    s5.addShape(pptx.ShapeType.rect,{x:5.35,y:ly,w:4.1,h:0.78,fill:fills[color],line:{type:'solid',color:bdrs[color],width:1}});
    tx(s5,name,           5.45,ly+0.06,1.1,0.38, {fontSize:12,bold:true,color,valign:'middle'});
    tx(s5,items.join(' / '),6.65,ly+0.06,2.75,0.38,{fontSize:11,color:C.sub,valign:'middle'});
    if(i<3) tx(s5,'^',5.15,ly+0.82,4.5,0.1,{align:'center',fontSize:13,color:C.dim});
});

// ---------------------------------------------------------------
// SLIDE 6 : Frontend highlights
// ---------------------------------------------------------------
const s6=ns(); hdr(s6,'05','\u524d\u7aef\u5f00\u53d1\u4eae\u70b9');
[
    [C.cyan,  '[ \u539f\u578b\u56fe -> \u9ad8\u4fdd\u771f\u8fd8\u539f ]',
              '\u76f4\u63a5\u5c06\u539f\u578b\u622a\u56fe\u4f5c\u4e3a\u8f93\u5165\uff0cAI \u8bc6\u522b\u5e03\u5c40\u7ed3\u6784\u3001\u989c\u8272\u89c4\u8303\u548c\u56fe\u8868\u7c7b\u578b\uff0c\u751f\u6210\u9ad8\u5ea6\u8fd8\u539f\u7684 Tailwind CSS \u4ee3\u7801\uff0c\u65e0\u9700\u624b\u5de5\u91cf\u53d6\u50cf\u7d20\u3002'],
    [C.orange,'[ \u70ed\u529b\u56fe\u53cc\u5c42\u6e32\u67d3\u65b9\u6848 ]',
              '\u5e95\u5c42\u6e32\u67d3\u8272\u5757 + CSS filter:blur(20px) \u5236\u9020\u70ed\u50cf\u5149\u6653\uff0c\u4e0a\u5c42\u53e0\u52a0\u5750\u6807\u8f74\u4e0e\u7f51\u683c\u4fdd\u6301\u6e05\u6670\uff0c\u540c\u65f6\u7528 appendToBody \u89e3\u51b3 Tooltip \u88ab\u6a21\u7cca\u7684 Bug\u3002'],
    [C.blue,  '[ \u6570\u636e\u9a71\u52a8 & \u7b5b\u9009\u8054\u52a8 ]',
              '\u56fe\u8868\u9009\u9879\u7531 buildXxxOption(data) \u751f\u6210\uff0c\u6570\u636e\u4e0e\u914d\u7f6e\u5b8c\u5168\u89e3\u8026\u3002useEffect \u76d1\u542c siteId/days \u72b6\u6001\uff0c\u5207\u6362\u65f6\u81ea\u52a8\u5e76\u53d1\u8bf7\u6c42\u6240\u6709\u63a5\u53e3\u3002'],
    [C.purple,'[ Axios \u7edf\u4e00\u62e6\u622a\u89e3\u5305 ]',
              '\u54cd\u5e94\u62e6\u622a\u5668\u7edf\u4e00\u89e3\u5305 Result<T>\uff0c\u4e1a\u52a1\u7ec4\u4ef6\u53ea\u5173\u5fc3 data\u3002\u9519\u8bef\u65f6\u81ea\u52a8 reject\uff0c\u524d\u7aef API \u8c03\u7528\u4ee3\u7801\u6781\u7b80\u6e05\u6670\u3002'],
].forEach(([color,title,desc],i)=>{
    const x=0.35+(i%2)*4.82, y=1.05+Math.floor(i/2)*2.25;
    abox(s6,x,y,4.5,2.15,color);
    tx(s6,title,x+0.2,y+0.12,4.1,0.42,{fontSize:14,bold:true,color});
    tx(s6,desc, x+0.2,y+0.62,4.1,1.35,{fontSize:13,color:C.sub,lineSpacingMultiple:1.5});
});

// ---------------------------------------------------------------
// SLIDE 7 : Backend highlights
// ---------------------------------------------------------------
const s7=ns(); hdr(s7,'06','\u540e\u7aef\u5f00\u53d1\u4eae\u70b9');
abox(s7,0.35,1.0,4.5,2.3,C.blue);
tx(s7,'[ \u6807\u51c6 MVC \u4e09\u5c42\u5206\u5c42 ]',0.55,1.1,4.1,0.42,{fontSize:15,bold:true,color:C.cyan});
tx(s7,'Controller \u53ea\u505a\u8def\u7531\u5206\u53d1\uff0c\u65e0\u4efb\u4f55\u4e1a\u52a1\u4ee3\u7801\uff1bService \u5c42\u805a\u5408\u8ba1\u7b97\uff0c\u5c4f\u853d\u6570\u636e\u6765\u6e90\uff1bCloudApiClient \u5c01\u88c5\u5916\u90e8\u8c03\u7528\uff0c\u652f\u6301 Mock/HTTP \u4e00\u952e\u5207\u6362\u3002',0.6,1.6,4.1,1.55,{fontSize:13,color:C.text,lineSpacingMultiple:1.5});

abox(s7,0.35,3.45,4.5,1.85,C.green);
tx(s7,'[ \u7edf\u4e00 Result<T> \u8fd4\u56de\u7ed3\u6784 ]',0.55,3.55,4.1,0.42,{fontSize:15,bold:true,color:C.green});
tx(s7,'code  |  success  |  msg  |  msgDetail  |  data<T>  |  timestamp',0.6,4.05,4.1,0.38,{fontSize:12,color:C.cyan,bold:true});
tx(s7,'\u5168\u5c40\u5f02\u5e38\u5904\u7406\u5668\u5144\u5e95\uff0c\u63a5\u53e3\u89c4\u8303\u5316\uff0c\u524d\u7aef Axios \u62e6\u622a\u5668\u7edf\u4e00\u89e3\u5305\u3002',0.6,4.5,4.1,0.65,{fontSize:13,color:C.text,lineSpacingMultiple:1.4});

abox(s7,5.15,1.0,4.5,1.85,C.purple);
tx(s7,'[ CloudApiClient \u63a5\u53e3\u6284\u8c61 ]',5.35,1.1,4.1,0.42,{fontSize:15,bold:true,color:C.purple});
tx(s7,'\u5b9a\u4e49 CloudApiClient \u63a5\u53e3\uff0c\u901a\u8fc7 @ConditionalOnProperty \u6ce8\u89e3\u63a7\u5236\u6ce8\u5165 MockCloudApiClient\uff08\u9ed8\u8ba4\uff09\u6216 CloudApiClientImpl\uff08HTTP\uff09\uff0c\u5207\u6362\u53ea\u9700\u4fee\u6539\u914d\u7f6e\u6587\u4ef6\u4e00\u884c\u3002',5.4,1.6,4.1,1.1,{fontSize:13,color:C.text,lineSpacingMultiple:1.5});

abox(s7,5.15,3.0,4.5,2.3,C.orange);
tx(s7,'[ \u9ad8\u4eff\u771f Mock \u6570\u636e ]',5.35,3.1,4.1,0.42,{fontSize:15,bold:true,color:C.orange});
tx(s7,'3 \u7ad9\u70b9 x 30 \u5929 x ~180 \u5355/\u5929  ~  16,200 \u6761\u539f\u59cb\u8ba2\u5355',5.4,3.6,4.1,0.38,{fontSize:13,color:C.cyan,bold:true});
tx(s7,'\u65f6\u95f4\u5206\u5e03\u9075\u5faa\u53cc\u9ad8\u65af\u5cf0\uff08\u65e9\u9ad8\u5cf0 8:30 / \u665a\u9ad8\u5cf0 16:00\uff09\uff0c\u7528\u6237\u5fe0\u8bda\u5ea6\u7b26\u5408 Zipf \u5206\u5e03\uff0c\u5404\u7ad9\u70b9\u6309 40%/35%/25% \u6743\u91cd\u5206\u914d\u3002',5.4,4.05,4.1,1.1,{fontSize:12,color:C.text,lineSpacingMultiple:1.5});

// ---------------------------------------------------------------
// SLIDE 8 : Cases
// ---------------------------------------------------------------
const s8=ns(); hdr(s8,'07','AI \u534f\u4f5c\u5178\u578b\u6848\u4f8b');
[
    [C.cyan,  '\u539f\u578b\u56fe\u5bf9\u7167\u5f00\u53d1',  '\u4e0a\u4f20\u539f\u578b\u622a\u56fe',             'AI \u8bc6\u522b\u7f3a\u5931\u56fe\u8868\uff0c\u8865\u5168\u5168\u90e8\u903b\u8f91\uff0c\u4e00\u6b21\u5bf9\u8bdd\u4ea4\u4ed8 6 \u4e2a\u56fe\u8868\u7ec4\u4ef6'],
    [C.red,   'Tooltip Bug \u4fee\u590d','\u201c\u70ed\u529b\u56fe\u60ac\u6d6e\u6587\u5b57\u6ca1\u4e86\u201d',   'AI \u5b9a\u4f4d filter:blur \u5185 Tooltip \u88ab\u6a21\u7cca\uff0c\u4e00\u884c\u53c2\u6570\u4fee\u590d'],
    [C.green, 'MVC \u67b6\u6784\u91cd\u6784',   '\u201cController \u4e0d\u5199\u4e1a\u52a1\u4ee3\u7801\u201d', 'AI \u65b0\u5efa service \u5305\uff0c\u6b63\u786e\u62c6\u5206\u903b\u8f91\uff0c\u63a5\u53e3\u5951\u7ea6\u4e0d\u53d8'],
    [C.purple,'\u53c2\u8003\u4ee3\u7801\u8fc1\u79fb',  '@BocloudResult @CatlCloudResult',  '\u878d\u5408\u4e24\u8005\u4f18\u70b9\uff0c\u8bbe\u8ba1\u542b 6 \u5b57\u6bb5\u7684 Result<T>\uff0c\u65b0\u589e\u5168\u5c40\u5f02\u5e38\u5904\u7406\u5668'],
    [C.orange,'\u7b5b\u9009\u5168\u94fe\u8def\u8caf\u901a','\u201c\u7ad9\u70b9/\u65f6\u95f4\u672a\u5bf9\u63a5\u63a5\u53e3\u201d', '\u516d\u5c42\u4ee3\u7801\u540c\u6b65\u4fee\u6539\uff1aDTO->Client->Service->Controller->api.js->App.jsx'],
    [C.blue,  '\u89c6\u89c9\u8fed\u4ee3\u8c03\u4f18',  '\u201c\u70ed\u529b\u56fe\u4e0e\u539f\u578b\u5dee\u8ddd\u5927\u201d',  'AI \u7406\u89e3\u70ed\u6210\u50cf\u8272\u5f69\u79d1\u5b66\uff0c\u591a\u8f6e\u8c03\u6574\u989c\u8272\u68af\u5ea6\u4e0e\u6a21\u7cca\u534a\u5f84\uff0c\u6700\u7ec8\u8fd8\u539f\u539f\u578b'],
].forEach(([color,title,input,output],i)=>{
    const x=0.35+(i%3)*3.25, y=1.05+Math.floor(i/3)*2.3;
    abox(s8,x,y,3.05,2.18,color);
    tx(s8,title,         x+0.15,y+0.1, 2.75,0.38,{fontSize:13,bold:true,color});
    tx(s8,'\u8f93\u5165: '+input,  x+0.15,y+0.57,2.75,0.35,{fontSize:11,color:C.sub,italic:true});
    s8.addShape(pptx.ShapeType.rect,{x:x+0.15,y:y+0.97,w:2.75,h:0.02,fill:C.border,line:{type:'none'}});
    tx(s8,'\u8f93\u51fa: '+output, x+0.15,y+1.07,2.75,0.98,{fontSize:11,color:C.text,lineSpacingMultiple:1.45});
});

// ---------------------------------------------------------------
// SLIDE 9 : Results
// ---------------------------------------------------------------
const s9=ns(); hdr(s9,'08','\u4ea4\u4ed8\u6210\u679c\u4e0e\u63d0\u6548\u5bf9\u6bd4');
[[C.cyan,'7 \u4e2a','\u56fe\u8868\u6a21\u5757'],[C.blue,'8 \u4e2a','REST \u63a5\u53e3'],
 [C.purple,'3 \u5c42','\u6807\u51c6\u5206\u5c42'],[C.green,'16K','\u4eff\u771f\u6570\u636e']].forEach(([color,num,label],i)=>{
    const mx=0.35+i*2.38;
    abox(s9,mx,1.05,2.2,1.45,color);
    tx(s9,num,  mx,1.12,2.2,0.72,{align:'center',fontSize:34,bold:true,color});
    tx(s9,label,mx,1.88,2.2,0.52,{align:'center',fontSize:14,bold:true,color:C.text});
});
const tbl=[
    [
        {text:'\u80fd\u529b\u7ef4\u5ea6',options:{bold:true,color:C.white,fill:'0f2d4a',fontFace:FONT,fontSize:13,align:'center',valign:'middle'}},
        {text:'\u4f20\u7edf\u65b9\u5f0f',options:{bold:true,color:C.white,fill:'0f2d4a',fontFace:FONT,fontSize:13,align:'center',valign:'middle'}},
        {text:'AI Coding',options:{bold:true,color:C.cyan,fill:'0f2d4a',fontFace:FONT,fontSize:13,align:'center',valign:'middle'}},
        {text:'\u63d0\u5347\u5e45\u5ea6',options:{bold:true,color:C.white,fill:'0f2d4a',fontFace:FONT,fontSize:13,align:'center',valign:'middle'}},
    ],
    ['\u5de5\u7a0b\u641e\u5efa\uff08\u6784\u5efa\u914d\u7f6e+\u76ee\u5f55\uff09','2~4 \u5c0f\u65f6','\u7ea6 10 \u5206\u949f','\u2191 10x+'],
    ['\u56fe\u8868\u7ec4\u4ef6\u5f00\u53d1\uff087 \u4e2a\uff09','1~2 \u5929','\u7ea6 1~2 \u5c0f\u65f6','\u2191 8x+'],
    ['\u540e\u7aef MVC \u4e09\u5c42\u4ee3\u7801','\u534a\u5929~1 \u5929','\u7ea6 30 \u5206\u949f','\u2191 10x+'],
    ['\u524d\u540e\u7aef\u63a5\u53e3\u8054\u8c03','\u534a\u5929~1 \u5929','\u7ea6 1 \u5c0f\u65f6','\u2191 6x+'],
    ['Bug \u5b9a\u4f4d\u4e0e\u4fee\u590d','\u4e0d\u786e\u5b9a\uff08\u4f9d\u8d56\u7ecf\u9a8c\uff09','\u5206\u949f\u7ea7\uff08\u622a\u56fe\u5373\u53ef\uff09','\u8d28\u7684\u98de\u8dc3'],
];
s9.addTable(tbl,{x:0.35,y:2.68,w:9.3,rowH:0.44,border:{type:'solid',color:'1a3a5c',pt:1},
    fontFace:FONT,fontSize:13,color:C.text,align:'center',valign:'middle',fill:C.card});

// ---------------------------------------------------------------
// SLIDE 10 : Summary
// ---------------------------------------------------------------
const s10=ns(); hdr(s10,'09','\u603b\u7ed3\u4e0e\u5c55\u671b');
box(s10,0.35,1.0,4.5,4.35);
tx(s10,'[ \u6700\u4f73\u5b9e\u8df5 ]',0.55,1.1,4.1,0.42,{fontSize:15,bold:true,color:C.cyan});
[
    [C.cyan,  '(1)','\u63d0\u4f9b\u53c2\u8003\u8d44\u4ea7','\u539f\u578b\u56fe\u3001\u9700\u6c42\u6587\u6863\u3001\u53c2\u8003\u4ee3\u7801\uff0cAI \u4ea7\u51fa\u8d28\u91cf\u663e\u8457\u63d0\u5347'],
    [C.blue,  '(2)','\u5206\u6b65\u786e\u8ba4\u63a8\u8fdb','\u6bcf\u4e2a\u6a21\u5757\u9a8c\u6536\u540e\u518d\u8fdb\u884c\u4e0b\u4e00\u6b65\uff0c\u907f\u514d\u96ea\u7403\u5f0f\u8fd4\u5de5'],
    [C.purple,'(3)','\u6307\u5b9a\u89c4\u8303\u7ea6\u675f','\u660e\u786e\u5206\u5c42\u89c4\u8303\u548c\u547d\u540d\u89c4\u8303\uff0cAI \u81ea\u52a8\u5bf9\u9f50\u56e2\u961f\u6807\u51c6'],
    [C.green, '(4)','\u622a\u56fe\u5373\u662f\u53cd\u9988','\u89c6\u89c9 Bug \u7528\u622a\u56fe\u5bf9\u6bd4\u63cf\u8ff0\uff0c\u6bd4\u6587\u5b57\u63cf\u8ff0\u66f4\u9ad8\u6548'],
].forEach(([color,num,title,desc],i)=>{
    const py=1.72+i*0.9;
    tx(s10,num,  0.55,py,0.4, 0.62,{align:'center',valign:'middle',fontSize:15,bold:true,color});
    tx(s10,title,1.05,py,3.65,0.3, {valign:'bottom',fontSize:14,bold:true,color:C.white});
    tx(s10,desc, 1.05,py+0.33,3.65,0.42,{fontSize:12,color:C.sub});
});

abox(s10,5.15,1.0,4.5,2.35,C.blue);
tx(s10,'[ \u6838\u5fc3\u7ed3\u8bba ]',5.35,1.1,4.1,0.42,{fontSize:15,bold:true,color:C.blue});
tx(s10,'AI Coding \u4e0d\u662f\u66ff\u4ee3\u5f00\u53d1\u8005',5.35,1.65,4.1,0.44,{fontSize:18,color:C.text});
tx(s10,'\u800c\u662f\u5c06\u5f00\u53d1\u8005\u7684\u751f\u4ea7\u529b\u653e\u5927 10 \u500d',5.35,2.1,4.1,0.44,{fontSize:18,bold:true,color:C.cyan});
tx(s10,'\u9700\u6c42\u7406\u89e3 + \u67b6\u6784\u8bbe\u8ba1 + \u8d28\u91cf\u628a\u63a7\n\u4f9d\u7136\u662f\u5f00\u53d1\u8005\u7684\u6838\u5fc3\u4ef7\u503c',5.35,2.65,4.1,0.65,{fontSize:13,color:C.sub,lineSpacingMultiple:1.5});

abox(s10,5.15,3.5,4.5,1.85,C.purple);
tx(s10,'[ \u540e\u7eed\u65b9\u5411 ]',5.35,3.6,4.1,0.42,{fontSize:15,bold:true,color:C.purple});
['\u5bf9\u63a5\u771f\u5b9e\u4e91\u5e73\u53f0\u63a5\u53e3','\u673a\u5668\u4eba\u5730\u56fe\u53ef\u89c6\u5316',
 '\u62a5\u8868\u5bfc\u51fa Excel/PDF','\u544a\u8b66\u9608\u5024\u914d\u7f6e\u7ba1\u7406'].forEach((f,i)=>{
    const fx=5.35+(i%2)*2.25, fy=4.15+Math.floor(i/2)*0.55;
    tx(s10,'> '+f,fx,fy,2.15,0.45,{fontSize:12,color:C.sub});
});

pptx.writeFile({fileName:'AI_Dev_Report_v2.pptx'})
    .then(()=>console.log('Done: AI_Dev_Report_v2.pptx'));
