import React from 'react';

const CURRENCIES = [
  { code: 'CNY', symbol: '¥', label: '人民币' },
  { code: 'USD', symbol: '$', label: '美元' },
  { code: 'EUR', symbol: '€', label: '欧元' },
];

export default function CurrencyToggle({ currency, onChange, exchangeRates }) {
  return (
    <div className="currency-toggle">
      <div className="currency-buttons">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            className={`currency-btn ${currency === c.code ? 'active' : ''}`}
            onClick={() => onChange(c.code)}
          >
            <span className="currency-symbol">{c.symbol}</span>
            <span className="currency-label">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
