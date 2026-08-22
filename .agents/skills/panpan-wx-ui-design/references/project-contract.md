# 判判 UI project contract

Read this reference whenever deciding page coverage, component scope, priority, naming, privacy, or system states. Confirm mutable facts against the source tree before acting.

Resolve the paths below from `07-代码/miniprogram-demo/`.

## Sources of truth

- Brand Figma: `https://www.figma.com/design/wcMDs0CPnZ25TTQvmwrYPs/20260822_panpan`
- Brand specification: `../../08-品牌视觉系统/品牌视觉系统规范.md`
- Brand/Figma execution notes: `../../08-品牌视觉系统/品牌视觉评审与Figma执行方案.md`
- UI brief: `../../09-UI设计需求.md`
- Runtime/UI research: `docs/调试与前端交互架构调研.md`
- App route source of truth: `app.json`
- Global tokens and common styles: `app.wxss`
- Current reusable components: `components/`
- Page implementations: `pages/`

The Figma execution notes may contain stale status text. Read the current Figma inventory before reporting what has or has not been executed.

## Product task chain

The registered product currently contains 19 routes:

```text
home
evidence
statement
accept
reply
preview
share
waiting
respond
their-statement
interview
trial
verdict
poster
pact
pebble
history
review
profile
```

Organize design and QA by vertical flows rather than isolated screens:

```text
Create case:
home → evidence → statement → accept → preview → share

Respond privately:
respond → their-statement → interview

Adjudicate:
waiting → trial → verdict

Repair and retain:
verdict → pact → poster / pebble → history → review / profile
```

`reply` is a de-escalation branch from `accept`, not a required step in every happy path. `pact` is part of the core product outcome. `waiting` is essential for a real two-device flow even if a local mock demo can bypass it.

## State dimensions

Do not reduce state coverage to one generic loading or error screen. Model these dimensions separately:

| Dimension | Required values where applicable |
| --- | --- |
| Case lifecycle | draft, created, accepted, summoned, opened, responded, trying, tried, pact, closed, retrial, expired, deleted |
| Actor progress | me-pending, me-done, ta-pending, ta-done, both-done, absent |
| Async operation | idle, uploading, transcribing, generating, saving, success, retryable-failure, timeout, offline, mock-fallback |
| Privacy | private-me, private-ta, joint, public-redacted |
| Safety | normal, concern, blocked, support |
| Recovery | restoring, draft-preserved, missing-case, unauthorized, version-conflict, expired, deleted |

The safety branch takes precedence over ordinary reconciliation UI. It must not reveal one party's private testimony to the other.

## Component foundation

The target UI library should cover at least:

```text
CatJudge
PageScaffold
TopBar
BottomActionBar
Button
Card
Pill
Chip
TextField
EvidencePicker
VoiceButton
ChatBubble
Stepper
CaseStatus
ActorProgress
Seal / VerdictMeter
PrivacyNotice / PrivacyScope
SafetyIntervention
AsyncState
InviteState
PermissionPrompt
RecoveryPanel
CaseCard
ChoiceCard
Toast
Modal
ActionSheet
EmptyState
ErrorState
DeletionFlow
PosterFrame
```

Keep `Toast`, `Modal`, `EmptyState`, and `ErrorState` as distinct component sets. Do not collapse every operational state into one catch-all component.

## Brand/runtime conflicts to resolve

- The code UI historically uses `ink #1A1918` for the primary action, while the Figma brand system also contains `cocoa #3B2919` and `peach #FFD9C7`. Choose and document the semantic source of truth before drawing screens; do not mix them opportunistically.
- Figma may preview with `Noto Sans SC`, while the mini-program uses system/PingFang fallbacks. Document this as preview versus runtime typography.
- The current source has historically depended on `app.globalData` and mock fallbacks. Designs must distinguish saved cloud success, local mock output, failure, and preserved draft.
- Claims about deletion, retention, privacy, or automatic destruction must match implemented behavior and remain configurable until verified.

## Page contract schema

Use this structure in design notes or handoff metadata:

```yaml
pageId: statement
route: pages/statement/statement
actor: initiator
privacyScope: private-me
viewport: 375pt
safeArea: bottom
entry: case draft exists
primaryAction: submit statement
backAction: preserve draft and return
components:
  - TextField
  - VoiceButton
  - PrivacyNotice
states:
  - idle
  - input
  - recording
  - transcribing
  - submitting
  - failed-preserved-draft
copyLimits: defined in implementation notes
qaSelectors:
  - qa-statement-input-what
  - qa-statement-submit
wechatCompatibility:
  - keyboard avoidance
  - microphone permission
```
