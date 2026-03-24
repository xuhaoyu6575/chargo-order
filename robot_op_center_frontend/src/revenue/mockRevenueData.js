/** 营收驾驶舱 mock（后端 /api/revenue/cockpit 未就绪时使用） */

export const REVENUE_PRESETS = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: 'mtd', label: '本月至今' },
];

function daysForPreset(preset) {
  switch (preset) {
    case 'today':
    case 'yesterday':
      return 1;
    case '7d':
      return 7;
    case 'mtd':
      return 18;
    case '30d':
    default:
      return 30;
  }
}

export function buildMockRevenue(preset) {
  const n = daysForPreset(preset);
  const today = new Date();
  const trend = [];
  let sumTrend = 0;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const base = 8000 + ((d.getDay() + 1) % 7) * 1200;
    const rev = Math.round(base + Math.sin(i / 3) * 4000 + (i % 5) * 800);
    sumTrend += rev;
    trend.push({
      dateLabel: `${m}月${day}`,
      revenue: rev,
    });
  }

  const delivery = 176275;
  const booking = 96150;
  const emergency = 48075;
  const totalRevenue = delivery + booking + emergency;
  const orderCount = Math.max(1, Math.round(totalRevenue / 105.5));

  const topSites = [
    { name: '港城广场', revenue: 176275 },
    { name: '临港基地', revenue: 142800 },
    { name: '泰安运营', revenue: 128400 },
    { name: '金桥示范', revenue: 98500 },
    { name: '张江站点', revenue: 87300 },
  ];

  const heatmap = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let h = 0; h < 24; h++) {
    for (let wd = 0; wd < 7; wd++) {
      let v = 2 + Math.random() * 8;
      if (wd >= 5 && h >= 11 && h <= 21) v += 25 + Math.random() * 20;
      if (wd >= 4 && wd <= 5 && h >= 16 && h <= 20) v += 15;
      heatmap.push([wd, h, Math.round(v)]);
    }
  }

  return {
    totalRevenue,
    avgOrderValue: Math.round((totalRevenue / orderCount) * 10) / 10,
    orderCount,
    trend,
    businessMix: [
      { name: '送电', value: delivery },
      { name: '预约', value: booking },
      { name: '应急救援', value: emergency },
    ],
    topSites,
    heatmap,
    heatmapDayLabels: days,
  };
}
