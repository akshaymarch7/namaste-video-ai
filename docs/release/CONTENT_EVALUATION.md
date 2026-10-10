# V1 representative-content evaluation

Status: the bounded 20-input evaluation and narration follow-ups are complete. Quality findings remain open; this is not release approval.

The user approved US$10 total additional closeout spending, including the US$7 prepaid ElevenLabs purchase. Auto Top Up stays off. No subscription or new social publication. Gemini audio reviews are explicitly authorized automated checks, not human listening. VoiceOver remains off by user choice. Private media, scripts and durable receipts remain under ignored runs/f22/evaluation and evaluation-followup.

Initial storyboard requests used the pinned520e300e worker and Gemini3.5FlashLite planner prompt2. Baseline renders through case15 used that image; case17 and bounded follow-ups use233c9d28 (940bbe7 source). Every narration used ElevenLabs eleven_multilingual_v2, Daniel voice ID onwK4e9ZLuTAKqWW03F9, mp3_44100_128, stability0.5/similarity0.75 and renderer plan-v2-2. Edited candidates were reviewed before generation, not silently substituted for initial results. 48 initial provider attempts were recorded across21 hosted storyboard requests. 12 baseline downloaded outputs have technical probes; observed duration range70.0–89.8seconds, median80.2seconds. These are samples, not an SLA.

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
| 17 | Pythagorean theorem | completed / attempt 1 | succeeded / 74.5s | Manual correction | No issues flagged (AI) | Six scene stills |
| 18 | Explain all of science | failed / STORYBOARD_INVALID / attempt 4 | Not rendered | No usable candidate | Not checked | Not checked |
| 19 | Resolve contradictory supplied notes | failed / STORYBOARD_INVALID / attempt 4 | Not rendered | No usable candidate | Not checked | Not checked |
| 20 | Photorealistic fluid simulation | completed / attempt 1 | Not required: limits response | Reviewed without edit | Not checked | Not checked |

## Findings retained from the initial matrix

- Photosynthesis first request failed with HTTP200/INVALID_RESPONSE; one explicit retry completed. Browser input retention, error display, retry and reload recovery were observed. This does not simulate every provider outage.
- Cases8/16/18/19 exhausted four attempts with duration-estimate, cue-match, size and JSON validation errors respectively. No hidden retry or fabricated successful candidate.
- Renewable, acronym and city-name narration failed measured duration validation. Read-only compilation found matching alignment with104.803,91.533 and88.320seconds of raw narration respectively before scene padding. Original failures remain recorded; shortened edited retests are separate evidence.
- Manual factual/schematic corrections were needed, including precipitation, photosynthesis arrows, permanent-storage claims, number-notation equivalence, pronunciation certainty, acronym expansion and independent mathematical terms linked as a flow. Review and approval remain necessary.
- Water-cycle sample lacks an explicit cycle-return arrow. The corrected butterfly output does show the adult-to-egg return arrow. Numeric comparison uses explicit values; a proportional-chart renderer is not implemented.
- Automated audio review flagged possible missing/ambiguous initial wording in the die example; its transcript also rendered fractions as ratios. A pronunciation follow-up is separate evidence, and the original flag is not a confirmed human listening diagnosis.
- Number-notation audio review also flagged number readings, but one timestamp (109.1s) is beyond its89.770667-second output. That timestamp is invalid; its other flags remain unconfirmed until listening.
- An old-image dispatch receipt blocked a capacity slot after rollout. The deployed dispatcher now observes its original immutable image, preserving namespace/argument checks. Live reconciliation finished the old receipt and dispatched the queued job once.
- Sampled layouts are legible without observed clipping. Some panel words wrap awkwardly. Six midpoint stills per output do not prove every animation frame is correct.

## Bounded follow-ups

Code changes lower the initial planner target to150–162words, retain numeric schema bounds and malformed-JSON scene paths in repair feedback, and expose distinct measured-too-long/short errors. Hard duration/visual validation, four attempts and immutable review/approval remain intact. Prompt changes are risk reduction, not factual or timing guarantees. Follow-ups preserve original records and use new durable commands.

