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
- Pages: `index.html`, `about.html`, `experience.html`, `skills.html`, `contact.html`, `home.html`
- Blog articles live in `blog/` and reference `../styles.css`
- All portfolio pages share `styles.css` and `script.js` from the root
- External dependencies loaded via CDN: Google Fonts (Inter), Font Awesome 6.4.0

**Self-contained mini-apps (each has its own `index.html`, `script.js`, `style.css`):**
- `maths-baxter/` — Year 6 Australian curriculum maths practice for Baxter (timed 15-min sessions, randomised question generators per skill category)
- `maths-hudson/` — More advanced maths practice for Hudson (algebra, geometry, statistics, composite shapes)
- `biology/` — Multiple-choice quiz on nervous and endocrine systems

These mini-apps are intentionally excluded from Copilot suggestions (`.copilotignore`) and should be treated as isolated projects with no shared code.

## Key style files

- `styles.css` — Active stylesheet for the portfolio site (glassmorphism / dark theme)
- `styles-backup.css`, `styles-modern.css` — Historical backups; not in use
- `assets/css/main.css` — Leftover from an old HTML5 UP "Dimension" template; not used by current pages

## Deployment

Push to `master` — GitHub Pages publishes automatically. The CNAME file maps the domain to `kellock.com.au`.
