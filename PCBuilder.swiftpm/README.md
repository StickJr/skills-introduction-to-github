# PC Builder (iOS)

An interactive, educational iOS app where you build up and break down a gaming PC part by part. It uses simple flat graphics.

## Features
- Side view of a PC case that fills in as you install parts. Parts animate in and out.
- 9 parts: Case, Power Supply, Motherboard, CPU, CPU Cooler, RAM, SSD, Graphics Card and Cables.
- Real assembly rules: the CPU needs a motherboard, the cooler needs the CPU, cables need the PSU, motherboard and GPU.
  You can't remove a part while something is still attached to it.
- Every part has a short explanation and a builder's tip.
- Estimated power draw, plus a progress bar.
- Power button: once the build is complete, the fans spin and the RGB lights turn on.
- "Build everything" and "Break it all down" run the whole sequence automatically.

## How to use
- Tap a part in the bottom tray to read about it, then tap **Install** or **Remove**.
- Dashed outlines in the case show where the next parts can go. Tap one to install it directly.
- Tap an installed part in the case to select it.

## How to run
This folder is a Swift Playgrounds app package (`.swiftpm`).
- **iPad:** open `PCBuilder.swiftpm` in the Swift Playgrounds app and tap Run.
- **Mac:** open `PCBuilder.swiftpm` in Xcode 15 or later (or Swift Playgrounds), choose an iPhone simulator or your
  iPhone, and press Run.

Requires iOS 16 or later.
