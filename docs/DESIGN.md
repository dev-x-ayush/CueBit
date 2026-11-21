# CueBit design notes

CueBit uses a warm, light look: cream paper with ember-orange light blooming from the corners, dark cocoa text, and a serif display face. The direction comes from a blurred cream-and-orange gradient reference image.

## Colour tokens

Defined in `src/styles/global.css` under `@theme`, and mirrored as plain values in `entrypoints/youtube.content/style.css` (which runs on YouTube and cannot use Tailwind).

| Token | Value | Use |
| --- | --- | --- |
| `cream-100` | `#F7F3EE` | Page background |
| `cream-200` | `#F0E4D8` | Timestamp tiles, key caps |
| `cocoa-950` | `#2A140A` | Headings, text on orange |
| `cocoa-900` | `#3A2216` | Body text (used with opacity for secondary text and borders) |
| `ember-300` | `#FDB98A` | Soft highlights |
| `ember-400` | `#FF8A57` | Hover and glow |
| `ember-500` | `#FF6B35` | Primary buttons, chart points, markers |
| `ember-700` | `#B83E10` | Small accent text (passes contrast on cream) |

Orange is used for fills and glows. Small orange text uses `ember-700` so it stays readable on cream.

## Type

- **Fraunces** (variable): wordmark, headings, large numbers.
- **Geist** (variable): interface text.
- **JetBrains Mono** (variable): timestamps, labels and counters.

The fonts are installed from `@fontsource-variable/*` packages and bundled into the extension. The YouTube overlay cannot load them, so it falls back to system fonts.

## Patterns

- `.atmosphere`: cream base with two orange radial blooms (top left, bottom right).
- `.glass`: translucent white card with a soft warm shadow.
- `.grain`: a faint noise overlay that stops gradients from banding.
- `.eyebrow`: small uppercase monospaced section label.
- Entrance animation `animate-rise` and background `animate-drift`; both are disabled when the user prefers reduced motion.

## Brand

The logo (`src/components/logo.tsx`) is an orange gradient tile holding a dark bookmark ribbon with a peach play triangle: a cue point you can jump back to. Extension icons are in `public/icon/` as PNGs at 16, 32, 48, 96 and 128 px, and are declared in `wxt.config.ts`.

## Rules for changes

- Keep colours in the tokens above rather than hard-coding new values.
- Keep interactive controls at least 36 px tall with a visible focus ring.
- Do not change behavior when restyling: message handling, storage and playback code are separate from the markup and styles.
