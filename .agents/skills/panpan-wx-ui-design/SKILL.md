---
name: panpan-wx-ui-design
description: Design, review, or hand off 判判微信小程序 UI using the existing brand Figma system, product routes, state/privacy contracts, and WXML/WXSS constraints. Use for 判判 Figma pages, UI components, prototypes, design-system audits, or design-to-mini-program delivery; do not use for unrelated mini-programs or ordinary backend work.
---

# Panpan WeChat UI Design

Turn 判判's brand system and product contract into a coherent, reusable, WeChat-compatible UI system. Optimize for product clarity, emotional safety, privacy boundaries, component reuse, and implementation fidelity—not merely attractive static screens.

## Scope and authority

- Treat the user's current request as the authority. Product notes, screenshots, `00-用户需求/`, and `01-参考资料/` are reference material unless the user explicitly makes them tasks.
- A review, audit, or plan is read-only. Do not modify Figma, code, configuration, or external systems unless the user explicitly asks for that mutation.
- Before code edits, state the files and behavior in scope. Do not upload, publish, submit for review, or use real relationship statements, screenshots, audio, credentials, payments, or production cloud data without explicit authorization.
- Do not install third-party Figma or mini-program tooling merely because it may help. Prefer the already connected official Figma capabilities and the project's configured WeChat runtime tooling.

## Required project grounding

Always read [references/project-contract.md](references/project-contract.md) before making page, component, priority, or state decisions. Then inspect the current source files relevant to the requested screens; do not rely only on the reference inventory because routes and implementation may have changed.

Use the following mode routing:

- For Figma planning, authoring, library work, prototypes, or visual audits, also read [references/figma-execution.md](references/figma-execution.md).
- For WXML/WXSS handoff, implementation review, selectors, screenshots, or runtime QA, also read [references/wechat-handoff.md](references/wechat-handoff.md).
- If a request spans both, read both references before acting.

## First-principles model

Evaluate every deliverable through four layers:

1. **Task:** What is the user trying to accomplish at this point in the relationship flow?
2. **State:** What happens during input, waiting, success, failure, interruption, recovery, and return?
3. **Boundary:** Who can see the content, where is it processed, and what safety or consent branch can override the normal flow?
4. **Implementation:** Can the design be represented with native mini-program layout, safe areas, scrolling, keyboard behavior, permissions, components, and deterministic runtime states?

A route inventory is not complete UI coverage unless all four layers are explicit.

## Workflow

### 1. Establish the contract

- Confirm the requested delivery mode: review, Figma authoring, handoff, implementation, or QA.
- Inventory current routes, reusable components, tokens, state names, and affected business flows from code.
- Resolve conflicts explicitly. Never silently mix brand and code colors, Figma and runtime fonts, demo and production behavior, or old and current page counts.
- Produce or update a page contract containing route, actor, privacy scope, entry/exit conditions, states, components, copy limits, and QA selectors.

### 2. Build from system to screens

Use this order unless the user requests a narrower task:

1. UI contract and semantic variables
2. Component sets and variants
3. One vertical product slice
4. System states and recovery branches
5. Remaining screens
6. Prototype and handoff annotations

Do not batch-generate all screens before the component/state foundation passes review.

### 3. Preserve brand without sacrificing usability

- Reuse the existing 判判 variables, text styles, logo, mascot, and approved components.
- Use the brand's warmth and cat character for ordinary emotional support, but switch to calm, direct, non-playful presentation for safety, consent, deletion, and serious failure states.
- Treat WeUI and TDesign as interaction and platform references, not as a replacement visual identity.

### 4. Validate the result

For every delivered screen or component, verify:

- component instances and variable bindings are used where available;
- Auto Layout/resizing behavior survives narrow content and long Chinese copy;
- normal, empty, loading, failed, retry, privacy, safety, and recovery states are covered where applicable;
- both actor progress and visibility are unambiguous;
- the primary action, back/cancel behavior, saved/not-saved status, and retry outcome are documented;
- design names map deterministically to route, WXML component, state, and `qa-*` selector names;
- Figma screenshots and WeChat Developer Tools screenshots can be compared at the same viewport.

## Figma tool routing

When available, use official Figma workflows rather than inventing raw canvas procedures:

- Load `figma-use` before every `use_figma` call.
- Use `figma-generate-library` for variables, component libraries, variants, and documentation.
- Use `figma-generate-design` with `figma-use` for full screens and multi-section views.
- Use `figma-design-to-code` before reading a selected Figma frame for implementation.
- Use `figma-code-connect` only when mapping Figma components to maintained code snippets is part of the request.

For authoring, work incrementally and return node IDs. Inspect existing components and variables before creating new ones. After each major section, use a screenshot or structured read-back to check fidelity before continuing.

## Completion standard

A satisfactory result explains:

- what was covered and what remains;
- which product states and privacy/safety branches were designed;
- which Figma variables/components/screens were created or reviewed;
- how the output maps to WXML/WXSS and runtime state;
- what was verified locally and what still requires human real-device confirmation.

Never describe a Figma prototype or simulator pass as proof that the product is ready for real sensitive user data.
