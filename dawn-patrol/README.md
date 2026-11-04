# Dawn Patrol

A cozy golf-course groundskeeping game for Godot 4.5. Mow stripes, rake
bunkers, blow leaves, fish balls out of the pond, and get the hole ready
before the first tee time.

**Current milestone:** M0 - project skeleton.

## Run

1. Open Godot 4.5, choose **Import**, and pick `dawn-patrol/project.godot`.
2. Press **F5** (Run Project).

## Checks and tests

Install GUT once: in the editor open **AssetLib**, search for **GUT**
(9.5.x for Godot 4.5), download, install to `addons/gut`, then enable it in
**Project > Project Settings > Plugins**.

Then from this folder:

```bash
GODOT=/path/to/godot ./check.sh
```

This imports the project (catches parse errors), boots the main scene, and
runs the unit tests in `tests/`.

## Controls

| Action | Keyboard / mouse | Gamepad |
|---|---|---|
| Move | WASD | Left stick |
| Look | Mouse | Right stick |
| Sprint | Shift | L3 |
| Jump | Space | A |
| Use tool | Left click | Right trigger |
| Next / prev tool | E / Q or wheel | RB / LB |
| Pick tool | 1-6 | - |
| Interact | F | X |
| Pause | Esc | Start |
| Debug overlay | F3 | Back |

## Layout

```
autoload/  Events (signal bus), GameState, SaveManager, AudioManager
core/      Pure logic: SaveSerializer (later MaskPainter, ScoreCalculator)
player/    Player, camera rig, tool belt (M1+)
tools/     Tool base class and one folder per tool (M2+)
world/     Holes, props, leaf field, pond
ui/        Menus and HUD
data/      Custom Resource files for balancing
shaders/   Grass, sand, water shaders
tests/     GUT unit tests
```
