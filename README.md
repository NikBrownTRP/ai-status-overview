# AI Status Overview

A shareable HTML page ranking AI models across four benchmarks: Coding, Reasoning & Math, Image Generation, and Agentic & Tool Use.

## Viewing Locally

```bash
open index.html
```

## Publishing to GitHub Pages

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Select **Deploy from a branch** → **main** → **root**
4. Your page is live at: `https://<username>.github.io/<repo-name>/`

## Updating Data

Run the refresh skill to fetch the latest model benchmarks:

```bash
/ai-benchmark-refresh
```

This validates `data.json` and rebuilds the HTML page.

## Structure

- `data.json` — model rankings and provider metadata
- `scripts/validate-data.mjs` — validator (exit 0 = valid, exit 1 = invalid)
- `index.html` — built HTML page (repo root)
