import React, { useState } from 'react';
import Header from './components/Header.jsx';
import HomePage from './components/HomePage.jsx';
import TokenCalcPage from './components/TokenCalcPage.jsx';
import BudgetCalcPage from './components/BudgetCalcPage.jsx';
import ConversationPage from './components/ConversationPage.jsx';
import { useCalculator } from './hooks/useCalculator.js';

const PAGES = {
  home: 'home',
  token: 'token',
  budget: 'budget',
  conversation: 'conversation',
};

export default function App() {
  const [page, setPage] = useState(PAGES.home);
  const calc = useCalculator();

  if (calc.loading) {
    return (
      <div className="app">
        <Header page="home" onBack={() => {}} />
        <main className="container">
          <div className="loading-screen">
            <div className="loading-icon">⏳</div>
            <p>正在加载数据...</p>
          </div>
        </main>
      </div>
    );
  }

  if (calc.error) {
    return (
      <div className="app">
        <Header page="home" onBack={() => {}} />
        <main className="container">
          <div className="error-screen">
            <div className="error-icon">⚠️</div>
            <p>加载失败: {calc.error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              重新加载
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handleBack = () => setPage(PAGES.home);

  const renderPage = () => {
    switch (page) {
      case PAGES.token:
        return (
          <TokenCalcPage
            selectedModel={calc.selectedModel}
            currency={calc.currency}
            getSymbol={calc.getSymbol}
            calcTokenCost={calc.calcTokenCost}
            calcConversations={calc.calcConversations}
            thinkingLevels={calc.thinkingLevels}
          />
        );
      case PAGES.budget:
        return (
          <BudgetCalcPage
            selectedModel={calc.selectedModel}
            models={calc.models}
            currency={calc.currency}
            getSymbol={calc.getSymbol}
            getRate={calc.getRate}
            thinkingLevels={calc.thinkingLevels}
          />
        );
      case PAGES.conversation:
        return (
          <ConversationPage
            selectedModel={calc.selectedModel}
            thinkingLevels={calc.thinkingLevels}
            currency={calc.currency}
            getSymbol={calc.getSymbol}
            getRate={calc.getRate}
            calcTokenCost={calc.calcTokenCost}
          />
        );
      default:
        return (
          <HomePage
            models={calc.models}
            selectedModel={calc.selectedModel}
            onSelectModel={calc.setSelectedModel}
            currency={calc.currency}
            onCurrencyChange={calc.setCurrency}
            exchangeRates={calc.exchangeRates}
            onNavigate={setPage}
          />
        );
    }
  };

  return (
    <div className="app">
      <Header page={page} onBack={handleBack} />
      <main className="container">
        {renderPage()}
      </main>
      <footer className="footer">
        <p>LLM Token Calculator v2.0 — 数据仅供参考</p>
      </footer>
    </div>
  );
}
