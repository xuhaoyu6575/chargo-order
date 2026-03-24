import axios from 'axios';

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

instance.interceptors.response.use(
  (response) => {
    const result = response.data;
    if (result.success && result.code === 200) {
      return result.data;
    }
    const err = new Error(result.msg || '请求失败');
    err.code = result.code;
    err.msgDetail = result.msgDetail;
    return Promise.reject(err);
  },
  (error) => {
    return Promise.reject(new Error(error.message || '网络请求异常'));
  }
);

function buildParams(siteId, days) {
  const params = {};
  if (siteId) params.siteId = siteId;
  if (days) params.days = days;
  return { params };
}

export const api = {
  /** 营收驾驶舱；后端未实现时调用方应 catch 并回退 mock */
  getRevenueCockpit: (siteId, preset) => {
    const params = { preset: preset || '30d' };
    if (siteId) params.siteId = siteId;
    return instance.get('/revenue/cockpit', { params });
  },
  getSites: () => instance.get('/dashboard/sites'),
  getStats: (siteId, days) => instance.get('/dashboard/stats', buildParams(siteId, days)),
  getCompletionRate: (siteId, days) => instance.get('/dashboard/completion-rate', buildParams(siteId, days)),
  getEndReasons: (siteId, days) => instance.get('/dashboard/end-reasons', buildParams(siteId, days)),
  getHeatmap: (siteId, days) => instance.get('/dashboard/heatmap', buildParams(siteId, days)),
  getProcessTime: (siteId, days) => instance.get('/dashboard/process-time', buildParams(siteId, days)),
  getCancelAnalysis: (siteId, days) => instance.get('/dashboard/cancel-analysis', buildParams(siteId, days)),
  getUserFrequency: (siteId, days) => instance.get('/dashboard/user-frequency', buildParams(siteId, days)),
};
