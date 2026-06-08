import React from 'react';
import ModelSelector from './ModelSelector.jsx';
import CurrencyToggle from './CurrencyToggle.jsx';

export default function HomePage({
  models, selectedModel, onSelectModel,
  currency, onCurrencyChange, exchangeRates,
  onNavigate,
}) {
  return (
    <div className="home-page">
      {/* 模型选择区 */}
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
        compact
      />

      {/* 货币切换 */}
      <CurrencyToggle
        currency={currency}
        onChange={onCurrencyChange}
        exchangeRates={exchangeRates}
      />

      {/* 当前选中模型信息 */}
      {selectedModel && (
        <div className="selected-model-badge">
          <span className="badge-provider">{selectedModel.provider}</span>
          <span className="badge-name">{selectedModel.name}</span>
          <span className="badge-price">
            入 ${selectedModel.input_price_per_1m_tokens}/1M · 出 ${selectedModel.output_price_per_1m_tokens}/1M
          </span>
        </div>
      )}

      {/* 三大入口按钮 */}
      <div className="entry-buttons">
        <button
          className="entry-btn token-entry"
          onClick={() => onNavigate('token')}
        >
          <span className="entry-icon">📊</span>
          <span className="entry-title">输入 TOKEN</span>
          <span className="entry-desc">计算费用 & 支撑对话次数</span>
        </button>

        <button
          className="entry-btn budget-entry"
          onClick={() => onNavigate('budget')}
        >
          <span className="entry-icon">💰</span>
          <span className="entry-title">输入预算</span>
          <span className="entry-desc">能买多少 TOKEN & 对话次数</span>
        </button>

        <button
          className="entry-btn conversation-entry"
          onClick={() => onNavigate('conversation')}
        >
          <span className="entry-icon">💬</span>
          <span className="entry-title">输入对话</span>
          <span className="entry-desc">估算对话 TOKEN 消耗</span>
        </button>
      </div>
    </div>
  );
}
