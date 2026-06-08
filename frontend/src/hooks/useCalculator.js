import { useState, useEffect, useCallback } from 'react';
import { fetchModels, fetchThinkingLevels, fetchExchangeRates } from '../api/index.js';

/**
 * 计算器核心状态管理 Hook — 精简版
 * 只管理共享数据，页面逻辑由各 Page 组件自行处理
 */
export function useCalculator() {
  const [models, setModels] = useState([]);
  const [thinkingLevels, setThinkingLevels] = useState([]);
  const [exchangeRates, setExchangeRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 全局选择
  const [selectedModel, setSelectedModel] = useState(null);
  const [currency, setCurrency] = useState('CNY');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [modelsRes, levelsRes, ratesRes] = await Promise.all([
          fetchModels(),
          fetchThinkingLevels(),
          fetchExchangeRates(),
        ]);
        setModels(modelsRes.models);
        setThinkingLevels(levelsRes.levels);
        setExchangeRates(ratesRes);
        if (modelsRes.models.length > 0) {
          setSelectedModel(modelsRes.models[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 获取当前汇率
  const getRate = useCallback(() => {
    if (!exchangeRates) return 1;
    return exchangeRates.rates[currency] || 1;
  }, [exchangeRates, currency]);

  // 获取货币符号
  const getSymbol = useCallback(() => {
    if (!exchangeRates) return '$';
    return exchangeRates.symbols[currency] || '$';
  }, [exchangeRates, currency]);

  // 计算 token 费用 (纯前端计算，无需调用后端)
  const calcTokenCost = useCallback((tokenCount) => {
    if (!selectedModel) return null;
    const rate = getRate();
    const inputPrice = selectedModel.input_price_per_1m_tokens / 1_000_000;
    const outputPrice = selectedModel.output_price_per_1m_tokens / 1_000_000;
    // 输入占60%，输出占40%
    const inputTokens = Math.round(tokenCount * 0.6);
    const outputTokens = Math.round(tokenCount * 0.4);
    const inputCost = inputTokens * inputPrice * rate;
    const outputCost = outputTokens * outputPrice * rate;
    return {
      inputTokens, outputTokens,
      inputCost, outputCost,
      totalCost: inputCost + outputCost,
      symbol: getSymbol(),
      currency,
      rate,
    };
  }, [selectedModel, currency, getRate, getSymbol]);

  // 计算给定 TOKEN 数能支撑多少次各级对话
  const calcConversations = useCallback((tokenCount) => {
    if (!thinkingLevels.length) return [];
    return thinkingLevels.map(lv => ({
      ...lv,
      count: Math.floor(tokenCount / lv.tokens_per_conversation),
    }));
  }, [thinkingLevels]);

  return {
    models,
    thinkingLevels,
    exchangeRates,
    loading,
    error,
    selectedModel,
    setSelectedModel,
    currency,
    setCurrency,
    getRate,
    getSymbol,
    calcTokenCost,
    calcConversations,
  };
}
