const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Colors matching "Cybernetic Precision" philosophy
const darkBg = '#020617';
const cardBg = 'rgba(15, 23, 42, 0.6)';
const cyan = '#0ea5e9';    // Cognition
const blue = '#3b82f6';    // Backend/Structure
const orange = '#f97316';  // Deliverables/Alerts
const green = '#10b981';   // Success
const purple = '#8b5cf6';  // Process
const gridColor = 'rgba(255, 255, 255, 0.03)';
const textDim = '#94a3b8';
const textBright = '#f8fafc';

function drawCanvas() {
    // 1920x1080 canvas
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background (obsidian/deep blue-black void)
    ctx.fillStyle = darkBg;
    ctx.fillRect(0, 0, width, height);

    // 2. Grid (Microscopic circuitry feel)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Four corners HUD brackets
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
    ctx.lineWidth = 3;
    const cornerSize = 40;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(20, 20 + cornerSize); ctx.lineTo(20, 20); ctx.lineTo(20 + cornerSize, 20); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(width - 20 - cornerSize, 20); ctx.lineTo(width - 20, 20); ctx.lineTo(width - 20, 20 + cornerSize); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(20, height - 20 - cornerSize); ctx.lineTo(20, height - 20); ctx.lineTo(20 + cornerSize, height - 20); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(width - 20, height - 20 - cornerSize); ctx.lineTo(width - 20, height - 20); ctx.lineTo(width - 20 - cornerSize, height - 20); ctx.stroke();

    // Utility text drawing
    function drawText(text, x, y, fontPath, fontSize, weight, color, align = 'left') {
        ctx.font = `${weight} ${fontSize}px "Segoe UI", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    }

    function roundedRect(ctx, x, y, w, h, radius, bgFill, borderStroke, borderGlow) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        if (bgFill) {
            ctx.fillStyle = bgFill;
            ctx.fill();
        }
        if (borderStroke) {
            ctx.shadowColor = borderGlow || borderStroke;
            ctx.shadowBlur = borderGlow ? 15 : 0;
            ctx.strokeStyle = borderStroke;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Reset shadow
            ctx.shadowBlur = 0;
        }
    }

    // Title
    ctx.shadowColor = cyan; ctx.shadowBlur = 20;
    drawText("AI 驱动全链路研发生态", 100, 80, '', 48, 'bold', textBright);
    ctx.shadowBlur = 0;
    drawText("COGNITIVE ARCHITECTURE & AUTOMATED WORKFLOW", 100, 140, '', 16, 'bold', cyan);

    // Timeline spine (Invisible grid core)
    const spineX = width / 2;
    ctx.setLineDash([5, 10]);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.moveTo(spineX, 220); ctx.lineTo(spineX, height - 100); ctx.stroke();
    ctx.setLineDash([]);

    // Nodes
    const phase1Y = 280;
    const phase2Y = 480;
    const phase3Y = 680;
    const phase4Y = 880;

    // Node: Input (Demand & UI)
    roundedRect(ctx, 100, phase1Y, 400, 120, 8, cardBg, 'rgba(255,255,255,0.2)');
    drawText("PHASE 01: 需求捕获", 130, phase1Y + 30, '', 14, 'bold', textDim);
    drawText("多模态输入源", 130, phase1Y + 55, '', 22, 'bold', textBright);
    drawText("PRD 面板说明 // 原型截图 // DTO 定义", 130, phase1Y + 85, '', 14, 'normal', cyan);

    // Arrow 1 to 2
    ctx.strokeStyle = cyan;
    ctx.beginPath(); ctx.moveTo(500, phase1Y + 60); ctx.lineTo(600, phase1Y + 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(600, phase1Y + 60); ctx.lineTo(600, phase2Y + 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(600, phase2Y + 60); ctx.lineTo(700, phase2Y + 60); ctx.stroke();

    // Node: AI Analysis (Cursor + Claude)
    roundedRect(ctx, 700, phase2Y, 520, 140, 8, 'rgba(14,165,233,0.05)', cyan, cyan);
    drawText("PHASE 02: 认知与转换", 730, phase2Y + 30, '', 14, 'bold', cyan);
    drawText("CURSOR 多模态理解", 730, phase2Y + 55, '', 24, 'bold', textBright);
    drawText("解析文档 → 提取计算逻辑 // 识别截图 → 重建布局/色彩规范", 730, phase2Y + 90, '', 16, 'normal', textDim);
    
    roundedRect(ctx, 1280, phase2Y + 10, 300, 120, 8, 'rgba(249,115,22,0.05)', orange);
    drawText("CLAUDE 架构师", 1310, phase2Y + 40, '', 20, 'bold', orange);
    drawText("API 契约 (8端点) · 技术选型", 1310, phase2Y + 70, '', 14, 'normal', textDim);

    // Arrow 2 to 3
    ctx.strokeStyle = blue;
    ctx.beginPath(); ctx.moveTo(960, phase2Y + 140); ctx.lineTo(960, phase3Y); ctx.stroke();

    // Node: Generation (Frontend + Backend)
    roundedRect(ctx, 300, phase3Y, 600, 120, 8, 'rgba(59,130,246,0.05)', blue);
    drawText("FRONTEND GENERATION", 330, phase3Y + 30, '', 14, 'bold', blue);
    drawText("React + Echarts 集群", 330, phase3Y + 55, '', 22, 'bold', textBright);
    drawText("App.jsx 组件化 / 响应式 Tailwind / 主题图表", 330, phase3Y + 85, '', 14, 'normal', textDim);

    roundedRect(ctx, 1020, phase3Y, 600, 120, 8, 'rgba(59,130,246,0.05)', blue);
    drawText("BACKEND GENERATION", 1050, phase3Y + 30, '', 14, 'bold', blue);
    drawText("Srping Boot 3 核心", 1050, phase3Y + 55, '', 22, 'bold', textBright);
    drawText("Controller / CloudApiClient / Mock 服务 / Result<T> 封装", 1050, phase3Y + 85, '', 14, 'normal', textDim);

    drawText("← 契约桥接 →", 960, phase3Y + 50, '', 12, 'bold', green, 'center');

    // Arrows 3 to 4
    ctx.strokeStyle = purple;
    ctx.beginPath(); ctx.moveTo(600, phase3Y + 120); ctx.lineTo(600, phase4Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1320, phase3Y + 120); ctx.lineTo(1320, phase4Y); ctx.stroke();

    // Node: Verification & Security
    roundedRect(ctx, 400, phase4Y, 400, 120, 8, 'rgba(139,92,246,0.05)', purple);
    drawText("PHASE 04: 防御与重构", 430, phase4Y + 30, '', 14, 'bold', purple);
    drawText("安全审查与修复", 430, phase4Y + 55, '', 22, 'bold', textBright);
    drawText("10 项全量扫描修复 / 全局越界保护", 430, phase4Y + 85, '', 14, 'normal', textDim);

    // Node: Output
    roundedRect(ctx, 1120, phase4Y, 400, 120, 8, 'rgba(16,185,129,0.05)', green, green);
    drawText("OUTPUT / RESULT", 1150, phase4Y + 30, '', 14, 'bold', green);
    drawText("云接驳交付", 1150, phase4Y + 55, '', 22, 'bold', textBright);
    drawText("自动生成 cloud_API_doc.md / 系统闭环交付", 1150, phase4Y + 85, '', 14, 'normal', textBright);

    // Cross connection
    ctx.strokeStyle = purple;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(800, phase4Y + 60); ctx.lineTo(1120, phase4Y + 60); ctx.stroke();
    ctx.setLineDash([]);
    drawText("联调验证通过", 960, phase4Y + 40, '', 12, 'bold', purple, 'center');

    // Badge markers randomly distributed like stars/code trace elements
    ctx.fillStyle = cyan;
    ctx.fillRect(1800, 100, 8, 8);
    ctx.fillStyle = orange;
    ctx.fillRect(1820, 120, 8, 8);
    ctx.fillStyle = purple;
    ctx.fillRect(180, 1000, 8, 8);
    
    // Write purely visual technical jargon
    drawText("SYS_MEM: 0x8F22A // LATENCY: 0.04ms", 1580, 1020, '', 10, 'normal', textDim);
    drawText("OP_EXEC: GENERATION_COMPLETE", 1580, 1040, '', 10, 'bold', green);

    // Save to file
    const outPath = path.join(__dirname, 'assets', 'ai-flow-architecture.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log('Saved architecture diagram to:', outPath);
}

drawCanvas();
