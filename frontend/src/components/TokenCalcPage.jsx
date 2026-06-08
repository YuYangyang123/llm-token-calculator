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

export default function TokenCalcPage({
  selectedModel,
  currency,
  getSymbol,
  calcTokenCost,
  calcConversations,
  thinkingLevels,
}) {
  const [tokenInput, setTokenInput] = useState('10000');
  const tokenCount = Math.max(1, parseInt(tokenInput) || 0);

  const costResult = useMemo(() => calcTokenCost(tokenCount), [tokenCount, calcTokenCost]);
  const conversations = useMemo(() => calcConversations(tokenCount), [tokenCount, calcConversations]);

  const symbol = getSymbol();

  return (
    <div className="calc-page token-calc-page">
      <div className="calc-card model-info-card">
        <span className="calc-model-label">当前模型</span>
        <span className="calc-model-value">{selectedModel?.provider} / {selectedModel?.name}</span>
      </div>

      {/* TOKEN 输入 */}
      <div className="calc-card">
        <h2 className="calc-title">📊 输入 TOKEN 数量</h2>
        <div className="big-input-wrap">
          <input
            type="number"
            className="big-input"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="输入 TOKEN 数量"
          />
          <span className="big-input-unit">tokens</span>
        </div>

        {/* 快捷按钮 */}
        <div className="quick-btns">
          {[500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000].map(v => (
            <button
              key={v}
              className={`quick-btn ${tokenCount === v ? 'active' : ''}`}
              onClick={() => setTokenInput(String(v))}
            >
              {fmt(v)}
            </button>
          ))}
        </div>
      </div>

      {/* 费用结果 */}
      {costResult && (
        <div className="calc-card result-card">
          <h2 className="calc-title">💰 预估费用</h2>
          <div className="big-result">
            <span className="result-symbol">{costResult.symbol}</span>
            <span className="result-number">{fmtMoney(costResult.totalCost)}</span>
          </div>
          <div className="result-breakdown">
            <div className="breakdown-row">
              <span>📥 输入 ({fmt(costResult.inputTokens)} tokens)</span>
              <span>{costResult.symbol}{fmtMoney(costResult.inputCost)}</span>
            </div>
            <div className="breakdown-row">
              <span>📤 输出 ({fmt(costResult.outputTokens)} tokens)</span>
              <span>{costResult.symbol}{fmtMoney(costResult.outputCost)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 对话次数估算 */}
      {conversations.length > 0 && (
        <div className="calc-card">
          <h2 className="calc-title">💬 可支撑对话次数</h2>
          <p className="calc-subtitle">基于该 TOKEN 数量，各等级可对话次数</p>
          <div className="conversation-list">
            {conversations.map(lv => (
              <div key={lv.level} className="conv-row" style={{ '--bar-color': lv.color }}>
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
          <p className="calc-note">* 每对话 TOKEN 按输入60%+输出40%估算，实际因模型而异</p>
        </div>
      )}
    </div>
  );
}
