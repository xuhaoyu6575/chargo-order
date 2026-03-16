import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Clock } from 'lucide-react';
import { api } from './services/api';

// --------------- ECharts option builders (data-driven) ---------------

function buildCompletionOption(data) {
  const { satisfied, unsatisfied, rate } = data;
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      formatter: (name) => {
        const map = {
          '已满足(≥预估)': satisfied.toLocaleString(),
          '未满足(<预估)': unsatisfied.toLocaleString(),
        };
        return `${name}: ${map[name] || ''}`;
      },
    },
    series: [{
      type: 'pie',
      radius: ['55%', '80%'],
      center: ['30%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#0a1929', borderWidth: 3 },
      label: {
        show: true, position: 'center',
        formatter: rate, fontSize: 32, color: '#ffffff', fontWeight: 'bold',
      },
      emphasis: { label: { show: true, fontSize: 34, fontWeight: 'bold' } },
      data: [
        { value: satisfied, name: '已满足(≥预估)', itemStyle: { color: '#10b981' } },
        { value: unsatisfied, name: '未满足(<预估)', itemStyle: { color: '#f59e0b' } },
      ],
    }],
  };
}

const REASON_COLORS = ['#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ef4444', '#f97316'];

function buildEndReasonOption(reasons) {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
    legend: {
      orient: 'vertical', right: 10, top: 'middle',
      textStyle: { color: '#94a3b8', fontSize: 11 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie', radius: ['0%', '70%'], center: ['35%', '50%'],
      label: { show: true, formatter: '{b} ({d}%)', color: '#cbd5e1', fontSize: 11 },
      labelLine: { lineStyle: { color: '#334155' } },
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
      data: reasons.map((r, i) => ({
        value: r.value,
        name: r.name,
        itemStyle: { color: REASON_COLORS[i % REASON_COLORS.length] },
      })),
    }],
  };
}

function buildHeatmapCellOption(heatmapData) {
  const STEPS = 48;
  const slotLabels = Array.from({ length: STEPS }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = (i % 2) * 30;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return {
    animation: false,
    tooltip: {
      appendToBody: true, position: 'top',
      formatter: (p) => `${days[p.value[1]]} ${slotLabels[p.value[0]]}<br/>订单数: ${p.value[2]}`,
    },
    grid: { top: 10, bottom: 40, left: 50, right: 20 },
    xAxis: {
      type: 'category', data: slotLabels,
      axisLabel: { show: false }, axisLine: { show: false },
      axisTick: { show: false }, splitLine: { show: false },
    },
    yAxis: {
      type: 'category', data: days, inverse: true,
      axisLabel: { show: false }, axisLine: { show: false },
      axisTick: { show: false }, splitLine: { show: false },
    },
    visualMap: {
      // max 设为 55：峰值格子归一化后约 55 即触顶变白热，
      // 使中等密度区域也能显示橙黄，光晕层次更丰富
      min: 0, max: 55, show: false,
      inRange: {
        // 暖色系：底色 → 深红 → 红 → 橙红 → 橙 → 亮黄 → 白热
        color: [
          '#06162d', // 0   深蓝底色（与背景融合）
          '#1a0404', // 4   暗红黑
          '#4a0808', // 10  深暗红
          '#840e0e', // 18  暗红
          '#be1818', // 26  标准红
          '#e62222', // 32  亮红
          '#f04010', // 38  红橙
          '#f06c00', // 44  深橙
          '#f0a000', // 48  橙黄
          '#f8d000', // 52  金黄
          '#ffee60', // 54  亮黄
          '#ffffff', // 55  白热（核心峰值）
        ],
      },
    },
    series: [{ type: 'heatmap', data: heatmapData, itemStyle: { borderWidth: 0 } }],
  };
}

function getHeatmapAxisOption() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return {
    animation: false,
    grid: { top: 10, bottom: 40, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 48 }, (_, i) => {
        const h = Math.floor(i / 2);
        return `${h.toString().padStart(2, '0')}:${((i % 2) * 30).toString().padStart(2, '0')}`;
      }),
      axisLabel: {
        color: '#64748b', fontSize: 10,
        interval: (idx) => idx % 6 === 0,
        formatter: (val) => val.replace(':30', ':00'),
      },
      axisLine: { lineStyle: { color: '#1a3350' } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#1a3350', width: 0.5 }, interval: (idx) => idx % 2 === 0 },
    },
    yAxis: {
      type: 'category', data: days, inverse: true,
      axisLabel: { color: '#8899aa', fontSize: 11 },
      axisLine: { lineStyle: { color: '#1a3350' } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#1a3350', width: 0.5 } },
    },
    series: [],
  };
}

