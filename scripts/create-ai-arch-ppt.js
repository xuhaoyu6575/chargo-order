/**
 * 生成 AI研发架构图.pptx
 * 整合 img 素材、架构内容、成果说明
 */
const pptxgen = require("pptxgenjs");
const path = require("path");

const imgDir = path.join(__dirname, "..", "img");
const img1 = path.join(imgDir, "540351e3-545a-42fe-ba70-b3e079b6474a.png");
const img2 = path.join(imgDir, "d20e6e7b-9436-4917-bda7-1ee1bc040648.png");
const img3 = path.join(imgDir, "fef55879-7f09-4d06-9f91-50ac2bcf32f3.png");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "AI 研发团队";
pres.title = "AI 赋能全链路研发 · 移动储能机器人运营中心";

// 配色
const colors = {
  cyan: "00D4FF",
  blue: "3B82F6",
  purple: "A855F7",
  green: "10B981",
  orange: "F97316",
  dark: "050F1E",
  card: "0B1F38",
  sub: "94A3B8",
};

// ========== 第1页：封面 ==========
let slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText("AI 赋能全链路研发", {
  x: 0.5, y: 1.2, w: 9, h: 0.8,
  fontSize: 36, fontFace: "Microsoft YaHei", bold: true,
  color: colors.cyan, align: "center",
});
slide.addText("移动储能机器人运营中心 · 系统研发架构图", {
  x: 0.5, y: 2.0, w: 9, h: 0.7,
  fontSize: 24, fontFace: "Microsoft YaHei",
  color: "FFFFFF", align: "center",
});
slide.addText("从需求输入 → AI分析 → 系统研发 → 接口设计 → 云平台对接 → 完整交付", {
  x: 0.5, y: 2.8, w: 9, h: 0.5,
  fontSize: 14, fontFace: "Microsoft YaHei",
  color: colors.sub, align: "center",
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: 4.2, y: 3.5, w: 1.6, h: 0.5,
  fill: { color: colors.cyan, transparency: 80 },
  line: { color: colors.cyan, width: 1 },
});
slide.addText("★ Cursor + Claude 大模型驱动", {
  x: 4.0, y: 3.52, w: 2, h: 0.45,
  fontSize: 12, fontFace: "Microsoft YaHei", bold: true,
  color: colors.cyan, align: "center",
});

// ========== 第2页：运营大屏成果展示 ==========
slide = pres.addSlide();
slide.background = { color: "F8FAFC" };
slide.addText("成果展示 · 运营大屏", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.dark,
});
slide.addText("深色科技风 Dashboard，7 个核心图表模块，支持站点筛选与时间维度分析", {
  x: 0.5, y: 0.75, w: 9, h: 0.4,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: "64748B",
});
slide.addImage({
  path: img1,
  x: 0.5, y: 1.2, w: 9, h: 4.8,
  sizing: { type: "contain", w: 9, h: 4.8 },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 6.0, w: 9, h: 0.6,
  fill: { color: "E2E8F0" },
});
slide.addText([
  { text: "核心指标：", options: { bold: true, breakLine: false } },
  { text: "总订单 1,232 · 充电 42,807 kWh · 活跃机器人 45 | " },
  { text: "完单率 70% | ", options: { bold: true } },
  { text: "平均流程耗时 57 分钟 | 24h 热力图 + 用户忠诚度分析", options: { breakLine: false } },
], {
  x: 0.6, y: 6.05, w: 8.8, h: 0.5,
  fontSize: 11, fontFace: "Microsoft YaHei",
  color: "475569",
});

// ========== 第3页：前后端联调与 API 调用 ==========
slide = pres.addSlide();
slide.background = { color: "F8FAFC" };
slide.addText("成果展示 · 前后端联调", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.dark,
});
slide.addText("8 个 REST 接口并行请求，Vite 代理转发，统一 Result<T> 响应格式", {
  x: 0.5, y: 0.75, w: 9, h: 0.4,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: "64748B",
});
slide.addImage({
  path: img2,
  x: 0.5, y: 1.2, w: 9, h: 4.6,
  sizing: { type: "contain", w: 9, h: 4.6 },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 5.8, w: 9, h: 0.65,
  fill: { color: "DBEAFE" },
});
slide.addText([
  { text: "API 端点：", options: { bold: true, breakLine: false } },
  { text: "sites | stats | completion-rate | end-reasons | heatmap | process-time | cancel-analysis | user-frequency " },
  { text: "· 公共参数 ?siteId=&days=7 · 响应 200 OK · 平均耗时 <100ms", options: { breakLine: false } },
], {
  x: 0.6, y: 5.85, w: 8.8, h: 0.55,
  fontSize: 11, fontFace: "Microsoft YaHei",
  color: "1E40AF",
});

