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

## M1

- **Movement model:** move toward a target velocity with separate
  acceleration and deceleration rates for ground and air, plus an
  acceleration curve. Releasing sprint uses the deceleration rate so you
  settle back to walk speed quickly instead of drifting.
- **Jump feel:** coyote time, jump buffering, a heavier fall
  (`fall_gravity_multiplier`) and a short hop when jump is released early.
  These make a cozy game feel responsive without being floaty.
- **Camera** follows the player's physics-interpolated position, and physics
  interpolation is on in project settings, so motion stays smooth on
  high-refresh monitors. Small FOV kick while sprinting.
- **Heavy-tool slowdown** hook: `ToolBelt.get_speed_multiplier()` scales max
  speed. It returns 1.0 until the mower lands in M2.
- **Esc** frees the mouse first; pressing it again returns to the menu.
  Clicking re-captures the mouse. A proper pause menu comes in M9.
- **Greybox course** is built in code (`world/GreyboxCourse.gd`) and will be
  replaced by the real Hole 01 in M6.
