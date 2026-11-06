# Tap & Paint 🎨

A painting game for toddlers. Every tap pops a cute picture onto the screen, and every swipe
paints a bright, colour-changing line. Pick a world, tap and swipe like crazy, and save the
masterpiece to your album.

## Worlds

| World | Taps make… | Swipes paint… |
|---|---|---|
| 🐠 Ocean | fish, jellyfish, starfish, octopuses, bubbles | glossy tubes with bubbles |
| 🚀 Space | planets, stars, moons, rockets, galaxies | glowing neon with sparkles |
| 🌷 Garden | flowers, tulips, butterflies, ladybugs, mushrooms | vines with leaves and blossoms |
| 🎈 Sky | balloons, clouds, birds, kites, hearts, rainbows | rainbow ribbons |
| 🎆 Fireworks | firework bursts over a city | neon light trails |
| 🍭 Candy | lollipops, donuts, cupcakes, ice cream, sweets | frosting with sprinkles |

Colours are random every time. Many things have smiley faces. Each tap plays a note (higher on
the screen = higher note), using a scale where any mix of notes sounds nice.

## Made for little hands

- Multi-touch: whole hands, many fingers, all at once.
- Something happens the instant a finger touches the screen.
- Grown-up buttons need a **press and hold** (a yellow ring fills up), so frantic tapping
  can't exit, clear, or delete by accident:
  - 🏠 hold to go home · ✨ hold for a new page · 📸 hold to save
- No zooming, scrolling, text selection, or pop-up menus while painting.
- No ads, no accounts, no internet needed after the first load.

## Album

Saved paintings are stored on the device (IndexedDB), never uploaded. Open **My Album** to see
them. Tap a picture to view it, then **Save / Share** to put it in Photos or send it. Hold 🗑️ to
delete.

## Run it

It's plain HTML/JS with no build step. Serve the folder over HTTPS (or `localhost`):

```sh
cd tap-and-paint
python3 -m http.server 8000
# open http://localhost:8000
```

To try it on a phone, host it on GitHub Pages: repo **Settings → Pages**, pick this branch and
the root folder, then open `https://<user>.github.io/<repo>/tap-and-paint/`.

**Install on the home screen** for a full-screen, offline app:
- iPhone/iPad: Safari → Share → *Add to Home Screen*
- Android: Chrome → ⋮ → *Install app*

**Tips for parents**
- Lock your toddler into the app with **Guided Access** (iPhone: Settings → Accessibility) or
  **App pinning** (Android: Settings → Security).
- On iPhone, the ring/silent switch also mutes the sounds. There's a 🔊 button on the home screen too.

## Files

```
index.html            screens and buttons
styles.css            look and layout
js/app.js             touch handling, animation, saving, album screens
js/environments.js    the six worlds: backgrounds, pictures, brushes
js/album-db.js        on-device album storage
js/audio.js           the little synth
sw.js                 offline support
manifest.webmanifest  home-screen app settings
icons/                app icons
```

## Next steps (ideas)

- Ship to the App Store / Google Play by wrapping it with [Capacitor](https://capacitorjs.com/).
- More worlds (dinosaurs, farm, snow), stickers that wiggle, a "shake to clear" gesture.
- Save to the phone's photo library automatically (needs the native wrapper).
