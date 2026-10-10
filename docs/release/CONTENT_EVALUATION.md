# V1 representative-content evaluation

Status: supervised evaluation and bounded follow-ups in progress. This is not release approval.

The user approved US$10 total additional closeout spending, including the US$7 prepaid ElevenLabs purchase. Auto Top Up stays off. No subscription or new social publication. Gemini audio reviews are explicitly authorized automated checks, not human listening. VoiceOver remains off by user choice. Private media, scripts and durable receipts remain under ignored runs/f22/evaluation and evaluation-followup.

The initial matrix used the pinned520e300e worker and Gemini3.5FlashLite planner prompt2. Every narration used ElevenLabs eleven_multilingual_v2, Daniel voice ID onwK4e9ZLuTAKqWW03F9, mp3_44100_128, stability0.5/similarity0.75 and renderer plan-v2-2. Edited candidates were reviewed before generation, not silently substituted for initial results. 48 initial provider attempts were recorded across21 hosted storyboard requests. 11 downloaded outputs currently have technical probes; observed duration range70.0–89.8seconds, median80.3seconds. These are samples, not an SLA.

| Case | Topic | Hosted storyboard | Hosted video | Content review | Automated audio | Visual samples |
|---|---|---|---|---|---|---|
| 1 | Water cycle | completed / attempt 2 | succeeded / 81.4s | Manual correction | No issues flagged (AI) | Six scene stills |
| 2 | Photosynthesis | completed / attempt 2 | succeeded / 80.3s | Manual correction | No issues flagged (AI) | Six scene stills |
| 3 | Bicycle brakes | completed / attempt 3 | succeeded / 78.6s | Reviewed without edit | No issues flagged (AI) | Six scene stills |
| 4 | Renewable versus nonrenewable energy | completed / attempt 1 | needs_input / SPEECH_TIMING_INVALID | Manual correction | Not checked | Not checked |
| 5 | RAM versus storage | completed / attempt 1 | succeeded / 88.7s | Manual correction | No issues flagged (AI) | Six scene stills |
| 6 | Butterfly life cycle | completed / attempt 2 | succeeded / 86.2s | Manual correction | No issues flagged (AI) | Six scene stills |
| 7 | A supplied four-event historical timeline | completed / attempt 2 | succeeded / 88.1s | Manual correction | No issues flagged (AI) | Six scene stills |
| 8 | Binary search | failed / STORYBOARD_INVALID / attempt 4 | Not rendered | No usable candidate | Not checked | Not checked |
| 9 | Probability of a fair six-sided die | completed / attempt 4 | succeeded / 78.9s | Reviewed without edit | Flagged; review required | Six scene stills |
| 10 | Thermostat feedback | completed / attempt 1 | succeeded / 80.0s | Manual correction | No issues flagged (AI) | Six scene stills |
| 11 | Compare supplied chart values | completed / attempt 2 | succeeded / 77.5s | Reviewed without edit | No issues flagged (AI) | Six scene stills |
| 12 | 18 percent of one thousand rupees | completed / attempt 1 | succeeded / 70.0s | Reviewed without edit | No issues flagged (AI) | Six scene stills |
| 13 | HTTP CPU RAM | completed / attempt 2 | needs_input / SPEECH_TIMING_INVALID | Manual correction | Not checked | Not checked |
| 14 | Three Indian city names | completed / attempt 3 | needs_input / SPEECH_TIMING_INVALID | Manual correction | Not checked | Not checked |
| 15 | Indian and international number notation | completed / attempt 3 | succeeded / 89.8s | Manual correction | Flagged; review required | Six scene stills |
| 16 | Kilometres and metres | failed / STORYBOARD_INVALID / attempt 4 | Not rendered | No usable candidate | Not checked | Not checked |
| 17 | Pythagorean theorem | completed / attempt 1 | queued | Manual correction | Not checked | Not checked |
| 18 | Explain all of science | failed / STORYBOARD_INVALID / attempt 4 | Not rendered | No usable candidate | Not checked | Not checked |
| 19 | Resolve contradictory supplied notes | failed / STORYBOARD_INVALID / attempt 4 | Not rendered | No usable candidate | Not checked | Not checked |
| 20 | Photorealistic fluid simulation | completed / attempt 1 | Not required: limits response | Reviewed without edit | Not checked | Not checked |

## Findings retained from the initial matrix

- Photosynthesis first request failed with HTTP200/INVALID_RESPONSE; one explicit retry completed. Browser input retention, error display, retry and reload recovery were observed. This does not simulate every provider outage.
- Cases8/16/18/19 exhausted four attempts with duration-estimate, cue-match, size and JSON validation errors respectively. No hidden retry or fabricated successful candidate.
- Renewable narration exceeded90seconds. Read-only compilation of stored speech found matching alignment but104.803seconds of narration before scene padding. The original failed output remains recorded.
- Manual factual/schematic corrections were needed, including precipitation, photosynthesis arrows, permanent-storage claims, number-notation equivalence, pronunciation certainty, acronym expansion and independent mathematical terms linked as a flow. Review and approval remain necessary.
- Water-cycle sample lacks an explicit cycle-return arrow. The corrected butterfly output does show the adult-to-egg return arrow. Numeric comparison uses explicit values; a proportional-chart renderer is not implemented.
- Automated audio review flagged possible missing/ambiguous initial wording in the die example; its transcript also rendered fractions as ratios. A pronunciation follow-up is separate evidence, and the original flag is not a confirmed human listening diagnosis.
- Sampled layouts are legible without observed clipping. Some panel words wrap awkwardly. Six midpoint stills per output do not prove every animation frame is correct.

## Bounded follow-ups

Code changes lower the initial planner target to150–162words, retain numeric schema bounds and malformed-JSON scene paths in repair feedback, and expose distinct measured-too-long/short errors. Hard duration/visual validation, four attempts and immutable review/approval remain intact. Prompt changes are risk reduction, not factual or timing guarantees. Follow-ups preserve original records and use new durable commands.

| Case | Storyboard follow-up | Video follow-up | Automated audio |
|---|---|---|---|
| 4 | failed | Not rendered | Pending |
| 8 | failed | Not rendered | Pending |
| 9 | Reviewed edit; original request retained | Not rendered | Pending |
| 13 | Reviewed edit; original request retained | Not rendered | Pending |
| 14 | Reviewed edit; original request retained | Not rendered | Pending |
| 16 | running | Not rendered | Pending |

## Scope and remaining sign-off

Successful technical probes cover full H.264/AAC decoding,1080×1920/30fps, exact MP4/VTT hashes against stored assets, owner isolation, HTTP HEAD/range delivery, ordered nonoverlapping caption timings and caption text matching every saved scene. They do not establish pronunciation naturalness or full continuous-motion quality. Photosynthesis completed80.32-second hosted Chrome playback without a media error. Human listening and final operating acceptance remain separate. No main merge is authorized. Publishing remains disabled; approved daily Instagram maintenance remains enabled. Generation must be disabled after the bounded evaluation window.
