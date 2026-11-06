# Golf Course Designer

A web app for drawing golf holes from above and sending them to the golf course cleaning game, where Claude Code turns each hole into a level.

Open `index.html` in any browser (phone or computer). Nothing to install.

## How to use it

1. **Terrain** tab: paint fairway, green, bunkers, water, woods, cart paths and more.
2. **Mess** tab: paint the dirt the player cleans up (leaves, mud, grass clippings, divots, weeds).
3. **Objects** tab: place the tee (ball start), the cup/flag, the cleaner's start spot, trash bins, scenery and trash pickups.
4. **⚙︎** sets the hole's name, par, notes and size. **☰** sets the course name, adds/reorders holes, and handles import.
5. **Send** → **Copy for Claude**, then paste into the game's Claude Code session.

Controls: one finger draws, two fingers pan and zoom. On a computer, use the scroll wheel to zoom and right-drag or hold space to pan. Shortcuts: `Ctrl+Z` / `Ctrl+Y` undo/redo, `B` brush, `R` rectangle, `F` fill, `E` erase, `H` pan, `[` `]` brush size, `G` grid.

Your work saves automatically in the browser. To move it to another device, use **Copy JSON only** and paste it into **Import JSON** on the other device.

## Export format (for the game's Claude)

The copied message explains the format itself, so the game project doesn't need this file. For reference:

```jsonc
{
  "format": "golf-course-designer",
  "version": 1,
  "course": { "name": "...", "designer": "...", "description": "...", "tileSizeYards": 8 },
  "holes": [
    {
      "number": 1, "name": "Hole 1", "par": 4, "notes": "free text from the designer",
      "width": 30, "height": 50,
      "stats": { "teeToCupTiles": 37, "teeToCupYards": 296, "trashObjects": 2, "messTiles": 41 },
      "tiles": ["XXRRRR...", "..."],   // one string per row, top to bottom
      "mess":  ["..LL..", "..."],      // same grid, "." = clean; [] when the hole has no mess
      "objects": [ { "type": "tee", "x": 15, "y": 44 }, { "type": "cup", "x": 15, "y": 7 } ]
    }
  ]
}
```

Coordinates: `x` is the column (0 = left), `y` is the row (0 = top). North is up.

| Tile | Meaning | | Mess | Meaning |
|---|---|---|---|---|
| `R` | rough | | `.` | clean |
| `F` | fairway | | `L` | leaves |
| `G` | green | | `M` | mud |
| `T` | tee box | | `C` | grass clippings |
| `S` | sand bunker | | `V` | divots |
| `W` | water | | `K` | weeds |
| `D` | deep rough | | | |
| `X` | woods | | | |
| `P` | cart path | | | |
| `O` | out of bounds | | | |

Object types:
- **Gameplay:** `tee` (ball start, one per hole), `cup` (hole/flag, one per hole), `player_start` (cleaner spawn, one per hole), `trash_bin`
- **Scenery:** `tree`, `pine`, `bush`, `flowers`, `rock`, `bench`, `sign`
- **Trash pickups:** `can`, `bottle`, `cup_trash`, `paper`, `banana`, `bag`, `lost_ball`, `branch`
