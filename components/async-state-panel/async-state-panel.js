const COPY = {
  loading: ['正在加载…', '请稍等'],
  empty: ['还没有案件', '发起你的第一次调解吧'],
  error: ['加载失败', '网络似乎不太稳定'],
  timeout: ['请求超时', '请检查网络后重试'],
  offline: ['暂时离线', '恢复网络后可继续'],
  success: ['已完成', '']
}

Component({
  properties: {
    state: { type: String, value: 'loading', observer: 'syncCopy' },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    retryText: { type: String, value: '重试' },
    showRetry: { type: Boolean, value: false },
    qaId: { type: String, value: 'async-state-panel' }
  },
  data: { stateTitle: '正在加载…', stateDescription: '请稍等' },
  lifetimes: { attached() { this.syncCopy(this.data.state) } },
  methods: {
    syncCopy(state) {
      const copy = COPY[state] || COPY.loading
      this.setData({ stateTitle: this.data.title || copy[0], stateDescription: this.data.description || copy[1] })
    },
    onRetry() {
      this.triggerEvent('retry', { state: this.data.state }, { bubbles: true, composed: true })
    }
  }
})
