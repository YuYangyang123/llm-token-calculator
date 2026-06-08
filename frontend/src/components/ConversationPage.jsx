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

/**
 * 估算字节数（UTF-8）
 * 中文约3字节/字，英文约1字节/字符
 */
function estimateBytes(text) {
  let bytes = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code < 128) bytes += 1;
    else if (code < 2048) bytes += 2;
    else if (code < 65536) bytes += 3;
    else bytes += 4;
  }
  return bytes;
}

/**
 * Token 估算: tokens ≈ byte_count × level_coefficient / 2
 * 中英文混合: 1中文字符≈3字节≈1.5 tokens, 1英文字符≈1字节≈0.3 tokens
 */
function estimateTokens(bytes, coefficient) {
  return Math.round(bytes * coefficient / 2);
}

export default function ConversationPage({
  selectedModel,
  thinkingLevels,
  currency,
  getSymbol,
  getRate,
  calcTokenCost,
}) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [dialogText, setDialogText] = useState('');
  const symbol = getSymbol();
  const rate = getRate();

  // 100 次对话估算
  const hundredResult = useMemo(() => {
    if (!selectedLevel || !selectedModel) return null;
    const tokens = selectedLevel.tokens_per_conversation * 100;
    const cost = calcTokenCost(tokens);
    return { tokens, cost };
  }, [selectedLevel, selectedModel, calcTokenCost]);

  // 用户输入文本的 TOKEN 估算
  const textTokenResult = useMemo(() => {
    if (!dialogText || !selectedLevel) return null;
    const bytes = estimateBytes(dialogText);
    const tokens = estimateTokens(bytes, selectedLevel.byte_coefficient);
    const cost = calcTokenCost(tokens);
    return { bytes, tokens, cost };
  }, [dialogText, selectedLevel, calcTokenCost]);

  return (
    <div className="calc-page conversation-page">
      <div className="calc-card model-info-card">
        <span className="calc-model-label">当前模型</span>
        <span className="calc-model-value">{selectedModel?.provider} / {selectedModel?.name}</span>
      </div>

      {/* 等级选择 */}
      <div className="calc-card">
        <h2 className="calc-title">🎯 选择对话等级</h2>
        <p className="calc-subtitle">点击等级查看100次对话的 TOKEN 和费用估算</p>
        <div className="level-grid">
          {thinkingLevels.map(lv => {
            const isSel = selectedLevel?.level === lv.level;
            return (
              <button
                key={lv.level}
                className={`level-card-btn ${isSel ? 'selected' : ''}`}
                style={{ '--lv-color': lv.color }}
                onClick={() => setSelectedLevel(isSel ? null : lv)}
              >
                <span className="lv-icon">{lv.icon}</span>
                <span className="lv-name">{lv.name}</span>
                <span className="lv-tokens">{fmt(lv.tokens_per_conversation)}t</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 100次对话估算 */}
      {selectedLevel && hundredResult && (
        <div className="calc-card result-card">
          <h2 className="calc-title">
            {selectedLevel.icon} {selectedLevel.name} — 100次对话
          </h2>
          <div className="hundred-result-grid">
            <div className="hundred-item">
              <span className="hundred-label">总 TOKEN</span>
              <span className="hundred-value">{fmt(hundredResult.tokens)}</span>
            </div>
            <div className="hundred-item">
              <span className="hundred-label">每次对话</span>
              <span className="hundred-value">{fmt(selectedLevel.tokens_per_conversation)}</span>
            </div>
            <div className="hundred-item full-width">
              <span className="hundred-label">预估费用</span>
              <span className="hundred-value cost">
                {hundredResult.cost.symbol}{fmtMoney(hundredResult.cost.totalCost)}
              </span>
            </div>
          </div>

          {/* 各级别 100 次对比 */}
          <div className="level-compare-section">
            <p className="compare-title">各等级 100 次对话费用对比</p>
            {thinkingLevels.map(lv => {
              const t = lv.tokens_per_conversation * 100;
              const c = calcTokenCost(t);
              const maxCost = Math.max(...thinkingLevels.map(x => {
                const r = calcTokenCost(x.tokens_per_conversation * 100);
                return r ? r.totalCost : 0;
              }));
              return (
                <div key={lv.level} className="compare-row">
                  <span className="compare-icon">{lv.icon}</span>
                  <span className="compare-name">{lv.name}</span>
                  <div className="compare-bar-wrap">
                    <div
                      className="compare-bar"
                      style={{
                        width: c ? `${(c.totalCost / maxCost) * 100}%` : '0%',
                        backgroundColor: lv.color,
                      }}
                    />
                  </div>
                  <span className="compare-cost">
                    {c ? `${c.symbol}${fmtMoney(c.totalCost)}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 对话输入框 */}
      <div className="calc-card">
        <h2 className="calc-title">✍️ 对话输入估算</h2>
        <p className="calc-subtitle">
          输入你的问题内容，系统根据文本长度和所选等级智能估算 TOKEN 消耗
        </p>

        <textarea
          className="dialog-textarea"
          value={dialogText}
          onChange={(e) => setDialogText(e.target.value)}
          placeholder="在这里输入你的问题或对话内容...&#10;&#10;例如：请用 Python 写一个快速排序算法，并解释其时间复杂度"
          rows={6}
        />

        {/* 实时统计 */}
        {dialogText && (
          <div className="text-stats">
            {selectedLevel ? (
              <>
                <div className="stat-item highlight">
                  <span className="stat-label">输入文本长度</span>
                  <span className="stat-value">{dialogText.length} 字符</span>
                </div>
                <div className="stat-item highlight">
                  <span className="stat-label">估算 TOKEN ({selectedLevel.icon} {selectedLevel.name})</span>
                  <span className="stat-value">{textTokenResult?.tokens || 0} tokens</span>
                </div>
                {textTokenResult?.cost && (
                  <div className="stat-item highlight cost">
                    <span className="stat-label">预估费用</span>
                    <span className="stat-value">
                      {textTokenResult.cost.symbol}{fmtMoney(textTokenResult.cost.totalCost)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="stat-hint">← 请先选择对话等级以获得 TOKEN 估算</div>
            )}
          </div>
        )}

        {!dialogText && (
          <p className="calc-note">输入文本后将自动估算 TOKEN 消耗</p>
        )}
      </div>
    </div>
  );
}
