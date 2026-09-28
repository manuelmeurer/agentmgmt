import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import {
  PLATFORMS,
  getExtraTools,
  getPrimaryTools,
  renderOsFilterOptions,
  renderStaticToolRows,
  renderToolRows,
} from "../src/render-tools.mjs";

const REQUIRED_KEYS = ["name", "url", "github_stars", "opensource", "os"];
const OPTIONAL_KEYS = ["icon_url", "links", "details", "price", "table"];
const PRICES = ["Free", "Freemium", "Paid"];
const OS_VALUES = PLATFORMS.map(({ value }) => value);

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

const errors = validateTools(tools);
if (errors.length) {
  console.error(`src/tools.yml is invalid:\n${errors.map(error => `  - ${error}`).join("\n")}`);
  process.exit(1);
}

const primaryTools = getPrimaryTools(tools);
const extraTools = getExtraTools(tools);

const rows = renderToolRows(primaryTools, "name-asc");
const extraRows = renderStaticToolRows(extraTools);
const osFilterOptions = renderOsFilterOptions(primaryTools);
const jsonTag = `<script type="application/json" id="tools-data">${JSON.stringify(tools).replace(/</g, "\\u003c")}</script>`;
const lastUpdated = await lastUpdatedPhrase();

const html = htmlTemplate
  .replace("<!-- TOOLS_ROWS -->", rows)
  .replace("<!-- EXTRA_TOOLS_ROWS -->", extraRows)
  .replace("<!-- OS_FILTER_OPTIONS -->", osFilterOptions)
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

function validateTools(tools) {
  if (!Array.isArray(tools))
    return ["expected a list of tools"];

  const errors = [];
  const names = new Set();
  tools.forEach((tool, index) => {
    const label = typeof tool?.name === "string" ? tool.name : `entry ${index + 1}`;
    const error = message => errors.push(`${label}: ${message}`);

    if (!tool || typeof tool !== "object" || Array.isArray(tool)) {
      error("expected a mapping of fields");
      return;
    }

    REQUIRED_KEYS
      .filter(key => !(key in tool))
      .forEach(key => error(`missing ${key}`));
    Object.keys(tool)
      .filter(key => !REQUIRED_KEYS.includes(key) && !OPTIONAL_KEYS.includes(key))
      .forEach(key => error(`unknown field ${key}`));

    if (typeof tool.name !== "string" || !tool.name.trim())
      error("name must be a non-empty string");
    else if (names.has(tool.name.toLowerCase()))
      error("duplicate name");
    else
      names.add(tool.name.toLowerCase());

    if ("url" in tool && !isHttpUrl(tool.url))
      error(`url must be an http(s) URL, got ${JSON.stringify(tool.url)}`);
    if (tool.icon_url != null && !isHttpUrl(tool.icon_url))
      error(`icon_url must be an http(s) URL, got ${JSON.stringify(tool.icon_url)}`);

    if (tool.links != null) {
      if (!Array.isArray(tool.links))
        error("links must be a list");
      else {
        tool.links
          .filter(link => !isHttpUrl(link))
          .forEach(link => error(`link must be an http(s) URL, got ${JSON.stringify(link)}`));
        if (new Set(tool.links).size !== tool.links.length)
          error("links contain duplicates");
      }
    }

    if (tool.details != null && (typeof tool.details !== "string" || !tool.details.trim()))
      error("details must be a non-empty string or blank");
    if (tool.price != null && !PRICES.includes(tool.price))
      error(`price must be one of ${PRICES.join(", ")} or blank, got ${JSON.stringify(tool.price)}`);
    if ("github_stars" in tool && !(Number.isInteger(tool.github_stars) && tool.github_stars >= 0))
      error(`github_stars must be a non-negative integer, got ${JSON.stringify(tool.github_stars)}`);
    if ("opensource" in tool && typeof tool.opensource !== "boolean")
      error(`opensource must be true or false, got ${JSON.stringify(tool.opensource)}`);
    if (tool.table != null && tool.table !== "extra")
      error(`table must be extra or omitted, got ${JSON.stringify(tool.table)}`);

    if ("os" in tool) {
      if (!Array.isArray(tool.os) || !tool.os.length)
        error("os must be a non-empty list");
      else {
        tool.os
          .filter(value => !OS_VALUES.includes(value))
          .forEach(value => error(`unknown os ${JSON.stringify(value)}, expected one of ${OS_VALUES.join(", ")}`));
        if (new Set(tool.os).size !== tool.os.length)
          error("os contains duplicates");
      }
    }
  });
  return errors;
}

function isHttpUrl(value) {
  if (typeof value !== "string")
    return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function copyAssets() {
  const assetsDir = join(src, "assets");
  const entries = await readdir(assetsDir);
  await Promise.all(
    entries.map(name => copyFile(join(assetsDir, name), join(dist, name))),
  );
}

async function lastUpdatedPhrase() {
  try {
    // CI checkouts may be shallow, where git log would report the oldest
    // fetched commit instead of the last change to tools.yml.
    const { stdout: shallow } = await exec("git", ["rev-parse", "--is-shallow-repository"], { cwd: root });
    if (shallow.trim() === "true")
      await exec("git", ["fetch", "--unshallow", "--quiet"], { cwd: root });

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
