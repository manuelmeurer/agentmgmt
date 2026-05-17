import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import { renderToolRows } from "../src/render-tools.mjs";

const exec = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "src");
const dist = join(root, "dist");

await mkdir(dist, { recursive: true });

const [htmlTemplate, toolsYaml] = await Promise.all([
  readFile(join(src, "index.html"), "utf8"),
  readFile(join(src, "tools.yml"), "utf8"),
]);
const tools = yaml.load(toolsYaml) || [];

const rows = renderToolRows(tools, "name-asc");
const jsonTag = `<script type="application/json" id="tools-data">${JSON.stringify(tools).replace(/</g, "\\u003c")}</script>`;
const lastUpdated = await lastUpdatedPhrase();

const html = htmlTemplate
  .replace("<!-- TOOLS_ROWS -->", rows)
  .replace("<!-- TOOLS_JSON -->", jsonTag)
  .replace("<!-- LAST_UPDATED -->", lastUpdated);

await writeFile(join(dist, "index.html"), html);

await Promise.all([
  copyFile(join(src, "app.js"), join(dist, "app.js")),
  copyFile(join(src, "render-tools.mjs"), join(dist, "render-tools.mjs")),
  copyFile(join(src, "tools.yml"), join(dist, "tools.yml")),
  copyAssets(),
]);

console.log(`built dist/ (${tools.length} tools${lastUpdated ? `, ${lastUpdated}` : ""})`);

async function copyAssets() {
  const assetsDir = join(src, "assets");
  const entries = await readdir(assetsDir);
  await Promise.all(
    entries.map(name => copyFile(join(assetsDir, name), join(dist, name))),
  );
}

async function lastUpdatedPhrase() {
  try {
    const { stdout } = await exec("git", [
      "log", "-1", "--format=%cI", "--", "src/tools.yml",
    ], { cwd: root });
    const iso = stdout.trim();
    if (!iso)
      return "";
    const days = Math.floor((Date.now() - new Date(iso)) / 86_400_000);
    const phrase = days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
    return `Last updated ${phrase}`;
  } catch {
    return "";
  }
}
