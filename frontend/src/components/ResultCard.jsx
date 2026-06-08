import React from 'react';

export default function ResultCard({ result, exchangeRates }) {
  if (!result) return null;

  // 对比其他货币价格
  const otherCurrencies = exchangeRates
    ? Object.keys(exchangeRates.rates).filter((c) => c !== result.currency)
    : [];

  return (
    <div className="panel result-card">
      <h2 className="panel-title">📋 汇总结果</h2>

      <div className="result-grid">
        <div className="result-item">
          <span className="result-label">模型</span>
          <span className="result-value">{result.provider} / {result.model_name}</span>
        </div>
        <div className="result-item">
          <span className="result-label">输入 TOKEN</span>
          <span className="result-value">{result.input_tokens.toLocaleString()}</span>
        </div>
        <div className="result-item">
          <span className="result-label">输出 TOKEN</span>
          <span className="result-value">{result.output_tokens.toLocaleString()}</span>
        </div>
        <div className="result-item">
          <span className="result-label">总计 TOKEN</span>
          <span className="result-value highlight">{result.total_tokens.toLocaleString()}</span>
        </div>
        <div className="result-item">
          <span className="result-label">预估费用</span>
          <span className="result-value highlight">
            {result.symbol}{result.estimated_total_cost.toFixed(4)}
          </span>
        </div>
        <div className="result-item">
          <span className="result-label">输出占比</span>
          <span className="result-value">{Math.round(result.output_ratio * 100)}%</span>
        </div>
      </div>

      {/* 其他货币对比 */}
      {otherCurrencies.length > 0 && exchangeRates && (
        <div className="other-currencies">
          <p className="other-title">其他货币参考价格</p>
          <div className="other-list">
            {otherCurrencies.map((code) => {
              const rate = exchangeRates.rates[code];
              const symbol = exchangeRates.symbols[code];
              const label = exchangeRates.labels[code];
              const usdTotal = result.estimated_total_cost / result.rate;
              const converted = usdTotal * rate;
              return (
                <div key={code} className="other-item">
                  <span className="other-currency">{symbol} {label}</span>
                  <span className="other-cost">{symbol}{converted.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
