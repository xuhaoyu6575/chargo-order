const pptxgen = require('pptxgenjs');
const html2pptx = require('./html2pptx.cjs');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const WORKSPACE = __dirname;
const SLIDES_DIR = path.join(WORKSPACE, 'slides');
const ASSETS_DIR = path.join(WORKSPACE, 'assets');

// ─── Color palette (no # prefix for PptxGenJS, with # for CSS) ───
// High-tech Cyberpunk Aesthetics
const C = {
  bgPrimary: '020617', bgCard: '0f172a', bgDeep: '000000',
  border: '1e293b', textPrimary: 'f8fafc', textSecondary: 'cbd5e1', textDim: '64748b',
  cyan: '0ea5e9', blue: '3b82f6', purple: '8b5cf6', green: '10b981', orange: 'f59e0b', red: 'ef4444',
  white: 'ffffff', accentBar: '0284c7',
};

// ─── Step 1: Rasterize gradient backgrounds ───
// Upgraded SVGs with sharper tech grids and corner crosshairs
async function createAssets() {
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <rect width="100%" height="100%" fill="#${C.bgPrimary}"/>
    <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0v40" fill="none" stroke="#0ea5e9" stroke-opacity="0.05" stroke-width="0.5"/>
      <circle cx="0" cy="0" r="1" fill="#0ea5e9" fill-opacity="0.2"/>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <!-- Tech Frame Lines -->
    <path d="M 20 20 L 60 20 M 20 20 L 20 60 M 1420 20 L 1380 20 M 1420 20 L 1420 60 M 20 790 L 60 790 M 20 790 L 20 750 M 1420 790 L 1380 790 M 1420 790 L 1420 750" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-opacity="0.3"/>
  </svg>`;
  await sharp(Buffer.from(bgSvg)).png().toFile(path.join(ASSETS_DIR, 'bg-dark.png'));

  const titleBgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="810">
    <rect width="100%" height="100%" fill="#${C.bgPrimary}"/>
    <defs><pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0v60" fill="none" stroke="#8b5cf6" stroke-opacity="0.06" stroke-width="0.5"/>
      <path d="M30 25 L30 35 M25 30 L35 30" fill="none" stroke="#0ea5e9" stroke-opacity="0.1" stroke-width="1"/>
    </pattern>
    <radialGradient id="r" cx="50%" cy="40%"><stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.08"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <rect width="100%" height="100%" fill="url(#r)"/>
    <path d="M 40 40 L 120 40 M 40 40 L 40 120 M 1400 40 L 1320 40 M 1400 40 L 1400 120" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-opacity="0.4"/>
  </svg>`;
  await sharp(Buffer.from(titleBgSvg)).png().toFile(path.join(ASSETS_DIR, 'bg-title.png'));

  const accentSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="8">
    <defs><linearGradient id="a" x1="0%" x2="100%"><stop offset="0%" stop-color="#${C.cyan}"/><stop offset="50%" stop-color="#${C.purple}"/><stop offset="80%" stop-color="#${C.blue}"/><stop offset="100%" stop-color="transparent"/></linearGradient></defs>
    <rect width="100%" height="100%" fill="url(#a)"/>
  </svg>`;
  await sharp(Buffer.from(accentSvg)).png().toFile(path.join(ASSETS_DIR, 'accent-bar.png'));

  console.log('Assets rasterized.');
}

// ─── Shared HTML helpers ───
const CSS_BASE = `
html { background: #${C.bgPrimary}; }
body {
  width: 720pt; height: 405pt; margin: 0; padding: 0;
  font-family: Arial, sans-serif; color: #${C.textPrimary};
  display: flex; flex-direction: column;
  background: #${C.bgPrimary};
}
.accent { position: absolute; top: 0; left: 0; width: 720pt; height: 3pt; background: #${C.cyan}; }
.content { flex: 1; display: flex; flex-direction: column; padding: 32pt 40pt 24pt 40pt; }
.content-center { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 32pt 40pt 24pt 40pt; text-align: center; }
h1 { font-size: 32pt; font-weight: 800; color: #${C.cyan}; margin: 0 0 8pt 0; font-family: Impact, Arial, sans-serif; letter-spacing: 1px; }
h2 { font-size: 22pt; font-weight: 700; color: #${C.cyan}; margin: 0 0 6pt 0; }
h3 { font-size: 14pt; font-weight: 700; margin: 0 0 4pt 0; }
h4 { font-size: 12pt; font-weight: 700; margin: 0 0 3pt 0; }
p { font-size: 11pt; color: #${C.textSecondary}; margin: 0 0 4pt 0; line-height: 1.5; }
ul { margin: 0; padding-left: 16pt; }
li { font-size: 10pt; color: #${C.textSecondary}; margin-bottom: 3pt; line-height: 1.4; }
.row { display: flex; gap: 12pt; }
.col { flex: 1; display: flex; flex-direction: column; }
.card { background: #${C.bgCard}; border: 1px solid #${C.border}; padding: 12pt; border-left: 3pt solid #${C.cyan}; position: relative; }
.card-glow { background: #${C.bgCard}; border: 1px solid #${C.cyan}; padding: 12pt; position: relative; box-shadow: inset 0 0 10pt rgba(14,165,233,0.1); }
.card::before, .card-glow::before { content: ""; position: absolute; top: -1px; left: -1px; width: 6pt; height: 6pt; border-top: 2px solid #${C.cyan}; border-left: 2px solid #${C.cyan}; }
.card::after, .card-glow::after { content: ""; position: absolute; bottom: -1px; right: -1px; width: 6pt; height: 6pt; border-bottom: 2px solid #${C.cyan}; border-right: 2px solid #${C.cyan}; }
.sub-box { background: #${C.bgDeep}; border: 1px solid #${C.border}; padding: 8pt; margin-top: 4pt; border-left: 2px solid #${C.purple}; }
.badge { display: inline-block; font-size: 8pt; font-weight: 700; padding: 2pt 8pt; border-radius: 0; text-transform: uppercase; letter-spacing: 1px; }
.badge-cyan { color: #${C.cyan}; }
.badge-orange { color: #${C.orange}; }
.badge-purple { color: #${C.purple}; }
.badge-bg-cyan { background: rgba(14,165,233,0.15); border: 1px solid rgba(14,165,233,0.7); padding: 2pt 8pt; display: inline-block; }
.badge-bg-orange { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.7); padding: 2pt 8pt; display: inline-block; }
.badge-bg-purple { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.7); padding: 2pt 8pt; display: inline-block; }
.tag-wrap { display: inline-block; padding: 1pt 6pt; border-radius: 0; border: 1px solid currentColor; margin-right: 4pt; }
.tag { font-size: 8pt; font-weight: 600; text-transform: uppercase; font-family: "Courier New", Courier, monospace;}
.section-num { position: absolute; top: 12pt; right: 40pt; font-size: 56pt; font-weight: 800; color: rgba(14,165,233,0.06); font-family: Impact, Arial, sans-serif; }
.stat-num { font-size: 32pt; font-weight: 800; font-family: Impact, Arial, sans-serif; text-shadow: 0 0 10pt currentColor; }
.text-cyan { color: #${C.cyan}; } .text-blue { color: #${C.blue}; } .text-purple { color: #${C.purple}; }
.text-green { color: #${C.green}; } .text-orange { color: #${C.orange}; } .text-red { color: #${C.red}; }
.text-dim { color: #${C.textDim}; } .text-white { color: #${C.white}; }
.small { font-size: 9pt; } .tiny { font-size: 8pt; }
`;

function slideHTML(bodyClass, innerContent) {
  let html = innerContent;
  // Remove bullet-like symbols that html2pptx rejects
  html = html.replace(/⚡\s*/g, '').replace(/◆\s*/g, '').replace(/⬡\s*/g, '').replace(/★\s*/g, '').replace(/◈\s*/g, '').replace(/◉\s*/g, '').replace(/▸\s*/g, '');
  html = html.replace(/⏱\s*/g, '').replace(/🔁\s*/g, '').replace(/📋\s*/g, '').replace(/🔒\s*/g, '').replace(/⚠\s*/g, '');
  html = html.replace(/🎨\s*/g, '').replace(/🔌\s*/g, '');
  // Fix badge pattern: <p class="badge badge-X" ...>text</p> → <div class="badge-bg-X"><p ...>text</p></div>
  html = html.replace(/<p class="badge badge-(cyan|orange|purple)"([^>]*)>([^<]*)<\/p>/g,
    (_, color, attrs, text) => `<div class="badge-bg-${color}"><p class="badge badge-${color}"${attrs}>${text}</p></div>`);
  // Fix tag pattern: <p class="tag ..." ...>text</p> → <div class="tag-wrap"><p class="tag ...">text</p></div>
  html = html.replace(/<p class="tag ([^"]*)"([^>]*)>([^<]*)<\/p>/g,
    (_, cls, attrs, text) => `<div class="tag-wrap" style="color:inherit"><p class="tag ${cls}"${attrs}>${text}</p></div>`);
  // Fix GET badge: <p ... background:...>GET</p>
  html = html.replace(/<p class="tiny" style="background:#([^;]+);color:#fff;padding:([^;]+);border-radius:([^;]+);font-weight:700">GET<\/p>/g,
    (_, bg, pad, rad) => `<div style="background:#${bg};padding:${pad};border-radius:0;display:inline-block;border:1px solid rgba(255,255,255,0.2)"><p class="tiny" style="color:#fff;font-weight:700;font-family:'Courier New'">[GET]</p></div>`);

  return `<!DOCTYPE html><html><head><style>${CSS_BASE}</style></head><body>
<div class="accent"></div>
<div class="${bodyClass}">${html}</div>
</body></html>`;
}

// ─── Step 2: Generate all 12 slides as HTML ───
function createSlides() {
  // Slide 1: Title
  fs.writeFileSync(path.join(SLIDES_DIR, 's01.html'), slideHTML('content-center', `
    <div style="margin-bottom:12pt"><p class="badge badge-cyan" style="font-size:10pt;padding:4pt 14pt">★ AI 赋能全链路研发</p></div>
    <h1 style="font-size:36pt;margin-bottom:10pt">AI Coding 研发提效总结</h1>
    <p style="font-size:13pt;margin-bottom:16pt">基于 Cursor IDE + Claude Code 双引擎驱动</p>
    <p style="font-size:11pt;margin-bottom:20pt">移动储能机器人运营中心 · 全链路独立系统研发</p>
    <div style="display:flex;gap:12pt;justify-content:center">
      <p class="badge badge-cyan">⚡ Cursor IDE</p>
      <p class="badge badge-orange">◆ Claude Code</p>
      <p class="badge badge-purple">⬡ 协作驱动</p>
    </div>
  `));

  // Slide 2: Pain Points
  fs.writeFileSync(path.join(SLIDES_DIR, 's02.html'), slideHTML('content', `
    <p class="section-num">01</p>
    <h2>传统开发的痛点</h2>
    <p style="margin-bottom:12pt">为什么需要 AI Coding？</p>
    <div class="row" style="flex:1">
      <div class="card" style="flex:1;border-left:3pt solid #${C.red}">
        <h3 class="text-red">⏱ 周期长</h3>
        <p class="small">需求理解、架构设计、编码实现、联调测试，每个环节都需要大量人工时间</p>
        <p class="small">独立系统研发通常需要 <span style="color:#${C.red};font-weight:bold">2-4 周</span></p>
      </div>
      <div class="card" style="flex:1;border-left:3pt solid #${C.orange}">
        <h3 class="text-orange">🔁 重复高</h3>
        <p class="small">CRUD 代码、配置文件、DTO 映射、API 文档等重复性工作占比大</p>
        <p class="small">工程师价值被低效消耗</p>
      </div>
      <div class="card" style="flex:1;border-left:3pt solid #${C.purple}">
        <h3 class="text-purple">📋 沟通成本</h3>
        <p class="small">需求文档 → 设计稿 → 开发 → 联调</p>
        <p class="small">多角色交接产生信息丢失和理解偏差</p>
      </div>
    </div>
  `));

  // Slide 3: Dual Engine
  fs.writeFileSync(path.join(SLIDES_DIR, 's03.html'), slideHTML('content', `
    <p class="section-num">02</p>
    <h2>AI Coding 双引擎</h2>
    <div class="row" style="flex:1;margin-top:8pt">
      <div class="card-glow" style="flex:1;display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:6pt;margin-bottom:8pt">
          <p class="badge badge-cyan">⚡ Cursor IDE</p>
          <p class="tiny text-dim">可视化 + 多模态</p>
        </div>
        <div class="sub-box" style="flex:1">
          <ul>
            <li><span style="color:#${C.cyan};font-weight:bold">多模态理解</span> — 直接读取原型截图、需求文档</li>
            <li><span style="color:#${C.cyan};font-weight:bold">UI 精准还原</span> — 对比截图逐像素调整</li>
            <li><span style="color:#${C.cyan};font-weight:bold">实时预览</span> — 边写边看、截图驱动迭代</li>
            <li><span style="color:#${C.cyan};font-weight:bold">代码审查</span> — 自动发现缺陷与安全漏洞</li>
            <li><span style="color:#${C.cyan};font-weight:bold">前后端联调</span> — 一键启动、实时调试</li>
          </ul>
        </div>
      </div>
      <div class="card" style="flex:1;border-color:#${C.orange};display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;gap:6pt;margin-bottom:8pt">
          <p class="badge badge-orange">◆ Claude Code</p>
          <p class="tiny text-dim">CLI + 架构规划</p>
        </div>
        <div class="sub-box" style="flex:1">
          <ul>
            <li><span style="color:#fbbf24;font-weight:bold">架构规划</span> — 技术选型、分层设计</li>
            <li><span style="color:#fbbf24;font-weight:bold">工程骨架</span> — 完整项目结构一键生成</li>
            <li><span style="color:#fbbf24;font-weight:bold">后端服务</span> — Controller/Service/Client 三层</li>
            <li><span style="color:#fbbf24;font-weight:bold">元数据提取</span> — DTO 模型 + 字段契约</li>
            <li><span style="color:#fbbf24;font-weight:bold">接口文档</span> — 自动生成 API 规范文档</li>
          </ul>
        </div>
      </div>
    </div>
  `));

  // Slide 4: Architecture Diagram (4-layer flow)
  const archCSS = `
.content-arch { flex:1; display:flex; flex-direction:column; padding:20pt 36pt 16pt 36pt; }
.arch-row { display:flex; align-items:stretch; gap:5pt; }
.arch-lbl { width:40pt; display:flex; align-items:center; justify-content:flex-end; padding-right:4pt; }
.arch-arr { text-align:center; padding:1pt 0; }
.an { background:#${C.bgCard}; border-radius:3pt; padding:4pt 6pt; }
`;
  fs.writeFileSync(path.join(SLIDES_DIR, 's04.html'), `<!DOCTYPE html><html><head><style>${CSS_BASE}${archCSS}</style></head><body>
<div class="accent"></div>
<div class="content-arch">
    <p class="section-num">03</p>
    <h2 style="margin-bottom:2pt;font-size:18pt">AI 全链路开发架构</h2>
    <p class="tiny text-dim" style="margin-bottom:5pt">移动储能机器人订单分析报表 — 从需求输入到系统交付的完整研发路径</p>

    <div style="display:flex;flex-direction:column;flex:1;gap:0">
      <div class="arch-row">
        <div class="arch-lbl"><p class="tiny" style="font-weight:800;color:#${C.textDim}">INPUT</p></div>
        <div style="flex:1;display:flex;gap:5pt">
          <div class="an" style="flex:1;border:1px solid #${C.border}"><h4 style="font-size:8pt;color:#${C.textSecondary}">业务需求文档</h4><p class="tiny text-dim">机器人运营数据看板 7 图表+3 指标</p></div>
          <div class="an" style="flex:1;border:1px solid #${C.border}"><h4 style="font-size:8pt;color:#${C.textSecondary}">UI 原型截图</h4><p class="tiny text-dim">深色科技风 Dashboard ECharts</p></div>
          <div class="an" style="flex:1;border:1px solid #${C.border}"><h4 style="font-size:8pt;color:#${C.textSecondary}">数据字段定义</h4><p class="tiny text-dim">订单/机器人/站点 时间/状态/金额</p></div>
        </div>
      </div>
      <div class="arch-arr"><p class="tiny" style="color:#${C.cyan};opacity:0.5">▼</p></div>

      <div class="arch-row">
        <div class="arch-lbl"><p class="tiny" style="font-weight:800;color:#${C.cyan}">AI</p></div>
        <div class="an" style="flex:2;border:1px solid rgba(0,212,255,0.3)">
          <h4 style="font-size:8pt;color:#${C.cyan};margin-bottom:2pt">Cursor 多模态理解</h4>
          <div style="display:flex;gap:6pt">
            <div style="flex:1"><p class="tiny" style="color:#${C.cyan};font-weight:600">需求语义提取</p><p class="tiny text-dim">解析文档 → 7 图表需求</p></div>
            <div style="flex:1"><p class="tiny" style="color:#${C.cyan};font-weight:600">原型 UI 解读</p><p class="tiny text-dim">截图 → 色彩/布局/间距</p></div>
          </div>
        </div>
        <div style="display:flex;align-items:center;padding:0 2pt"><p class="tiny" style="color:#${C.cyan};opacity:0.4">→</p></div>
        <div class="an" style="flex:1.2;border:1px solid rgba(249,115,22,0.3)">
          <h4 style="font-size:8pt;color:#${C.orange};margin-bottom:2pt">Claude Code 架构规划</h4>
          <p class="tiny text-dim">技术选型 + 分层设计</p>
          <p class="tiny text-dim">API 契约 (8端点) + 目录结构</p>
        </div>
      </div>
      <div class="arch-arr"><p class="tiny" style="color:#${C.cyan};opacity:0.5">▼</p></div>

      <div class="arch-row">
        <div class="arch-lbl"><p class="tiny" style="font-weight:800;color:#${C.blue}">CODE</p></div>
        <div class="an" style="flex:1;border:1px solid rgba(0,212,255,0.3)">
          <h4 style="font-size:8pt;color:#${C.cyan}">前端 React 18 + Vite 5</h4>
          <div style="display:flex;gap:4pt"><div style="flex:1"><p class="tiny text-dim">App.jsx 7 ECharts</p></div><div style="flex:1"><p class="tiny text-dim">api.js Tailwind SVG</p></div></div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 1pt">
          <p class="tiny" style="color:#${C.green};font-weight:700;font-size:6pt">API</p>
        </div>
        <div class="an" style="flex:1;border:1px solid rgba(59,130,246,0.3)">
          <h4 style="font-size:8pt;color:#${C.blue}">后端 Spring Boot 3.2</h4>
          <div style="display:flex;gap:4pt"><div style="flex:1"><p class="tiny text-dim">Controller Service</p></div><div style="flex:1"><p class="tiny text-dim">CloudApiClient Mock</p></div></div>
        </div>
      </div>
      <div class="arch-arr"><p class="tiny" style="color:#${C.cyan};opacity:0.5">▼</p></div>

      <div class="arch-row">
        <div class="arch-lbl"><p class="tiny" style="font-weight:800;color:#${C.green}">SHIP</p></div>
        <div style="flex:1;display:flex;gap:4pt">
          <div class="an" style="flex:1;border:1px solid rgba(16,185,129,0.3)"><h4 style="font-size:8pt;color:#${C.green}">联调验证</h4><p class="tiny text-dim">8 端点对接 Mock→Real</p></div>
          <div style="display:flex;align-items:center"><p class="tiny" style="color:#${C.cyan};opacity:0.4">→</p></div>
          <div class="an" style="flex:1;border:1px solid rgba(239,68,68,0.3)"><h4 style="font-size:8pt;color:#${C.red}">代码审查+安全加固</h4><p class="tiny text-dim">AI 扫描 10 项问题修复</p></div>
          <div style="display:flex;align-items:center"><p class="tiny" style="color:#${C.cyan};opacity:0.4">→</p></div>
          <div class="an" style="flex:1;border:1px solid rgba(249,115,22,0.3)"><h4 style="font-size:8pt;color:#${C.orange}">云平台接口文档</h4><p class="tiny text-dim">cloud_API_doc.md 自动生成</p></div>
          <div style="display:flex;align-items:center"><p class="tiny" style="color:#${C.cyan};opacity:0.4">→</p></div>
          <div class="an" style="flex:0.5;border:1px solid rgba(16,185,129,0.5);text-align:center;display:flex;flex-direction:column;justify-content:center"><h4 style="font-size:9pt;color:#${C.green}">DONE</h4><p class="tiny" style="color:#${C.green}">2-3天 10x</p></div>
        </div>
      </div>
    </div>
</div>
</body></html>`);

  // Slide 5: AI Analysis (Cursor)
  fs.writeFileSync(path.join(SLIDES_DIR, 's05.html'), slideHTML('content', `
    <p class="section-num">04</p>
    <div style="display:flex;align-items:center;gap:8pt;margin-bottom:8pt">
      <h2 style="margin:0">AI 智能分析</h2>
      <p class="badge badge-cyan">⚡ Cursor</p>
    </div>
    <div class="row" style="flex:1">
      <div class="col" style="gap:6pt">
        <div class="card-glow" style="flex:1">
          <h4 class="text-cyan">◈ 需求理解与分析</h4>
          <ul>
            <li>解析业务文档语义，提取 7 大图表需求</li>
            <li>识别数据维度（站点/时间/用户/订单）</li>
            <li>提取字段定义与计算逻辑</li>
            <li>规划功能优先级与范围</li>
          </ul>
        </div>
        <div class="card-glow" style="flex:1">
          <h4 class="text-blue">◈ 原型 UI 解读还原</h4>
          <ul>
            <li>识别截图中的深色科技风布局结构</li>
            <li>提取颜色规范 (#050f1e) 与间距</li>
            <li>匹配 ECharts 图表类型</li>
            <li>还原电路板纹理背景效果</li>
          </ul>
        </div>
      </div>
      <div class="col" style="gap:4pt">
        <p class="tiny" style="font-weight:600;color:#${C.textDim}">关键输出物</p>
        <div style="display:flex;gap:4pt;flex-wrap:wrap;margin-bottom:4pt">
          <p class="tag text-cyan">📋 功能需求清单</p>
          <p class="tag text-blue">🎨 UI 规范提取</p>
          <p class="tag text-purple">🔌 API 契约设计</p>
        </div>
        <div class="card" style="flex:1;background:#1e1e1e;border-color:#333;padding:8pt">
          <p class="tiny" style="color:#777;text-align:center;margin-bottom:4pt">Cursor — AI Agent 对话</p>
          <div style="background:#2d2d3f;padding:3pt 6pt;border-radius:3pt;margin-bottom:3pt"><p class="tiny" style="color:#b0b0d0">请分析原型截图中的布局和颜色</p></div>
          <div style="background:#1a2632;padding:3pt 6pt;border-radius:3pt;margin-bottom:3pt"><p class="tiny" style="color:#88ccdd">已识别：深色科技风，7个图表模块</p></div>
          <div style="background:#1a2632;padding:3pt 6pt;border-radius:3pt;margin-bottom:3pt"><p class="tiny" style="color:#6ee7b7">✅ Dashboard 完成：StatCard×3 + 7 ECharts</p></div>
          <div style="background:#2d2d3f;padding:3pt 6pt;border-radius:3pt;margin-bottom:3pt"><p class="tiny" style="color:#b0b0d0">流程耗时图需要 L 型连接线</p></div>
          <div style="background:#1a2632;padding:3pt 6pt;border-radius:3pt"><p class="tiny" style="color:#88ccdd">已用 SVG+ResizeObserver 重写 ✅</p></div>
        </div>
      </div>
    </div>
  `));

  // Slide 6: Architecture (Claude Code)
  fs.writeFileSync(path.join(SLIDES_DIR, 's06.html'), slideHTML('content', `
    <p class="section-num">05</p>
    <div style="display:flex;align-items:center;gap:8pt;margin-bottom:8pt">
      <h2 style="margin:0">系统架构 & 工程骨架</h2>
      <p class="badge badge-orange">◆ Claude Code</p>
    </div>
    <div class="row" style="flex:1">
      <div class="col" style="gap:6pt">
        <div class="card" style="flex:1;border-color:#${C.cyan}">
          <h4 class="text-cyan">前端工程</h4>
          <div style="display:flex;gap:3pt;flex-wrap:wrap;margin-bottom:4pt">
            <p class="tag text-cyan">React 18</p><p class="tag text-blue">Vite 5</p><p class="tag text-cyan">ECharts 5</p><p class="tag text-blue">Tailwind CSS</p>
          </div>
          <ul>
            <li>vite.config.js — 构建 + API 代理</li>
            <li>App.jsx — 完整 Dashboard 页面</li>
            <li>api.js — Axios 服务层</li>
          </ul>
        </div>
        <div class="card" style="flex:1;border-color:#${C.blue}">
          <h4 class="text-blue">后端工程</h4>
          <div style="display:flex;gap:3pt;flex-wrap:wrap;margin-bottom:4pt">
            <p class="tag text-blue">Spring Boot 3.2</p><p class="tag text-cyan">Java 17</p><p class="tag text-blue">Maven</p>
          </div>
          <ul>
            <li>Controller → Service → Client 三层</li>
            <li>MockClient / RealClient 可切换</li>
            <li>Result&lt;T&gt; + GlobalExceptionHandler</li>
          </ul>
        </div>
      </div>
      <div class="col">
        <div class="card" style="flex:1;background:#0d1117;border-color:#333;padding:8pt">
          <p class="tiny" style="color:#777;text-align:center;margin-bottom:4pt">Claude Code — Terminal</p>
          <p class="tiny" style="color:#58a6ff">$ <span style="color:#e6edf3">claude "分析需求，规划系统架构"</span></p>
          <p class="tiny" style="color:#3fb950;margin-top:4pt">━━ 架构方案 ━━</p>
          <p class="tiny" style="color:#7d8590">前端: React 18 + Vite 5 + ECharts + Tailwind</p>
          <p class="tiny" style="color:#7d8590">后端: Spring Boot 3.2 + Java 17 + Maven</p>
          <p class="tiny" style="color:#7d8590">分层: Controller → Service → Client</p>
          <p class="tiny" style="color:#3fb950;margin-top:4pt">━━ API 契约（8 端点）━━</p>
          <p class="tiny"><span style="color:#f0883e">GET</span> <span style="color:#7d8590">/dashboard/stats</span> <span style="color:#d29922">→ 总览</span></p>
          <p class="tiny"><span style="color:#f0883e">GET</span> <span style="color:#7d8590">/dashboard/completion-rate</span> <span style="color:#d29922">→ 完单率</span></p>
          <p class="tiny"><span style="color:#f0883e">GET</span> <span style="color:#7d8590">/dashboard/heatmap</span> <span style="color:#d29922">→ 热力图</span></p>
          <p class="tiny"><span style="color:#f0883e">GET</span> <span style="color:#7d8590">/dashboard/process-time</span> <span style="color:#d29922">→ 耗时</span></p>
          <p class="tiny" style="color:#58a6ff;margin-top:4pt">$ <span style="color:#e6edf3">claude "生成后端骨架+Mock数据"</span></p>
          <p class="tiny"><span style="color:#3fb950">✓</span> <span style="color:#7d8590">controller/service/client/common 四层</span></p>
          <p class="tiny"><span style="color:#3fb950">✓</span> <span style="color:#7d8590">MockCloudApiClient — 3站×30天仿真</span></p>
        </div>
      </div>
    </div>
  `));

  // Slide 7: Full-stack Dev
  fs.writeFileSync(path.join(SLIDES_DIR, 's07.html'), slideHTML('content', `
    <p class="section-num">06</p>
    <div style="display:flex;align-items:center;gap:8pt;margin-bottom:8pt">
      <h2 style="margin:0">AI 驱动全栈研发</h2>
      <p class="badge badge-purple">⬡ Cursor + Claude Code 协作</p>
    </div>
    <div class="row" style="flex:1">
      <div class="card-glow" style="flex:1;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt">
          <h4 class="text-cyan">前端 Dashboard</h4>
          <p class="badge badge-cyan" style="font-size:7pt">⚡ Cursor</p>
        </div>
        <div class="sub-box" style="margin-bottom:4pt">
          <h4 class="text-cyan" style="font-size:9pt">7 个图表组件</h4>
          <div style="display:flex;flex-wrap:wrap;gap:2pt">
            <p class="tiny text-dim">◉ 完单率环形图</p><p class="tiny text-dim">◉ 结束原因饼图</p>
            <p class="tiny text-dim">◉ 24h 热力图</p><p class="tiny text-dim">◉ 流程耗时堆叠条</p>
            <p class="tiny text-dim">◉ 取消分析饼图</p><p class="tiny text-dim">◉ 用户频次柱状图</p>
          </div>
        </div>
        <div class="sub-box">
          <h4 class="text-purple" style="font-size:9pt">服务层</h4>
          <p class="tiny text-dim">api.js — Axios + 响应拦截</p>
          <p class="tiny text-dim">useState/useEffect 筛选联动</p>
        </div>
      </div>
      <div class="card" style="flex:1;border-color:#${C.blue};display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt">
          <h4 class="text-blue">后端 API 服务</h4>
          <p class="badge badge-orange" style="font-size:7pt">◆ Claude Code</p>
        </div>
        <div class="sub-box" style="margin-bottom:4pt">
          <h4 class="text-cyan" style="font-size:9pt">8 个 REST 端点</h4>
          <p class="tiny text-dim" style="font-family:Courier New,monospace">/sites · /stats · /completion-rate</p>
          <p class="tiny text-dim" style="font-family:Courier New,monospace">/heatmap · /process-time · /end-reasons</p>
          <p class="tiny text-dim" style="font-family:Courier New,monospace">/cancel-analysis · /user-frequency</p>
        </div>
        <div class="sub-box" style="margin-bottom:4pt">
          <h4 class="text-purple" style="font-size:9pt">CloudApiClient 抽象</h4>
          <div style="display:flex;gap:4pt">
            <div style="flex:1;padding:3pt;background:rgba(168,85,247,0.06);border:1px solid rgba(168,85,247,0.2);border-radius:3pt">
              <p class="tiny text-purple" style="font-weight:600">MockClient</p>
              <p class="tiny text-dim">高斯仿真数据</p>
            </div>
            <div style="flex:1;padding:3pt;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:3pt">
              <p class="tiny text-blue" style="font-weight:600">RealClient</p>
              <p class="tiny text-dim">RestTemplate HTTP</p>
            </div>
          </div>
        </div>
        <div style="padding:4pt 6pt;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:4pt;display:flex;gap:4pt;align-items:center">
          <p class="tiny text-green" style="font-weight:600">Result&lt;T&gt;</p>
          <p class="tiny text-dim">统一响应 + GlobalExceptionHandler</p>
        </div>
      </div>
    </div>
  `));

  // Slide 8: API Integration
  fs.writeFileSync(path.join(SLIDES_DIR, 's08.html'), slideHTML('content', `
    <p class="section-num">07</p>
    <h2>接口联调 & 云平台文档输出</h2>
    <div class="row" style="flex:1;margin-top:6pt">
      <div class="card-glow" style="flex:1;display:flex;flex-direction:column">
        <h4 class="text-green">前后端联调 · 8 个端点</h4>
        <div style="display:flex;flex-direction:column;gap:3pt;flex:1;margin-top:4pt">
          <div style="display:flex;align-items:center;gap:4pt;padding:3pt 6pt;background:#${C.bgDeep};border-radius:3pt;border:1px solid #${C.border}">
            <p class="tiny" style="background:#${C.blue};color:#fff;padding:1pt 4pt;border-radius:2pt;font-weight:700">GET</p>
            <p class="tiny text-cyan" style="font-family:Courier New,monospace">/api/dashboard/sites</p>
            <p class="tiny text-dim" style="margin-left:auto">站点列表</p>
          </div>
          <div style="display:flex;align-items:center;gap:4pt;padding:3pt 6pt;background:#${C.bgDeep};border-radius:3pt;border:1px solid #${C.border}">
            <p class="tiny" style="background:#${C.blue};color:#fff;padding:1pt 4pt;border-radius:2pt;font-weight:700">GET</p>
            <p class="tiny text-cyan" style="font-family:Courier New,monospace">/api/dashboard/stats</p>
            <p class="tiny text-dim" style="margin-left:auto">总览指标</p>
          </div>
          <div style="display:flex;align-items:center;gap:4pt;padding:3pt 6pt;background:#${C.bgDeep};border-radius:3pt;border:1px solid #${C.border}">
            <p class="tiny" style="background:#${C.blue};color:#fff;padding:1pt 4pt;border-radius:2pt;font-weight:700">GET</p>
            <p class="tiny text-cyan" style="font-family:Courier New,monospace">/api/dashboard/completion-rate</p>
            <p class="tiny text-dim" style="margin-left:auto">完单率</p>
          </div>
          <p class="tiny text-dim" style="text-align:center">... + heatmap, process-time, end-reasons, cancel-analysis, user-frequency</p>
        </div>
        <div style="padding:4pt 6pt;background:rgba(0,212,255,0.04);border:1px dashed rgba(0,212,255,0.2);border-radius:4pt;margin-top:auto">
          <p class="tiny"><span style="color:#${C.cyan};font-weight:bold">统一规范:</span> <span style="color:#${C.textDim}">?siteId=S001&amp;days=7 → Result&lt;T&gt;</span></p>
        </div>
      </div>
      <div class="card" style="flex:1;border-color:#${C.orange};display:flex;flex-direction:column">
        <h4 class="text-orange">云平台接口文档 · AI 自动生成</h4>
        <div class="sub-box" style="margin-top:4pt">
          <h4 class="text-cyan" style="font-size:9pt">cloud_API_doc.md</h4>
          <p class="tiny text-dim">▸ GET /api/orders — 订单流水 (OrderRecord)</p>
          <p class="tiny text-dim">▸ GET /api/robots — 机器人状态 (RobotRecord)</p>
          <p class="tiny text-dim">▸ GET /api/sites — 站点列表</p>
        </div>
        <div class="sub-box" style="margin-top:4pt">
          <h4 class="text-purple" style="font-size:9pt">DTO 元数据模型</h4>
          <p class="tiny text-dim" style="font-family:Courier New,monospace">OrderRecord: orderId, siteId, daysAgo,</p>
          <p class="tiny text-dim" style="font-family:Courier New,monospace">endReason, actualKwh, userId, xxxMinutes</p>
          <p class="tiny text-dim" style="font-family:Courier New,monospace">RobotRecord: vin, siteId, active</p>
        </div>
        <div style="padding:4pt 6pt;background:rgba(249,115,22,0.04);border:1px dashed rgba(249,115,22,0.2);border-radius:4pt;margin-top:auto">
          <p class="tiny"><span style="color:#${C.orange};font-weight:bold">交付给云平台团队</span> <span style="color:#${C.textDim}">→ 传统开发实现 3 个 API</span></p>
        </div>
      </div>
    </div>
  `));

  // Slide 9: Code Review
  fs.writeFileSync(path.join(SLIDES_DIR, 's09.html'), slideHTML('content', `
    <p class="section-num">08</p>
    <div style="display:flex;align-items:center;gap:8pt;margin-bottom:4pt">
      <h2 style="margin:0">AI 代码审查 & 安全加固</h2>
      <p class="badge badge-cyan">⚡ Cursor</p>
    </div>
    <p style="margin-bottom:8pt">全量代码扫描，发现 <span style="color:#${C.red};font-weight:bold">10 项问题</span>（6 P1 高优 + 4 P2 中优），全部自动修复</p>
    <div class="row" style="flex:1">
      <div class="card" style="flex:1;border-color:#${C.red};display:flex;flex-direction:column">
        <h4 class="text-red">🔒 P1 高优修复（6 项）</h4>
        <ul style="margin-top:4pt">
          <li><span style="font-weight:bold">GlobalExceptionHandler</span> — 阻止异常信息泄露</li>
          <li><span style="font-weight:bold">getHeatmap</span> — 数组越界防护</li>
          <li><span style="font-weight:bold">getUserFrequency</span> — null userId 过滤</li>
          <li><span style="font-weight:bold">getEndReasons</span> — null endReason 过滤</li>
          <li><span style="font-weight:bold">RestTemplate</span> — 超时配置 5s/30s</li>
          <li><span style="font-weight:bold">DashboardController</span> — days 参数校验 1~365</li>
        </ul>
      </div>
      <div class="card" style="flex:1;border-color:#${C.orange};display:flex;flex-direction:column">
        <h4 class="text-orange">⚠ P2 中优修复（4 项）</h4>
        <ul style="margin-top:4pt">
          <li><span style="font-weight:bold">异常处理器顺序</span> — IllegalArgument 优先</li>
          <li><span style="font-weight:bold">CloudApiClient.unwrap</span> — null data 处理</li>
          <li><span style="font-weight:bold">baseUrl 末尾斜杠</span> — trim 防止双斜杠</li>
          <li><span style="font-weight:bold">CORS 配置</span> — 改为配置文件读取</li>
        </ul>
        <div style="padding:6pt;background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:4pt;margin-top:auto;text-align:center">
          <p class="small text-green" style="font-weight:600">✅ 所有修复已验证通过，零回归</p>
        </div>
      </div>
    </div>
  `));

  // Slide 10: Comparison
  fs.writeFileSync(path.join(SLIDES_DIR, 's10.html'), slideHTML('content', `
    <p class="section-num">09</p>
    <h2 style="margin-bottom:12pt">AI Coding vs 传统开发</h2>
    <div class="card-glow" style="max-width:580pt;margin:0 auto">
      <div style="display:flex;padding:6pt 0;border-bottom:2pt solid #${C.border};font-weight:700">
        <p class="small text-dim" style="width:90pt">环节</p>
        <p class="small text-dim" style="flex:1">传统开发</p>
        <p class="small text-cyan" style="flex:1">AI Coding</p>
      </div>
      <div style="display:flex;padding:5pt 0;border-bottom:1px solid rgba(26,58,92,0.4)">
        <p class="small" style="width:90pt;font-weight:600">需求分析</p>
        <p class="small text-dim" style="flex:1">人工阅读文档，多轮会议 — 1~2天</p>
        <p class="small text-cyan" style="flex:1">AI 多模态理解，秒级提取 — <span style="font-weight:bold">分钟级</span></p>
      </div>
      <div style="display:flex;padding:5pt 0;border-bottom:1px solid rgba(26,58,92,0.4)">
        <p class="small" style="width:90pt;font-weight:600">UI 还原</p>
        <p class="small text-dim" style="flex:1">设计师切图 → 前端还原 — 3~5天</p>
        <p class="small text-cyan" style="flex:1">截图直接生成 React 代码 — <span style="font-weight:bold">小时级</span></p>
      </div>
      <div style="display:flex;padding:5pt 0;border-bottom:1px solid rgba(26,58,92,0.4)">
        <p class="small" style="width:90pt;font-weight:600">后端开发</p>
        <p class="small text-dim" style="flex:1">手写 Controller/Service/DTO — 3~5天</p>
        <p class="small text-cyan" style="flex:1">AI 生成完整三层架构 — <span style="font-weight:bold">小时级</span></p>
      </div>
      <div style="display:flex;padding:5pt 0;border-bottom:1px solid rgba(26,58,92,0.4)">
        <p class="small" style="width:90pt;font-weight:600">接口文档</p>
        <p class="small text-dim" style="flex:1">手动编写 API 文档 — 1~2天</p>
        <p class="small text-cyan" style="flex:1">AI 从 DTO 自动生成 — <span style="font-weight:bold">分钟级</span></p>
      </div>
      <div style="display:flex;padding:5pt 0;border-bottom:1px solid rgba(26,58,92,0.4)">
        <p class="small" style="width:90pt;font-weight:600">代码审查</p>
        <p class="small text-dim" style="flex:1">人工 Code Review — 1~2天</p>
        <p class="small text-cyan" style="flex:1">AI 全量扫描+自动修复 — <span style="font-weight:bold">分钟级</span></p>
      </div>
      <div style="display:flex;padding:6pt 0">
        <p class="small" style="width:90pt;font-weight:800">总计</p>
        <p class="small text-red" style="flex:1;font-weight:700">2~4 周</p>
        <p style="flex:1;font-weight:700;font-size:12pt;color:#${C.cyan}">2~3 天 → 10x 提效 🚀</p>
      </div>
    </div>
  `));

  // Slide 11: Results
  fs.writeFileSync(path.join(SLIDES_DIR, 's11.html'), slideHTML('content-center', `
    <p class="section-num">10</p>
    <h2 style="margin-bottom:16pt">核心成果数据</h2>
    <div style="display:flex;gap:12pt;margin-bottom:16pt">
      <div class="card-glow" style="flex:1;text-align:center;padding:12pt">
        <p class="stat-num text-cyan">7</p><p class="small text-dim">图表模块</p>
      </div>
      <div class="card" style="flex:1;text-align:center;padding:12pt;border-color:#${C.blue}">
        <p class="stat-num text-blue">8</p><p class="small text-dim">REST 接口</p>
      </div>
      <div class="card" style="flex:1;text-align:center;padding:12pt;border-color:#${C.green}">
        <p class="stat-num text-green">3</p><p class="small text-dim">云平台对接</p>
      </div>
      <div class="card" style="flex:1;text-align:center;padding:12pt;border-color:#${C.red}">
        <p class="stat-num text-red">10</p><p class="small text-dim">安全缺陷修复</p>
      </div>
      <div class="card" style="flex:1;text-align:center;padding:12pt;border-color:#${C.purple}">
        <p class="stat-num text-purple">10x</p><p class="small text-dim">研发效率提升</p>
      </div>
    </div>
    <div style="display:flex;gap:12pt;width:100%">
      <div class="sub-box" style="flex:1;text-align:left">
        <h4 class="text-cyan" style="font-size:9pt;margin-bottom:3pt">前端交付物</h4>
        <p class="tiny text-dim">App.jsx · 7 个 ECharts 图表 · ProcessTimeChart 自定义 SVG</p>
        <p class="tiny text-dim">api.js 服务层 · circuit-bg.svg 电路板背景 · Tailwind 响应式</p>
      </div>
      <div class="sub-box" style="flex:1;text-align:left">
        <h4 class="text-blue" style="font-size:9pt;margin-bottom:3pt">后端交付物</h4>
        <p class="tiny text-dim">DashboardController/Service · CloudApiClient 抽象层</p>
        <p class="tiny text-dim">MockClient 仿真 · Result&lt;T&gt; · GlobalExceptionHandler</p>
      </div>
    </div>
  `));

  // Slide 12: Closing
  fs.writeFileSync(path.join(SLIDES_DIR, 's12.html'), slideHTML('content-center', `
    <div style="margin-bottom:14pt"><p class="badge badge-cyan" style="font-size:10pt;padding:4pt 14pt">★ 贯穿全程的 AI 核心能力</p></div>
    <h1 style="font-size:30pt;margin-bottom:16pt">AI 不仅能写代码</h1>
    <div style="display:flex;gap:12pt;margin-bottom:20pt;max-width:580pt">
      <div style="flex:1;text-align:center">
        <h4 class="text-cyan" style="font-size:10pt">多模态理解</h4>
        <p class="tiny text-dim">读截图 · 读文档</p>
        <p class="tiny text-dim">识别 UI 布局</p>
        <p class="badge badge-cyan" style="font-size:7pt;margin-top:4pt">Cursor</p>
      </div>
      <div style="flex:1;text-align:center">
        <h4 class="text-blue" style="font-size:10pt">全栈生成</h4>
        <p class="tiny text-dim">前端+后端</p>
        <p class="tiny text-dim">一步到位</p>
        <p class="badge badge-purple" style="font-size:7pt;margin-top:4pt">协作</p>
      </div>
      <div style="flex:1;text-align:center">
        <h4 class="text-purple" style="font-size:10pt">元数据驱动</h4>
        <p class="tiny text-dim">字段契约</p>
        <p class="tiny text-dim">接口文档</p>
        <p class="badge badge-orange" style="font-size:7pt;margin-top:4pt">Claude Code</p>
      </div>
      <div style="flex:1;text-align:center">
        <h4 class="text-green" style="font-size:10pt">截图调试</h4>
        <p class="tiny text-dim">精准修复</p>
        <p class="tiny text-dim">分钟级迭代</p>
        <p class="badge badge-cyan" style="font-size:7pt;margin-top:4pt">Cursor</p>
      </div>
      <div style="flex:1;text-align:center">
        <h4 class="text-red" style="font-size:10pt">安全审查</h4>
        <p class="tiny text-dim">漏洞检测</p>
        <p class="tiny text-dim">自动修复</p>
        <p class="badge badge-cyan" style="font-size:7pt;margin-top:4pt">Cursor</p>
      </div>
    </div>
    <p style="font-size:13pt;font-weight:700;color:#${C.cyan}">更能理解需求、设计架构、生成文档、审查安全</p>
    <p style="font-size:13pt;font-weight:700;color:#${C.cyan}">驱动全链路研发</p>
  `));

  console.log('12 HTML slides created.');
}

// ─── Step 3: Convert to PPTX ───
async function buildPptx() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'AI Coding Team';
  pptx.title = 'AI Coding 研发提效总结';

  for (let i = 1; i <= 12; i++) {
    const num = String(i).padStart(2, '0');
    const htmlFile = path.join(SLIDES_DIR, `s${num}.html`);
    console.log(`Converting slide ${i}...`);
    try {
      await html2pptx(htmlFile, pptx);
    } catch (e) {
      console.error(`Slide ${i} error:`, e.message);
      if (e.message.includes('overflow')) {
        console.log('  → Trying to continue...');
      } else {
        throw e;
      }
    }
  }

  const outPath = path.join(WORKSPACE, '..', 'AI研发提效总结_v3.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log(`\nPPTX saved to: ${outPath}`);
  return outPath;
}

// ─── Main ───
(async () => {
  try {
    await createAssets();
    createSlides();
    const outPath = await buildPptx();
    console.log('Done!');
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
})();
