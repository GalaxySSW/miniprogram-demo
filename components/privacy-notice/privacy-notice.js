const SCOPE_COPY = {
  'private-me': ['对 TA 保密', '#D9785B'],
  'private-ta': ['对我保密', '#DDBB7A'],
  joint: ['共同可见', '#A8B89A'],
  public: ['公开脱敏版', '#F6B59D']
}

Component({
  properties: {
    scope: { type: String, value: 'private-me', observer: 'syncScope' },
    label: { type: String, value: '' },
    text: { type: String, value: '这段内容只会按当前范围保存和展示。' },
    detail: { type: String, value: '' },
    quiet: { type: Boolean, value: false },
    qaId: { type: String, value: 'privacy-notice' }
  },
  data: { scopeLabel: '对 TA 保密', scopeColor: '#D9785B' },
  lifetimes: { attached() { this.syncScope(this.data.scope) } },
  methods: {
    syncScope(scope) {
      const copy = SCOPE_COPY[scope] || SCOPE_COPY['private-me']
      this.setData({ scopeLabel: this.data.label || copy[0], scopeColor: copy[1] })
    }
  }
})
