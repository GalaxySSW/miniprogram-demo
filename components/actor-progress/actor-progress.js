Component({
  properties: {
    actor: { type: String, value: 'me' },
    current: { type: Number, value: 0, observer: 'syncSteps' },
    steps: { type: Array, value: [], observer: 'syncSteps' },
    orientation: { type: String, value: 'horizontal' },
    compact: { type: Boolean, value: false },
    qaId: { type: String, value: 'actor-progress' }
  },
  data: { renderedSteps: [] },
  lifetimes: { attached() { this.syncSteps() } },
  methods: {
    syncSteps() {
      const input = this.data.steps && this.data.steps.length ? this.data.steps : ['发起', '回应', '审理', '结果']
      const current = Number(this.data.current) || 0
      const renderedSteps = input.map((step, index) => {
        const item = typeof step === 'string' ? { id: index, label: step } : step
        return Object.assign({}, item, { state: index < current ? 'done' : (index === current ? 'current' : 'pending') })
      })
      this.setData({ renderedSteps })
    },
    onStepTap(event) {
      const index = Number(event.currentTarget.dataset.index)
      this.triggerEvent('select', { index, step: this.data.renderedSteps[index] }, { bubbles: true, composed: true })
    }
  }
})
