# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Site overview

Personal portfolio site for Matt Kellock, hosted on GitHub Pages at kellock.com.au. No build pipeline: all HTML, CSS, and JS are deployed directly on push to `master`. The only build step is a local generator for SEO pages whose output is committed (see Generated pages below).

## Local development

Serve the repo root (paths are root-absolute, so opening files over `file://` will not work):

```bash
python3 -m http.server 8080
```

There are no tests, no linting config, and no package manager.

## Architecture

The repo contains two distinct areas:

**Portfolio site (root):**
- Single page app: `index.html`, rendered by `support.js` (design runtime; loads React 18 and Babel standalone from unpkg) with `tech-bg.js` (animated background)
- Views and URLs: Home `/`, Writing index `/writing/` (headed "Talks & writing"), individual talks and articles `/writing/<post-id>/`, About `/about/` (background, experience, governance, skills, contact). Routing uses real paths via `history.pushState`; legacy hash links (`#speaking`, `#about`, `#experience`, `#contact`, `#<post-id>`) redirect to the new paths
- All content lives in the `<script type="text/x-dc">` block at the bottom of `index.html`: `POSTS`, `FOCUS`, `BIO`, `JOBS`, `CREDENTIALS`, `SKILLS`, `SOCIALS`. Add new talks or articles to the top of `POSTS` (body is a list of P/H/Q blocks; `type` is `Talk` or `Article`)
- All internal links and asset paths must be root-absolute (`/images/...`, `/about/`) because the same template is served from nested folders
- Images: `images/portrait.jpg` (on page), `images/profile.jpg` (social preview and apple-touch-icon); `favicon.svg`
- External dependencies via CDN: Google Fonts (Inter, JetBrains Mono), Font Awesome 6.7.2, React/Babel (unpkg)
- Content rules: the current employer is not named on the site (described as a global payroll and HR technology company); no em dashes

**Generated pages (SEO):**
- `scripts/build.mjs` (plain Node, no dependencies) copies `index.html` into `about/index.html`, `writing/index.html`, `writing/<post-id>/index.html` and `404.html`, rewriting the head between the `<!-- seo:start -->`/`<!-- seo:end -->` and `<!-- seo-ld:... -->` markers (title, description, canonical, Open Graph, JSON-LD) and adding a `<noscript>` copy of the content. It also writes `sitemap.xml` and removes pages for deleted posts
- **After any change to `index.html` (content or design), run `node scripts/build.mjs` and commit the generated files**, otherwise the nested pages go stale. Never edit generated files directly
- At runtime `setTitle()` keeps title, description, canonical and `og:*` in step with the generated heads during client-side navigation
- `robots.txt` points to the sitemap and disallows the mini-apps; `_config.yml` excludes `scripts/` and `CLAUDE.md` from the published site

**Self-contained mini-apps (each has its own `index.html`, `script.js`, `style.css`):**
- `maths-baxter/`, `maths-hudson/`, `biology/`, `times-tables/`
- These mini-apps are intentionally excluded from Copilot suggestions (`.copilotignore`) and should be treated as isolated projects with no shared code.

## Deployment

Push to `master` — GitHub Pages publishes automatically. The CNAME file maps the domain to `kellock.com.au`.
