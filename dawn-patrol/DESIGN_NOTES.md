# Design notes

Choices made where the brief left room, and why.

## M0

- **Project lives in `dawn-patrol/`** inside this repo so the existing
  repo files stay untouched.
- **Extra input actions.** Besides the listed actions I added
  `look_left/right/up/down` (right stick, needed for gamepad camera) and
  `toggle_debug` (F3 / Back, for the M1 overlay).
- **Tool cycling on Q/E**, so interact moved to **F**. Q/E sits next to WASD,
  which suits frequent tool switching between jobs.
- **Save format** logic lives in `core/SaveSerializer.gd` (pure, tested).
  Loading never fails: a bad or partial file falls back to defaults field by
  field, and `migrate()` handles older `save_version` values.
- **Typing is enforced** with project warnings for untyped declarations and
  unsafe access, so slips show up in the headless check.
- **Zen mode** is stored in settings now so the save format won't need a
  version bump when it arrives in M7.
