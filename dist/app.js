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
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-red-400">Failed to load data: ${escapeHtml(
      err.message,
    )}</td></tr>`;
    return;
  }

  const formatStars = (n) => (n < 1000 ? `~${n}` : `${n / 1000}k`);

  const repoFirst = (a, b) =>
    !!b.github_repo - !!a.github_repo;

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
        const starsNumber = tool.github_repo
          ? `<span class="font-mono tabular-nums text-neutral-200">${formatStars(
              tool.github_stars || 0,
            )}</span>`
          : `<span class="text-neutral-600">—</span>`;
        const stars = tool.github_repo
          ? `<a href="https://github.com/${escapeAttr(tool.github_repo)}"
                target="_blank" rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-neutral-400 transition hover:text-neutral-100">
              ${starsNumber}
              ${externalLinkSvg}
            </a>`
          : starsNumber;
        const badge = tool.opensource
          ? `<span class="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">Open source</span>`
          : `<span class="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800/50 px-2.5 py-0.5 text-xs font-medium text-neutral-400">Proprietary</span>`;
        const faviconHtml =
          host === "github.com"
            ? `<div class="h-5 w-5 flex-shrink-0" aria-hidden="true"></div>`
            : `<img src="${escapeAttr(
                `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`,
              )}" alt=""
                     loading="lazy" width="20" height="20"
                     class="h-5 w-5 flex-shrink-0 rounded bg-neutral-800/50"
                     onerror="this.style.visibility='hidden'">`;
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
})();
