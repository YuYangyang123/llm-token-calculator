import React from 'react';

export default function Header({ page, onBack }) {
  const titles = {
    home: '大模型 TOKEN 计算器',
    token: 'TOKEN 计算',
    budget: '预算计算',
    conversation: '对话估算',
  };

  return (
    <header className="header">
      <div className="header-content">
        {page !== 'home' && (
          <button className="back-btn" onClick={onBack}>
            ← 返回
          </button>
        )}
        <div className="header-text">
          <h1 className="header-title">
            <span className="header-icon">🧮</span>
            {titles[page] || titles.home}
          </h1>
          {page === 'home' && (
            <p className="header-subtitle">选择模型，开始计算</p>
          )}
        </div>
      </div>
    </header>
  );
}
