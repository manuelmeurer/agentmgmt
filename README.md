# Agent MGMT

The independent guide to agent orchestrators — a community-maintained list of agentic IDEs and AI coding tools.

Live at [agentmgmt.dev](https://agentmgmt.dev).

## Adding a tool

Edit [`dist/tools.yml`](dist/tools.yml) and open a PR. Each entry looks like:

```yaml
- name: Tool Name
  url: https://example.com/
  links:
    - https://github.com/owner/name # optional, enables auto star updates
  details: One-line description (optional).
  price: Free | Freemium | Paid (optional)
  github_stars: 0              # populated by the daily workflow
  opensource: true             # or false
```

Fields with no value can be left blank (e.g. `details:`).

## Stack

- Static HTML / JS / Tailwind (CDN), served by Cloudflare Workers static assets.
- Data lives in [`dist/tools.yml`](dist/tools.yml), parsed client-side via [js-yaml](https://github.com/nodeca/js-yaml).
- Tool favicons are fetched from DuckDuckGo's icon proxy.
- Last-updated timestamp is pulled from the GitHub commits API at page load.

## Local dev

```sh
npm install
npm run dev      # wrangler dev
```

## Deploy

```sh
npm run deploy
```

Configuration: [`wrangler.jsonc`](wrangler.jsonc).

## Daily star refresh

[`.github/workflows/update-stars.yml`](.github/workflows/update-stars.yml) runs once a day, calls the GitHub API for each entry's GitHub URL in `links`, and opens an auto-merging PR via [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request). The script is at [`scripts/update-stars.mjs`](scripts/update-stars.mjs).

## License & intent

This is a personal project with no monetization. The goal is a useful, neutral community resource. Contributions and corrections welcome.