| Case | Storyboard follow-up | Video follow-up | Automated audio |
|---|---|---|---|
| 4 | Failed automatic request; manually shortened earlier candidate | succeeded / 77.7s | No issues flagged (AI) |
| 8 | failed | Not rendered | Not performed |
| 9 | Reviewed edit; original request retained | succeeded / 80.0s | No issues flagged (AI) |
| 13 | Reviewed edit; original request retained | succeeded / 76.9s | No issues flagged (AI) |
| 14 | Reviewed edit; original request retained | succeeded / 73.0s | No issues flagged (AI) |
| 16 | completed | succeeded / 77.7s | No issues flagged (AI) |
| 18 | failed | Not rendered | Not performed |
| 19 | failed | Not rendered | Not performed |

Case19 produced a valid candidate on the first follow-up (attempt3), but the evaluation helper reapplied it after an explicitly rejected heading edit and correctly hit stale-plan protection. One fresh recovery request exhausted four validation attempts. No narration was generated for that case, and no further retries were made. This helper mistake is separate from the initial model failure. Binary-search and overbroad-science follow-ups also exhausted validation; a generic validation error does not satisfy the desired actionable clarification flow.

## Scope and remaining sign-off

Successful technical probes cover full H.264/AAC decoding,1080×1920/30fps, exact MP4/VTT hashes against stored assets, owner isolation, HTTP HEAD/range delivery, ordered nonoverlapping caption timings and caption text matching every saved scene. They do not establish pronunciation naturalness or full continuous-motion quality. Photosynthesis completed80.32-second hosted Chrome playback without a media error. Human listening and final operating acceptance remain separate. No main merge is authorized. Publishing remains disabled; approved daily Instagram maintenance remains enabled. All 47 cloud executions finished, and no unresolved dispatch receipts remained. Generation and publishing shutdown passed on Ready deployment FvCuyDs1aydXWex5x1jUpNS1xfmQ: both execution endpoints returned503; renewal remained protected with401. Both dispatch/publication schedulers are paused; daily renewal remains enabled.

## Final technical totals and cost checkpoint

- **17 successful narrated outputs across 16 topics:** 12 baseline videos and five
  separately reviewed follow-ups. All 17 passed full decoding, exact asset/caption
  checks, owner isolation and six midpoint visual samples. All received the
  authorized automated audio review; two baseline reviews raised unconfirmed
  flags, including one invalid timestamp. All five follow-up audio reviews reported
  no issues. These are not human listening passes.
- Final follow-up durations: energy 77.696s, units 77.653s, city names 72.960s,
  fractions 80.021s and acronyms 76.928s. None required an automatic paid rerender.
- 27 hosted storyboard requests used 71 recorded provider attempts. One separate
  diagnostic JSON probe used 2,070 input/1,076 output tokens. The hosted request
  counts exclude that diagnostic probe; initial failures are not overwritten.
- All 47 Cloud Run executions completed. Their aggregate duration with a
  60-second minimum per execution was 6,601.45 seconds: approximately **US$0.29**
  at 2 CPU/4 GiB list compute rates before free allowances. Three successful
  builds totalled about 20.44 minutes, approximately **US$0.123** on the default
  build machine. These estimates exclude storage, transfer and taxes.
  Sources: [Cloud Run pricing](https://cloud.google.com/run/pricing) and
  [Cloud Build pricing](https://cloud.google.com/build/pricing).
- Seventeen audio reviews recorded 38,803 input/4,212 output tokens, approximately
  **US$0.022** at current Flash-Lite list rates. The 71 storyboard attempts had a
  maximum combined output allowance of 581,632 tokens, approximately **US$1.455**
  if fully consumed; this is a conservative output ceiling, not actual usage.
  Storyboard input usage is not persisted by the adapter. Source:
  [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).
- The actual purchase was **US$7 prepaid ElevenLabs credit**, with Auto Top Up off.
  Recorded/estimated compute, build and model costs leave headroom within the
  approved US$10 total, but provider billing can lag and these figures are not a
  final invoice or a permanent spending cap. No further evaluation calls planned.
