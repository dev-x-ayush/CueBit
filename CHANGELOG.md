# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [Released]

## [0.1.0]

First version of CueBit. It starts from the original "YouTube Moment Notes" extension and adds a complete visual redesign, a new name and brand, a faster way to save notes, and two interface fixes. No change touches how notes are stored, saved, searched, deleted or played back.

### Added

- **Keyboard shortcut to save a note.** Press `Alt+Shift+N` anywhere on a YouTube tab to open the note form at the current video time, with no need to click the player button. It is registered as a browser command (`add-note`), so it can be rebound at `chrome://extensions/shortcuts`. If the form is already open, the shortcut refocuses it instead of discarding your text.
- **New message type** `video:open-composer`, sent from the background worker to the YouTube content script when the shortcut is used.
- **CueBit brand.** A new logo (an ember-orange tile with a bookmark ribbon and a play cue), and extension icons at 16, 32, 48, 96 and 128 px, declared in the manifest.
- **Design system.** Cream, cocoa and ember colour tokens, bundled fonts, glass-style cards and a soft grain texture, documented in [docs/DESIGN.md](docs/DESIGN.md).
- **Bundled fonts** (served locally, no network requests): Fraunces for display text, Geist for interface text, and JetBrains Mono for timestamps.
- **Popup:** a character counter on the note field (limit 500) and a hint about both keyboard shortcuts.
- **Dashboard:** a hero header ("Every moment, *on cue.*"), stat cards with large serif numbers, and subtle entrance animations that respect the reduced-motion setting.
- Project documents: `CHANGELOG.md` and `docs/DESIGN.md`.

### Changed

- **Renamed to CueBit** everywhere: manifest name and toolbar tooltip, page titles, package name (`cuebit`), README, PRIVACY, CONTRIBUTING, SECURITY, LICENSE, console messages, and the CSS ids and classes injected into YouTube (now `cuebit-*`).
- **New visual theme, based on a warm cream and orange gradient reference.** It replaces the original dark interface across the popup, the library, and the in-player note form, toast and seek-bar markers.
  - Popup: a "Now watching" card with a large monospaced timestamp, a vertical timeline of recent notes, pill-shaped controls, and an orange primary button.
  - Library: gradient hero, rounded glass panels, redesigned note rows with a timestamp tile and a clearer "Watch moment" action, and a rounded search field.
  - Timeline chart: orange points with a white edge, warm gridlines and tooltips in the new palette.
  - YouTube overlay: a cream note form and toast with orange accents, and orange capsule markers on the seek bar that scale on hover.
- Shared UI components (button, textarea) rebuilt on the new tokens, with visible focus rings.
- Package description and README feature list updated to describe the new shortcuts and design.

### Fixed

- **Player button alignment.** The save-note button in YouTube's control bar sat higher than the time display and the other icons. It now fills the bar's height and centres its icon so it lines up with them.
- **Long video titles were cut off in the library chart.** Titles on the timeline's left axis were clipped at the edge. They now wrap onto several lines, and the chart's margin and row height adjust to the longest title (with tighter wrapping on narrow windows). Special characters in titles are escaped so they display as typed.

### Compatibility and data

- The internal IndexedDB database keeps its original name, `youtube-moment-notes`, on purpose. Renaming it would hide notes saved before the rename. Existing notes appear in CueBit unchanged.
- No new browser permissions are required. The shortcut uses the browser's `commands` feature, which needs no extra permission; Chrome may still ask you to confirm an updated extension when you reload it.
- Existing shortcuts are unchanged: `B` opens the note form while a video page is focused, and `Ctrl+Enter` saves from inside the form.
