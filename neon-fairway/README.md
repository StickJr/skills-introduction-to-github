# Neon Fairway

A futuristic 3D mobile golf game in a single HTML file (Three.js + Web Audio, no build step).

## Play
Open `index.html` in a mobile browser (or any desktop browser; mouse drags work too).
To host it, enable GitHub Pages for this repo and open `/neon-fairway/`.

## Controls
- **Swipe up** from the lower part of the screen to swing.
  - **Length** sets power. Past the white line is an overswing: a little more distance, but less accurate.
  - **Straightness** sets curve. A swipe that bows right fades or slices; one that bows left draws or hooks.
  - **Angle** sets start direction. A swipe tilted right pushes the ball right; tilted left pulls it left.
  - **Speed (tempo)**: a quick, smooth flick hits hardest. Slow drags lose power.
- **Drag across the top of the screen** or hold **‹ ›** to aim.
- **Tap the club** to change clubs. The best club is picked for you each shot.
- **◎** shows an overhead view of the hole.

The dotted arc and landing ring preview the shot live while you swipe (wind not included).
Read the wind dial before you swing.

## Holes
1. **Crystal Mesa**: par 3, 155 yd, plasma pond, light wind
2. **Orbital Bend**: par 4, dogleg right around a void lake, medium wind
3. **Nebula Isles**: par 5, island fairways and an island green, strong wind

Water and out of bounds cost one penalty stroke. Crystal spires bounce the ball back.
Your best score on each hole is saved on your device.
