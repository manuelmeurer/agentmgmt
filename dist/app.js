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
  function renderOs(os) {
    const supported = new Set(Array.isArray(os) ? os : []);
    const platforms = [
      { value: "web", label: "Web" },
      { value: "macos", label: "macOS" },
      { value: "windows", label: "Windows" },
      { value: "linux", label: "Linux" },
      { value: "android", label: "Android" },
      { value: "ios", label: "iOS" },
    ];
    return `<div class="flex items-center gap-2 text-neutral-200">${platforms
      .map(({ value, label }) => {
        const active = supported.has(value);
        const stateClass = active ? "opacity-100" : "opacity-20";
        const stateLabel = active ? label : `${label} (not supported)`;
        return `<span class="${stateClass} transition" title="${escapeAttr(stateLabel)}" aria-label="${escapeAttr(stateLabel)}">${platformIconSvg(value)}</span>`;
      })
      .join("")}</div>`;
  }
  function platformIconSvg(name) {
    switch (name) {
      case "web":
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
      case "macos":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>`;
      case "windows":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623"/></svg>`;
      case "linux":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.216.399.293.2.523.269 1.052.468h.003c.255.136.405.266.478.399v-.131a.571.571 0 01.016.47c-.123.31-.516.643-1.063.842v.002c-.268.135-.501.333-.775.465-.276.135-.588.292-1.012.267a1.139 1.139 0 01-.448-.067 3.566 3.566 0 01-.322-.198c-.195-.135-.363-.332-.612-.465v-.005h-.005c-.4-.246-.616-.512-.686-.71-.07-.268-.005-.47.193-.6.224-.135.38-.271.483-.336.104-.074.143-.102.176-.131h.002v-.003c.169-.202.436-.47.839-.601.139-.036.294-.065.466-.065zm2.8 2.142c.358 1.417 1.196 3.475 1.735 4.473.286.534.855 1.659 1.102 3.024.156-.005.33.018.513.064.646-1.671-.546-3.467-1.089-3.966-.22-.2-.232-.335-.123-.335.59.534 1.365 1.572 1.646 2.757.13.535.16 1.104.021 1.67.067.028.135.06.205.067 1.032.534 1.413.938 1.23 1.537v-.043c-.06-.003-.12 0-.18 0h-.016c.151-.467-.182-.825-1.065-1.224-.915-.4-1.646-.336-1.77.465-.008.043-.013.066-.018.135-.068.023-.139.053-.209.064-.43.268-.662.669-.793 1.187-.13.533-.17 1.156-.205 1.869v.003c-.02.334-.17.838-.319 1.35-1.5 1.072-3.58 1.538-5.348.334a2.645 2.645 0 00-.402-.533 1.45 1.45 0 00-.275-.333c.182 0 .338-.03.465-.067a.615.615 0 00.314-.334c.108-.267 0-.697-.345-1.163-.345-.467-.931-.995-1.788-1.521-.63-.4-.986-.87-1.15-1.396-.165-.534-.143-1.085-.015-1.645.245-1.07.873-2.11 1.274-2.763.107-.065.037.135-.408.974-.396.751-1.14 2.497-.122 3.854a8.123 8.123 0 01.647-2.876c.564-1.278 1.743-3.504 1.836-5.268.048.036.217.135.289.202.218.133.38.333.59.465.21.201.477.335.876.335.039.003.075.006.11.006.412 0 .73-.134.997-.268.29-.134.52-.334.74-.4h.005c.467-.135.835-.402 1.044-.7zm2.185 8.958c.037.6.343 1.245.882 1.377.588.134 1.434-.333 1.791-.765l.211-.01c.315-.007.577.01.847.268l.003.003c.208.199.305.53.391.876.085.4.154.78.409 1.066.486.527.645.906.636 1.14l.003-.007v.018l-.003-.012c-.015.262-.185.396-.498.595-.63.401-1.746.712-2.457 1.57-.618.737-1.37 1.14-2.036 1.191-.664.053-1.237-.2-1.574-.898l-.005-.003c-.21-.4-.12-1.025.056-1.69.176-.668.428-1.344.463-1.897.037-.714.076-1.335.195-1.814.12-.465.308-.797.641-.984l.045-.022zm-10.814.049h.01c.053 0 .105.005.157.014.376.055.706.333 1.023.752l.91 1.664.003.003c.243.533.754 1.064 1.189 1.637.434.598.77 1.131.729 1.57v.006c-.057.744-.48 1.148-1.125 1.294-.645.135-1.52.002-2.395-.464-.968-.536-2.118-.469-2.857-.602-.369-.066-.61-.2-.723-.4-.11-.2-.113-.602.123-1.23v-.004l.002-.003c.117-.334.03-.752-.027-1.118-.055-.401-.083-.71.043-.94.16-.334.396-.4.69-.533.294-.135.64-.202.915-.47h.002v-.002c.256-.268.445-.601.668-.838.19-.201.38-.336.663-.336zm7.159-9.074c-.435.201-.945.535-1.488.535-.542 0-.97-.267-1.28-.466-.154-.134-.28-.268-.373-.335-.164-.134-.144-.333-.074-.333.109.016.129.134.199.2.096.066.215.2.36.333.292.2.68.467 1.167.467.485 0 1.053-.267 1.398-.466.195-.135.445-.334.648-.467.156-.136.149-.267.279-.267.128.016.034.134-.147.332a8.097 8.097 0 01-.69.468zm-1.082-1.583V5.64c-.006-.02.013-.042.029-.05.074-.043.18-.027.26.004.063 0 .16.067.15.135-.006.049-.085.066-.135.066-.055 0-.092-.043-.141-.068-.052-.018-.146-.008-.163-.065zm-.551 0c-.02.058-.113.049-.166.066-.047.025-.086.068-.14.068-.05 0-.13-.02-.136-.068-.01-.066.088-.133.15-.133.08-.031.184-.047.259-.005.019.009.036.03.03.05v.02h.003z"/></svg>`;
      case "android":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z"/></svg>`;
      case "ios":
        return `<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M1.1 6.05C.486 6.05 0 6.53 0 7.13A1.08 1.08 0 0 0 1.1 8.21C1.72 8.21 2.21 7.73 2.21 7.13C2.21 6.53 1.72 6.05 1.1 6.05M8.71 6.07C5.35 6.07 3.25 8.36 3.25 12C3.25 15.67 5.35 17.95 8.71 17.95C12.05 17.95 14.16 15.67 14.16 12C14.16 8.36 12.05 6.07 8.71 6.07M19.55 6.07C17.05 6.07 15.27 7.45 15.27 9.5C15.27 11.13 16.28 12.15 18.4 12.64L19.89 13C21.34 13.33 21.93 13.81 21.93 14.64C21.93 15.6 20.96 16.28 19.58 16.28C18.17 16.28 17.11 15.59 17 14.53H15C15.08 16.65 16.82 17.95 19.46 17.95C22.25 17.95 24 16.58 24 14.4C24 12.69 23 11.72 20.68 11.19L19.35 10.89C17.94 10.55 17.36 10.1 17.36 9.34C17.36 8.38 18.24 7.74 19.54 7.74C20.85 7.74 21.75 8.39 21.85 9.46H23.81C23.76 7.44 22.09 6.07 19.55 6.07M8.71 7.82C10.75 7.82 12.06 9.45 12.06 12C12.06 14.57 10.75 16.2 8.71 16.2C6.65 16.2 5.35 14.57 5.35 12C5.35 9.45 6.65 7.82 8.71 7.82M.111 9.31V17.76H2.1V9.31H.11Z"/></svg>`;
    }
    return "";
  }
})();
