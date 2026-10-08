# F21 homepage implementation

The approved Cinema composition is implemented at `apps/web/app/page.tsx`, with scoped `home.css` and three small client components. Existing private workspace CSS and video renderers are unchanged. The public page is static and requires no authentication, database or provider access to render. Protected destination links retain their existing session checks. Create a video goes through the existing protected `/projects` entry point, which routes anonymous visitors to sign-in. This remains an internal pilot with no public registration or billing. Noindex metadata remains in place.

The hero is a separate eight-second illustration with pause/resume/replay, one-shot playback, intersection and document-visibility suspension, and a resolved reduced-motion/SSR still. It never plays audio. The example players start only after the user's Watch action, expose native controls and English VTT tracks, focus the opened player, and pause another playing example. Text transcripts are available independently of video playback. Mobile navigation has expanded state and Escape handling; FAQ uses native details/summary. Shared focus styles and skip link remain.

## Public demo provenance

The three twelve-second, silent motion studies were authored specifically for this public homepage. They are not customer exports, provider-generated examples or the previous private narrated prototypes. Page copy states this distinction and does not present their duration as a typical generated video. This replaces the design document's placeholder thumbnails and rounded prototype durations with honest, playable public media. Full product narration and the 60–90-second workflow remain described separately.

Sources: `src/homepage-demo/index.tsx`; build: `node --import tsx scripts/render-homepage-demos.ts` under Node 24. The script bundles with an empty public directory and reads no environment file, user assets, database or provider API. Outputs are explicitly public, small MP4/PNG/VTT assets in `apps/web/public/examples`, suitable for version control. The root `runs` and `public/runs` remain outside the web root. Rebuild intentionally only when changing this demonstration source; routine Next builds use checked-in media and do not render videos.

Verification: `node --import tsx scripts/verify-homepage-demos.ts` checks all three outputs, full FFmpeg decode, 12-second H.264, 360×640, 24 fps, no audio stream, bounded file size, four timed text cues and poster presence. Public preview colors are isolated from Cinema chrome and do not change the approved production renderer. All labels/content in the public media are authored educational examples; no private media or credentials were copied.

## Pilot limits

Homepage copy intentionally says live Instagram delivery is pending activation, voices currently use Daniel, and cloud generation runs in controlled pilot windows. When those operational constraints change, update the page and FAQ alongside the verification record. F22 owns complete internal end-to-end acceptance and separately approved deployments/live posts. F21 does not activate any cloud worker, scheduler, migration or external post.
