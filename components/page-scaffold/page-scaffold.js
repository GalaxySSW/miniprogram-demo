Component({
  properties: {
    title: { type: String, value: '' },
    eyebrow: { type: String, value: '' },
    subtitle: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    backText: { type: String, value: '返回' },
    compact: { type: Boolean, value: false },
    centered: { type: Boolean, value: false },
    qaId: { type: String, value: 'page-scaffold' }
  },
  methods: {
    onBack() {
      this.triggerEvent('back', {}, { bubbles: true, composed: true })
    }
  }
})
