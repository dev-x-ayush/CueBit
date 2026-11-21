# Privacy

CueBit runs entirely in your browser. It has no server, no account, no analytics, and no tracking, and it makes no network requests of its own. Fonts are bundled, so opening CueBit makes no font requests either.

## What it stores

Everything is kept in the extension's IndexedDB database (`youtube-moment-notes`) on your device. For each note it stores:

- the YouTube video ID, title and URL
- the timestamp in seconds
- the note text
- creation and update times

## What it reads

On `youtube.com` only, CueBit reads the current watch page to identify the video and its current time, and adds a bookmark button and seek-bar markers to the player. Notes are written by the extension's own background worker to the local database.

## What it shares

Nothing. No data is sent to the developer or to any third party.

## Your data

Each browser profile has separate extension storage, so notes do not sync between Chrome, Brave, Edge, profiles or devices. Review and delete notes any time from the Library page. Removing the extension or clearing its data can delete your notes, and export/import is not currently included, so copy important notes elsewhere first.

## Permissions

| Permission | Why it is needed |
|---|---|
| `activeTab`, `scripting` | Read the video and time on the tab you are using when you save from the popup or the shortcut |
| Access to `https://www.youtube.com/*` | Add the player button, note form and seek-bar markers |

The `Alt+Shift+N` keyboard shortcut uses the browser's `commands` feature and needs no extra permission. CueBit does not request access to other websites.

## Contact

For privacy questions, contact **adityavermax7@gmail.com** / **ak2020192187909157@gmail.com**.
