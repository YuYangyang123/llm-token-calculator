const app = getApp();

Page({
  data: {
    models: [],
    modelLabels: [],
    selectedModel: null,
    modelIndex: 0,
    currency: 'CNY',
    loading: true,
  },

  onShow() {
    // 如果数据已加载，直接显示
    if (app.globalData.loaded) {
      this.refreshData();
      return;
    }
    // 否则等待加载完成
    this.setData({ loading: true });
    this.waitForData();
  },

  waitForData() {
    const that = this;
    if (app.globalData.loaded) {
      that.refreshData();
      return;
    }
    setTimeout(() => that.waitForData(), 500);
  },

  refreshData() {
    const g = app.globalData;
    const labels = g.models.map(m => m.provider + ' / ' + m.name);
    const idx = g.selectedModel ? g.models.findIndex(m => m.id === g.selectedModel.id) : 0;
    this.setData({
      models: g.models,
      modelLabels: labels,
      selectedModel: g.selectedModel || g.models[0],
      modelIndex: idx >= 0 ? idx : 0,
      currency: g.currency,
      loading: false,
    });
  },

  onModelChange(e) {
    const idx = parseInt(e.detail.value);
    const model = this.data.models[idx];
    if (model) {
      app.globalData.selectedModel = model;
      this.setData({ selectedModel: model, modelIndex: idx });
    }
  },

  onCurrency(e) {
    const c = e.currentTarget.dataset.code;
    app.globalData.currency = c;
    this.setData({ currency: c });
  },

  goToken() { wx.navigateTo({ url: '/pages/token/token' }); },
  goBudget() { wx.navigateTo({ url: '/pages/budget/budget' }); },
  goConversation() { wx.navigateTo({ url: '/pages/conversation/conversation' }); },
});
