export const comparators = {
  "stars-desc": (a, b) =>
    repoFirst(a, b) ||
    (b.github_stars || 0) - (a.github_stars || 0) ||
    byName(a, b),
  "stars-asc": (a, b) =>
    repoFirst(a, b) ||
    (a.github_stars || 0) - (b.github_stars || 0) ||
    byName(a, b),
  "name-asc": byName,
  "name-desc": (a, b) => b.name.localeCompare(a.name),
};

export function renderToolRows(tools, sortKey) {
  const comparator = comparators[sortKey] || comparators["name-asc"];
  return [...tools].sort(comparator).map(renderRow).join("");
}

function renderRow(tool) {
  const host = getHost(tool.url);
  const githubUrl = getGithubUrl(tool);
  const starsNumber = githubUrl
    ? `<span class="font-mono tabular-nums text-neutral-200">${formatStars(tool.github_stars || 0)}</span>`
    : `<span class="text-neutral-600">—</span>`;
  const stars = githubUrl
    ? `<a href="${escapeAttr(githubUrl)}"
          target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-neutral-100">
        ${starsNumber}
        ${externalLinkSvg}
      </a>`
    : starsNumber;
  const badge = tool.opensource
    ? `<span class="inline-flex items-center whitespace-nowrap rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Open source</span>`
    : `<span class="inline-flex items-center whitespace-nowrap rounded-full border border-neutral-700 bg-neutral-800/50 px-2.5 py-0.5 text-xs font-medium text-neutral-400">Proprietary</span>`;
  const faviconHtml = tool.icon_url
    ? `<img src="${escapeAttr(tool.icon_url)}" alt=""
             loading="lazy" width="20" height="20"
             class="h-5 w-5 flex-shrink-0 rounded bg-neutral-800/50 object-cover"
             onerror="this.style.visibility='hidden'">`
    : host === "github.com"
    ? `<div class="h-5 w-5 flex-shrink-0" aria-hidden="true"></div>`
    : `<img src="${escapeAttr(getFaviconUrl(host))}" alt=""
             loading="lazy" width="20" height="20"
             class="h-5 w-5 flex-shrink-0 rounded bg-neutral-800/50"
             onerror="this.style.visibility='hidden'">`;
  const linkFavicons = Array.isArray(tool.links) && tool.links.length
    ? `<div class="flex items-center gap-2">${[...tool.links]
        .sort(compareLinks)
        .map(renderLinkIcon)
        .join("")}</div>`
    : `<span class="text-neutral-600">—</span>`;
  return `
    <tr class="transition hover:bg-neutral-900/40">
      <td class="px-6 py-4 font-medium text-neutral-100">
        <a href="${escapeAttr(tool.url)}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-3 text-neutral-100 transition hover:text-white">
          ${faviconHtml}
          <span>${escapeHtml(tool.name)}</span>
          ${externalLinkSvg}
        </a>
      </td>
      <td class="px-6 py-4">${linkFavicons}</td>
      <td class="px-6 py-4 max-w-md text-neutral-400">${
        tool.details ? escapeHtml(tool.details) : `<span class="text-neutral-600">—</span>`
      }</td>
      <td class="px-6 py-4">${renderOs(tool.os)}</td>
      <td class="px-6 py-4 text-neutral-400">${
        tool.price ? escapeHtml(tool.price) : `<span class="text-neutral-600">—</span>`
      }</td>
      <td class="px-6 py-4 text-right">${stars}</td>
      <td class="px-6 py-4 text-right">${badge}</td>
    </tr>
  `;
}

function renderLinkIcon(link) {
  const linkHost = getHost(link);
  const linkIcon = isGitHubHost(linkHost)
    ? githubIconSvg
    : `<img src="${escapeAttr(getFaviconUrl(linkHost))}" alt=""
           loading="lazy" width="16" height="16"
           class="h-4 w-4 rounded-sm"
           onerror="this.parentElement.style.display='none'">`;
  return `<a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer"
      class="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-800 bg-neutral-900/60 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-50"
      title="${escapeAttr(linkHost)}" aria-label="${escapeAttr(linkHost)}">
    ${linkIcon}
  </a>`;
}

function renderOs(os) {
  const supported = new Set(Array.isArray(os) ? os : []);
  return `<div class="flex items-center gap-2 text-neutral-200">${PLATFORMS
    .map(({ value, label }) => {
      const active = supported.has(value);
      const stateClass = active ? "opacity-100" : "opacity-20";
      const stateLabel = active ? label : `${label} (not supported)`;
      return `<span class="${stateClass} transition" title="${escapeAttr(stateLabel)}" aria-label="${escapeAttr(stateLabel)}">${PLATFORM_ICONS[value] || ""}</span>`;
    })
    .join("")}</div>`;
}

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

function repoFirst(a, b) {
  return !!getGithubUrl(b) - !!getGithubUrl(a);
}

function formatStars(n) {
  return n < 1000 ? `~${n}` : `${n / 1000}k`;
}

function compareLinks(a, b) {
  return getHost(a).localeCompare(getHost(b)) || a.localeCompare(b);
}

function getHost(url) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(host) {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`;
}

function isGitHubHost(host) {
  return host === "github.com";
}

function getGithubUrl(tool) {
  if (!Array.isArray(tool.links))
    return null;
  return tool.links.find(link => getGithubRepo(link)) || null;
}

function getGithubRepo(link) {
  try {
    const url = new URL(link);
    const host = url.host.replace(/^www\./, "");
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (host !== "github.com" || !owner || !repo)
      return null;
    return `${owner}/${repo.replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

const externalLinkSvg = `<svg class="h-3.5 w-3.5 opacity-60" aria-hidden="true"><use href="#icon-external"/></svg>`;

const githubIconSvg = `<svg class="h-4 w-4" aria-hidden="true"><use href="#icon-github"/></svg>`;

const PLATFORMS = [
  { value: "web", label: "Web" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
];

const PLATFORM_ICONS = Object.fromEntries(
  PLATFORMS.map(({ value }) => [
    value,
    `<svg class="h-5 w-5" aria-hidden="true"><use href="#icon-${value}"/></svg>`,
  ]),
);
