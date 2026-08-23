# Phonograph Skills Model Design

## Goal

Replace the Skills placeholder cube with the new `唱片机1.glb` model while preserving the existing Skills interaction and the model's authored materials. Place the phonograph naturally on the cabinet model's middle shelf.

## Architecture

- Keep the current Skills interactive object as the interaction anchor and fallback.
- Load the phonograph through the existing `GLTFLoader` integration.
- Attach the loaded scene to the Skills anchor so selection, hover, and scale feedback continue to use the existing interaction path.
- Preserve every material supplied by the GLB. Only enable shadow participation and disable frustum culling where needed.

## Placement

- Compute the phonograph bounds after loading.
- Normalize its scale against an explicit target width suitable for the cabinet interior.
- Recenter it horizontally and in depth around the Skills anchor.
- Offset it vertically so the scaled lower bound rests on the middle shelf surface without floating or intersection.
- Keep rotation and placement constants localized so browser verification can tune them without changing loader behavior.

## Failure Handling

- Keep the placeholder visible until the phonograph loads successfully.
- If loading fails, log a warning and leave the placeholder usable.
- Do not allow a failed optional asset to block the cabinet intro or other sections.

## Verification

- Add a source-level regression check for the model URL, material preservation, fallback, and Skills anchoring.
- Run the production build.
- Run the site locally and inspect desktop and mobile browser screenshots.
- Confirm the phonograph sits naturally on the middle shelf, remains clickable, opens the Skills panel, retains visible authored materials, and does not disturb the other interactive objects.
