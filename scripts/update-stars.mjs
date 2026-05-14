import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../dist/tools.yml", import.meta.url);
const token = process.env.GITHUB_TOKEN;

const text = await readFile(FILE, "utf8");

const blocks = text.split(/\n(?=- name:)/);

let updated = 0;
for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const repo = findGithubRepo(block);
  if (!repo)
    continue;

  const headers = { "user-agent": "agentmgmt-star-updater" };
  if (token)
    headers.authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) {
    console.warn(`${repo}: HTTP ${res.status}`);
    continue;
  }
  const { stargazers_count } = await res.json();
  if (typeof stargazers_count !== "number") {
    console.warn(`${repo}: no stargazers_count in response`);
    continue;
  }

  const rounded = roundStars(stargazers_count);
  const next = block.replace(
    /^(\s*github_stars:\s*).*$/m,
    `$1${rounded}`,
  );
  if (next !== block) {
    blocks[i] = next;
    updated++;
    console.log(`${repo}: ${stargazers_count} -> ${rounded}`);
  }
}

function roundStars(n) {
  const step = n < 10000 ? 100 : 1000;
  return Math.round(n / step) * step;
}

function findGithubRepo(block) {
  const lines = block.split("\n");
  let inLinks = false;
  let linksIndent = 0;

  for (const line of lines) {
    const linksMatch = line.match(/^(\s*)links:\s*$/);
    if (linksMatch) {
      inLinks = true;
      linksIndent = linksMatch[1].length;
      continue;
    }
    if (!inLinks)
      continue;
    if (/^\s*$/.test(line))
      continue;

    const indent = line.match(/^(\s*)/)[1].length;
    if (indent <= linksIndent)
      break;

    const linkMatch = line.match(/^\s*-\s*(.+?)\s*$/);
    if (!linkMatch)
      continue;

    const repo = githubRepoFromUrl(linkMatch[1].replace(/^["']|["']$/g, ""));
    if (repo)
      return repo;
  }

  return null;
}

function githubRepoFromUrl(value) {
  try {
    const url = new URL(value);
    const host = url.host.toLowerCase().replace(/^www\./, "");
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (host !== "github.com" || !owner || !repo)
      return null;

    const normalizedRepo = repo.replace(/\.git$/, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(`${owner}/${normalizedRepo}`))
      return null;

    return `${owner}/${normalizedRepo}`;
  } catch {
    return null;
  }
}

const out = blocks.join("\n");
await writeFile(FILE, out);
console.log(`updated ${updated} entries`);
