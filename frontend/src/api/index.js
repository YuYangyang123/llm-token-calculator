/**
 * API 请求层 — 封装所有后端接口调用
 */

const API_BASE = '/api';

async function request(url, options = {}) {
  const { method = 'GET', body, headers: extraHeaders } = options;
  const headers = { ...extraHeaders };

  // 只在有 body 时设置 Content-Type
  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `请求失败: ${res.status}`);
  }
  return res.json();
}

/** 获取模型列表 */
export function fetchModels(search = '', provider = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (provider) params.set('provider', provider);
  const qs = params.toString();
  return request(`/models${qs ? '?' + qs : ''}`);
}

/** 获取模型详情 */
export function fetchModel(id) {
  return request(`/models/${encodeURIComponent(id)}`);
}

/** 获取思考量分级 */
export function fetchThinkingLevels() {
  return request('/thinking-levels');
}

/** 获取汇率 */
export function fetchExchangeRates() {
  return request('/exchange-rates');
}

/** 计算费用 */
export function calculateCost(modelId, tokenCount, currency = 'USD', outputRatio = 0.7) {
  return request('/calculate', {
    method: 'POST',
    body: { model_id: modelId, token_count: tokenCount, currency, output_ratio: outputRatio },
  });
}
