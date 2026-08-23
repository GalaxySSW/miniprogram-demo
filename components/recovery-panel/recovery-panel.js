Component({
  properties: {
    state: { type: String, value: 'error' },
    title: { type: String, value: '出了点问题' },
    description: { type: String, value: '你的内容已经保留，可以稍后继续。' },
    primaryText: { type: String, value: '重试' },
    secondaryText: { type: String, value: '' },
    showSecondary: { type: Boolean, value: false },
    qaId: { type: String, value: 'recovery-panel' }
  },
  methods: {
    onRetry() { this.triggerEvent('retry', { state: this.data.state }, { bubbles: true, composed: true }) },
    onSecondary() { this.triggerEvent('secondary', { state: this.data.state }, { bubbles: true, composed: true }) }
  }
})
