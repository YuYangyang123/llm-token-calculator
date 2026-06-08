import React, { useState, useMemo } from 'react';

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function fmtMoney(n) {
  if (n >= 1) return n.toFixed(2);
  if (n >= 0.01) return n.toFixed(4);
  return n.toFixed(6);
}

export default function BudgetCalcPage({
  selectedModel,
  models,
  currency,
  getSymbol,
  getRate,
  thinkingLevels,
}) {
  const [budgetInput, setBudgetInput] = useState('10');
  const budget = Math.max(0.01, parseFloat(budgetInput) || 0);

  const symbol = getSymbol();
  const rate = getRate();

  // 计算能买多少 TOKEN
  const calcResult = useMemo(() => {
    if (!selectedModel) return null;
    // 混合价格 = 输入价格*0.6 + 输出价格*0.4
    const inputPrice = selectedModel.input_price_per_1m_tokens;
    const outputPrice = selectedModel.output_price_per_1m_tokens;
    const blendedPrice = inputPrice * 0.6 + outputPrice * 0.4;
    // budget(目标货币) / rate = USD
    const budgetUSD = budget / rate;
    // token数 = budgetUSD / (blendedPrice / 1e6)
    const totalTokens = Math.round(budgetUSD / (blendedPrice / 1_000_000));
    return { totalTokens, blendedPrice, budgetUSD };
  }, [budget, selectedModel, rate]);

  // 各等级对话次数
  const conversations = useMemo(() => {
    if (!calcResult || !thinkingLevels.length) return [];
    return thinkingLevels.map(lv => ({
      ...lv,
      count: Math.floor(calcResult.totalTokens / lv.tokens_per_conversation),
    }));
  }, [calcResult, thinkingLevels]);

  return (
    <div className="calc-page budget-calc-page">
      <div className="calc-card model-info-card">
        <span className="calc-model-label">当前模型</span>
        <span className="calc-model-value">{selectedModel?.provider} / {selectedModel?.name}</span>
      </div>

      {/* 预算输入 */}
      <div className="calc-card">
        <h2 className="calc-title">💰 输入预算金额</h2>
        <div className="big-input-wrap">
          <span className="big-input-prefix">{symbol}</span>
          <input
            type="number"
            className="big-input"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="输入金额"
            step="0.01"
          />
        </div>
        <div className="currency-label">{currency === 'CNY' ? '人民币' : currency === 'EUR' ? '欧元' : '美元'}</div>
      </div>

      {/* 能买多少 TOKEN */}
      {calcResult && (
        <div className="calc-card result-card">
          <h2 className="calc-title">📊 可购买 TOKEN</h2>
          <div className="big-result token-result">
            <span className="result-number">{fmt(calcResult.totalTokens)}</span>
            <span className="result-unit">tokens</span>
          </div>
          <div className="result-breakdown">
            <div className="breakdown-row">
              <span>预算</span>
              <span>{symbol}{fmtMoney(budget)}</span>
            </div>
            <div className="breakdown-row">
              <span>折合美元</span>
              <span>${fmtMoney(calcResult.budgetUSD)}</span>
            </div>
            <div className="breakdown-row">
              <span>混合单价</span>
              <span>${calcResult.blendedPrice} / 1M tokens</span>
            </div>
          </div>
        </div>
      )}

      {/* 对话次数 */}
      {conversations.length > 0 && (
        <div className="calc-card">
          <h2 className="calc-title">💬 可支撑对话次数</h2>
          <div className="conversation-list">
            {conversations.map(lv => (
              <div key={lv.level} className="conv-row">
                <div className="conv-header">
                  <span className="conv-icon">{lv.icon}</span>
                  <span className="conv-name">{lv.name}</span>
                  <span className="conv-per">{fmt(lv.tokens_per_conversation)} tokens/次</span>
                </div>
                <div className="conv-count-wrap">
                  <div className="conv-bar-bg">
                    <div
                      className="conv-bar-fill"
                      style={{
                        width: `${Math.min((lv.count / 200) * 100, 100)}%`,
                        backgroundColor: lv.color,
                      }}
                    />
                  </div>
                  <span className="conv-count">
                    <strong>{lv.count}</strong> 次
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 各大模型当日单价 */}
      <div className="calc-card model-prices-card">
        <h2 className="calc-title">📋 各大模型 TOKEN 单价</h2>
        <p className="calc-subtitle">价格单位：{currency === 'CNY' ? '人民币 (¥)' : currency === 'EUR' ? '欧元 (€)' : '美元 ($)'} / 1M tokens</p>
        <div className="model-prices-table">
          <div className="prices-header">
            <span>模型</span>
            <span>输入</span>
            <span>输出</span>
          </div>
          {models.map(m => (
            <div key={m.id} className={`prices-row ${selectedModel?.id === m.id ? 'current' : ''}`}>
              <span className="prices-model">{m.provider} {m.name}</span>
              <span className="prices-input">{symbol}{fmtMoney(m.input_price_per_1m_tokens * rate)}</span>
              <span className="prices-output">{symbol}{fmtMoney(m.output_price_per_1m_tokens * rate)}</span>
            </div>
          ))}
        </div>
        <p className="calc-note">* 价格为参考值，以各厂商官网实时价格为准</p>
      </div>
    </div>
  );
}
