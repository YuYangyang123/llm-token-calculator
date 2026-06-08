import React, { useState } from 'react';

export default function ThinkingLevel({
  levels,
  selectedLevel,
  onSelectLevel,
  onSelectExample,
}) {
  const [expandedLevel, setExpandedLevel] = useState(null);

  if (!levels || levels.length === 0) {
    return (
      <div className="panel thinking-level">
        <h2 className="panel-title">💡 模型思考量</h2>
        <p className="panel-desc">加载中...</p>
      </div>
    );
  }

  return (
    <div className="panel thinking-level">
      <h2 className="panel-title">💡 模型思考量</h2>
      <p className="panel-desc">
        不知道需要多少 TOKEN？根据问题类型自动估算
      </p>

      {/* 等级选择卡片 */}
      <div className="level-cards">
        {levels.map((level) => {
          const isSelected = selectedLevel?.level === level.level;
          const isExpanded = expandedLevel === level.level;
          const [min, max] = level.token_range;

          return (
            <div key={level.level} className={`level-card-wrapper`}>
              <button
                className={`level-card ${isSelected ? 'selected' : ''}`}
                style={{ '--level-color': level.color }}
                onClick={() => {
                  if (isSelected) {
                    onSelectLevel(null);
                  } else {
                    onSelectLevel(level);
                    setExpandedLevel(level.level);
                  }
                }}
              >
                <div className="level-card-header">
                  <span className="level-icon">{level.icon}</span>
                  <span className="level-name">{level.name}</span>
                  {isSelected && <span className="level-check">✓</span>}
                </div>
                <div className="level-range">
                  {min >= 1000 ? `${(min / 1000).toFixed(1)}K` : min}
                  {' - '}
                  {max >= 1000 ? `${(max / 1000).toFixed(0)}K` : max} tokens
                </div>
                <div className="level-desc">{level.description}</div>
                <div className="level-bar">
                  <div
                    className="level-bar-fill"
                    style={{
                      width: `${Math.min((max / 100000) * 100, 100)}%`,
                      backgroundColor: level.color,
                    }}
                  />
                </div>
              </button>

              {/* 展开示例 */}
              {isExpanded && (
                <div className="level-examples">
                  <p className="examples-title">问题示例（点击自动填充 TOKEN）：</p>
                  {level.examples.map((ex, i) => (
                    <button
                      key={i}
                      className="example-btn"
                      onClick={() => {
                        onSelectLevel(level);
                        onSelectExample(ex);
                      }}
                    >
                      <span className="example-label">{ex.label}</span>
                      <span className="example-tokens">
                        ~{ex.estimated_tokens >= 1000
                          ? `${(ex.estimated_tokens / 1000).toFixed(1)}K`
                          : ex.estimated_tokens} tokens
                      </span>
                      <span className="example-prompt">{ex.prompt}</span>
                    </button>
                  ))}
                  <button
                    className="collapse-btn"
                    onClick={() => setExpandedLevel(null)}
                  >
                    收起示例
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 提示 */}
      <div className="thinking-tip">
        <span className="tip-icon">💡</span>
        <span>提示：选择一个等级会自动填充 TOKEN 数量；也可以选择具体问题示例获得更精确的估算</span>
      </div>
    </div>
  );
}
