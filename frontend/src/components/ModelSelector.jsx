import React, { useState, useEffect, useRef } from 'react';

export default function ModelSelector({
  models,
  allModels,
  selectedModel,
  onSelectModel,
  compact,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const list = allModels || models;
  const filtered = search
    ? list.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.provider.toLowerCase().includes(search.toLowerCase())
      )
    : list;

  // 点击外部关闭下拉
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  return (
    <div className={`model-selector ${compact ? 'compact' : 'panel'}`}>
      {!compact && (
        <>
          <h2 className="panel-title">🤖 选择大模型</h2>
          <p className="panel-desc">选择要计算费用的模型</p>
        </>
      )}

      <div className="model-search-wrapper" ref={wrapperRef}>
        <div className="custom-select-wrapper">
          <button
            className="custom-select-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            type="button"
          >
            <span className={selectedModel ? 'trigger-label' : 'trigger-placeholder'}>
              {selectedModel ? `${selectedModel.provider} / ${selectedModel.name}` : '请选择模型'}
            </span>
            <span className="arrow">▾</span>
          </button>

          {dropdownOpen && (
            <div className="custom-select-dropdown" onMouseDown={(e) => e.preventDefault()}>
              <div className="dropdown-search">
                <input
                  type="text"
                  placeholder="搜索模型..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="dropdown-search-input"
                  autoFocus
                />
              </div>
              {filtered.length === 0 ? (
                <div className="dropdown-empty">未找到匹配模型</div>
              ) : (
                filtered.map((m) => (
                  <div
                    key={m.id}
                    className={`dropdown-item ${selectedModel?.id === m.id ? 'active' : ''}`}
                    onMouseDown={() => { onSelectModel(m); setDropdownOpen(false); }}
                  >
                    <div className="dropdown-item-header">
                      <span className="dropdown-item-name">{m.name}</span>
                      <span className="dropdown-item-provider">{m.provider}</span>
                    </div>
                    <div className="dropdown-item-prices">
                      <span className="price-tag input-price">入 ${m.input_price_per_1m_tokens}/1M</span>
                      <span className="price-tag output-price">出 ${m.output_price_per_1m_tokens}/1M</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
