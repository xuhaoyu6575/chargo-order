const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Colors matching "Clinical Geometric" philosophy (White Theme)
const bgWhite = '#f8fafc';       // Slate 50
const gridColor = '#e2e8f0';     // Slate 200
const cardBg = '#ffffff';        // Pure White
const shadowColor = 'rgba(15, 23, 42, 0.04)'; // Subtle shadow
const borderCard = '#cbd5e1';    // Slate 300
const textMain = '#0f172a';      // Slate 900
const textSub = '#64748b';       // Slate 500
const lineDefault = '#94a3b8';   // Slate 400

// Accent Colors (Flat, surgical precision)
const cyan = '#0ea5e9';
const blue = '#3b82f6';
const orange = '#f97316';
const purple = '#8b5cf6';
const green = '#10b981';

function drawCanvas() {
    // 1920x1080 canvas
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background (Pristine White)
    ctx.fillStyle = bgWhite;
    ctx.fillRect(0, 0, width, height);

    // 2. Structural Grid (Blueprint style)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 80) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Utility text drawing
    function drawText(text, x, y, fontSize, weight, color, align = 'left') {
        ctx.font = `${weight} ${fontSize}px "Segoe UI", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x, y);
    }

    // Clean white card with subtle shadow and crisp border
    function rigidCard(x, y, w, h, topAccentColor) {
        // Shadow
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 15;
        ctx.fillStyle = cardBg;
        ctx.fillRect(x, y, w, h);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Border
        ctx.strokeStyle = borderCard;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        // Top accent line (Surgical categorization)
        if (topAccentColor) {
            ctx.fillStyle = topAccentColor;
            ctx.fillRect(x, y, w, 4);
        }
    }

    // Orthogonal routing for perfect straight lines
    function drawOrthoLine(x1, y1, x2, y2, color = lineDefault, dashed = false) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([6, 6]);
        else ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        // If they are on the same line, just draw straight
        if (y1 === y2) {
            ctx.lineTo(x2, y2);
        } else {
            // Midpoint elbow routing
            const midX = x1 + (x2 - x1) / 2;
            ctx.lineTo(midX, y1);
            ctx.lineTo(midX, y2);
            ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Target dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x2, y2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Title
    drawText("AI 驱动全链路研发生态", 80, 80, 52, 'bold', textMain);
    drawText("CLINICAL ARCHITECTURE & SYMMETRIC WORKFLOW", 80, 150, 16, 'bold', textSub);

    // Box configurations
    const w = 320;
    const h = 140;
    
    // Columns X coordinates
    const c1x = 80;
    const c2x = 560;
    const c3x = 1040;
    const c4x = 1520;

    // Y coordinates
    const yCenter = 470; // (H=140, so center point is 470 + 70 = 540)
    const yTop = 350;    // (Center point is 420)
    const yBot = 590;    // (Center point is 660)

    // Routing ----------------------------------------------------
    // C1 to C2
    drawOrthoLine(c1x + w, 540, c2x, 420, cyan);
    drawOrthoLine(c1x + w, 540, c2x, 660, orange);

    // C2 to C3
    drawOrthoLine(c2x + w, 420, c3x, 420, blue);
    drawOrthoLine(c2x + w, 660, c3x, 660, blue);

    // C3 to C4
    drawOrthoLine(c3x + w, 420, c4x, 540, purple);
    drawOrthoLine(c3x + w, 660, c4x, 540, purple);


    // Draw Nodes -------------------------------------------------

    // COL 1: Input
    rigidCard(c1x, yCenter, w, h, textSub);
    drawText("PHASE 01: 需求捕获", c1x + 30, yCenter + 30, 12, 'bold', textSub);
    drawText("多模态输入源", c1x + 30, yCenter + 55, 24, 'bold', textMain);
    drawText("PRD 文档", c1x + 30, yCenter + 95, 14, 'bold', textSub);
    drawText("UI 原型截图 · DTO 定义", c1x + 100, yCenter + 95, 14, 'normal', textSub);

    // COL 2: AI Analysis
    // Cursor
    rigidCard(c2x, yTop, w, h, cyan);
    drawText("PHASE 02: 认知与转换", c2x + 30, yTop + 30, 12, 'bold', cyan);
    drawText("CURSOR 多模态理解", c2x + 30, yTop + 55, 24, 'bold', textMain);
    drawText("解析文档", c2x + 30, yTop + 95, 14, 'bold', textSub);
    drawText("提取计算逻辑 · 重建布局规范", c2x + 100, yTop + 95, 14, 'normal', textSub);

    // Claude
    rigidCard(c2x, yBot, w, h, orange);
    drawText("PHASE 02: 认知与转换", c2x + 30, yBot + 30, 12, 'bold', orange);
    drawText("CLAUDE 架构师", c2x + 30, yBot + 55, 24, 'bold', textMain);
    drawText("架构选型", c2x + 30, yBot + 95, 14, 'bold', textSub);
    drawText("API 契约 (8端点) · 前后端结构", c2x + 100, yBot + 95, 14, 'normal', textSub);

    // COL 3: Code Generation
    // Frontend
    rigidCard(c3x, yTop, w, h, blue);
    drawText("PHASE 03: 资产生成", c3x + 30, yTop + 30, 12, 'bold', blue);
    drawText("React + Echarts 集群", c3x + 30, yTop + 55, 24, 'bold', textMain);
    drawText("App.jsx", c3x + 30, yTop + 95, 14, 'bold', textSub);
    drawText("响应式 Tailwind · 主题图表", c3x + 95, yTop + 95, 14, 'normal', textSub);

    // Backend
    rigidCard(c3x, yBot, w, h, blue);
    drawText("PHASE 03: 资产生成", c3x + 30, yBot + 30, 12, 'bold', blue);
    drawText("Spring Boot 3 核心", c3x + 30, yBot + 55, 24, 'bold', textMain);
    drawText("服务层", c3x + 30, yBot + 95, 14, 'bold', textSub);
    drawText("Controller · CloudApiClient", c3x + 85, yBot + 95, 14, 'normal', textSub);

    // COL 4: Output / Verification
    rigidCard(c4x, yCenter, w, h, green);
    drawText("PHASE 04: 交付与结项", c4x + 30, yCenter + 30, 12, 'bold', green);
    drawText("防御修复与云接驳", c4x + 30, yCenter + 55, 24, 'bold', textMain);
    drawText("交付清单", c4x + 30, yCenter + 95, 14, 'bold', textSub);
    drawText("安全修复 · cloud_API_doc.md", c4x + 100, yCenter + 95, 14, 'normal', textSub);

    // Grid coordinates markers (Blueprint feel)
    drawText("+ 040 X_AXIS", c1x, yCenter - 25, 10, 'bold', textSub);
    drawText("+ 040 X_AXIS", c2x, yTop - 25, 10, 'bold', textSub);
    drawText("+ 040 X_AXIS", c2x, yBot - 25, 10, 'bold', textSub);
    drawText("+ 040 X_AXIS", c3x, yTop - 25, 10, 'bold', textSub);
    drawText("+ 040 X_AXIS", c3x, yBot - 25, 10, 'bold', textSub);
    drawText("+ 040 X_AXIS", c4x, yCenter - 25, 10, 'bold', textSub);

    // Tiny timestamp/signature
    drawText("DOC_ID: AIF-001 // SYSTEM GENERATED // PERFECT_ALIGNMENT", width - 80, height - 40, 10, 'bold', textSub, 'right');

    // Save to file
    const outPath = path.join(__dirname, 'assets', 'ai-flow-architecture-clean.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log('Saved clean architecture diagram to:', outPath);
}

drawCanvas();
