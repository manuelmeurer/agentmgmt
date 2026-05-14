(async () => {
  const tbody = document.getElementById("ide-rows");
  const sortSelect = document.getElementById("sort");

  let tools = [];

  try {
    const res = await fetch("/tools.yml", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    tools = jsyaml.load(text) || [];
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-red-400">Failed to load data: ${escapeHtml(
      err.message,
    )}</td></tr>`;
    return;
  }

  const formatStars = (n) => (n < 1000 ? `~${n}` : `${n / 1000}k`);

  const repoFirst = (a, b) =>
    !!getGithubUrl(b) - !!getGithubUrl(a);

  const byName = (a, b) => a.name.localeCompare(b.name);

  const comparators = {
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

  const render = () => {
    const sortKey = sortSelect.value;
    const sorted = [...tools].sort(comparators[sortKey] || comparators["name-asc"]);
    tbody.innerHTML = sorted
      .map((tool) => {
        const host = (() => {
          try {
            return new URL(tool.url).host.replace(/^www\./, "");
          } catch {
            return tool.url;
          }
        })();
        const externalLinkSvg = `<svg class="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5z"/>
                  <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5z"/>
                </svg>`;
        const githubUrl = getGithubUrl(tool);
        const starsNumber = githubUrl
          ? `<span class="font-mono tabular-nums text-neutral-200">${formatStars(
              tool.github_stars || 0,
            )}</span>`
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
        const faviconHtml =
          tool.icon_url
            ? `<img src="${escapeAttr(tool.icon_url)}" alt=""
                     loading="lazy" width="20" height="20"
                     class="h-5 w-5 flex-shrink-0 rounded bg-neutral-800/50 object-cover"
                     onerror="this.style.visibility='hidden'">`
            : host === "github.com"
            ? `<div class="h-5 w-5 flex-shrink-0" aria-hidden="true"></div>`
            : `<img src="${escapeAttr(
                `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
              )}" alt=""
                     loading="lazy" width="20" height="20"
                     class="h-5 w-5 flex-shrink-0 rounded bg-neutral-800/50"
                     onerror="this.style.visibility='hidden'">`;
        const linkFavicons = Array.isArray(tool.links) && tool.links.length
          ? `<div class="flex items-center gap-2">${[...tool.links]
              .sort(compareLinks)
              .map((link) => {
                const linkHost = getHost(link);
                const linkIcon = isGitHubHost(linkHost)
                  ? githubIconSvg()
                  : `<img src="${escapeAttr(getFaviconUrl(linkHost))}" alt=""
                       loading="lazy" width="16" height="16"
                       class="h-4 w-4 rounded-sm"
                       onerror="this.parentElement.style.display='none'">`;
                return `<a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer"
                    class="inline-flex h-7 w-7 items-center justify-center rounded border border-neutral-800 bg-neutral-900/60 text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-50"
                    title="${escapeAttr(linkHost)}" aria-label="${escapeAttr(linkHost)}">
                  ${linkIcon}
                </a>`;
              })
              .join("")}</div>`
          : `<span class="text-neutral-600">—</span>`;
        return `
          <tr class="transition hover:bg-neutral-900/40">
            <td class="px-6 py-4 font-medium text-neutral-100">
              <div class="flex items-center gap-3">
                ${faviconHtml}
                <span>${escapeHtml(tool.name)}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <a href="${escapeAttr(tool.url)}" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-neutral-100">
                ${escapeHtml(host)}
                <svg class="h-3.5 w-3.5 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M11 3a1 1 0 1 0 0 2h2.586l-6.293 6.293a1 1 0 1 0 1.414 1.414L15 6.414V9a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-5z"/>
                  <path d="M5 5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3a1 1 0 1 0-2 0v3H5V7h3a1 1 0 0 0 0-2H5z"/>
                </svg>
              </a>
            </td>
            <td class="px-6 py-4">${linkFavicons}</td>
            <td class="px-6 py-4 max-w-md text-neutral-400">${
              tool.details ? escapeHtml(tool.details) : `<span class="text-neutral-600">—</span>`
            }</td>
            <td class="px-6 py-4 text-neutral-400">${
              tool.price ? escapeHtml(tool.price) : `<span class="text-neutral-600">—</span>`
            }</td>
            <td class="px-6 py-4 text-right">${stars}</td>
            <td class="px-6 py-4 text-right">${badge}</td>
          </tr>
        `;
      })
      .join("");
  };

  sortSelect.addEventListener("change", render);
  render();

  showLastUpdated();

  async function showLastUpdated() {
    const el = document.getElementById("last-updated");
    if (!el) return;
    try {
      const res = await fetch(
        "https://api.github.com/repos/manuelmeurer/agentmgmt/commits?path=dist/tools.yml&per_page=1",
      );
      if (!res.ok) return;
      const commits = await res.json();
      const date = commits?.[0]?.commit?.committer?.date;
      if (!date) return;
      const days = Math.floor((Date.now() - new Date(date)) / 86_400_000);
      const phrase =
        days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
      el.textContent = `Last updated ${phrase}`;
    } catch {
      // ignore
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }
  function escapeAttr(s) {
    return escapeHtml(s);
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
  function githubIconSvg() {
    return `<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>`;
  }
  function compareLinks(a, b) {
    return getHost(a).localeCompare(getHost(b)) || a.localeCompare(b);
  }
})();
