const app = getApp();

function fmtMoney(n) {
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

Page({
  data: {
    budgetInput: '10',
    modelLabel: '',
    currency: 'CNY',
    symbol: '¥',
    result: null,
    conversations: [],
    modelPrices: [],
    ready: false,
  },

  onShow() {
    this.waitAndInit();
  },

  waitAndInit() {
    const that = this;
    if (app.globalData.loaded) {
      that.init();
      return;
    }
    setTimeout(() => that.waitAndInit(), 500);
  },

  init() {
    const g = app.globalData;
    const m = g.selectedModel;
    const ex = g.exchangeRates || {};
    const cur = g.currency;
    const rate = (ex.rates && ex.rates[cur]) || 1;
    const symbol = (ex.symbols && ex.symbols[cur]) || '$';

    const prices = g.models.map(x => ({
      ...x,
      inputDisplay: symbol + fmtMoney(x.input_price_per_1m_tokens * rate),
      outputDisplay: symbol + fmtMoney(x.output_price_per_1m_tokens * rate),
    }));

    this.setData({
      modelLabel: m ? m.provider + ' / ' + m.name : '未选择模型',
      currency: cur,
      symbol,
      modelPrices: prices,
      selectedModel: m,
      ready: true,
    });
    this.calculate();
  },

  onInput(e) { this.setData({ budgetInput: e.detail.value }); this.calculate(); },

  calculate() {
    const g = app.globalData;
    const m = g.selectedModel;
    const levels = g.thinkingLevels;
    const ex = g.exchangeRates || {};
    const cur = g.currency;
    const rate = (ex.rates && ex.rates[cur]) || 1;
    const budget = Math.max(0.01, parseFloat(this.data.budgetInput) || 0);
    if (!m || !budget || !levels.length) return;

    const blendedPrice = m.input_price_per_1m_tokens * 0.6 + m.output_price_per_1m_tokens * 0.4;
    const budgetUSD = +(budget / rate).toFixed(4);
    const totalTokens = Math.round(budgetUSD / (blendedPrice / 1e6));

    const convs = levels.map(lv => ({
      ...lv,
      count: Math.floor(totalTokens / lv.tokens_per_conversation),
    }));

    this.setData({
      result: { totalTokens, blendedPrice, budgetUSD },
      conversations: convs,
    });
  },
});
