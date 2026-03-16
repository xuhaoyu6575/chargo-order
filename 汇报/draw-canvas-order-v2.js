const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Colors matching "Pragmatic Clarity" philosophy (White Theme w/ Corporate Blueprint feel)
const bgWhite = '#ffffff';       // Pure white background
const gridColor = '#f1f5f9';     // Slate 100 for very subtle grid
const cardBg = '#f8fafc';        // Slate 50 for cards
const shadowColor = 'rgba(15, 23, 42, 0.05)'; 
const borderCard = '#cbd5e1';    // Slate 300
const borderGate = '#3b82f6';    // Blue 500 for the AI Gateway

const textMain = '#0f172a';      // Slate 900
const textSub = '#64748b';       // Slate 500
const lineDefault = '#94a3b8';   // Slate 400

const blue = '#3b82f6';
const cyan = '#0ea5e9';
const green = '#10b981';

function drawCanvas() {
    const width = 1920;
    const height = 1080;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = bgWhite;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Utility text drawing
    function drawText(text, x, y, fontSize, weight, color, align = 'left') {
        ctx.font = `${weight} ${fontSize}px "Segoe UI", sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    function drawRoundedRect(x, y, w, h, radius) {
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
    }

    function drawNode(x, y, w, h, title, subtext, accentColor, align = 'left', customBorder = false) {
        // Shadow
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = cardBg;
        
        drawRoundedRect(x, y, w, h, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Border
        ctx.strokeStyle = customBorder ? accentColor : borderCard;
        ctx.lineWidth = customBorder ? 2 : 1;
        ctx.stroke();

        // Accent bar on the left
        if (!customBorder) {
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.moveTo(x + 8, y);
            ctx.lineTo(x + 12, y);
            ctx.lineTo(x + 12, y + h);
            ctx.lineTo(x + 8, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - 8);
            ctx.lineTo(x, y + 8);
            ctx.quadraticCurveTo(x, y, x + 8, y);
            ctx.fill();
        }

        // Text
        const textX = align === 'center' ? x + w/2 : x + (customBorder ? 30 : 40);
        const textY = y + h/2;
        
        if (align === 'center') {
            drawText(title, textX, textY - 12, 22, 'bold', textMain, 'center');
            drawText(subtext, textX, textY + 16, 14, 'normal', textSub, 'center');
        } else {
            drawText(title, textX, textY - 10, 20, 'bold', textMain);
            drawText(subtext, textX, textY + 16, 14, 'normal', textSub);
        }
    }

    function drawGateway(x, y, w, h, title, subtext) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#f0f9ff'; // Very light blue
        drawRoundedRect(x, y, w, h, 12);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#bae6fd'; // Light blue border
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Vertical text drawing setup
        ctx.save();
        ctx.translate(x + w/2 - 10, y + h/2);
        ctx.rotate(-Math.PI / 2);
        drawText(title, 0, 0, 32, 'bold', cyan, 'center');
        ctx.restore();

        ctx.save();
        ctx.translate(x + w/2 + 25, y + h/2);
        ctx.rotate(-Math.PI / 2);
        drawText(subtext, 0, 0, 16, 'normal', textSub, 'center');
        ctx.restore();
    }

    function drawDashedBox(x, y, w, h) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        drawRoundedRect(x, y, w, h, 16);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Label for the dashed group
        ctx.fillStyle = '#e2e8f0';
        drawRoundedRect(x, y - 30, 200, 30, 8);
        ctx.fill();
        drawText("AI 辅助交付流 (Delivery Workflow)", x + 10, y - 15, 12, 'bold', textSub);
    }

    function drawArrow(x1, y1, x2, y2, color, thickness) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 12;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawOrthoPath(x1, y1, x2, y2, color, thickness) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        const midX = x1 + (x2 - x1) / 2;
        ctx.lineTo(midX, y1);
        ctx.lineTo(midX, y2);
        ctx.lineTo(x2 - 10, y2); // Stop short for arrow head
        ctx.stroke();

        // Arrow head at (x2, y2) pointing RIGHT
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 10, y2 - 6);
        ctx.lineTo(x2 - 10, y2 + 6);
        ctx.fillStyle = color;
        ctx.fill();
    }


    // Content Coordinates
    const col1X = 100;
    const col2X = 380;
    const col3X = 820;  // Gateway
    const col4X = 1100;
    const col5X = 1520;

    const w = 280;
    const h = 80;

    const yCenters = [300, 440, 580, 720];
    const totalCenter = 510;

    // Headings
    drawText("AI 驱动全生命周期效能重构", 100, 70, 48, 'bold', textMain);
    drawText("以「订单业务报表」替换场景为例，展示从旧有资产到系统重构的五步演进流程。参考《AI研发架构图_v1》及架构哲学设定的 V2 版本。", 100, 130, 18, 'normal', textSub);

    // Columns Labels
    const colY = 170;
    drawText("STAGE 1 / 原点 (Origin)", col1X, colY, 14, 'bold', textSub);
    drawText("STAGE 2 / 输入层 (Inputs Zone)", col2X, colY, 14, 'bold', textSub);
    drawText("STAGE 3 / AI 实验网关 (AI Gateway)", col3X, colY, 14, 'bold', cyan);
    drawText("STAGE 4 / 交付流水线 (Workflow Pipeline)", col4X, colY, 14, 'bold', textSub);
    drawText("STAGE 5 / 成效落地 (Outcome)", col5X, colY, 14, 'bold', green);

    // -------------------------------------------------------------
    // ROUTING LINES (Draw these under the nodes)
    // -------------------------------------------------------------
    
    // Origin -> Inputs 
    // We branch out from Col1 right edge to Col2 left edge
    const r1X = col1X + w;
    const r2L = col2X;
    
    yCenters.forEach(centerY => {
        drawOrthoPath(r1X, totalCenter, r2L, centerY, blue, 2);
    });

    // Inputs -> AI Gateway
    const r2R = col2X + w;
    const r3L = col3X;
    yCenters.forEach(centerY => {
        drawArrow(r2R, centerY, r3L, centerY, cyan, 2);
    });

    // AI Gateway -> Workflow
    // Single massive arrow coming out of the gateway, hitting the Dashed Box
    const r3R = col3X + 100; // Gateway width is 100
    const r4L = col4X - 40; // Aiming towards dashed box
    drawArrow(r3R, totalCenter, r4L, totalCenter, cyan, 6);

    // Within Workflow (Vertical sequence inside col 4)
    for(let i=0; i<3; i++) {
        drawArrow(col4X + w/2, yCenters[i] + h/2, col4X + w/2, yCenters[i+1] - h/2, lineDefault, 2);
    }

    // Workflow -> Outcome
    // Arrow from Dashbox right edge to Col5
    const r4R = col4X + w + 40;
    const r5L = col5X;
    drawArrow(r4R, totalCenter, r5L, totalCenter, green, 3);


    // -------------------------------------------------------------
    // DRAW NODES
    // -------------------------------------------------------------

    // Col 1: Origin
    drawNode(col1X, totalCenter - h/2, w, h, "运营管理总线", "遗留的 BOSS 系统数据源", blue, 'center');

    // Col 2: Platform Inputs (Parallel)
    drawNode(col2X, yCenters[0] - h/2, w, h, "订单业务需求文档", "历史业务分析 PRD", blue);
    drawNode(col2X, yCenters[1] - h/2, w, h, "大盘 UI 原型截图", "高保真设计视觉稿", blue);
    drawNode(col2X, yCenters[2] - h/2, w, h, "历史看板数据源", "原有报表导出的假数据", blue);
    drawNode(col2X, yCenters[3] - h/2, w, h, "API 数据字典", "BOSS系统旧接口参数表", blue);

    // Col 3: AI Gateway (Vertical bar spanning the height)
    drawGateway(col3X, yCenters[0] - h/2, 120, (yCenters[3] + h/2) - (yCenters[0] - h/2), "大模型研发引擎", "Cursor IDE · Claude Code CLI · 多模态感知交互");

    // Col 4: Workflow Pipeline (Sequential)
    // Draw the dashed container first
    const dashPadding = 40;
    drawDashedBox(col4X - dashPadding, yCenters[0] - h/2 - dashPadding, w + dashPadding*2, (yCenters[3] + h/2) - (yCenters[0] - h/2) + dashPadding*2);

    drawNode(col4X, yCenters[0] - h/2, w, h, "AI 代码重构", "React / Tailwind / Echarts 生成", cyan);
    drawNode(col4X, yCenters[1] - h/2, w, h, "服务端点联调", "Spring Boot 3 + 自动化 Mock", cyan);
    drawNode(col4X, yCenters[2] - h/2, w, h, "系统级集成验证", "前后端接口全栈协同测试", cyan);
    drawNode(col4X, yCenters[3] - h/2, w, h, "现代仪表盘上线", "全响应式大屏幕看板发布部署", cyan);

    // Col 5: Outcome
    drawNode(col5X, totalCenter - h/2, w, h, "手工拉表模式全面下线", "完成系统替代跨越", green, 'center', true);

    // Signature
    drawText("DOC_ID: ARCH-V2-ORDER // CANVAS_DESIGN // GENERATED", width - 80, height - 40, 11, 'bold', textSub, 'right');

    // Make sure assets folder exists
    const outDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(__dirname, 'AI研发架构图_v2.png'); // Saving directly to 汇报 dir as requested
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log('Saved Architecture Diagram v2 to:', outPath);
}

drawCanvas();
