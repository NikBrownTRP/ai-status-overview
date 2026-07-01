# AI Model Status Overview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single shareable static HTML page that ranks major paid and open-source AI models per task category (coding, reasoning & math, image generation, agentic/tool use), shows cost-of-use (API token price + subscription) and API-key setup links, plus a Claude Code skill that refreshes the benchmark data.

**Architecture:** Two static artifacts (`index.html`, `data.json`) hosted on GitHub Pages, with a clean data/view split — the page renders purely from `data.json`, with the same data inlined as a `file://` fallback. A separate installed skill (`~/.claude/skills/ai-benchmark-refresh/`) does web research and regenerates `data.json` after user confirmation.

**Tech Stack:** Plain HTML/CSS/JS (no framework, no CDN runtime deps), inline SVG charts, Node.js (for JSON validation only), Git + GitHub Pages.

## Global Constraints

- Static files only — must work as `user.github.io/<repo>/` on GitHub Pages; no backend.
- No external CDN runtime dependency in `index.html` (page must render offline). Charts drawn with inline SVG / vanilla JS.
- Page must render both when served over http AND when opened via `file://` (inline JSON fallback).
- `data.json` is the single source of truth; the inline fallback block in `index.html` is regenerated from it.
- Data honesty: every category names its `primary_benchmark` and `unit`; sources linked in footer.
- Scope: top ~10–15 models per category.
- Categories (exact ids): `coding`, `reasoning-math`, `image-generation`, `agentic-tooluse`.
- License values (exact): `"open"` | `"proprietary"`.
- Nullable numeric fields render as `—`.
- All UI work goes through the `/frontend-design` skill (user's global instruction).
- Currency for subscriptions default `"USD"`.

---

### Task 1: Repo scaffold + validated data schema (with placeholder data)

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `data.json`
- Create: `scripts/validate-data.mjs`

**Interfaces:**
- Produces: `data.json` conforming to the schema below; `scripts/validate-data.mjs` (Node script, exit 0 = valid, exit 1 = invalid) usable by all later tasks and the refresh skill.

Schema (top-level keys): `last_updated` (string `YYYY-MM-DD`), `sources` (array of `{name, url}`), `providers` (array), `categories` (array).

- `providers[]`: `{ id, name, api_key_url, subscriptions: [{plan, price_month, currency}] }`
- `categories[]`: `{ id, label, primary_benchmark, unit, higher_is_better, models: [...] }`
- `models[]`: `{ model, provider_id, org, license, score, price_in, price_out, context, speed_tps, notes }`

- [ ] **Step 1: Initialize the repo**

```bash
cd "/Users/niklasbrown/Desktop/Claude Tools/AI Status Overview"
git init
printf "node_modules/\n.DS_Store\n" > .gitignore
```

- [ ] **Step 2: Write `data.json` with the schema shape and 2 placeholder providers + 2 placeholder models per category**

Use this exact structure (placeholder numbers — real data comes in Task 4). Include all four categories with correct ids/units:

```json
{
  "last_updated": "2026-07-01",
  "sources": [
    { "name": "Artificial Analysis", "url": "https://artificialanalysis.ai" },
    { "name": "LMArena", "url": "https://lmarena.ai" }
  ],
  "providers": [
    { "id": "openai", "name": "OpenAI", "api_key_url": "https://platform.openai.com/api-keys",
      "subscriptions": [ { "plan": "ChatGPT Plus", "price_month": 20, "currency": "USD" } ] },
    { "id": "anthropic", "name": "Anthropic", "api_key_url": "https://console.anthropic.com/settings/keys",
      "subscriptions": [ { "plan": "Claude Pro", "price_month": 20, "currency": "USD" } ] }
  ],
  "categories": [
    { "id": "coding", "label": "Coding", "primary_benchmark": "SWE-bench Verified", "unit": "% resolved", "higher_is_better": true,
      "models": [
        { "model": "Placeholder A", "provider_id": "anthropic", "org": "Anthropic", "license": "proprietary", "score": 70.0, "price_in": 3.0, "price_out": 15.0, "context": 200000, "speed_tps": 80, "notes": "" },
        { "model": "Placeholder B", "provider_id": "openai", "org": "OpenAI", "license": "proprietary", "score": 68.0, "price_in": 2.5, "price_out": 10.0, "context": 128000, "speed_tps": 90, "notes": "" }
      ] },
    { "id": "reasoning-math", "label": "Reasoning & Math", "primary_benchmark": "GPQA Diamond", "unit": "% accuracy", "higher_is_better": true,
      "models": [
        { "model": "Placeholder A", "provider_id": "openai", "org": "OpenAI", "license": "proprietary", "score": 82.0, "price_in": 2.5, "price_out": 10.0, "context": 128000, "speed_tps": 90, "notes": "" },
        { "model": "Placeholder B", "provider_id": "anthropic", "org": "Anthropic", "license": "proprietary", "score": 80.0, "price_in": 3.0, "price_out": 15.0, "context": 200000, "speed_tps": 80, "notes": "" }
      ] },
    { "id": "image-generation", "label": "Image Generation", "primary_benchmark": "LMArena Image Arena (Elo)", "unit": "Elo", "higher_is_better": true,
      "models": [
        { "model": "Placeholder A", "provider_id": "openai", "org": "OpenAI", "license": "proprietary", "score": 1300, "price_in": null, "price_out": null, "context": null, "speed_tps": null, "notes": "per-image pricing" },
        { "model": "Placeholder B", "provider_id": "openai", "org": "OpenAI", "license": "open", "score": 1250, "price_in": null, "price_out": null, "context": null, "speed_tps": null, "notes": "" }
      ] },
    { "id": "agentic-tooluse", "label": "Agentic & Tool Use", "primary_benchmark": "Tau-bench", "unit": "% success", "higher_is_better": true,
      "models": [
        { "model": "Placeholder A", "provider_id": "anthropic", "org": "Anthropic", "license": "proprietary", "score": 60.0, "price_in": 3.0, "price_out": 15.0, "context": 200000, "speed_tps": 80, "notes": "" },
        { "model": "Placeholder B", "provider_id": "openai", "org": "OpenAI", "license": "proprietary", "score": 58.0, "price_in": 2.5, "price_out": 10.0, "context": 128000, "speed_tps": 90, "notes": "" }
      ] }
  ]
}
```

- [ ] **Step 3: Write `scripts/validate-data.mjs`**

Validates structure and referential integrity (every `model.provider_id` exists in `providers`; required category ids present; license enum; numeric-or-null cost fields).

```js
import { readFileSync } from "node:fs";

const REQUIRED_CATEGORIES = ["coding", "reasoning-math", "image-generation", "agentic-tooluse"];
const LICENSES = new Set(["open", "proprietary"]);
const errors = [];
const fail = (m) => errors.push(m);

const data = JSON.parse(readFileSync(new URL("../data.json", import.meta.url)));

if (!/^\d{4}-\d{2}-\d{2}$/.test(data.last_updated || "")) fail("last_updated must be YYYY-MM-DD");
if (!Array.isArray(data.sources) || data.sources.length === 0) fail("sources must be a non-empty array");
for (const s of data.sources || []) if (!s.name || !s.url) fail(`source missing name/url: ${JSON.stringify(s)}`);

const providerIds = new Set();
for (const p of data.providers || []) {
  if (!p.id || !p.name || !p.api_key_url) fail(`provider missing id/name/api_key_url: ${JSON.stringify(p)}`);
  providerIds.add(p.id);
  for (const sub of p.subscriptions || []) {
    if (!sub.plan) fail(`subscription missing plan for provider ${p.id}`);
    if (typeof sub.price_month !== "number") fail(`subscription price_month must be number for provider ${p.id}`);
  }
}

const seenCats = new Set();
for (const c of data.categories || []) {
  seenCats.add(c.id);
  if (!c.label || !c.primary_benchmark || !c.unit) fail(`category ${c.id} missing label/primary_benchmark/unit`);
  if (typeof c.higher_is_better !== "boolean") fail(`category ${c.id} higher_is_better must be boolean`);
  if (!Array.isArray(c.models) || c.models.length === 0) fail(`category ${c.id} has no models`);
  for (const m of c.models || []) {
    if (!m.model) fail(`model missing name in ${c.id}`);
    if (!providerIds.has(m.provider_id)) fail(`model ${m.model} references unknown provider_id ${m.provider_id}`);
    if (!LICENSES.has(m.license)) fail(`model ${m.model} has invalid license ${m.license}`);
    if (typeof m.score !== "number") fail(`model ${m.model} score must be number`);
    for (const f of ["price_in", "price_out", "context", "speed_tps"]) {
      if (m[f] !== null && typeof m[f] !== "number") fail(`model ${m.model} field ${f} must be number or null`);
    }
  }
}
for (const id of REQUIRED_CATEGORIES) if (!seenCats.has(id)) fail(`missing required category ${id}`);

if (errors.length) { console.error("INVALID data.json:\n- " + errors.join("\n- ")); process.exit(1); }
console.log("data.json valid: " + data.categories.length + " categories, " + data.providers.length + " providers");
```

- [ ] **Step 4: Write `README.md`**

Include: what the page is, how to view locally, how to publish to GitHub Pages (Settings → Pages → deploy from branch → root), the share URL shape `https://<user>.github.io/<repo>/`, and how to refresh data (run the `ai-benchmark-refresh` skill). Keep it under ~40 lines.

- [ ] **Step 5: Verify the validator passes**

Run: `node scripts/validate-data.mjs`
Expected: `data.json valid: 4 categories, 2 providers`

- [ ] **Step 6: Verify negative case**

Temporarily change a `provider_id` to `"nope"`, re-run the validator.
Run: `node scripts/validate-data.mjs`
Expected: exit 1 with `references unknown provider_id nope`. Revert the change afterward; re-run to confirm valid again.

- [ ] **Step 7: Commit**

```bash
git add .gitignore data.json scripts/validate-data.mjs README.md docs/
git commit -m "feat: scaffold repo, data schema, and validator"
```

---

### Task 2: The page — `index.html` rendering from `data.json`

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `data.json` (schema from Task 1); optional inline fallback `<script id="data-fallback" type="application/json">`.
- Produces: a fully rendered page with element ids `#verdict-cards`, `#category-sections`, `#access-pricing`, `#last-updated`, `#sources`.

**IMPORTANT:** Do the visual/styling work via the `/frontend-design` skill (user global instruction). The steps below define required behavior and structure; frontend-design owns the aesthetic execution.

- [ ] **Step 1: Build the data-loading core**

`index.html` must load data with this exact strategy (fetch first, inline fallback second) so it works on http and `file://`:

```html
<script>
async function loadData() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) { /* file:// or offline — fall through */ }
  const el = document.getElementById("data-fallback");
  if (el) return JSON.parse(el.textContent);
  throw new Error("No data available");
}
</script>
```

- [ ] **Step 2: Render the header + verdict cards**

- Header sets `#last-updated` to `data.last_updated` and a one-line explainer.
- For each category, compute the winner = the model with the best `score` given `higher_is_better`, and the runner-up = second best. Render a card into `#verdict-cards` showing: category label, winner model + org, score + `unit`, `primary_benchmark` name, and "2nd: <runner-up> <score>".
- Helper (use verbatim so ordering is consistent everywhere):

```js
function rankModels(cat) {
  return [...cat.models].sort((a, b) =>
    cat.higher_is_better ? b.score - a.score : a.score - b.score);
}
function fmt(v, suffix = "") { return (v === null || v === undefined) ? "—" : v + suffix; }
```

- [ ] **Step 3: Render per-category sections (sortable tables + bar chart)**

For each category, into `#category-sections`, render:
- A heading with `label`, and a caption "Measured by <primary_benchmark> (<unit>)".
- A table: columns `Model`, `Org`, `License`, `Score (<unit>)`, `In $/M`, `Out $/M`, `Context`, `Speed t/s`. License shown as a colored badge (open vs proprietary). Top-ranked row highlighted. Cost/context/speed use `fmt()` for nulls.
- Clicking a column header sorts by that column (toggle asc/desc). Implement one generic `sortTableBy(tableEl, colIndex, numeric)` handler.
- A horizontal bar chart (inline SVG) of the top 8 ranked models by `score`, bar length proportional to score (normalize to max), labeled with model name + score. Open-source bars use the distinct license color.

- [ ] **Step 4: Render the Access & Pricing section**

Into `#access-pricing`, one row per provider from `data.providers`:
- Provider name.
- Token price range: min/max of `price_in`/`price_out` across that provider's models found in categories (compute across all models whose `provider_id` matches; show `—` if none numeric), formatted like `$2.5–15 /M`.
- Subscription plans: list `plan — $price_month/mo` for each subscription (or "API only" if none).
- A "Get API key" button/link → `provider.api_key_url` (opens new tab, `rel="noopener"`).

- [ ] **Step 5: Render the footer**

Into `#sources`, list `data.sources` as links (new tab, `rel="noopener"`), plus a one-line methodology note ("Scores reflect each category's named primary benchmark; figures gathered from public leaderboards and model cards.") and the last-updated date.

- [ ] **Step 6: Wire it up + apply frontend-design styling**

Call `loadData()` on `DOMContentLoaded`, render all sections, handle the error case by showing a visible message. Then apply the `/frontend-design` skill for the dense dashboard aesthetic, responsive layout, and license color-coding. No CDN dependencies.

- [ ] **Step 7: Verify rendering (served)**

Run a static server and open the page:
```bash
cd "/Users/niklasbrown/Desktop/Claude Tools/AI Status Overview"
python3 -m http.server 8765 &
```
Open `http://localhost:8765/` (via browser / chrome-devtools skill). Confirm: 4 verdict cards, 4 category tables with working column-sort, 4 bar charts, Access & Pricing rows with working "Get API key" links, footer with source links and last-updated. Stop the server afterward (`kill %1`).

- [ ] **Step 8: Generate the inline fallback and verify `file://`**

Regenerate the inline fallback block from `data.json` (this is the same routine the skill will use — see Task 3 Step 3, `scripts/inline-fallback.mjs`), then open `index.html` directly via `file://` and confirm it still renders from the fallback (fetch will fail silently).

- [ ] **Step 9: Commit**

```bash
git add index.html scripts/inline-fallback.mjs
git commit -m "feat: render overview page from data.json with file:// fallback"
```

---

### Task 3: The refresh skill — `ai-benchmark-refresh`

**Files:**
- Create: `~/.claude/skills/ai-benchmark-refresh/SKILL.md`
- Create: `scripts/inline-fallback.mjs` (in the project repo; used by Task 2 Step 8 and by the skill)

**Interfaces:**
- Consumes: existing `data.json`, `scripts/validate-data.mjs`, `scripts/inline-fallback.mjs`.
- Produces: an updated `data.json` + refreshed inline fallback in `index.html`, after user confirmation.

- [ ] **Step 1: Write `scripts/inline-fallback.mjs`**

Reads `data.json`, replaces (or inserts before `</body>`) the `<script id="data-fallback" type="application/json">…</script>` block in `index.html` with the current data.

```js
import { readFileSync, writeFileSync } from "node:fs";

const dataUrl = new URL("../data.json", import.meta.url);
const htmlUrl = new URL("../index.html", import.meta.url);
const data = readFileSync(dataUrl, "utf8");
let html = readFileSync(htmlUrl, "utf8");

const block = `<script id="data-fallback" type="application/json">\n${data}\n</script>`;
const re = /<script id="data-fallback" type="application\/json">[\s\S]*?<\/script>/;
if (re.test(html)) {
  html = html.replace(re, block);
} else {
  html = html.replace("</body>", `${block}\n</body>`);
}
writeFileSync(htmlUrl, html);
console.log("Inline fallback updated from data.json");
```

- [ ] **Step 2: Verify the inline script works**

Run: `node scripts/inline-fallback.mjs`
Expected: `Inline fallback updated from data.json`, and `index.html` contains a `data-fallback` script whose JSON matches `data.json`. Running it twice must not duplicate the block (idempotent) — run it again and confirm exactly one `data-fallback` block exists:
Run: `grep -c 'id="data-fallback"' index.html`
Expected: `1`

- [ ] **Step 3: Write the skill `SKILL.md`**

Frontmatter + procedure. The skill must:
1. Locate the project (ask user for the repo path if not obvious; default to the current working directory).
2. Read current `data.json` to know existing models/dates.
3. For each category, use WebSearch/WebFetch to gather current top ~10–15 paid + open models and their scores on the category's `primary_benchmark`, plus API token prices; and per provider, subscription plan prices and API-key setup URL. Prefer: Artificial Analysis, LMArena, official model cards, SWE-bench Verified, LiveCodeBench, GPQA Diamond leaderboards.
4. Normalize into the exact schema (Task 1). Keep `provider_id` referential integrity.
5. **Show the user a concise diff/summary** (added models, removed models, changed scores/prices, new `last_updated`) and **ask for explicit confirmation before writing**.
6. On confirmation: write `data.json`, set `last_updated` to today, update `sources`, then run `node scripts/validate-data.mjs` (must pass) and `node scripts/inline-fallback.mjs`.
7. Remind the user to `git add -A && git commit && git push`, and note the Pages URL.

Frontmatter:

```markdown
---
name: ai-benchmark-refresh
description: Use when a new AI model is released or benchmark data looks stale, to re-research current model benchmark scores, prices, subscriptions, and API-key links and regenerate the AI Status Overview data.json (with user confirmation before writing).
---
```

The body must spell out the 7 steps above as an explicit procedure, name the exact files (`data.json`, `scripts/validate-data.mjs`, `scripts/inline-fallback.mjs`), the exact schema, the confirmation gate, and the post-write validation commands.

- [ ] **Step 4: Verify the skill is discoverable and coherent**

Run: `test -f ~/.claude/skills/ai-benchmark-refresh/SKILL.md && head -5 ~/.claude/skills/ai-benchmark-refresh/SKILL.md`
Expected: frontmatter with `name: ai-benchmark-refresh` prints. Re-read the body and confirm it references the real script paths and the confirmation gate.

- [ ] **Step 5: Commit**

```bash
git add scripts/inline-fallback.mjs
git commit -m "feat: add inline-fallback generator and ai-benchmark-refresh skill"
```

(The skill file lives under `~/.claude`, outside the repo; note this in the commit message body.)

---

### Task 4: Populate real benchmark data + final verification

**Files:**
- Modify: `data.json`
- Modify: `index.html` (inline fallback regenerated)

**Interfaces:**
- Consumes: the `ai-benchmark-refresh` procedure (Task 3) and validator (Task 1).

- [ ] **Step 1: Gather real current data**

Follow the `ai-benchmark-refresh` procedure to research and populate real, current figures for all four categories (top ~10–15 models each) as of today's date, including provider subscription prices and API-key URLs. Replace all `Placeholder` entries. Set `last_updated` to today.

- [ ] **Step 2: Validate**

Run: `node scripts/validate-data.mjs`
Expected: `data.json valid: 4 categories, N providers` (N = actual provider count).

- [ ] **Step 3: Regenerate inline fallback**

Run: `node scripts/inline-fallback.mjs`
Expected: `Inline fallback updated from data.json`; `grep -c 'id="data-fallback"' index.html` → `1`.

- [ ] **Step 4: Final render check**

Serve and open the page (as in Task 2 Step 7). Confirm real models appear, verdict cards name plausible winners, sorting works, Access & Pricing shows real subscription prices and working API-key links, footer date is today. Also open via `file://` to confirm the fallback path.

- [ ] **Step 5: Commit**

```bash
git add data.json index.html
git commit -m "data: populate real benchmark data and refresh fallback"
```

- [ ] **Step 6: Publish note**

Confirm the README's GitHub Pages steps are accurate. Leave the actual `git remote add` / push and enabling Pages to the user (they choose the repo name), but state the exact commands in the final message.

---

## Self-Review

**Spec coverage:**
- Two files + skill architecture → Tasks 1, 2, 3. ✓
- Verdict cards + per-category tables + charts → Task 2 Steps 2–3. ✓
- Speed & price shown in tables; Access & Pricing (token price + subscription + API-key link) → Task 2 Steps 3–4. ✓
- `providers[]` schema with `api_key_url` + subscriptions, model `provider_id` → Task 1 Step 2, validator Step 3. ✓
- fetch + inline `file://` fallback → Task 2 Step 1/8, Task 3 Steps 1–2. ✓
- Data honesty (primary_benchmark/unit, sources) → Task 1 schema, Task 2 Steps 3/5. ✓
- Refresh skill with confirmation gate + post-write validation → Task 3 Step 3. ✓
- Real initial data → Task 4. ✓
- GitHub Pages publishing → Task 1 README, Task 4 Step 6. ✓

**Placeholder scan:** No "TBD/TODO"; placeholder *data* in Task 1 is intentional and replaced in Task 4. All code steps contain full code. ✓

**Type consistency:** `rankModels`, `fmt`, `sortTableBy`, `loadData`, element ids (`#verdict-cards`, `#category-sections`, `#access-pricing`, `#last-updated`, `#sources`), and the `data-fallback` script id are used consistently across Tasks 2–3. Schema field names match between Task 1 schema, validator, and Task 2 rendering. ✓
