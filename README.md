# Agent MGMT

The independent guide to agent orchestrators — a community-maintained list of agentic IDEs and AI coding tools.

Live at [agentmgmt.dev](https://agentmgmt.dev).

## Adding a tool

Edit [`src/tools.yml`](src/tools.yml) and open a PR. Each entry looks like:

```yaml
- name: Tool Name
  url: https://example.com/
  links:
    - https://github.com/owner/name # optional, enables auto star updates
  details: One-line description (optional).
  price: Free | Freemium | Paid (optional)
  github_stars: 0              # populated by the daily workflow
  opensource: true             # or false
  os: [macos, linux, windows, web]   # any subset; use "web" for cloud-only tools
```

Fields with no value can be left blank (e.g. `details:`).

## Stack

- Static HTML / JS / Tailwind (CDN), served by Cloudflare Workers static assets.
- Source lives under [`src/`](src/); [`scripts/build.mjs`](scripts/build.mjs) generates [`dist/`](dist/) (committed). Data source is [`src/tools.yml`](src/tools.yml), parsed at build time via [js-yaml](https://github.com/nodeca/js-yaml).
- Rows are pre-rendered into `dist/index.html` so the page has content before JS runs. The shared renderer is [`src/render-tools.mjs`](src/render-tools.mjs); the browser imports it for live re-sorting using tools embedded as JSON.
- Tool favicons are fetched from DuckDuckGo's icon proxy.
- Last-updated timestamp comes from `git log` on `src/tools.yml` at build time.

## Local dev

```sh
npm install
npm run dev      # build, watch src/, run wrangler dev
npm run build    # one-shot build
```

## Deploy

```sh
npm run deploy   # build, then wrangler deploy
```

Configuration: [`wrangler.jsonc`](wrangler.jsonc).

## Daily star refresh

[`.github/workflows/update-stars.yml`](.github/workflows/update-stars.yml) runs once a day, calls the GitHub API for each entry's GitHub URL in `links`, rebuilds `dist/`, and opens an auto-merging PR via [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request). The script is at [`scripts/update-stars.mjs`](scripts/update-stars.mjs).

## License & intent

This is a personal project with no monetization. The goal is a useful, neutral community resource. Contributions and corrections welcome.
