# Skills Vinyl Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only the Skills detail view with a responsive three-record vinyl player controlled by wheel, swipe, and previous/next buttons.

**Architecture:** Add a focused `skills-player.js` module containing the three records, wrapped-index logic, and markup renderer. `main.js` owns application state and DOM event handling, while `style.css` owns the turntable illustration, transitions, responsive stacking, and reduced-motion behavior.

**Tech Stack:** JavaScript ES modules, CSS, GSAP, Node test runner, Vite, Playwright.

---

### Task 1: Skills Data And Wrapped Navigation

**Files:**
- Create: `src/skills-player.js`
- Create: `src/skills-player.test.js`

- [ ] **Step 1: Write failing tests**

Test that the exported record list contains exactly Creative Code, Frontend Systems, and Interaction Design, and that `wrapSkillIndex(-1, 3) === 2` and `wrapSkillIndex(3, 3) === 0`.

- [ ] **Step 2: Verify RED**

Run `npm test`; expect module-not-found failure for `skills-player.js`.

- [ ] **Step 3: Implement the data and helper**

Export `skillRecords` with title, eyebrow, description, tags, and accent for all three records. Export `wrapSkillIndex(index, length)` using `((index % length) + length) % length` and throw when length is not positive.

- [ ] **Step 4: Verify GREEN**

Run `npm test`; expect all data and navigation tests to pass.

### Task 2: Skills Player Markup

**Files:**
- Modify: `src/skills-player.js`
- Modify: `src/skills-player.test.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write a failing markup test**

Assert that `renderSkillsPlayer(skillRecords[0], 0, 3)` contains `skills-player`, `vinyl-record`, `Creative Code`, all three tool tags, `01 / 03`, and previous/next buttons with accessible labels.

- [ ] **Step 2: Verify RED**

Run `npm test`; expect failure because `renderSkillsPlayer` is not exported.

- [ ] **Step 3: Implement markup rendering**

Return the complete two-column player markup: turntable plinth, rotating record, spindle, tonearm, controls, skill copy, tags, progress, and icon-button navigation. Escape all rendered text with a small private HTML-escape helper.

- [ ] **Step 4: Integrate the dedicated Skills renderer**

Import the module in `main.js`, add `activeSkillRecord: 0` to state, and branch `renderPanel('skills')` to the player renderer. Toggle `detail-panel--skills` only for this section so generic panels remain unchanged.

- [ ] **Step 5: Verify GREEN**

Run `npm test`; expect all tests to pass.

### Task 3: Wheel, Swipe, And Button Controls

**Files:**
- Modify: `src/main.js`
- Modify: `src/skills-player.test.js`

- [ ] **Step 1: Add a failing source-contract test**

Assert that `main.js` binds wheel, pointer-down/up, previous, and next behavior through the Skills player; uses `wrapSkillIndex`; prevents wheel default behavior; and ignores navigation while the Skills panel is inactive.

- [ ] **Step 2: Verify RED**

Run `npm test`; expect the source-contract assertions to fail.

- [ ] **Step 3: Implement record selection**

Add `changeSkillRecord(direction)` to wrap the index, animate the current player out with GSAP, rerender, and animate the next player in. Use a 650ms wheel lock, a 42px swipe threshold, and delegated click handlers for `data-skill-direction` buttons.

- [ ] **Step 4: Preserve existing panel behavior**

Keep close, Escape, scrim, and non-Skills rendering behavior unchanged. Reset transient wheel and swipe state when the panel closes.

- [ ] **Step 5: Verify GREEN**

Run `npm test`; expect all tests to pass.

### Task 4: Visual System And Responsive Layout

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add the desktop player styles**

Set the Skills panel to a maximum width near 900px and height near 560px. Create a 44/56 split layout with an ivory turntable, black vinyl, record-specific accent ring, tonearm, knobs, tool tags, progress rail, and compact icon controls.

- [ ] **Step 2: Add motion and accessibility styles**

Animate the record continuously and accelerate it during switching. Add hover/focus-visible states and disable continuous/transition motion under `prefers-reduced-motion: reduce`.

- [ ] **Step 3: Add mobile styles**

Below 760px, stack the turntable above the copy, reduce turntable size, constrain the panel to `88svh`, allow internal content scrolling, and keep every control visible without horizontal overflow.

### Task 5: Browser QA And Final Verification

**Files:**
- Create outside source: `work/verify-skills-player.mjs`
- Create outside source: desktop and mobile screenshots

- [ ] **Step 1: Exercise the desktop flow**

Open Skills, wheel through all three records, confirm `1 -> 2 -> 3 -> 1`, use previous/next buttons, and verify the background does not scroll.

- [ ] **Step 2: Exercise the mobile flow**

Use a 390 by 844 viewport, swipe vertically in both directions, verify cycling, and inspect for clipping or inaccessible controls.

- [ ] **Step 3: Check generic panels**

Open About, Work, and Notes and confirm they retain the generic markup and original panel dimensions.

- [ ] **Step 4: Inspect screenshots and tune**

Compare the implementation with approved option A for split ratio, turntable prominence, copy hierarchy, tags, controls, palette, spacing, and responsive stacking. If CSS lacks sufficient object fidelity, report that before proposing a GLB renderer.

- [ ] **Step 5: Run final commands**

Run `npm test` and `npm run build`; require zero test failures and a successful Vite build.
