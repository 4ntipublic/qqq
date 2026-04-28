# Caveats

Knowledge that the codebase needs but the code itself can't express. Read
before touching any of the listed files; re-introducing fixed bugs is
free here, debugging them again is not.

---

## `app/_components/BeatCard.tsx`

### Autoplay on expansion: rAF + retry-with-backoff

The `useEffect` keyed on `[isActive]` does **not** call `.play()`
synchronously. It schedules retries every 40ms (capped at 600ms)
because:

- `<motion.video>` mounts in the same React commit as `isActive`, so
  its ref is usually attached on the first attempt.
- `<audio>` lives inside an `<AnimatePresence>` whose `animate` has a
  `delay: 0.2`. The element does not exist for ~200ms after the click.
  A synchronous `audioRef.current` read returns `null`, `.play()` never
  fires, and there is no console error to find later.

Both elements share a single `cancelled` flag so the close path aborts
the chain cleanly. Don't replace this with a single rAF — that was the
silent-failure shape the user reported.

### Element attributes required for autoplay

`<video>` MUST keep `muted`, `playsInline`, `crossOrigin="anonymous"`.
Browsers refuse programmatic autoplay without `muted`. Safari refuses
playback inside FLIP transitions without permissive CORS, which the
`crossOrigin` triggers on Supabase Storage responses.

### `<source>` vs `src` on the video element

The `src` lives on `<video>` directly. A `<source type="video/mp4">`
child broke `.webm` and `.mov` outputs because the strict `type` made
the browser refuse to negotiate the real MIME. Sniffing wins.

### Cross-instance video sync

Multiple `<video>` elements pointing at the same URL register in a
runtime registry (`registerSyncedVideo`/`readSyncSeedTime`). New mounts
seed `currentTime` from the furthest-advanced living peer so a grid
remount doesn't visually jump back to frame 0. Don't reset
`currentTime` on the open path — only on close.

### Expanded overlay portal

The expanded modal is rendered through `createPortal(..., document.body)`.
An ancestor that establishes a containing block (transform, will-change,
filter) — like the `<motion.section>` in `/beats` — would otherwise pin
the `position: fixed` backdrop to that section instead of the viewport,
making the dimming look small and broken.

---

## `lib/transcoder.ts`

### FFmpeg.wasm scope

Audio only. Video transcoding was removed because the wasm core OOMs
on >50MB inputs and SharedArrayBuffer is unavailable in some embedded
contexts. Videos are uploaded raw; image WebP conversion is done via
the native Canvas API in `lib/image-to-webp.ts`, not FFmpeg.

### Audio flags

```
-i input -vn -codec:a libmp3lame -b:a 128k output.mp3
```

`-codec:a libmp3lame` is explicit. Without it the wasm core sometimes
falls into a copy/passthrough path on already-MP3 inputs and the output
file is the same size as the input.

### COOP/COEP headers

`next.config.mjs` sets `Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp`. These enable
SharedArrayBuffer, which FFmpeg.wasm needs. Don't drop these headers.

---

## `app/admin/dashboard/beats/_components/beats-upload-form.tsx`

### Visualizer policy

- Image (non-GIF): Canvas WebP pass.
- GIF: upload as-is. Canvas only sees frame 0 — converting to WebP
  silently kills the animation.
- Video: upload as-is.

### Storage paths

Files are renamed to `{folder}/{uuid}.{ext}` on upload. The user's
original filename is discarded entirely; messy names like
`Beat Final FINAL v3 (1).wav` contain reserved characters that break
Supabase Storage path validation.

### `size_mb`

Computed from the **post-compression** blob sizes (audio + visualizer),
not the originals. The DB column is `numeric(8,2)`. Older rows may be
`NULL`; the UI tolerates it.

---

## `app/beats/_components/BeatsCatalogClient.tsx`

### Grid/list `AnimatePresence` mode

`mode="wait"` is required. `WaveformRow` owns an `AudioContext` + rAF
loop, so the default sync-mount mode would briefly run two of them in
parallel during a list↔grid toggle and leak audio handles.

---

## `next.config.mjs`

The COOP/COEP headers are global. Removing them disables FFmpeg
transcoding silently — `crossOriginIsolated` becomes `false` and
`SharedArrayBuffer` throws on access.
