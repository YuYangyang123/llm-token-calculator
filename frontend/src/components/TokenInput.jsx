import React from 'react';

const PRESET_TOKENS = [
  { label: '100', value: 100 },
  { label: '500', value: 500 },
  { label: '1K', value: 1000 },
  { label: '2K', value: 2000 },
  { label: '5K', value: 5000 },
  { label: '10K', value: 10000 },
  { label: '20K', value: 20000 },
  { label: '50K', value: 50000 },
  { label: '100K', value: 100000 },
];

function formatTokens(count) {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export default function TokenInput({
  tokenCount,
  onChange,
  outputRatio,
  onOutputRatioChange,
}) {
  const outputTokens = Math.round(tokenCount * outputRatio);

  return (
    <div className="panel token-input">
      <h2 className="panel-title">📊 TOKEN 数量</h2>
      <p className="panel-desc">
        输入预计消耗的 TOKEN 数量（含输入和预估输出）
      </p>

      {/* 输入 TOKEN 滑块 */}
      <div className="token-section">
        <h3 className="section-label">输入 TOKEN</h3>
        <div className="token-display">
          <input
            type="number"
            className="token-number-input"
            value={tokenCount}
            min={1}
            max={10000000}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <span className="token-unit">tokens</span>
        </div>

        {/* 滑块 */}
        <input
          type="range"
          className="token-slider"
          min={10}
          max={200000}
          step={10}
          value={Math.min(tokenCount, 200000)}
          onChange={(e) => onChange(parseInt(e.target.value))}
        />
        <div className="slider-labels">
          <span>10</span>
          <span>50K</span>
          <span>100K</span>
          <span>200K+</span>
        </div>

        {/* 快捷选择 */}
        <div className="preset-tokens">
          {PRESET_TOKENS.map((p) => (
            <button
              key={p.value}
              className={`preset-btn ${tokenCount === p.value ? 'active' : ''}`}
              onClick={() => onChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输出比例 */}
      <div className="token-section">
        <h3 className="section-label">
          输出/输入比例
          <span className="ratio-badge">{Math.round(outputRatio * 100)}%</span>
        </h3>
        <input
          type="range"
          className="token-slider"
          min={10}
          max={200}
          step={5}
          value={Math.round(outputRatio * 100)}
          onChange={(e) => onOutputRatioChange(parseInt(e.target.value) / 100)}
        />
        <div className="slider-labels">
          <span>10%</span>
          <span>50%</span>
          <span>100%</span>
          <span>200%</span>
        </div>
      </div>

      {/* 输出 TOKEN 估算 */}
      <div className="output-estimate">
        <span className="estimate-label">预估输出 TOKEN</span>
        <span className="estimate-value">{formatTokens(outputTokens)} tokens</span>
      </div>

      {/* 总计 */}
      <div className="total-tokens">
        <span className="total-label">总计 TOKEN</span>
        <span className="total-value">{formatTokens(tokenCount + outputTokens)} tokens</span>
      </div>
    </div>
  );
}
