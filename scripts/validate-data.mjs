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
