# V1 representative-content evaluation

Status: in progress. This table records actual results, not release approval.

The user approved US$10 total additional closeout spending, including the US$7 prepaid ElevenLabs purchase. No subscription or new social publication. Gemini audio reviews are expressly authorized automated checks, not human listening. Private media, provider payloads and durable request receipts remain under ignored runs/f22/evaluation.

| Case | Topic | Hosted storyboard | Hosted video | Content review | Automated audio review |
|---|---|---|---|---|---|
| 1 | Water cycle | completed | succeeded / 81.4s | Manual correction required | No issues flagged (AI) |
| 2 | Photosynthesis | completed | succeeded / 80.3s | Manual correction required | No issues flagged (AI) |
| 3 | Bicycle brakes | completed | succeeded / 78.6s | Text/schematic reviewed | No issues flagged (AI) |
| 4 | Renewable versus nonrenewable energy | completed | needs_input | Manual correction required | Pending |
| 5 | RAM versus storage | completed | succeeded / 88.7s | Manual correction required | No issues flagged (AI) |
| 6 | Butterfly life cycle | completed | running | Manual correction required | Pending |
| 7 | A supplied four-event historical timeline | completed | running | Manual correction required | Pending |
| 8 | Binary search | failed / STORYBOARD_INVALID | Not rendered | Pending | Pending |
| 9 | Probability of a fair six-sided die | completed | Not rendered | Text/schematic reviewed | Pending |
| 10 | Thermostat feedback | completed | Not rendered | Manual correction required | Pending |
| 11 | Compare supplied chart values | completed | Not rendered | Text/schematic reviewed | Pending |
| 12 | 18 percent of one thousand rupees | completed | Not rendered | Text/schematic reviewed | Pending |
| 13 | HTTP CPU RAM | completed | Not rendered | Manual correction required | Pending |
| 14 | Three Indian city names | completed | Not rendered | Manual correction required | Pending |
| 15 | Indian and international number notation | completed | Not rendered | Manual correction required | Pending |
| 16 | Kilometres and metres | failed / STORYBOARD_INVALID | Not rendered | Pending | Pending |
| 17 | Pythagorean theorem | completed | Not rendered | Manual correction required | Pending |
| 18 | Explain all of science | failed / STORYBOARD_INVALID | Not rendered | Pending | Pending |
| 19 | Resolve contradictory supplied notes | failed / STORYBOARD_INVALID | Not rendered | Pending | Pending |
| 20 | Photorealistic fluid simulation | completed | Not rendered | Text/schematic reviewed | Pending |

Known findings: water-cycle precipitation wording required correction; photosynthesis required correcting misleading diagram arrows and sugar-output wording. Photosynthesis first request failed with HTTP200/INVALID_RESPONSE and recovered through one explicit hosted retry. Contradictory notes exhausted four repairs with INVALID_JSON; a separate bounded diagnostic probe succeeded, which does not erase the hosted failure.

Technical decoding, exact download hashes, caption timing and sampled stills are separate checks. Full-duration human listening, complete visual sign-off and remaining cases must not be inferred from a successful render. No main merge is authorized.
