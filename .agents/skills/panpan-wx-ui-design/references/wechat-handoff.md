# WeChat handoff and runtime QA

Read this reference for WXML/WXSS handoff, implementation review, runtime validation, or visual regression.

## Design-to-code mapping

Translate the design representation into the project's native mini-program conventions:

| Figma | Mini-program |
| --- | --- |
| Variable | semantic token/class in `app.wxss` or maintained component WXSS |
| Component | reusable component under `components/` |
| Component property | component `properties` plus deterministic class/state mapping |
| Screen frame | page WXML structure and page-state contract |
| Variant state | JS state enum and conditional WXML |
| Prototype reaction | explicit navigation/event handler |
| Annotation | implementation, privacy, copy-limit, or QA note |
| Screenshot | visual comparison reference |

Figma design-context output is a representation, not production code. Adapt React/Tailwind-like output to WXML/WXSS; do not paste it directly.

## Component contract

For shared components, maintain a mapping similar to:

```json
{
  "component": "JudgeButton",
  "figmaComponent": "Button",
  "wxml": "judge-button",
  "properties": ["variant", "size", "loading", "disabled"],
  "states": ["idle", "loading", "success", "error"],
  "tokens": ["color/action/primary", "radius/button", "space/button"],
  "qaSelector": "qa-button-{purpose}"
}
```

Use Code Connect when it supports the maintained mapping cleanly. Otherwise keep the contract in Figma annotations or a project handoff artifact rather than fabricating unsupported framework integration.

## WeChat constraints

Check, as applicable:

- capsule and navigation-bar avoidance;
- top and bottom safe areas;
- 375pt design intent and explicit px/rpx conversion;
- scroll ownership for long pages such as verdict;
- keyboard avoidance and input retention;
- touch target size and pressed/disabled/loading feedback;
- microphone, album, image upload, save-to-album, canvas, and settings permissions;
- native share and authorization behavior;
- long Chinese copy, line wrapping, truncation, and missing fields;
- reduced motion and non-color status cues;
- local mock, staging, and real AI states remain visibly distinguishable.

Use WeUI or TDesign MiniProgram only as a behavior/API reference unless the user explicitly chooses to adopt those components. Preserve 判判's own visual tokens and voice.

## Runtime workflow

The project baseline is local mock for the first visual and interaction pass. When the user has manually opened WeChat Developer Tools, do not open, quit, or switch ports automatically.

For the configured `weapp-agent-mcp` workflow:

```text
mp_ensureConnection
→ mp_healthCheck after a connection problem
→ mp_recoverConnection only when needsRecovery=true
→ inspect route, elements, and page data
→ perform one short scenario
→ assert route and state
→ take screenshots serially when needed
```

Do not confuse the IDE service port with the automation WebSocket port. Do not run two runtime MCP controllers against the same Developer Tools session unless the user explicitly requests a controlled comparison.

## Stable QA selectors

Use stable semantic selectors for primary actions, inputs, state indicators, and route exits. Avoid coordinates, generic `.btn`, or list indices.

Baseline examples:

```text
qa-home-start-case
qa-evidence-next
qa-statement-input-what
qa-statement-submit
qa-accept-send-summons
qa-share-simulate-ta
qa-respond-start
qa-interview-submit
qa-trial-result
qa-verdict-go-pact
```

## Scenario reporting

Record for each validation:

- modification scope;
- entry page and precondition;
- action performed;
- expected route/data/visual state;
- actual result;
- screenshot or structured evidence;
- whether human real-device confirmation is still required.

Recommended short scenarios:

```text
Create case:
home → evidence → statement → accept

Single-device respondent demo:
share → respond → their-statement → interview → trial → verdict

Post-verdict repair:
verdict → pact → wait / confirm / done
```

Simulator success proves only the tested local behavior. It does not prove dual-device authorization, sensitive-data governance, automatic deletion, provider retention, or production readiness.
