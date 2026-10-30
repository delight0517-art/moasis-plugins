---
name: App Store Review Rejection Defense
slug: app-review-defense
description: Diagnose Apple App Review rejections (Guideline 2.1(a) window launch, Guideline 5.1.1 privacy), fix root causes in lifecycle code, and generate Resolution Center response drafts.
category: Engineering
requires: [workbench, cabinet]
license: MIT
version: 1.0.0
default: false
---

# App Store Review Rejection Defense Protocol

Use this skill when an app is rejected by Apple App Review or reviewer feedback requires code remediation.

## 1. Common Rejection: Guideline 2.1(a) App Completeness
- **Reviewer Message**: "The app failed to launch any main window or menu bar extra app."
- **Root Cause**: Reviewers test on a completely clean macOS/iOS environment (zero state, default settings, idle timer). If UI guards (`shouldKeepWidgetAlive()`) check conditional state that only turns true after user interaction, the window is never shown.
- **Architectural Defense**:
  1. Main UI lifecycle must be unconditionally active:
     ```javascript
     function shouldKeepWidgetAlive() { return true; }
     ```
  2. Implement aggressive window resurrect guards:
     - On window `closed`: immediately schedule recreation unless `appIsQuitting`.
     - On `app.on('activate')`: if window count == 0, create main window immediately.
  3. Validate on fresh profile / isolated cache:
     ```bash
     npm run check
     ```

## 2. App Store Connect Resolution Center Response Template
When resubmitting with a new build:
```text
Hello App Review Team,

We identified and resolved the root cause of the window launch issue in build <BUILD_VERSION>.

Root Cause Analysis:
The primary interface lifecycle previously depended on an internal state check that evaluated to false on a clean install with default settings. As a result, the window failed to surface on initial launch.

Resolution:
- Updated the window lifecycle controller to unconditionally ensure the primary window is created and maintained across all initial launch states.
- Re-tested and verified on a completely clean macOS environment with no prior settings.

Thank you for your review.
```
