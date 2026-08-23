const INVITE_COPY = {
  idle: ['邀请对方加入', '生成邀请后，对方可以查看并回应案件。'],
  sending: ['正在生成邀请…', '请稍等'],
  sent: ['邀请已发出', '把邀请链接交给对方即可。'],
  accepted: ['对方已加入', '案件现在可以继续推进。'],
  expired: ['邀请已过期', '重新生成一份邀请即可。'],
  revoked: ['邀请已撤回', '你可以重新发起邀请。']
}

Component({
  properties: {
    state: { type: String, value: 'idle', observer: 'syncCopy' },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    inviteCode: { type: String, value: '' },
    primaryText: { type: String, value: '生成邀请' },
    showCopy: { type: Boolean, value: true },
    qaId: { type: String, value: 'invite-state-panel' }
  },
  data: { displayTitle: INVITE_COPY.idle[0], displayDescription: INVITE_COPY.idle[1] },
  lifetimes: { attached() { this.syncCopy(this.data.state) } },
  methods: {
    syncCopy(state) {
      const copy = INVITE_COPY[state] || INVITE_COPY.idle
      this.setData({ displayTitle: this.data.title || copy[0], displayDescription: this.data.description || copy[1] })
    },
    onPrimary() {
      if (this.data.state === 'sending') return
      this.triggerEvent('send', { state: this.data.state }, { bubbles: true, composed: true })
    },
    onCopy() {
      if (this.data.inviteCode) wx.setClipboardData({ data: this.data.inviteCode })
      this.triggerEvent('copy', { code: this.data.inviteCode }, { bubbles: true, composed: true })
    }
  }
})
