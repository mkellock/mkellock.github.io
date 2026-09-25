# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Site overview

Personal portfolio site for Matt Kellock, hosted on GitHub Pages at kellock.com.au. No build system — all HTML, CSS, and JS are deployed directly on push to `master`.

## Local development

Open any `.html` file directly in a browser, or use a local server to avoid CORS issues:

```bash
python3 -m http.server 8080
```

There are no tests, no linting config, and no package manager.

## Architecture

The repo contains two distinct areas:

**Portfolio site (root):**
- Single page app: `index.html`, rendered by `support.js` (design runtime; loads React 18 and Babel standalone from unpkg) with `tech-bg.js` (animated background)
- Views: Home, Speaking & writing (index), individual talk/article pages, About (background, experience, governance, skills, contact). Routing is hash based: `#speaking`, `#about`, `#<post-id>`; legacy `#experience`/`#contact` redirect to About
- All content lives in the `<script type="text/x-dc">` block at the bottom of `index.html`: `POSTS`, `STATS`, `FOCUS`, `BIO`, `JOBS`, `CREDENTIALS`, `SKILLS`, `SOCIALS`. Add new talks or articles to the top of `POSTS` (body is a list of P/H/Q blocks)
- Images: `images/portrait.jpg` (on page), `images/profile.jpg` (social preview)
- External dependencies via CDN: Google Fonts (Inter, JetBrains Mono), Font Awesome 6.7.2, React/Babel (unpkg)
- Content rules: the current employer is not named on the site (described as a global payroll and HR technology company); no em dashes

**Self-contained mini-apps (each has its own `index.html`, `script.js`, `style.css`):**
- `maths-baxter/`, `maths-hudson/`, `biology/`, `times-tables/`
- These mini-apps are intentionally excluded from Copilot suggestions (`.copilotignore`) and should be treated as isolated projects with no shared code.

## Deployment

Push to `master` — GitHub Pages publishes automatically. The CNAME file maps the domain to `kellock.com.au`.
