const STATUS_COPY = {
  draft: '草稿',
  invited: '已邀请',
  waiting: '等待中',
  'in-progress': '审理中',
  in_progress: '审理中',
  responded: '已回应',
  'verdict-ready': '判决已出',
  completed: '已完成',
  expired: '已过期',
  cancelled: '已取消',
  failed: '处理失败',
  accepted: '已受理',
  closed: '已结束'
}

Component({
  properties: {
    status: { type: String, value: 'draft', observer: 'syncText' },
    text: { type: String, value: '' },
    compact: { type: Boolean, value: false },
    qaId: { type: String, value: 'case-status' }
  },
  data: { displayText: STATUS_COPY.draft, statusClass: 'draft' },
  lifetimes: { attached() { this.syncText(this.data.status) } },
  methods: {
    syncText(status) {
      this.setData({
        displayText: this.data.text || STATUS_COPY[status] || status,
        statusClass: String(status || 'draft').replace(/_/g, '-')
      })
    }
  }
})
