const app = getApp();
Page({
  data: {
    state: null,
    hospital: null,
    current: null,
    api: app.globalData.api,
    online: false,
    busy: false,
    target: '',
    route: null,
    floorIndex: 0,
    query: '',
    results: [],
    large: false,
    steps: [],
    floorNames: [],
    locationName: '',
    atTask: false,
  },
  onLoad() {
    this.loadHospital();
  },
  onShow() {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 1500);
  },
  onHide() {
    clearInterval(this.timer);
  },
  onUnload() {
    clearInterval(this.timer);
  },
  onPullDownRefresh() {
    this.refresh().finally(() => wx.stopPullDownRefresh());
  },
  request(path, method = 'GET', data) {
    return new Promise((resolve, reject) =>
      wx.request({
        url: app.globalData.api + path,
        method,
        data,
        timeout: 5000,
        success: (r) =>
          r.statusCode >= 200 && r.statusCode < 300
            ? resolve(r.data)
            : reject(Error(r.data.error || '服务异常')),
        fail: () => reject(Error('无法连接，请检查接口地址及同一 Wi-Fi')),
      }),
    );
  },
  async loadHospital() {
    try {
      const hospital = await this.request('/api/hospital');
      this.setData({
        hospital,
        floorNames: hospital.floors.map((f) => f.name),
      });
      this.refresh();
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  async refresh() {
    try {
      const state = await this.request('/api/state');
      const h = this.data.hospital;
      if (h) {
        const current = h.stages[state.stage];
        const ids =
          state.scenario === 'simple'
            ? [0, 1, 2, 7, 8, 9]
            : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.setData({
          state,
          current,
          online: true,
          locationName: (
            state.poiOverrides[state.location] ||
            h.nodes.find((n) => n.id === state.location)
          ).name,
          atTask: current.target === state.location,
          steps: ids.map((i) => ({
            ...h.stages[i],
            id: i,
            done: i < state.stage,
            active: i === state.stage,
          })),
        });
        if (this.data.target) await this.getRoute();
        else this.draw();
      } else this.setData({ state, online: true });
    } catch {
      this.setData({ online: false });
    }
  },
  async action(type, extra = {}) {
    if (this.data.busy) return;
    this.setData({ busy: true });
    try {
      await this.request('/api/action', 'POST', {
        type,
        ...extra,
        version: this.data.state.version,
      });
      await this.refresh();
      wx.showToast({ title: '已更新', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
      await this.refresh();
    } finally {
      this.setData({ busy: false });
    }
  },
  advance() {
    this.action('advance');
  },
  call() {
    this.action('call');
  },
  arrive() {
    this.action('arrive', { id: this.data.target });
  },
  accessible(e) {
    this.action('accessible', { value: e.detail.value });
  },
  large(e) {
    this.setData({ large: e.detail.value });
  },
  go() {
    this.navigate(this.data.current.target);
  },
  pickPoi(e) {
    this.navigate(e.currentTarget.dataset.id);
  },
  async navigate(id) {
    if (!id) return;
    const h = this.data.hospital;
    const loc = h.nodes.find((n) => n.id === this.data.state.location);
    this.setData({
      target: id,
      query: '',
      results: [],
      floorIndex: h.floors.findIndex((f) => f.id === loc.level),
    });
    await this.getRoute();
  },
  async getRoute() {
    try {
      const { route } = await this.request(
        '/api/route?from=' +
          this.data.state.location +
          '&to=' +
          this.data.target,
      );
      this.setData({ route });
      this.draw();
    } catch {}
  },
  floor(e) {
    this.setData({ floorIndex: Number(e.detail.value) });
    this.draw();
  },
  search(e) {
    const q = e.detail.value.toLowerCase();
    this.setData({
      query: q,
      results: q
        ? this.data.hospital.pois.filter((p) =>
            (p.name + ' ' + p.aliases).toLowerCase().includes(q),
          )
        : [],
    });
  },
  setApi(e) {
    this.setData({ api: e.detail.value });
  },
  connect() {
    const value = this.data.api.replace(/\/$/, '');
    if (!/^https?:\/\//.test(value)) {
      wx.showToast({ title: '请填写 http:// 开头的接口地址', icon: 'none' });
      return;
    }
    app.globalData.api = value;
    this.loadHospital();
  },
  scan() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (r) => {
        const id = r.result.replace('hospital-demo://location/', '');
        if (!this.data.hospital.nodes.some((n) => n.id === id)) {
          wx.showToast({ title: '不是有效的院内定位码', icon: 'none' });
          return;
        }
        this.action('locate', { id });
      },
    });
  },
  locate() {
    const ids = ['out-1-entry', 'service', 'cardio', 'ct', 'pharmacy'];
    wx.showActionSheet({
      itemList: ids.map(
        (id) => this.data.hospital.nodes.find((n) => n.id === id).name,
      ),
      success: (r) => this.action('locate', { id: ids[r.tapIndex] }),
    });
  },
  draw() {
    const h = this.data.hospital;
    if (!h || !this.data.state) return;
    const level = h.floors[this.data.floorIndex].id;
    const ctx = wx.createCanvasContext('floorMap', this);
    wx.createSelectorQuery()
      .in(this)
      .select('#floorMap')
      .boundingClientRect((rect) => {
        if (!rect) return;
        const scale = rect.width / 800;
        ctx.scale(scale, scale);
        ctx.setFillStyle('#14253c');
        ctx.fillRect(0, 0, 800, 650);
        ctx.setFillStyle('#203951');
        ctx.fillRect(70, 105, 660, 430);
        ctx.setStrokeStyle('#36526d');
        ctx.setLineWidth(35);
        ctx.beginPath();
        ctx.moveTo(160, 300);
        ctx.lineTo(650, 300);
        ctx.moveTo(180, 300);
        ctx.lineTo(180, 440);
        ctx.lineTo(620, 440);
        ctx.lineTo(620, 300);
        ctx.moveTo(400, 300);
        ctx.lineTo(400, 440);
        ctx.stroke();
        const n = (id) => h.nodes.find((n) => n.id === id);
        h.pois
          .filter((p) => p.level === level)
          .forEach((p) => {
            ctx.setFillStyle(p.id === this.data.target ? '#245d91' : '#2d4966');
            ctx.fillRect(
              p.x - 82,
              p.y < 300 ? 130 : 335,
              164,
              p.y < 300 ? 110 : 65,
            );
            ctx.setFillStyle('#d8e8fa');
            ctx.setFontSize(17);
            ctx.setTextAlign('center');
            ctx.fillText(
              (this.data.state.poiOverrides[p.id] || p).name,
              p.x,
              p.y < 300 ? 185 : 370,
            );
          });
        if (this.data.route) {
          ctx.setStrokeStyle('#4eafff');
          ctx.setLineWidth(6);
          this.data.route.segments.forEach((e) => {
            const a = n(e.a),
              b = n(e.b);
            if (a.level !== level || b.level !== level) return;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            (e.bends || []).forEach((p) => ctx.lineTo(p.x, p.y));
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          });
        }
        h.nodes
          .filter(
            (n) =>
              n.level === level &&
              ['elevator', 'stairs', 'entry'].includes(n.type),
          )
          .forEach((p) => {
            ctx.setFillStyle('#9bbad9');
            ctx.setFontSize(16);
            ctx.fillText(p.name, p.x, p.y + 30);
          });
        const p = n(this.data.state.location);
        if (p.level === level) {
          ctx.setFillStyle('#5cb9ff');
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.draw();
      })
      .exec();
  },
});
