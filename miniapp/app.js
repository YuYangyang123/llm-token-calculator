App({
  globalData: {
    apiBase: 'https://llm-token-calculator.onrender.com/api',
    selectedModel: null,
    currency: 'CNY',
    models: [],
    thinkingLevels: [],
    exchangeRates: null,
    loaded: false,
  },

  onLaunch() {
    this.loadData();
  },

  loadData() {
    const that = this;
    const base = this.globalData.apiBase;

    // 串行请求，兼容 wx.request 回调模式
    this._request(base + '/models', (modelsRes) => {
      if (!modelsRes) return;
      that.globalData.models = modelsRes.models || [];
      if (that.globalData.models.length > 0) {
        that.globalData.selectedModel = that.globalData.models[0];
      }

      that._request(base + '/thinking-levels', (levelsRes) => {
        if (levelsRes) {
          that.globalData.thinkingLevels = levelsRes.levels || [];
        }

        that._request(base + '/exchange-rates', (ratesRes) => {
          if (ratesRes) {
            that.globalData.exchangeRates = ratesRes;
          }
          that.globalData.loaded = true;
          console.log('Data loaded:', that.globalData.models.length, 'models');
        });
      });
    });
  },

  _request(url, callback) {
    wx.request({
      url: url,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200) {
          callback(res.data);
        } else {
          console.error('Request failed:', url, res.statusCode);
          callback(null);
        }
      },
      fail(err) {
        console.error('Request error:', url, err);
        callback(null);
      },
    });
  },
});
