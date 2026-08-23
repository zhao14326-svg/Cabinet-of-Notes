# Skills Vinyl Player Design

## Goal

Replace the generic Skills detail content with a vinyl-player interface that presents three skill groups as records. Preserve the existing panel behavior for Home, About, Work, and Notes.

## Content

1. Creative Code: Three.js, GSAP, WebGL.
2. Frontend Systems: React, TypeScript, Vite.
3. Interaction Design: interaction prototyping, visual systems, narrative design.

Each record has a title, short description, tool tags, accent color, and `current / total` progress.

## Layout

- Desktop panel target: approximately 900 by 560 pixels.
- Left 44 percent: an HTML/CSS turntable matching the existing ivory, black, and red phonograph styling.
- Right 56 percent: skill index, title, description, tags, progress, and previous/next controls.
- Mobile: stack the turntable above the description and keep the panel within the available small-viewport height.
- Existing content panels retain their current layout and dimensions.

## Interaction

- Desktop wheel changes one record at a time and is throttled to prevent accidental skipping.
- Mobile vertical swipe changes records.
- Previous and next buttons work on all viewports.
- Navigation wraps from the third record to the first and from the first to the third.
- The active record rotates continuously. Switching accelerates the record, changes its accent, and crossfades the description.
- Wheel events inside the open Skills player do not scroll or zoom the background.
- Existing close button, Escape key, and scrim behavior remain unchanged.
- Reduced-motion users receive immediate state changes without continuous or transition animation.

## State And Boundaries

- Keep the selected skill-record index in application state.
- Use a dedicated Skills renderer while retaining the existing generic renderer for all other sections.
- Bind player listeners once and make them no-ops when the Skills view is not active.
- No second Three.js renderer is introduced. If browser review shows that the CSS turntable lacks sufficient fidelity, pause and propose reuse of the GLB model as a separate enhancement.

## Verification

- Unit-test wrapped index calculation and Skills-specific markup.
- Verify wheel throttling, previous/next controls, and swipe navigation in the browser.
- Confirm other content panels render unchanged.
- Capture and inspect desktop and mobile screenshots for overflow, clipping, hierarchy, and visual fidelity.
- Run the complete test suite and production build after visual tuning.
