// next.config.mjs
//
// We expose Cross-Origin-Opener-Policy + Cross-Origin-Embedder-Policy on every
// route so the browser hands us SharedArrayBuffer, which @ffmpeg/ffmpeg's
// multi-threaded core (and even some single-thread builds on stricter
// browsers) needs in order to spawn workers and decode/encode WebM with VP9
// + Opus reliably. Without these headers, ffmpeg.wasm crashes mid-transcode
// with cryptic "RuntimeError: memory access out of bounds" errors.
//
// Trade-off: any third-party `<img>`, `<script>`, `<iframe>` or font that we
// embed has to be served with `Cross-Origin-Resource-Policy: cross-origin` or
// the browser blocks it. Supabase Storage already returns CORP-friendly
// headers; if you ever embed something else, set `crossorigin="anonymous"` on
// the tag and you're good.

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}

export default nextConfig
