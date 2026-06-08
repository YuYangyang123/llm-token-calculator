const app = getApp();

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

Page({
  data: {
    tokenInput: '10000',
    modelLabel: '',
    currency: 'CNY',
    symbol: '¥',
    result: null,
    conversations: [],
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
    this.setData({
      modelLabel: m ? m.provider + ' / ' + m.name : '未选择模型',
      currency: g.currency,
      symbol: (ex.symbols && ex.symbols[g.currency]) || '$',
      ready: true,
    });
    this.calculate();
  },

  onInput(e) { this.setData({ tokenInput: e.detail.value }); this.calculate(); },

  setQuick(e) {
    this.setData({ tokenInput: String(e.currentTarget.dataset.val) });
    this.calculate();
  },

  calculate() {
    const g = app.globalData;
    const m = g.selectedModel;
    const levels = g.thinkingLevels;
    const ex = g.exchangeRates || {};
    const cur = g.currency;
    const rate = (ex.rates && ex.rates[cur]) || 1;
    const symbol = (ex.symbols && ex.symbols[cur]) || '$';
    const count = Math.max(1, parseInt(this.data.tokenInput) || 0);
    if (!m || !count || !levels.length) return;

    const inputPrice = m.input_price_per_1m_tokens / 1e6;
    const outputPrice = m.output_price_per_1m_tokens / 1e6;
    const inTokens = Math.round(count * 0.6);
    const outTokens = Math.round(count * 0.4);
    const inCost = +(inTokens * inputPrice * rate).toFixed(4);
    const outCost = +(outTokens * outputPrice * rate).toFixed(4);

    const convs = levels.map(lv => ({
      ...lv,
      count: Math.floor(count / lv.tokens_per_conversation),
    }));

    this.setData({
      symbol,
      result: { inTokens, outTokens, inCost, outCost, totalCost: +(inCost + outCost).toFixed(4) },
      conversations: convs,
    });
  },
});
