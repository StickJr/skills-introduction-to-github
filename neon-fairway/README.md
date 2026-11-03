# Neon Fairway

A futuristic 3D mobile golf game in a single HTML file (Three.js + Web Audio, no build step).

## Play
Open `index.html` in a mobile browser (or any desktop browser; mouse drags work too).
To host it, enable GitHub Pages for this repo and open `/neon-fairway/`.

## Controls
- **Flick up** from the lower part of the screen to swing.
  - **Length** sets power. Past the white line is an overswing: a little more distance, but less accurate.
  - **Angle** shapes the shot. Flick up and to the right and the ball starts right and curves back left (a draw or hook). Flick up and to the left and it starts left and curves right (a fade or slice). A straight-up flick flies straight.
  - **Straightness**: a wobbly stroke lowers accuracy and pushes the ball off line.
  - **Tempo**: the meter above the clubs times the flick. Release in the green sweet spot (0.12 to 0.30 seconds) for full power; a tick sounds when you're in it. Pausing at the top before lifting your finger doesn't count against you.
- With the putter, the angle aims the putt instead of curving it. Greens have slopes, so putts break.
- **Drag across the top of the screen** or hold **‹ ›** to aim.
- **Tap the club** to change clubs. The best club is picked for you each shot.
- **◎** shows an overhead view of the hole.

The dotted arc and landing ring preview the shot live while you swipe (wind not included).

## Holes
1. **Crystal Mesa**: par 3, 155 yd, plasma pond, light wind
2. **Orbital Bend**: par 4, dogleg right around a void lake, medium wind
3. **Nebula Isles**: par 5, island fairways and an island green, strong wind

The course has rolling hills, mounds and valley walls, plus crystal spires and glowing trees that bounce the ball back.
Water and out of bounds cost one penalty stroke.
Your best score on each hole is saved on your device.
