const GOLD = '#d4a853';
const GOLD_DIM = 'rgba(212,168,83,0.35)';

export function buildTrendOption(trend) {
  const dates = trend.map((t) => t.dateLabel);
  const bar = trend.map((t) => t.revenue);
  const line = trend.map((t) => t.revenue);
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['日营收', '趋势线'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
    },
    grid: { left: 48, right: 16, top: 36, bottom: 28 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#64748b', fontSize: 10, rotate: dates.length > 14 ? 40 : 0 },
      axisLine: { lineStyle: { color: '#2a3f5c' } },
    },
    yAxis: {
      type: 'value',
      name: '营收(元)',
      nameTextStyle: { color: '#64748b', fontSize: 11 },
      axisLabel: { color: '#64748b', fontSize: 10 },
      splitLine: { lineStyle: { color: '#1a3350', type: 'dashed' } },
    },
    series: [
      {
        name: '日营收',
        type: 'bar',
        barMaxWidth: 14,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1e3a8a' },
            ],
          },
        },
        data: bar,
      },
      {
        name: '趋势线',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2, color: GOLD },
        itemStyle: { color: GOLD },
        data: line,
      },
    ],
  };
}

export function buildDonutOption(mix) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 4,
      top: 'middle',
      textStyle: { color: '#94a3b8', fontSize: 10 },
    },
    series: [{
      type: 'pie',
      // 右侧约 1/3 栏：饼略靠左、略缩小，给图例留空，贴近原型
      radius: ['40%', '62%'],
      center: ['44%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#0a0f1a', borderWidth: 2 },
      label: { color: '#cbd5e1', formatter: '{b}\n¥{c}' },
      data: [
        { value: mix[0].value, name: mix[0].name, itemStyle: { color: '#3b82f6' } },
        { value: mix[1].value, name: mix[1].name, itemStyle: { color: GOLD } },
        { value: mix[2].value, name: mix[2].name, itemStyle: { color: '#dc2626' } },
      ],
    }],
  };
}

export function buildTopSitesOption(topSites) {
  const names = topSites.map((s) => s.name).reverse();
  const vals = topSites.map((s) => s.revenue).reverse();
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 88, right: 24, top: 8, bottom: 8 },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748b', formatter: (v) => `¥${(v / 1000).toFixed(0)}k` },
      splitLine: { lineStyle: { color: '#1a3350' } },
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: '#94a3b8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: vals,
      barMaxWidth: 18,
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#b45309' },
            { offset: 1, color: GOLD },
          ],
        },
        borderRadius: [0, 4, 4, 0],
      },
      label: {
        show: true,
        position: 'right',
        color: GOLD_DIM,
        formatter: (p) => `¥${p.value.toLocaleString()}`,
      },
    }],
  };
}

export function buildRevenueHeatmapOption(heatmap, dayLabels) {
  const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
  const maxV = Math.max(...heatmap.map((x) => x[2]), 1);
  return {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      borderColor: 'rgba(212, 168, 83, 0.35)',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (p) => {
        const [dx, hy, v] = p.value;
        return `${dayLabels[dx]} ${hours[hy]}<br/>营收指数: ${v}`;
      },
    },
    /**
     * 视觉映射条必须放在绘图区外。横向 continuous 在部分版本下 itemWidth/itemHeight 语义易反，
     * 会渲染成「竖条压在网格中间」。改为右侧纵向条 + grid.right 留白，与原型一致。
     */
    grid: { left: 48, right: 56, top: 8, bottom: 40 },
    xAxis: {
      type: 'category',
      data: dayLabels,
      position: 'bottom',
      axisLine: { lineStyle: { color: 'rgba(212, 168, 83, 0.25)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#8899aa',
        fontSize: 11,
        margin: 10,
        fontWeight: 500,
      },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: hours,
      inverse: true,
      axisLine: { lineStyle: { color: 'rgba(212, 168, 83, 0.2)' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 3 },
      splitArea: { show: false },
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: maxV,
      calculable: false,
      orient: 'vertical',
      right: 4,
      top: 'middle',
      // 纵向条：itemWidth=条厚度（水平方向），itemHeight=条长度（竖直方向）
      itemWidth: 12,
      itemHeight: 200,
      padding: [0, 0, 0, 4],
      // text[0] 在 max 值一端，text[1] 在 min 值一端；inverse 后「低」在上「高」在下更贴近常见示意
      inverse: true,
      text: ['低', '高'],
      textStyle: { color: '#94a3b8', fontSize: 10 },
      inRange: {
        color: ['#0a1628', '#1f0a0c', '#7f1d1d', '#dc2626', '#ea580c', '#f59e0b', '#fde047', '#fffbeb'],
      },
      outOfRange: { color: ['#0a1628'] },
    },
    series: [{
      type: 'heatmap',
      data: heatmap,
      itemStyle: {
        borderWidth: 0.5,
        borderColor: 'rgba(5, 10, 20, 0.45)',
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: GOLD_DIM,
          borderColor: 'rgba(212, 168, 83, 0.5)',
        },
      },
    }],
  };
}