// ========== 第4页：开发环境与一键启动 ==========
slide = pres.addSlide();
slide.background = { color: "F8FAFC" };
slide.addText("成果展示 · 开发环境", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.dark,
});
slide.addText("前后端一键启动，本地联调即开即用，Mock 数据支持离线演示", {
  x: 0.5, y: 0.75, w: 9, h: 0.4,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: "64748B",
});
slide.addImage({
  path: img3,
  x: 0.5, y: 1.2, w: 9, h: 4.6,
  sizing: { type: "contain", w: 9, h: 4.6 },
});
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 5.8, w: 9, h: 0.65,
  fill: { color: "D1FAE5" },
});
slide.addText([
  { text: "前端：", options: { bold: true, breakLine: false } },
  { text: "http://localhost:3000  (Vite + React)  |  " },
  { text: "后端：", options: { bold: true, breakLine: false } },
  { text: "http://localhost:8080  (Spring Boot)  |  cloud.api.mock=true 使用仿真数据", options: { breakLine: false } },
], {
  x: 0.6, y: 5.85, w: 8.8, h: 0.55,
  fontSize: 11, fontFace: "Microsoft YaHei",
  color: "065F46",
});

// ========== 第5页：8 阶段研发流程 ==========
slide = pres.addSlide();
slide.background = { color: "F8FAFC" };
slide.addText("AI 赋能全链路研发流程", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.dark,
});
const stages = [
  { n: "01", name: "需求输入", sub: "文档 + 原型截图", ai: false },
  { n: "02", name: "AI 智能分析", sub: "需求理解 · UI 解读", ai: true },
  { n: "03", name: "AI 架构生成", sub: "工程骨架 + 配置", ai: true },
  { n: "04", name: "AI 全栈研发", sub: "前端 + 后端编码", ai: true },
  { n: "05", name: "前后端联调", sub: "Result<T> · 参数联动", ai: false },
  { n: "06", name: "AI 接口设计", sub: "元数据 → 接口文档", ai: true },
  { n: "07", name: "云平台对接", sub: "传统开发 + 联调", ai: false },
  { n: "08", name: "系统交付", sub: "完整独立系统", ai: false },
];
const stepW = 1.1;
stages.forEach((s, i) => {
  const x = 0.5 + i * stepW;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.0, w: stepW - 0.05, h: 1.2,
    fill: { color: s.ai ? "E0F2FE" : "F1F5F9" },
    line: { color: s.ai ? colors.cyan : "CBD5E1", width: 1 },
  });
  slide.addText(s.n, {
    x, y: 1.05, w: stepW - 0.05, h: 0.3,
    fontSize: 10, fontFace: "Microsoft YaHei", bold: true,
    color: "64748B", align: "center",
  });
  slide.addText(s.name, {
    x, y: 1.35, w: stepW - 0.05, h: 0.4,
    fontSize: 11, fontFace: "Microsoft YaHei", bold: true,
    color: s.ai ? colors.cyan : "475569", align: "center",
  });
  slide.addText(s.sub, {
    x, y: 1.75, w: stepW - 0.05, h: 0.35,
    fontSize: 9, fontFace: "Microsoft YaHei",
    color: "64748B", align: "center",
  });
  if (i < 7) {
    slide.addText("›", {
      x: x + stepW - 0.15, y: 1.4, w: 0.2, h: 0.4,
      fontSize: 16, color: "94A3B8", align: "center",
    });
  }
});
slide.addText("AI 贯穿需求理解、架构设计、代码生成、接口文档全流程，传统团队仅负责云平台实现与联调", {
  x: 0.5, y: 2.4, w: 9, h: 0.5,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: "64748B",
});

// ========== 第6页：成果总结 ==========
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText("研发成果总结", {
  x: 0.5, y: 0.3, w: 9, h: 0.7,
  fontSize: 32, fontFace: "Microsoft YaHei", bold: true,
  color: "FFFFFF", align: "center",
});
const metrics = [
  { num: "7", label: "图表模块", color: colors.cyan },
  { num: "8", label: "REST 接口", color: colors.blue },
  { num: "3", label: "云平台系统对接", color: colors.green },
  { num: "10x", label: "研发效率提升", color: colors.purple },
];
metrics.forEach((m, i) => {
  const x = 0.8 + i * 2.3;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: 1.2, w: 2.0, h: 1.8,
    fill: { color: "0B1F38" },
    line: { color: m.color, width: 1 },
  });
  slide.addText(m.num, {
    x, y: 1.5, w: 2.0, h: 0.9,
    fontSize: 48, fontFace: "Microsoft YaHei", bold: true,
    color: m.color, align: "center",
  });
  slide.addText(m.label, {
    x, y: 2.4, w: 2.0, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei",
    color: colors.sub, align: "center",
  });
});
slide.addText("AI 不仅能写代码，更能理解需求、设计架构、生成文档、驱动全链路研发", {
  x: 0.5, y: 3.3, w: 9, h: 0.6,
  fontSize: 16, fontFace: "Microsoft YaHei",
  color: colors.cyan, align: "center",
});
slide.addText([
  { text: "技术栈：", options: { bold: true, breakLine: true } },
  { text: "前端 React 18 + Vite 5 + ECharts 5 + Tailwind | 后端 Spring Boot 3.2 + Java 17 | Mock 仿真 + 云平台 HTTP 双模式", options: { breakLine: true } },
  { text: "AI 能力：", options: { bold: true, breakLine: true } },
  { text: "多模态理解（文档+截图）· 全栈代码生成 · 元数据提取与接口文档设计 · 截图驱动调试", options: { breakLine: false } },
], {
  x: 0.5, y: 4.0, w: 9, h: 1.5,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: colors.sub,
});

