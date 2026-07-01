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
