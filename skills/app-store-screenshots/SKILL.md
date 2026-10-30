---
name: App Store Screenshot Studio
slug: app-store-screenshots
description: Automate high-resolution App Store screenshot capture across required iOS and macOS viewports with frame mockups and caption layout.
category: Design
requires: [workbench, cabinet]
license: MIT
version: 1.0.0
default: false
---

# App Store Screenshot Studio Protocol

Automates the production of Apple App Store submission screenshot sets.

## 1. App Store Required Dimensions

| Target Device | Display Size | Exact Resolution |
|---|---|---|
| iPhone 16 Pro Max / 15 Plus | 6.9" / 6.7" Super Retina XDR | `1320 x 2868` or `1290 x 2796` |
| iPhone 14 Plus / 13 Pro Max | 6.5" Super Retina XDR | `1242 x 2688` |
| iPad Pro 13-inch | 13.0" Liquid Retina XDR | `2064 x 2752` |
| macOS Mac App Store | 16-inch Retina / Pro Display | `2880 x 1800` (16:10) |

## 2. Capture Automation via StarNet
1. **Launch App**: Open target app in Simulator, Native Window, or iPhone Mirroring.
2. **Execute Capture**:
   ```javascript
   apple.screenshot {
     outputPath: "assets/store/screenshots/screen_01.png",
     formatForStore: "iphone_6_7"
   }
   ```
3. **Inspect Output**: Verify no window borders or clipping, proper status bar appearance, and crisp typography.