const STAGE_COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#10b981', '#f97316'];
const SUB_PROCESS_MAP = {
  响应耗时: '派单-下单',
  行驶耗时: '到达-派单',
  插枪耗时: '插枪-到达',
  充电耗时: '充电完成-插枪',
  拔枪耗时: '拔枪-充电完成',
};

function buildProcessTimeOption(stages) {
  return {
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params) =>
        params.map((p) => `${p.seriesName}: ${p.value}分钟`).join('<br/>'),
    },
    legend: { show: false },
    grid: { top: 4, bottom: 4, left: 0, right: 0, containLabel: false },
    xAxis: { type: 'value', show: false, max: (v) => v.max * 1.02 },
    yAxis: { type: 'category', show: false, data: [''] },
    series: stages.map((s, i) => ({
      name: `${s.name}(${s.value}m)`,
      type: 'bar',
      stack: 'total',
      barWidth: 28,
      barGap: 0,
      data: [s.value],
      itemStyle: {
        color: STAGE_COLORS[i % STAGE_COLORS.length],
        borderRadius: 0,
      },
      label: {
        show: true,
        position: 'inside',
        formatter: `${s.value}m`,
        color: '#fff',
        fontSize: 11,
        fontWeight: 500,
      },
    })),
  };
}

const CANCEL_COLORS = ['#06b6d4', '#6366f1', '#10b981'];

function buildCancelAnalysisOption(types) {
  const total = types.reduce((s, t) => s + t.value, 0);
  return {
    tooltip: { trigger: 'item', formatter: (p) => `${p.name}: ${p.value} (${p.percent}%)` },
    legend: { show: false },
    series: [{
      type: 'pie',
      radius: ['38%', '72%'],
      center: ['50%', '50%'],
      label: { show: false },
      emphasis: { scale: true, scaleSize: 6, itemStyle: { shadowBlur: 12, shadowColor: 'rgba(0,0,0,0.4)' } },
      data: types.map((t, i) => ({
        value: t.value,
        name: t.name,
        itemStyle: { color: CANCEL_COLORS[i % CANCEL_COLORS.length] },
      })),
    }],
  };
}

const FREQ_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

