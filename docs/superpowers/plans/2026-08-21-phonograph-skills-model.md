# Phonograph Skills Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Skills cube with the authored phonograph GLB and place it naturally on the cabinet's middle shelf without changing the existing Skills interaction.

**Architecture:** Add a small pure transform helper that scales and recenters a loaded Three.js object from its bounds, making placement testable outside the browser. Keep the existing Skills mesh as the interaction anchor and fallback, attach the loaded phonograph to it, preserve GLB materials, and hide only the anchor surface after successful loading.

**Tech Stack:** JavaScript ES modules, Three.js, GSAP, Vite, Node built-in test runner, Playwright browser verification.

---

### Task 1: Test the Bounds-Based Placement Helper

**Files:**
- Create: `src/phonograph-placement.test.js`
- Create: `src/phonograph-placement.js`
- Modify: `package.json`

- [ ] **Step 1: Add a failing placement test**

Create a Three.js group containing an offset box, call `fitObjectToAnchor(group, { targetWidth: 0.72, shelfY: 0 })`, and assert that its resulting world width is `0.72`, horizontal/depth center is zero, and lower Y bound is zero.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `src/phonograph-placement.js` does not exist.

- [ ] **Step 3: Implement the pure placement helper**

Export `fitObjectToAnchor(object, options)` from `src/phonograph-placement.js`. Compute the original bounds, apply a uniform `targetWidth / size.x` scale, update matrices, recompute bounds, and offset X/Z to the requested center and Y so the lower bound equals `shelfY`. Throw when the source width is zero.

- [ ] **Step 4: Add the test script and verify GREEN**

Set `package.json` script `test` to `node --test src/*.test.js`, run `npm test`, and expect one passing test with zero failures.

### Task 2: Load the Phonograph Into the Skills Anchor

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Add a failing source contract test**

Extend `src/phonograph-placement.test.js` to read `src/main.js` and assert that it references `唱片机1.glb`, calls `fitObjectToAnchor`, preserves existing mesh materials rather than assigning replacements, attaches the scene beneath the Skills anchor, and retains a load-error fallback.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: the source contract test fails because the phonograph loader is absent.

- [ ] **Step 3: Implement the loader**

Import `fitObjectToAnchor`; cache the `GLTFLoader` constructor used by the cabinet; load `./assets/models/唱片机1.glb`; mark child meshes for shadows without assigning materials; fit the model to a localized target width and shelf offset; attach it to `interactiveObjects.get('skills')`; and hide the anchor material only after success. On error, warn and leave the placeholder visible.

- [ ] **Step 4: Keep interaction behavior stable**

Ensure the Skills anchor remains in `interactiveObjects`, continues to carry `userData.id = 'skills'`, and receives the existing hover/select scale animation. Keep the phonograph below the same anchor so a click opens the current Skills panel.

- [ ] **Step 5: Run tests and build**

Run: `npm test`

Expected: all tests pass with zero failures.

Run: `npm run build`

Expected: Vite exits successfully and emits the phonograph GLB into `dist/assets`.

### Task 3: Browser Placement and Interaction Verification

**Files:**
- Modify if needed: `src/main.js`
- Create: `work/phonograph-desktop.png`
- Create: `work/phonograph-mobile.png`

- [ ] **Step 1: Start the Vite development server**

Run `npm run dev -- --host 127.0.0.1` on an unused port and keep the process active.

- [ ] **Step 2: Capture desktop and mobile screenshots**

Use Playwright after the welcome and door animations complete. Capture the open cabinet at a desktop viewport and a narrow mobile viewport.

- [ ] **Step 3: Inspect and tune placement**

Verify visually that the phonograph is upright, centered naturally on the middle shelf, rests on the shelf with no visible gap, does not intersect the cabinet, and retains its authored appearance. Adjust only the localized target width, anchor position, or rotation constants, then recapture until these conditions pass.

- [ ] **Step 4: Verify the Skills interaction**

Click the visible phonograph area and assert that the detail panel opens with the title `能力`. Confirm the other three interactive entries still open their existing panels.

- [ ] **Step 5: Run final verification**

Run `npm test` and `npm run build` again after the final visual tuning. Confirm both exit with code 0 and inspect the final screenshots at native size.
