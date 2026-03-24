import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { api } from '../services/api';
import { buildMockRevenue, REVENUE_PRESETS } from './mockRevenueData';
import {
  buildTrendOption,
  buildDonutOption,
  buildTopSitesOption,
  buildRevenueHeatmapOption,
} from './revenueChartOptions';
import './revenueCockpit.css';

function normalizePayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (
    raw.trend &&
    raw.businessMix &&
    raw.topSites &&
    raw.heatmap &&
    typeof raw.totalRevenue === 'number'
  ) {
    return {
      totalRevenue: raw.totalRevenue,
      avgOrderValue: raw.avgOrderValue ?? 0,
      trend: raw.trend,
      businessMix: raw.businessMix,
      topSites: raw.topSites,
      heatmap: raw.heatmap,
      heatmapDayLabels: raw.heatmapDayLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    };
  }
  return null;
}

export default function RevenueCockpit() {
  const [sites, setSites] = useState([]);
  const [siteId, setSiteId] = useState('');
  const [preset, setPreset] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromMock, setFromMock] = useState(false);

  useEffect(() => {
    api.getSites().then(setSites).catch(() => setSites([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getRevenueCockpit(siteId, preset)
      .then((raw) => {
        if (cancelled) return;
        const n = normalizePayload(raw);
        if (n) {
          setData(n);
          setFromMock(false);
        } else {
          setData(buildMockRevenue(preset));
          setFromMock(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData(buildMockRevenue(preset));
        setFromMock(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId, preset]);

  if (loading || !data) {
    return (
      <div className="revenue-cockpit flex items-center justify-center text-amber-200/80">
        加载营收数据…
      </div>
    );
  }

  const trendTitle =
    preset === '30d' ? '营收趋势图（近30天）' : `营收趋势图（${REVENUE_PRESETS.find((p) => p.value === preset)?.label || preset}）`;

  return (
    <div className="revenue-cockpit px-4 pb-8 pt-4 font-sans">
      <header className="revenue-title-bar mb-6 py-3 px-2 rounded-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-center text-lg md:text-xl font-semibold tracking-widest text-amber-100/95 md:flex-1">
            移动储能机器人 · 营收分析驾驶舱
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <label className="text-amber-200/50">站点选择</label>
            <select
              className="rounded border border-amber-600/40 bg-slate-950/80 px-3 py-1.5 text-amber-100 outline-none focus:border-amber-400/60"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">全部站点</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label className="text-amber-200/50">时间范围</label>
            <select
              className="rounded border border-amber-600/40 bg-slate-950/80 px-3 py-1.5 text-amber-100 outline-none focus:border-amber-400/60"
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
            >
              {REVENUE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {fromMock && (
          <p className="mt-2 text-center text-xs text-amber-200/40">
            当前为演示数据（后端 /api/revenue/cockpit 不可用或未返回结构化数据时自动回退）
          </p>
        )}
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="gold-frame">
            <div className="gold-frame-inner flex flex-col items-center justify-center py-8">
              <p className="text-sm text-amber-200/60">总营收</p>
              <p className="revenue-kpi-value mt-2 text-4xl font-bold text-amber-300 md:text-5xl">
                ¥ {data.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="gold-frame">
            <div className="gold-frame-inner flex flex-col items-center justify-center py-8">
              <p className="text-sm text-amber-200/60">客单价</p>
              <p className="revenue-kpi-value mt-2 text-4xl font-bold text-amber-300 md:text-5xl">
                ¥ {data.avgOrderValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* 原型：中间行左宽右窄 — 趋势 ~2/3，环形 ~1/3 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="gold-frame lg:col-span-8">
            <div className="gold-frame-inner">
              <h3 className="mb-2 border-l-2 border-amber-400 pl-2 text-sm font-semibold text-amber-100/90">
                {trendTitle}
              </h3>
              <ReactECharts option={buildTrendOption(data.trend)} style={{ height: 300 }} />
            </div>
          </div>
          <div className="gold-frame lg:col-span-4">
            <div className="gold-frame-inner">
              <h3 className="mb-2 border-l-2 border-amber-400 pl-2 text-sm font-semibold text-amber-100/90">
                业务营收占比（预约 / 送电 / 应急）
              </h3>
              <ReactECharts option={buildDonutOption(data.businessMix)} style={{ height: 300 }} />
            </div>
          </div>
        </div>

        {/* 底行等高：grid stretch + 左右列 flex 填充满，底边对齐 */}
        <div className="revenue-bottom-row grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <div className="gold-frame flex min-h-0 flex-col lg:col-span-4">
            <div className="gold-frame-inner flex min-h-0 flex-1 flex-col">
              <h3 className="mb-2 shrink-0 border-l-2 border-amber-400 pl-2 text-sm font-semibold text-amber-100/90">
                TOP 5 高营收站点排名
              </h3>
              <div className="revenue-top5-chart min-h-[280px] w-full flex-1">
                <ReactECharts
                  option={buildTopSitesOption(data.topSites)}
                  style={{ width: '100%', height: '100%' }}
                  opts={{ renderer: 'canvas' }}
                  onChartReady={(c) => requestAnimationFrame(() => c.resize())}
                />
              </div>
            </div>
          </div>
          <div className="gold-frame revenue-heatmap-rail flex min-h-0 flex-col lg:col-span-8">
            <div className="gold-frame-inner flex min-h-0 flex-1 flex-col">
              <h3 className="mb-2 shrink-0 border-l-2 border-amber-400 pl-2 text-sm font-semibold text-amber-100/90">
                时段营收热力图（24 小时 × 周）
              </h3>
              <div className="revenue-heatmap-chart flex min-h-0 flex-1 flex-col">
                <div className="revenue-heatmap-echarts-wrap min-h-[400px] w-full flex-1">
                  <ReactECharts
                    option={buildRevenueHeatmapOption(data.heatmap, data.heatmapDayLabels)}
                    style={{ width: '100%', height: '100%' }}
                    opts={{ renderer: 'canvas' }}
                    onChartReady={(c) => requestAnimationFrame(() => c.resize())}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
