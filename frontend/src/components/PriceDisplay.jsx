import React from 'react';

function formatCost(cost) {
  if (cost === undefined || cost === null) return '—';
  if (cost >= 1) return cost.toFixed(2);
  if (cost >= 0.01) return cost.toFixed(4);
  return cost.toFixed(6);
}

export default function PriceDisplay({ result, calculating, selectedModel, currency }) {
  if (!selectedModel) {
    return (
      <div className="panel price-display empty">
        <h2 className="panel-title">💰 费用估算</h2>
        <p className="empty-hint">请先选择一个模型</p>
      </div>
    );
  }

  if (calculating) {
    return (
      <div className="panel price-display loading">
        <h2 className="panel-title">💰 费用估算</h2>
        <div className="loading-spinner">⏳ 计算中...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel price-display empty">
        <h2 className="panel-title">💰 费用估算</h2>
        <p className="empty-hint">请输入 TOKEN 数量进行计算</p>
      </div>
    );
  }

  return (
    <div className="panel price-display">
      <h2 className="panel-title">💰 费用估算</h2>

      {/* 总费用 */}
      <div className="total-cost-card">
        <div className="total-cost-label">预估总费用</div>
        <div className="total-cost-value">
          <span className="total-cost-symbol">{result.symbol}</span>
          <span className="total-cost-number">{formatCost(result.estimated_total_cost)}</span>
        </div>
        <div className="total-cost-model">
          {result.provider} / {result.model_name}
        </div>
      </div>

      {/* 费用明细 */}
      <div className="cost-breakdown">
        <div className="breakdown-item input">
          <div className="breakdown-header">
            <span className="breakdown-label">📥 输入费用</span>
            <span className="breakdown-cost">
              {result.symbol}{formatCost(result.estimated_input_cost)}
            </span>
          </div>
          <div className="breakdown-detail">
            {result.breakdown.input.tokens >= 1000
              ? `${(result.breakdown.input.tokens / 1000).toFixed(1)}K`
              : result.breakdown.input.tokens} tokens
            {' × '}
            {result.symbol}{result.breakdown.input.price_per_1m} / 1M tokens
          </div>
        </div>

        <div className="breakdown-item output">
          <div className="breakdown-header">
            <span className="breakdown-label">📤 输出费用</span>
            <span className="breakdown-cost">
              {result.symbol}{formatCost(result.estimated_output_cost)}
            </span>
          </div>
          <div className="breakdown-detail">
            {result.breakdown.output.tokens >= 1000
              ? `${(result.breakdown.output.tokens / 1000).toFixed(1)}K`
              : result.breakdown.output.tokens} tokens
            {' × '}
            {result.symbol}{result.breakdown.output.price_per_1m} / 1M tokens
          </div>
        </div>
      </div>

      {/* 费用占比条 */}
      {result.estimated_total_cost > 0 && (
        <div className="cost-ratio-bar">
          <div
            className="cost-ratio-input"
            style={{
              width: `${(result.estimated_input_cost / result.estimated_total_cost) * 100}%`,
            }}
          >
            {Math.round((result.estimated_input_cost / result.estimated_total_cost) * 100)}%
          </div>
          <div
            className="cost-ratio-output"
            style={{
              width: `${(result.estimated_output_cost / result.estimated_total_cost) * 100}%`,
            }}
          >
            {Math.round((result.estimated_output_cost / result.estimated_total_cost) * 100)}%
          </div>
        </div>
      )}
      <div className="ratio-legend">
        <span className="legend-input">■ 输入</span>
        <span className="legend-output">■ 输出</span>
      </div>

      <div className="rate-info">
        汇率: 1 USD = {result.breakdown.exchange_rate} {result.currency}
      </div>
    </div>
  );
}