function buildUserFrequencyOption(freqData) {
  return {
    tooltip: { trigger: 'axis', formatter: '{b}: {c}人' },
    grid: { top: 30, bottom: 30, left: 50, right: 20 },
    xAxis: {
      type: 'category',
      data: freqData.map((d) => d.label),
      axisLabel: { color: '#94a3b8', fontSize: 12 },
      axisLine: { lineStyle: { color: '#1e3a5f' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: (v) => Math.ceil(v.max / 200) * 200,
      splitNumber: 5,
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#1e3a5f', type: 'dashed' } },
      axisLine: { show: false },
    },
    series: [{
      type: 'bar', barWidth: 40,
      data: freqData.map((d, i) => ({
        value: d.value,
        itemStyle: { color: FREQ_COLORS[i % FREQ_COLORS.length] },
      })),
      label: { show: true, position: 'top', color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' },
    }],
  };
}

// --------------- Process Time Chart (pure HTML/CSS) ---------------

function ProcessTimeChart({ processTime }) {
  const stages = processTime.stages;
  const total = stages.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const containerRef = React.useRef(null);
  const [lines, setLines] = React.useState([]);

  const cumPct = React.useMemo(() => {
    const arr = [0];
    stages.forEach((s, i) => {
      arr.push(arr[i] + ((s.value || 0) / total) * 100);
    });
    return arr;
  }, [stages, total]);

  React.useEffect(() => {
    const recalc = () => {
      const container = containerRef.current;
      if (!container) return;
      const bar = container.querySelector('[data-bar]');
      const labelRow = container.querySelector('[data-labels]');
      if (!bar || !labelRow) return;

      const cw = bar.offsetWidth;
      const barRect = bar.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const barBottom = barRect.bottom - containerRect.top;
      const labelCells = labelRow.querySelectorAll('[data-label-cell]');

      const newLines = stages.map((s, i) => {
        const segStartPx = (cumPct[i] / 100) * cw;
        const segWidthPx = ((s.value || 0) / total) * cw;
        const segCenterX = barRect.left - containerRect.left + segStartPx + segWidthPx / 2;

        let labelCenterX = segCenterX;
        if (labelCells[i]) {
          const cellRect = labelCells[i].getBoundingClientRect();
          labelCenterX = cellRect.left - containerRect.left + cellRect.width / 2;
        }

        const labelTop = labelRow.getBoundingClientRect().top - containerRect.top;
        const bendY = barBottom + (labelTop - barBottom) * 0.55;

        return { segCenterX, labelCenterX, barBottom, bendY, labelTop };
      });
      setLines(newLines);
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [stages, total, cumPct, processTime]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* 顶部测量标注线: ├── 平均：57分钟 ──┤ */}
      <div className="flex items-center mb-3 px-0.5">
        <div className="w-px h-2.5 bg-gray-500/70" />
        <div className="flex-1 h-px bg-gray-500/70" />
        <span className="text-gray-400 text-xs px-3 whitespace-nowrap leading-none">
          平均：{processTime.avgTotal}分钟
        </span>
        <div className="flex-1 h-px bg-gray-500/70" />
        <div className="w-px h-2.5 bg-gray-500/70" />
      </div>

      {/* 堆叠条形图 - 纯 flexbox */}
      <div data-bar className="flex h-8 overflow-hidden">
        {stages.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center justify-center text-white text-[11px] font-semibold select-none"
            style={{
              width: `${((s.value || 0) / total) * 100}%`,
              backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length],
              minWidth: 0,
            }}
          >
            {s.value >= 2 ? `${s.value}m` : ''}
          </div>
        ))}
      </div>

      {/* L 形连接线 (绝对定位 SVG，使用 ref 精确计算) */}
      {lines.length > 0 && (
        <svg
          className="absolute left-0 top-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible' }}
        >
          {lines.map((l, i) => (
            <path
              key={i}
              d={`M ${l.segCenterX} ${l.barBottom} V ${l.bendY} H ${l.labelCenterX} V ${l.labelTop}`}
              fill="none"
              stroke="rgba(148,163,184,0.45)"
              strokeWidth="1"
            />
          ))}
        </svg>
      )}

      {/* 标签区域：等宽列分布 */}
      <div data-labels className="flex mt-10">
        {stages.map((s, i) => (
          <div
            key={s.name}
            data-label-cell
            className="flex-1 flex flex-col items-center min-w-0"
          >
            <div className="flex items-center gap-1 text-[11px] text-gray-300 whitespace-nowrap">
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
              />
              <span>{s.name}({s.value}m)</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">
              {s.subProcess || SUB_PROCESS_MAP[s.name] || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Circuit board background applied via .pcb-bg class in index.css

// --------------- Dashboard component ---------------

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [endReasons, setEndReasons] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [processTime, setProcessTime] = useState(null);
  const [cancelData, setCancelData] = useState(null);
  const [userFreq, setUserFreq] = useState(null);

  useEffect(() => {
    api.getSites().then(setSites).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStats(siteId, days),
      api.getCompletionRate(siteId, days),
      api.getEndReasons(siteId, days),
      api.getHeatmap(siteId, days),
      api.getProcessTime(siteId, days),
      api.getCancelAnalysis(siteId, days),
      api.getUserFrequency(siteId, days),
    ])
      .then(([s, c, er, hm, pt, ca, uf]) => {
        setStats(s);
        setCompletion(c);
        setEndReasons(er);
        setHeatmap(hm);
        setProcessTime(pt);
        setCancelData(ca);
        setUserFreq(uf);
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setLoading(false));
  }, [siteId, days]);

  if (loading) {
    return (
      <div className="pcb-bg min-h-screen flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="pcb-bg min-h-screen text-white p-6 font-sans">
      {/* Vignette overlay for depth */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 0%, rgba(2,8,18,0.45) 100%)' }}
      />
      {/* Header */}
      <div className="relative flex justify-between items-center mb-6 border-b border-cyan-900/60 pb-4">
        <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          移动储能机器人运营中心
        </h1>
        <div className="flex gap-4 items-center text-sm">
          <label className="text-gray-400">站点选择：</label>
          <select
            className="bg-[#0b223d] border border-cyan-800 px-3 py-1 rounded text-cyan-300 outline-none focus:border-cyan-500"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          >
            <option value="">全部站点</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <label className="text-gray-400">时间范围：</label>
          <select
            className="bg-[#0b223d] border border-cyan-800 px-3 py-1 rounded text-cyan-300 outline-none focus:border-cyan-500"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>最近7天</option>
            <option value={30}>最近30天</option>
          </select>
        </div>
      </div>

      {/* Top Stats */}
      {stats && (
        <div className="relative grid grid-cols-3 gap-6 mb-6">
          <StatCard label="总订单量" value={stats.totalOrders.toLocaleString()} />
          <StatCard label="总充电度数" value={stats.totalKwh.toLocaleString()} unit="kWh" />
          <StatCard label="活跃机器人" value={stats.activeRobots.toLocaleString()} />
        </div>
      )}

      {/* Charts Grid */}
      <div className="relative grid grid-cols-12 gap-6 mb-6">
        {/* Row 1 */}
        <ChartCard title="完单率（基于预估度数）" span={4}>
          {completion && <ReactECharts option={buildCompletionOption(completion)} style={{ height: '220px' }} />}
        </ChartCard>
        <ChartCard title="结束充电原因分布" span={8}>
          {endReasons && <ReactECharts option={buildEndReasonOption(endReasons)} style={{ height: '220px' }} />}
        </ChartCard>

        {/* Row 2 */}
        <ChartCard title="24小时订单热力分布" span={6}>
          {heatmap && (
            <div className="relative" style={{ height: '260px' }}>
              <div className="absolute inset-0" style={{ filter: 'blur(20px)' }}>
                <ReactECharts option={buildHeatmapCellOption(heatmap)} style={{ height: '260px' }} />
              </div>
              <div className="absolute inset-0 pointer-events-none">
                <ReactECharts option={getHeatmapAxisOption()} style={{ height: '260px' }} />
              </div>
            </div>
          )}
        </ChartCard>
        <ChartCard title="平均服务流程耗时（堆叠条形图）" span={6}>
          {processTime && <ProcessTimeChart processTime={processTime} />}
        </ChartCard>

        {/* Row 3 */}
        <ChartCard title="订单取消分析" span={6}>
          {cancelData && (
            <div className="flex items-stretch gap-4" style={{ height: '200px' }}>
              {/* 饼图 */}
              <div className="w-[160px] shrink-0">
                <ReactECharts option={buildCancelAnalysisOption(cancelData.types)} style={{ height: '200px' }} />
              </div>
              {/* 图例列表 */}
              <div className="flex flex-col justify-center gap-3 flex-1">
                {cancelData.types.map((t, i) => {
                  const total = cancelData.types.reduce((s, x) => s + x.value, 0);
                  const pct = total ? Math.round((t.value / total) * 100) : 0;
                  return (
                    <div key={t.name} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CANCEL_COLORS[i] }} />
                      <span className="text-gray-300 text-sm">{t.name}</span>
                      <span className="ml-auto text-cyan-400 text-sm font-semibold tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
              {/* 分隔线 */}
              <div className="w-px bg-cyan-900/40 self-stretch" />
              {/* 平均耗时 stat */}
              <div className="flex flex-col items-center justify-center gap-2 px-4 shrink-0">
                <span className="text-gray-400 text-xs whitespace-nowrap">买家取消平均耗时</span>
                <div className="flex items-end gap-1.5">
                  <Clock className="w-5 h-5 text-cyan-400 mb-0.5" />
                  <span className="text-4xl font-bold text-cyan-300 tabular-nums leading-none">
                    {cancelData.avgCancelMinutes}
                  </span>
                  <span className="text-sm text-cyan-500 mb-0.5">分钟</span>
                </div>
              </div>
            </div>
          )}
        </ChartCard>
        <ChartCard
          title="用户充电频次（忠诚度）"
          span={6}
          extra={userFreq && <span className="text-gray-400 text-xs">全人用户：{userFreq.totalUsers.toLocaleString()}</span>}
        >
          {userFreq && <ReactECharts option={buildUserFrequencyOption(userFreq.data)} style={{ height: '220px' }} />}
        </ChartCard>
      </div>
    </div>
  );
};

function StatCard({ label, value, unit }) {
  return (
    <div className="relative bg-[#0a1e38]/80 backdrop-blur-sm border border-cyan-800/40 rounded-lg p-5 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.06),0_4px_20px_rgba(0,0,0,0.3)]">
      <p className="text-gray-400 text-sm">{label}：</p>
      <p className="text-3xl font-mono font-bold text-cyan-400">
        {value}
        {unit && <span className="text-lg text-cyan-600 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function ChartCard({ title, span, children, extra }) {
  const colSpan = {
    4: 'col-span-4',
    6: 'col-span-6',
    8: 'col-span-8',
    12: 'col-span-12',
  }[span] || 'col-span-6';

  return (
    <div className={`${colSpan} relative bg-[#0a1e38]/80 backdrop-blur-sm p-4 rounded-lg border border-cyan-800/40 shadow-[0_0_15px_rgba(6,182,212,0.06),0_4px_20px_rgba(0,0,0,0.3)]`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold border-l-2 border-cyan-400 pl-2">{title}</h3>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default Dashboard;
