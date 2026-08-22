// app.js — 爱情判官（黑客松 MVP）
// 云开发就绪后把 CLOUD_ENV 填成你的云环境 ID，AI 即自动生效；为空时全流程走本地 mock
const CLOUD_ENV = 'cloud1-d5gwslwa351e26c8e'

App({
  onLaunch() {
    if (wx.cloud && CLOUD_ENV) {
      wx.cloud.init({ env: CLOUD_ENV, traceUser: true })
      this.globalData.cloudReady = true
    }
  },
  globalData: {
    cloudReady: false,
    // 当前案件的模拟状态机：created → accepted → summoned → responded → tried → closed
    caseData: {
      id: '2026 情字第 0822 号',
      docId: '',
      status: 'created',
      myStatement: {},
      theirStatement: {},
      pebblesToday: 0
    },
    // 「先回一句」低风险话术（后续由 DeepSeek 生成）
    replySuggestions: [
      '我现在有点乱，但我不想跟你冷战。等我理一理，今晚好好说。',
      '刚才那句话我说重了。我还在生气，但不是不想理你。',
      '先吃饭吧。这件事我想好好说，不想在气头上说错话。'
    ],
    // 判决书 mock（后续由 DeepSeek 按六段结构生成）
    verdict: {
      caseBrief: '周三晚上，一句「你先吃吧，我要加班」点燃了本案。一方觉得自己又一次被排在了工作后面；另一方觉得自己辛苦加班，回家还要挨骂。随后的一个小时里，你们互相说了七句反话——经查，没有一句是真心的。',
      herWord: '「随便你」',
      herMeaning: '「我怕说了你也不听，但我还是想你再哄哄我。」',
      hisWord: '一整晚的沉默',
      hisMeaning: '「不是不在乎，是怕一开口，把你越推越远。」',
      index: 87,
      caseType: 'misunderstanding',
      residue: '其余 13% 不是误会：加班这件事，你确实有三次没提前说一声。',
      verdictTitle: '本案不存在被告。',
      ruling: '判处「你根本不在乎我」一句有罪，当庭销毁；原告双方，无罪释放，即刻和好。',
      herStep: '「那天说随便你，其实是想让你再多问我一句。」',
      hisStep: '「我沉默不是不在乎，我在想怎么说你才不会更生气。」'
    },
    // 首页跑马灯：匿名结案金句
    quotes: [
      '本案不存在被告。',
      '判处「你根本不在乎我」一句有罪，当庭销毁。',
      '经查，没有一句反话是真心的。',
      '原告双方，无罪释放，即刻和好。',
      '误会浓度 87%，实际矛盾含量仅 13%。'
    ]
  }
})
