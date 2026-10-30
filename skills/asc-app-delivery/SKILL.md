---
name: App Store Connect Delivery
slug: asc-app-delivery
description: Prepare and verify an exact Apple app release while separating build, upload, processing and review submission.
category: Engineering
requires: [workbench, cabinet]
license: MIT
version: 1.1.0
default: false
---

# App Store Connect delivery

Use the owner's existing authorized Apple account and supported signing pipeline.
Identify the exact app, bundle ID, platform, version, build and intended action.
Do not embed a personal team ID, password, API key or certificate in this skill.

1. Read the project build instructions. Verify source revision, artifact identity
   and signature; preserve the installed version and one necessary rollback.
2. Confirm the account's access to the exact ASC app and version. Keep credentials
   in the user's provider-supported storage; never request secrets in chat.
3. Build/archive only when requested and within the project's disk budget.
4. Upload using the project's supported Xcode, Transporter or API integration.
   Do not assume that another assistant's tool names exist in this environment.
5. Read back upload processing and match the exact bundle, version and build.
   A package hash alone proves neither signing nor successful upload.
6. Check required metadata, screenshots, privacy and export-compliance answers
   using facts provided by the app owner; never invent compliance responses.
7. Submit only when the owner has requested review submission. Read back the
   resulting review state and report processing/upload/submission separately.

Stop at actual authentication, new terms, billing or device-approval gates.
Do not reset accounts, recreate working signing assets, or bypass OS security.

The companion `asc-release` plugin supplies planning and package fingerprints.
It deliberately reports identity, signature and archive validation as unverified;
it does not upload or submit builds. Use the configured Apple tools for those steps.

Official reference: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds
