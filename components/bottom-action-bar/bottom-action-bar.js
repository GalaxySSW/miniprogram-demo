Component({
  properties: {
    primaryText: { type: String, value: '确认' },
    secondaryText: { type: String, value: '' },
    loadingText: { type: String, value: '提交中…' },
    primaryDisabled: { type: Boolean, value: false },
    secondaryDisabled: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    showSecondary: { type: Boolean, value: false },
    fixed: { type: Boolean, value: true },
    safeArea: { type: Boolean, value: true },
    qaId: { type: String, value: 'bottom-action-bar' }
  },
  methods: {
    onPrimary() {
      if (this.data.primaryDisabled || this.data.loading) return
      this.triggerEvent('primary', {}, { bubbles: true, composed: true })
    },
    onSecondary() {
      if (this.data.secondaryDisabled) return
      this.triggerEvent('secondary', {}, { bubbles: true, composed: true })
    }
  }
})
