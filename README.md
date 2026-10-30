# M-Oasis Plugins

Reusable, MIT-licensed extensions for M-Oasis / StarNet. This is a small standalone
source repository, separate from personal station data and the main app's history.

## Included

| Extension | What it does |
| --- | --- |
| `plugins/aside-browser-bridge` | Delegates a scoped browser task through the user's existing Aside MCP session, preserving human approval gates. Requires a separately installed Aside CLI; set `MOASIS_ASIDE_CLI` if its path differs. |
| `plugins/asc-release` | Creates an exact app/version/build release plan and computes a selected `.ipa`/`.pkg` fingerprint. It performs no upload or review submission. |
| `skills/asc-app-delivery` | Portable release workflow with no embedded Apple team or account. |
| Other `skills/` folders | Screenshot, review-response, cross-store assets and physical-device QA guides. |

## Install

Use the M-Oasis EXTENSIONS screen's **COPY FOLDER PATH** to locate your station's
plugin directory. Copy a selected plugin folder there; review its source and
approve it in EXTENSIONS. Do not copy this entire repository into a plugin folder.
The host locks approval to the plugin's code digest; an update needs fresh review.
Station-code plugins run with the user's OS permissions. The Aside bridge starts
the selected external CLI and can delegate browser actions, so review it carefully.

Skills are separate from runtime plugins. Import their `SKILL.md` through your
assistant's supported skill workflow. No credentials, sessions or third-party
executables are bundled, and no extension is enabled automatically.

## ASC release boundaries

The release plugin's package hash does not verify archive contents, signing,
bundle metadata, account permissions or Apple processing. Those remain separate
checks in the provided skill and your own Apple build/upload integration.
Actual Apple release submission is not exercised by this repository's tests.
See [Apple's upload documentation](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds).

## Checks

Node.js 18 or later; no package installation is needed:

```
node --test test/*.test.cjs
node --check plugins/aside-browser-bridge/index.js
node --check plugins/asc-release/index.js
```

## Provenance and contribution

The skill format, included existing skills and plugin API are derived from
[StarNet](https://github.com/androoAGI/starnet), MIT, copyright Andrew Sims.
The Aside bridge and ASC release extensions are M-Oasis additions. See `LICENSE`
and `NOTICE`. Apple and Aside are separate third-party products; this repository
does not claim their endorsement or redistribute their software.

Keep contributions portable. Do not commit personal chats, account IDs, tokens,
signing files, browser profiles, build packages or dependency directories.
