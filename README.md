<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/121f9445-c641-4b77-bd80-54f6aa0757b9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set `OPENROUTER_API_KEY` in [.env.local](.env.local) to your [OpenRouter](https://openrouter.ai/keys) key.
   Optionally set `OPENROUTER_MODEL` (default: `minimax/minimax-m3:free`). Paid models
   such as `google/gemini-2.5-flash` require credits at https://openrouter.ai/settings/credits.
3. Run the app:
   `npm run dev`

Story text is generated via OpenRouter; the narration is spoken with the browser's
built-in Web Speech API (no audio API key needed).
