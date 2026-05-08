import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../dist/tools.yml", import.meta.url);
const token = process.env.GITHUB_TOKEN;

const text = await readFile(FILE, "utf8");

const blocks = text.split(/\n(?=- name:)/);

let updated = 0;
for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const repoMatch = block.match(/^\s*github_repo:\s*(.+?)\s*$/m);
  if (!repoMatch) continue;
  const repo = repoMatch[1].replace(/^["']|["']$/g, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    console.warn(`skipping invalid repo "${repo}"`);
    continue;
  }

  const headers = { "user-agent": "agentmgmt-star-updater" };
  if (token) headers.authorization = `Bearer ${token}`;

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

  const formatted = formatStars(stargazers_count);
  const next = block.replace(
    /^(\s*github_stars:\s*).*$/m,
    `$1"${formatted}"`,
  );
  if (next !== block) {
    blocks[i] = next;
    updated++;
    console.log(`${repo}: ${stargazers_count} -> ${formatted}`);
  }
}

function formatStars(n) {
  if (n < 1000) return "< 1k";
  if (n < 10000) return `${Math.round(n / 100) / 10}k`;
  return `${Math.round(n / 1000)}k`;
}

const out = blocks.join("\n");
await writeFile(FILE, out);
console.log(`updated ${updated} entries`);
