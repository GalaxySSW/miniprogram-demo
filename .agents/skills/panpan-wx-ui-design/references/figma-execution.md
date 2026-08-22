# Figma execution for 判判 UI

Read this reference for Figma planning, authoring, library work, prototypes, or audits.

## File organization

Preserve the existing brand pages. Append or maintain a dedicated UI section such as:

```text
08 UI Contract
09 UI Foundations
10 UI Components
11 Core Flow Screens
12 System States
13 Extended Screens
14 Prototype
15 Handoff
```

Do not treat brand application examples as finished product screens.

## Preflight

Before any write:

1. Inventory the current Figma pages, local variables, styles, components, component sets, and existing UI screens.
2. Read the relevant route implementation and product contract.
3. List the sections and components needed for the requested screen.
4. Search existing components, variables, and styles before creating new assets.
5. Record unresolved decisions such as token conflicts, missing states, or unclear copy limits.
6. If the user requested only review or planning, stop before mutation and report the proposed node/page changes.

## Variables

Reuse the brand primitive, semantic color, spacing, and radius collections. Add UI semantics only when the existing system cannot represent the needed meaning:

```text
color/state/loading
color/state/success
color/state/warning
color/state/error
color/privacy/private
color/privacy/recipient
color/privacy/joint
color/safety/high-risk
color/action/disabled
motion/duration/fast
motion/duration/normal
safe-area/top
safe-area/bottom
```

Prefer aliases from semantic variables to primitives. Do not bind product screens directly to primitive colors when a semantic token exists.

## Components

- Use Component Sets and explicit properties such as `variant`, `state`, `size`, `actor`, `privacy`, and `motion`.
- Use Auto Layout for reusable components and page sections.
- Use component instances in screens; do not redraw buttons, fields, cards, cats, seals, or notices as detached primitives.
- Give components semantic names and descriptions that include state meaning, privacy behavior, and implementation mapping.
- Ensure long Chinese text, missing optional fields, and small viewports do not break layout.

Example component contracts:

```text
Button / variant=primary / state=loading / size=default
PrivacyNotice / visibility=private-me / content=statement
VoiceButton / state=permission-denied
AsyncState / operation=verdict / state=retryable-failure
CatJudge / mood=thinking / motion=breathe / size=hero
```

## Screen construction

Build one vertical slice before scaling. For each screen:

- create the main state with real component instances;
- add only the critical alternate frames required by its contract;
- annotate actor, privacy scope, entry condition, primary action, back behavior, async source, and saved/not-saved outcome;
- use realistic short and long Chinese copy to exercise layout;
- keep platform chrome, capsule avoidance, scroll region, keyboard behavior, and bottom safe area visible;
- return node IDs and verify each major section using structured inspection and a screenshot.

## System states page

Maintain full, reusable examples for:

```text
privacy consent
permission denied
upload / ASR / AI failure
mock result / not saved
invite invalid / expired / revoked / self / unauthorized
case recovery / deleted / version conflict
safety intervention
pact conflict / failed / expired
offline / polling timeout
deletion progress / completed / failed
```

These may be full-page frames, modals, sheets, or component variants. They do not all require new application routes.

## Prototype

Prototype at least:

1. normal two-party flow through verdict and pact;
2. AI/cloud failure with preserved draft and retry;
3. privacy consent or safety intervention branch.

Prototype links communicate navigation only. Keep state and business rules in annotations and page contracts.

## Audit gates

Before calling a Figma deliverable ready:

- no unexplained hardcoded colors, spacing, or radii where variables exist;
- no detached copies of reusable UI components;
- all required variants and selected/error/loading states are present;
- text contrast, touch target sizing, and non-color state cues are checked;
- responsive resizing is tested at the target mini-program viewport;
- screen names match routes and state names;
- screenshots are inspected at useful resolution;
- handoff contains implementation and QA mappings.

Community Figma audit skills may supplement these checks when explicitly requested, but they do not replace this project contract or justify installing new tooling without permission.
