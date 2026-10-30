---
name: Cross-Store Asset Pipeline & Reuse
slug: cross-store-asset-pipeline
description: Protocol for single-source promotional image, copy, and screenshot reuse between Apple App Store (ASC) and Google Play Store for Android relaunches.
category: Marketing & Release
requires: [workbench, cabinet]
license: MIT
version: 1.0.0
default: true
---

# Cross-Store Asset Pipeline: ASC ⇄ Google Play Store Reuse

This protocol governs how the **MARKETING CONTENT STUDIO**, **APP STORE SIGNING & RELEASE**, and **ANDROID RELEASE & OPERATIONS** teams share, synchronize, and reuse promotional assets to achieve zero duplicate work during multi-platform releases and Android relaunches.

---

## 1. Single-Source Shared Assets (100% Direct Reuse)

When preparing an Android release or relaunch, the Android team directly inherits the following assets produced for App Store Connect (ASC):

| Asset Category | App Store (ASC) Specification | Google Play Store Specification | Reuse Strategy |
|---|---|---|---|
| **App Title** | Up to 30 characters | Up to 30 characters | **100% Direct Reuse** |
| **Short Description** | Subtitle (up to 30 chars) / Promo Text (170 chars) | Short Description (up to 80 chars) | Core value proposition reused directly |
| **Full Description** | Up to 4,000 characters | Up to 4,000 characters | Markdown/Plain text feature breakdown shared |
| **Privacy Policy URL** | App Privacy URL | Privacy Policy URL | Single canonical URL |
| **Support URL / Email** | Support URL | Support Email & Website | Single canonical support channel |
| **Master Brand Logo** | 1024 x 1024 px PNG | 512 x 512 px PNG (32-bit, max 1024KB) | Downscaled from master `m-oasis-logo.png` |

---

## 2. Promotional Visuals & Screenshot Adaptation Pipeline

App Store and Google Play have different viewport dimensions and required graphic types, but **all visual templates, color palettes, captions, and layout hierarchies are shared**.

```
[MARKETING CONTENT STUDIO]
          │
          ├── Master Brand Styleguide & SVG Templates
          ├── Localized Copy & Feature Captions (1 to 5)
          │
          ├──► [APP STORE SIGNING & RELEASE] (iOS / macOS)
          │     ├── 6.7" iPhone Mockups (1290 x 2796)
          │     ├── 6.5" iPhone Mockups (1242 x 2688)
          │     └── macOS Desktop Screenshots (2880 x 1800)
          │
          └──► [ANDROID RELEASE & OPERATIONS] (Google Play)
                ├── Feature Graphic (1024 x 500) ◄── [Hero Slide Auto-Resized]
                ├── App Icon (512 x 512)         ◄── [Master Icon Scaled]
                └── Android Screenshots (1080 x 2400) ◄── [Frameless / Android Frame]
```

### A. Feature Graphic (Google Play Mandatory: 1024 x 500 px)
* **Play Store Requirement**: 1024 x 500 px, JPG or 24-bit PNG (no transparency).
* **Reuse Action**: The hero promo banner created for ASC Custom Product Pages (CPP) or slide #1 is exported directly to `1024 x 500` without redesigning.

### B. Screenshot Set Adaptation
* **Screen Flow**: The 5 core user journey screens captured for iOS (Onboarding, Main Dashboard, Core Utility, Settings/Pro, Analytics) are maintained identically.
* **Aspect Ratio Conversion**:
  * iOS 19.5:9 (`1290 x 2796`) ➔ Android 20:9 (`1080 x 2400`) or 16:9 (`1080 x 1920`).
  * **Frameless Best Practice**: By placing app screens inside borderless, modern floating cards with shared headline banners, the same template renders crisp on both App Store and Google Play without device chrome conflict (Dynamic Island vs Punch-Hole).

---

## 3. Android Relaunch Execution Checklist

When initiating an Android relaunch in M-Oasis:

1. **Query Existing ASC Artifacts**:
   * Inspect artifacts under `APP STORE SIGNING & RELEASE` or `/assets/store/screenshots/`.
   * Verify last approved version's copy, changelog, and visual themes.
2. **Batch Export for Play Store**:
   * Generate `icon_512.png` from master vector/1024px PNG.
   * Generate `feature_graphic_1024x500.png` from Slide #1 hero banner.
   * Render 1080x2400 screenshot set preserving the approved iOS Korean/English typography.
3. **Dispatch to `ANDROID RELEASE & OPERATIONS`**:
   * The Android release coordinator validates Google Play Data Safety compliance.
   * Engineer attaches AAB build signed with release Keystore.
   * Store reviewer confirms metadata against Play Console policies and records the attempt via `release.attempt.record`.
