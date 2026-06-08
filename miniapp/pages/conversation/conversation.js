const app = getApp();

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function fmtMoney(n) {
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(4);
}

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

Page({
  data: {
    levels: [],
    selectedLevel: null,
    modelLabel: '',
    currency: 'CNY',
    symbol: '¥',
    hundred: null,
    compare: [],
    dialogText: '',
    textResult: null,
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
      levels: g.thinkingLevels,
      modelLabel: m ? m.provider + ' / ' + m.name : '未选择模型',
      currency: g.currency,
      symbol: (ex.symbols && ex.symbols[g.currency]) || '$',
      ready: true,
    });
  },

  selectLevel(e) {
    const idx = parseInt(e.currentTarget.dataset.idx);
    const level = this.data.levels[idx];
    if (!level) return;
    if (this.data.selectedLevel && this.data.selectedLevel.level === level.level) {
      this.setData({ selectedLevel: null, hundred: null, compare: [] });
      return;
    }
    this.setData({ selectedLevel: level });
    this.calcHundred(level);
    this.calcDialog();
  },

  calcHundred(level) {
    const g = app.globalData;
    const m = g.selectedModel;
    const ex = g.exchangeRates || {};
    const cur = g.currency;
    const rate = (ex.rates && ex.rates[cur]) || 1;
    const sym = (ex.symbols && ex.symbols[cur]) || '$';
    if (!m || !level) return;

    const tokens = level.tokens_per_conversation * 100;
    const inputPrice = m.input_price_per_1m_tokens / 1e6;
    const outputPrice = m.output_price_per_1m_tokens / 1e6;
    const inTokens = Math.round(tokens * 0.6);
    const outTokens = Math.round(tokens * 0.4);
    const cost = +((inTokens * inputPrice + outTokens * outputPrice) * rate).toFixed(4);

    const compare = this.data.levels.map(lv => {
      const t = lv.tokens_per_conversation * 100;
      const it = Math.round(t * 0.6);
      const ot = Math.round(t * 0.4);
      const c = +((it * inputPrice + ot * outputPrice) * rate).toFixed(4);
      return { ...lv, cost: c, costDisplay: sym + fmtMoney(c) };
    });

    this.setData({
      hundred: { tokens: fmt(tokens), perConvo: fmt(level.tokens_per_conversation), cost: sym + fmtMoney(cost) },
      compare,
    });
  },

  onTextInput(e) {
    this.setData({ dialogText: e.detail.value });
    this.calcDialog();
  },

  calcDialog() {
    const text = this.data.dialogText;
    const level = this.data.selectedLevel;
    if (!text || !level) return;

    const g = app.globalData;
    const m = g.selectedModel;
    const ex = g.exchangeRates || {};
    const cur = g.currency;
    const rate = (ex.rates && ex.rates[cur]) || 1;
    const sym = (ex.symbols && ex.symbols[cur]) || '$';
    if (!m) return;

    const bytes = estimateBytes(text);
    const tokens = Math.round(bytes * level.byte_coefficient / 2);
    const inputPrice = m.input_price_per_1m_tokens / 1e6;
    const outputPrice = m.output_price_per_1m_tokens / 1e6;
    const inTokens = Math.round(tokens * 0.6);
    const outTokens = Math.round(tokens * 0.4);
    const cost = +((inTokens * inputPrice + outTokens * outputPrice) * rate).toFixed(4);

    this.setData({
      textResult: {
        chars: text.length,
        tokens,
        cost: sym + fmtMoney(cost),
      },
    });
  },
});