// ========== 第7页：扩展方向与适用场景（新内容）==========
slide = pres.addSlide();
slide.background = { color: "F8FAFC" };
slide.addText("扩展方向与适用场景", {
  x: 0.5, y: 0.2, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: colors.dark,
});
slide.addText("本架构可复用到其他业务域，支撑快速孵化新系统", {
  x: 0.5, y: 0.75, w: 9, h: 0.4,
  fontSize: 12, fontFace: "Microsoft YaHei",
  color: "64748B",
});
const expandItems = [
  { title: "多站点 / 多租户", desc: "按站点、区域、租户维度扩展筛选与权限" },
  { title: "实时大屏", desc: "WebSocket 推送，秒级刷新订单与机器人状态" },
  { title: "移动端适配", desc: "响应式布局 + 触控优化，支持现场巡检" },
  { title: "数据导出", desc: "Excel / PDF 报表导出，对接 BI 工具" },
];
expandItems.forEach((item, i) => {
  const row = Math.floor(i / 2);
  const col = i % 2;
  const x = 0.5 + col * 4.75;
  const y = 1.2 + row * 2.2;
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 4.5, h: 1.9,
    fill: { color: "FFFFFF" },
    line: { color: "E2E8F0", width: 1 },
  });
  slide.addText(item.title, {
    x: x + 0.2, y: y + 0.25, w: 4.1, h: 0.5,
    fontSize: 16, fontFace: "Microsoft YaHei", bold: true,
    color: colors.blue,
  });
  slide.addText(item.desc, {
    x: x + 0.2, y: y + 0.8, w: 4.1, h: 0.9,
    fontSize: 12, fontFace: "Microsoft YaHei",
    color: "64748B",
  });
});
slide.addText("适用场景：运营看板、设备监控、订单分析、数据大屏等需快速交付的独立系统", {
  x: 0.5, y: 5.2, w: 9, h: 0.5,
  fontSize: 13, fontFace: "Microsoft YaHei",
  color: "475569",
});

// ========== 第8页：关键经验与落地建议（新内容）==========
slide = pres.addSlide();
slide.background = { color: colors.dark };
slide.addText("关键经验与落地建议", {
  x: 0.5, y: 0.3, w: 9, h: 0.6,
  fontSize: 28, fontFace: "Microsoft YaHei", bold: true,
  color: "FFFFFF",
});
const tips = [
  { n: "1", t: "需求输入要明确", d: "文档 + 原型截图双输入，减少 AI 理解偏差" },
  { n: "2", t: "先 Mock 后对接", d: "本地仿真数据先行开发，云平台接口就绪后一键切换" },
  { n: "3", t: "接口契约前置", d: "AI 从 DTO 提取元数据生成接口文档，降低联调成本" },
  { n: "4", t: "截图驱动迭代", d: "问题截图反馈，AI 精准定位修复，分钟级闭环" },
];
tips.forEach((tip, i) => {
  const y = 1.1 + i * 1.3;
  slide.addShape(pres.shapes.OVAL, {
    x: 0.5, y: y + 0.1, w: 0.5, h: 0.5,
    fill: { color: colors.cyan, transparency: 80 },
    line: { color: colors.cyan, width: 1 },
  });
  slide.addText(tip.n, {
    x: 0.5, y: y + 0.2, w: 0.5, h: 0.3,
    fontSize: 14, fontFace: "Microsoft YaHei", bold: true,
    color: colors.dark, align: "center",
  });
  slide.addText(tip.t, {
    x: 1.15, y: y + 0.05, w: 2.5, h: 0.4,
    fontSize: 14, fontFace: "Microsoft YaHei", bold: true,
    color: colors.cyan,
  });
  slide.addText(tip.d, {
    x: 1.15, y: y + 0.45, w: 8, h: 0.5,
    fontSize: 12, fontFace: "Microsoft YaHei",
    color: colors.sub,
  });
});
slide.addText("AI 辅助研发不是替代人，而是放大人的能力 — 把精力集中在业务理解与质量把控上", {
  x: 0.5, y: 5.6, w: 9, h: 0.6,
  fontSize: 14, fontFace: "Microsoft YaHei",
  color: colors.cyan, align: "center",
});

// ========== 输出 ==========
const outPath = path.join(__dirname, "..", "AI研发架构图.pptx");
pres.writeFile({ fileName: outPath })
  .then(() => console.log("已生成: " + outPath))
  .catch((err) => console.error(err));
