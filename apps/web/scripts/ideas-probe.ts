// One explicit live request with synthetic input. Never prints keys or model text.
import { geminiConfig, suggest, ProviderError } from '../src/ideas/providers';
try {
  const config = geminiConfig();
  const ideas = await suggest({ prompt: 'Suggest three visual approaches to explaining binary search to beginners.',
    draft: { topic: 'Binary search', audience: 'Beginning programmers', notes: '', voicePreset: 'daniel-test' },
  }, config, fetch, event => console.log(JSON.stringify({ event: 'idea_provider_probe', model: config.model, ...event })));
  console.log(JSON.stringify({ ok: true, suggestionCount: ideas.length }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, code: error instanceof ProviderError ? error.code : 'PROBE_FAILED' }));
  process.exitCode = 1;
}
