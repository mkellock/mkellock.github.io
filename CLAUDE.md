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
- Single page app: `index.html`, rendered by `support.js` (design runtime; loads React 18.3.1 and ReactDOM from `/lib/` through the `window.__resources` map set in the head, which also stops the runtime refetching the page; the files are the same bytes as the unpkg builds and match the SRI hashes in `support.js`) with `tech-bg.js` (animated background). Both scripts load with `defer`; the build rewrites their `src` with a content hash (`?v=`) so Cloudflare's cache misses on change. The app decides play or pause: the reader's saved choice from the header button (`localStorage` `mk-bg-paused`), otherwise paused when the device asks for reduced motion or has a coarse pointer (phones and tablets); pausing also stops the current-role blink and smooth scrolling; `tech-bg` just obeys its `paused` attribute and keeps a still frame when paused. Theme works the same way (`mk-theme`, else the device's light/dark setting)
- Views and URLs: Home `/`, Writing index `/writing/` (headed "Talks & writing"), individual talks and articles `/writing/<post-id>/`, About `/about/` (background, `#boards`, `#experience`, governance, skills, `#speaking`, `#contact`). An unknown path shows the not-found view (and `404.html` carries no canonical). Routing uses real paths via `history.pushState`; legacy hash links (`#about`, `#experience`, `#contact`, `#speaking`, `#talks`, `#boards`, `#<post-id>`) redirect to the new paths or About sections
- Most content lives in the `<script type="text/x-dc">` block at the bottom of `index.html`: `POSTS`, `FOCUS`, `BIO`, `JOBS`, `CREDENTIALS`, `SKILLS`, `SOCIALS`, `BOARD`, `SPEAKING`, plus `HEADLINE`, `TAGLINE`, `HOME_ABOUT`, `HOME_TITLE`, `HOME_DESC`, `WRITING_TITLE`, `WRITING_DESC`, `WRITING_INTRO`, `ABOUT_TITLE`, `ABOUT_DESC`, `ABOUT_TAGLINE`, `ABOUT_UPDATED` (bump when About content changes; it is the About `lastmod`), `CONTACT_NOTE`, `PRIVACY_NOTE`. The build reads all of them and emits the WebSite and Person JSON-LD (portrait, credentials, `knowsAbout`) into every page's `<!-- seo-ld -->` block, index.html included; the Person node itself is defined in `scripts/build.mjs` (`personNode`). Some biographical text is hard-coded: in the `<x-dc>` template (hero eyebrow, article byline `AACS CP · Melbourne`, About eyebrow, footer), the site card eyebrow in `scripts/build.mjs`, the post card footer in `scripts/card-template.html` (editing it re-renders every card) and the `site.webmanifest` description. When changing details, `grep -rn 'AACS\|Melbourne' index.html scripts/ site.webmanifest`. To add talks or articles, follow "Adding a new article or talk" below
- Markdown articles live in `posts/<id>.md` and diagrams in `posts/<name>.diagram.html`; see "Adding a new article or talk" for the supported Markdown subset, images, light/dark variants and diagram rendering
- All internal links and asset paths must be root-absolute (`/images/...`, `/about/`) because the same template is served from nested folders
- Images: `images/portrait.jpg` (on page, on share cards, the Person JSON-LD image and the fallback share image if a card can't be rendered; it is hashed into every card name, so a larger headshot goes in as a new file), `images/writing/` (article figures), `images/cards/` (generated share cards); `favicon.svg`. Icons are an inline SVG sprite after `</x-dc>` in `index.html` (Font Awesome Free 6.7.2 symbols `#icon-<name>`); the template references them as `<svg class="mk-icon"><use sc-camel-xlink-href="{{ x }}">` (the camelCase encoding keeps the hidden raw template from fetching `{{ }}` as a URL) and data values are `'#icon-<name>'`
- External dependencies: Google Fonts (Inter with italic, JetBrains Mono; preconnected in the head), and Google Analytics (gtag.js `G-1Q0FD5LT9M`, which also verifies Search Console; share, copy, native share and print actions send a `share` event with `method`). React is served from `/lib/` (see above); no other third-party script
- Content rules: the current employer is not named on the site (described as a global payroll and HR technology company); no em dashes

**Generated pages (SEO):**
- `scripts/build.mjs` (plain Node, no dependencies) copies `index.html` into `about/index.html`, `writing/index.html`, `writing/<post-id>/index.html` and `404.html`, rewriting the head between the `<!-- seo:start -->`/`<!-- seo:end -->` and `<!-- seo-ld:... -->` markers (title, description, canonical, Open Graph, JSON-LD) and adding a `<noscript>` copy of the content. Markdown posts also get `writing/<id>/body.html`, which the app fetches when the article is opened from another page (on a direct load it reads the `noscript#mk-body-<id>` copy instead). Each page's no-JavaScript copy goes in the `<!-- noscript:start -->`/`<!-- noscript:end -->` slot at the top of `<body>` (styled by a `<noscript><style>` in the head); the home page's copy is regenerated inside `index.html` too. It also writes `sitemap.xml` and removes pages for deleted posts
- The build also regenerates the marked `<!-- seo:start -->` head block inside `index.html` itself (home page title, description, Open Graph and share image), so edit `HOME_TITLE`/`HOME_DESC` in the logic block, not that head block
- Share cards: each post without its own `image` gets a 1200×630 card (1× PNG, three-line dek) at `images/cards/<id>-<hash>.png`; home, Writing, About and 404 share `images/cards/site-<hash>.png` (from `HEADLINE`/`TAGLINE`). Cards are rendered from `scripts/card-template.html` with headless Chrome (`CHROME_PATH`, default the macOS app; `CHROME_FLAGS` adds flags such as `--no-sandbox --ignore-certificate-errors`), or through Playwright when `PLAYWRIGHT_MODULE` points at an installed `playwright` package (Chrome's `--screenshot` clips the page in some Linux builds). The hash covers the card text, template and portrait, so a change produces a new filename (social caches refresh) and stale cards are deleted. Never edit `images/cards/` by hand. Without Chrome (or if a render fails) the build still succeeds: it reuses the first existing card whose name starts with `<id>-` (possibly stale), otherwise falls back to `images/portrait.jpg`, and prints a `warning:` line; rebuild with Chrome before committing
- App icons (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) come from `scripts/icon-template.html`; delete one to re-render it (needs Chrome). `site.webmanifest` lists the 192 and 512 icons; the head links `apple-touch-icon.png`
- `feed.xml` is an RSS 2.0 feed with each post's full content (absolute URLs); `sitemap.xml` includes each page's share image
- Optional per-post `updated: 'YYYY-MM-DD'` sets the modified date (`article:modified_time`, `og:updated_time`, JSON-LD `dateModified`, the post's sitemap `lastmod`, and the feed's `lastBuildDate` when it is the newest date). It does not change the visible date or the feed item's `pubDate`. Times are published as 09:00 Melbourne time with the correct offset
- **After any change to `index.html` (content or design) or `posts/`, run `node scripts/build.mjs` and commit the generated files**, otherwise the nested pages go stale. Never edit generated files directly
- At runtime `setTitle()` (on first load, except 404, and on every client-side navigation) updates only `document.title`, the meta description, canonical, `og:url`, `og:title` (set to the page title with " · Matt Kellock", which differs from the generated one) and `og:description`; `og:image`, `twitter:*` and JSON-LD stay as loaded. Check share metadata in the generated file or with `curl`, never in the live DOM
- Markdown posts with four or more `##` sections (excluding References) get a Contents list in `body.html` and the static copy (not the feed); every `##`/`###` heading carries a `#` section link; reading time is published as `<script type="application/json" id="mk-read">` in every head and shown in the article meta row, the Writing list and the Latest card; the feed carries an `enclosure` and `media:content` per item
- `robots.txt` points to the sitemap, disallows `writing/*/body.html` and the mini-apps for everyone, and blocks training-only AI crawlers (GPTBot, ClaudeBot, CCBot, Bytespider, Google-Extended) while allowing AI search crawlers; `.well-known/security.txt` (RFC 9116) expires each September and must be refreshed; `_config.yml` excludes `scripts/`, `posts/` and `CLAUDE.md` from the published site

**Self-contained mini-apps (each has its own `index.html`, `script.js`, `style.css`):**
- `maths-baxter/`, `maths-hudson/`, `biology/`, `times-tables/`
- These mini-apps are intentionally excluded from Copilot suggestions (`.copilotignore`) and should be treated as isolated projects with no shared code.

## Adding a new article or talk

Work through these in order. The build stops only on a missing or malformed `dt`, a missing file (`posts/<id>.md`, an `image`) or a syntax error in the logic block; everything else publishes silently, so the checks in step 9 matter.

### 1. Content rules
- Australian English, first person, plain and direct. Never name the current employer (say "a global payroll and HR technology company").
- No em dashes anywhere, including alt text and diagram labels (en dashes are fine for ranges). Before building, `grep -rn '—' index.html posts/` must print nothing; after building, `grep -arln '—' writing/ about/ 404.html feed.xml` must print nothing (this catches em dashes written as `\u2014` escapes in `POSTS` strings; `-a` stops grep skipping files that contain NULs).
- Cite every quote, figure and claim with a numbered footnote to a primary source where one exists (Markdown posts only; for an inline-body talk put sources in `links` or switch it to `md: true`).
- Spell out organisations and any acronym readers may not know on first use, e.g. "multi-factor authentication (MFA)", "Australian Signals Directorate (ASD)". Common technical ones (AI, API, DNS, IP, TLS, URL, VPN) can stand.
- The `researched-blog-post` skill, if installed, writes citations and the opening italic line in this format. Before pasting its draft, move its headline and subtitle into `title` and `dek`, and remake any diagram to step 6 (it defaults to a white SVG).

### 2. Choose the id (permanent)
- The id is the URL (`/writing/<id>/`), the Markdown file name, the prefix of every heading and footnote anchor, and the share card's file name. **Never change it after publishing**: there are no redirects, so old links fall through to `404.html` (the home view) and every anchor breaks.
- Lowercase `a-z`, `0-9` and hyphens, short and descriptive, unique. No id may be a hyphen-prefix of another in either direction (a new `private` would pick up the `private-by-default-playbook-*` card; for a follow-up use a new stem, not `<old-id>-2`).
- Not `site` or `site-…` (the home, Writing and About share card), `about`, `writing`, `main` (the skip-link target), or a legacy hash name (`experience`, `contact`, `certifications`, `speaking`, `talks`).

### 3. Add the `POSTS` entry (`index.html` logic block)
Keep `POSTS` newest first by `dt`: new posts at the top, back-dated ones in place. Order sets the home "Latest" card and the three rows under it, the Writing list, each article's "Next" card (it cycles), the feed order and the `lastmod` of `/` and `/writing/`. For a same-day pair, put the main piece first and its companion second. There is no draft or scheduling: a post is live as soon as it is pushed.

| Field | Required | Format and effect |
|---|---|---|
| `id` | yes | See step 2 |
| `type` | yes | `'Article'` or `'Talk'` exactly. Badges, card eyebrow, JSON-LD `genre`, and the unfurl label (`Event` for talks) |
| `tag` | yes | One category string; reuse one (currently `'Security'`). The badge at the foot of the article, the `venue · tag` line in the Writing list, `article:section`, one `article:tag`, JSON-LD `articleSection` and `keywords` (`"<tag>, <type>"`), and the RSS `<category>`. If missing, `article:section`, `article:tag` and `<category>` read "undefined", JSON-LD `keywords` becomes ", Article" and the badge is empty |
| `date` | yes | Display date, `'4 Oct 2026'` (D Mon YYYY). Also on the share card |
| `dt` | yes | `'2026-10-04'`, zero-padded, the same day as `date` (nothing checks). Metadata uses 09:00 Melbourne time with the right offset |
| `title` | yes | Plain text. The h1, `og:title`, card title, the headline in list rows and the Latest and Next cards, and the X/Bluesky share text; `<title>` adds " · Matt Kellock", so aim for 45 characters or fewer |
| `dek` | yes | One plain sentence: meta description, `og:description`, RSS description, the standfirst and the card text. Aim for 100 to 115 characters (the card clamps it to two lines, roughly 115 to 130 characters depending on word breaks); search shows about 155 |
| `md` | one of | `true` reads the body from `posts/<id>.md`. Needed for links, emphasis, lists, figures or footnotes |
| `body` | one of | `[P('…'), H('…'), Q('…')]` plain-text blocks, for short talk write-ups; no links, formatting or heading ids |
| `venue` | talks | Event name, shown after the date and in the card eyebrow. Always set it for talks (otherwise the Event unfurl row reads "Matt Kellock"). Keep type · date · venue under about 60 characters or the eyebrow is cut |
| `links` | no | `[{ label, source, href }]`, all three set, for external coverage (agenda, recording, LinkedIn posts). An "Elsewhere" list opening in a new tab, also JSON-LD `citation`. Not for internal links |
| `image`, `imageAlt` | no | Custom share image: root-absolute path to a committed PNG or JPEG, `'/images/writing/<name>.png'`, 1200×630 (2× is fine), with alt text. A missing file stops the build; a path without the leading `/` gives a broken URL. Omit both for an auto card |
| `updated` | no | `'YYYY-MM-DD'` when revising (step 11). The build throws if the post's `*Last updated D Month YYYY*` line disagrees with `updated || dt` |
| `searchTitle` | no | Used for the `<title>` only (search results); the h1, `og:title` and cards keep `title` |
| `audience` | no | `'For directors and executives'`, `'For technology leaders'` or `'For engineers'`: shown in the list row, the article meta row and the static copy, and emitted as JSON-LD `audience` |
| `series` | no | Series name (`'Private by default'`); emitted as `isPartOf` CreativeWorkSeries |
| `related` | no | The post id the Next card prefers (labelled "Companion"); the static header links it. The build throws on an unknown id |

**Keywords and search.** There is no keywords field (Google ignores meta keywords anyway) and a post has one `tag`; multi-tag, keyword or tag-page support needs a build and template change. Put the phrase a reader would search for in the title, the dek and the opening paragraph, and use specific terms in `##` headings.

### 4. Write the body (`posts/<id>.md`)
`scripts/markdown.mjs` supports a small subset; anything else shows as literal text or is silently misparsed.
- Don't repeat the title (the h1 comes from `POSTS`). Start with `*Last updated D Month YYYY. Views are my own, not my employer's.*`, then a `> **In short:** …` callout (required: it is the summary readers and search snippets use), then prose. The first paragraph's italics render upright with a left rule.
- Headings: `##` sections and `###` subsections only (`#` also becomes h2; `####`+ are unstyled). Each heading must give a unique id: the id is `<id>-` plus the text lowercased, with `&`, `<`, `>` and `"` dropped and every other run of characters outside `a-z0-9` turned into `-` (`Q&A` gives `qa`, `Résumé` gives `r-sum`), so headings differing only in punctuation or accents collide, and `Fn 1`/`Ref 2` clash with footnote ids. No links, code or footnote refs in headings.
- One line per paragraph and per list item. A line starting with `# `, `- `, `* `, a number and `. ` (even `2026. `), `>`, `|`, `[^n]:`, a lone image, or only dashes starts a new block mid-paragraph.
- Emphasis `*italic*` and `**bold**` only (no underscores, no nesting). Inline `` `code` `` only: **no fenced or indented code blocks** (their lines are parsed as Markdown), and no raw HTML, entities, strikethrough, task lists, reference links, link titles or `<autolinks>`.
- Lists: one level, no blank lines between items; numbered lists always start at 1.
- Tables: flush left; header row, `|---|---|`, then rows (without the separator the first data row is silently dropped). Column 1 becomes the row header, so make it the label. On phones the rows stack and each value shows its column heading above it, so keep headings short. Prefer two or three columns. No `|` in cells. Introduce each table in the sentence before it (no captions).
- Callouts: every line starts with `>` (a bare `>` for blank lines), bold label first (`> **What we don't know yet**`). A `>` block whose first line opens with a bold run of 40 characters or fewer becomes `<div class="mk-callout" role="note">` (a `<blockquote>` in the feed); a longer bold opening, such as a bold pull quote, stays a quotation.
- Footnotes: `[^1]`, `[^2]` … in order of first use, after punctuation (`text.[^1]`). At the end: `---`, `## References`, then one definition per line with no blank lines between: `[^1]: Publisher, *Title*, date. https://url` (bare URL last, not in quotes). Every ref needs exactly one definition and every definition a ref; the step 9 anchor check catches misses. A reference cited more than once gets one back link per use (`-ref-n`, `-ref-n-2` …).
- Links: `[descriptive text](url)`, never "here". Link text is words, optionally with `` `code` ``; keep footnote refs and images out of it (a ref inside link text loses its own link). Emphasis goes outside: `**[text](/x)**`. Encode `(` `)` in URLs as `%28` `%29`. Bare URLs only in References.
- Avoid long unbroken strings (ARNs, hashes, long paths); they overflow on phones.

### 5. Linking between articles (Markdown posts)
- Link posts as `[Title](/writing/<id>/)`, root-absolute with the trailing slash. Only hrefs starting with `/` navigate in-app without a reload and become full URLs in the feed; relative links reload the page, and a bare `<id>/` 404s.
- Companions link both ways: the newer piece opens with `*Companion to [Title](/writing/<id>/). Last updated … Views are my own, not my employer's.*` and the other gets a "see the companion post, [Title](/writing/<id>/)" line near the end. Editing an older post means updating it (step 11).
- Link to a section as `[section name](#<id>-<heading-slug>)` within an article, or `[section name](/writing/<other-id>/#<other-id>-<heading-slug>)` across articles, copying the id from the built `writing/<id>/body.html`. The app scrolls to the section and moves focus there once the body has rendered, for in-app clicks, fresh loads, shared URLs and feed links alike. Still name the section in the link text.
- The "Next" card and home lists come from `POSTS` order automatically.

### 6. Images, diagrams and light/dark mode
- New visitors get the theme matching their device's light/dark setting (it follows live changes) until they use the header toggle, which is remembered in `localStorage` `mk-theme`. Expect roughly as many light-mode readers as dark. RSS always carries the dark image and the social preview is whatever `image` names (or the dark auto card), so design dark first, then check light.
- Each figure goes alone on an unindented line with blank lines around it: `![alt](/images/writing/<name>.png)`, with no title string. An image inside a sentence or list item is not a figure: it renders at full pixel width (sideways scroll on phones) with no border or light variant. Lowercase kebab-case filenames (GitHub Pages is case-sensitive, macOS is not).
- Light variant: `<name>-light.png` beside the dark file, `-light` immediately before the extension (versioned: `<name>-v2.png` and `<name>-v2-light.png`). The build emits both and CSS shows the one matching the theme; without it, light-mode readers see the dark image. The built `body.html` should contain `class="mk-img-light"`.
- To use a diagram as the post's social preview, set `image` to the dark PNG and `imageAlt`; this is not automatic.
- Diagrams: copy `posts/public-private-planes.diagram.html` and its `-light` twin (inline SVG, `viewBox="0 0 1200 630" width="2400" height="1260"`, full-size background rect). Light palette: background `#f4f4f1`, text `#0f0f0f`/`#333333`/`#595959`, accent `#6e5f00`, red `#c62828`; `#ffe600` only as a fill behind `#0f0f0f` text. From the repo root, while online (Google Fonts): `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=2400,1260 --virtual-time-budget=8000 --screenshot="$PWD/images/writing/<image>.png" "file://$PWD/posts/<source>.diagram.html"` (and again for `-light`). Check `sips -g pixelWidth -g pixelHeight -g hasAlpha` reports 2400, 1260, no alpha, then open the PNG: a missing source or font failure still produces a 2400×1260 image.
- Diagram accessibility: figures display at most about 0.63 of their SVG units on desktop (17 units is about 11px) and about a quarter on a phone (unreadable without zooming). Keep labels few and at 17 units or more (the template's 10 to 15 unit labels need enlarging), and make the alt text and prose carry everything the figure shows. Label every coloured element with text, not colour alone. Contrast at least 4.5:1 for text and 3:1 for meaningful lines: the template's dashed zone outlines (`#4a4a4a` dark, `#a8a8a0` light) are about 2:1, so when zones carry meaning use `#6a6a6a` or lighter on dark (3.4:1) and `#7a7a72` or darker on light (3.6:1 on the `#eaeae5` zone fill).
- Export opaque, static images only: transparent PNGs vanish against one theme, and animated GIFs can't be paused or respect reduced-motion settings.
- When an image changes, give it a new filename (bump `-vN` on both), update the Markdown and `image`, and delete the old files: platforms cache previews by image URL.

### 7. SEO and metadata
The build generates every per-post head tag from the `POSTS` fields: title, description, canonical, robots (`max-image-preview:large`), Open Graph and Twitter tags (image type and size are read from PNG/JPEG files), `article:*` times, section and tag, Slack "Reading time" and "Written by"/"Event" rows, JSON-LD `Article` and `BreadcrumbList`, the `<noscript>` copy and the sitemap entry. Never hand-edit them. Site-wide tags outside the `<!-- seo:start -->` markers (`twitter:card`, `og:site_name`, the WebSite/Person JSON-LD) are hand-maintained in `index.html` and copied to every page. For the home page, edit `HOME_TITLE`/`HOME_DESC` (and `HEADLINE`/`TAGLINE` for the site card), never the marked block.

### 8. RSS
`feed.xml` (RSS 2.0, linked from every page's head, the Writing page and the footer) is rebuilt with each post's full content: the dek as an italic first paragraph, the body with root-absolute and `#` links made absolute, the "Elsewhere" links, and dark images only. Nothing to add per post. Items carry only `pubDate` (`updated` moves just the channel's `lastBuildDate`), so an update doesn't mark the item as changed in feed readers. Validate after deploy: https://validator.w3.org/feed/check.cgi?url=https%3A%2F%2Fkellock.com.au%2Ffeed.xml

### 9. Build, check and commit
1. Run `node scripts/build.mjs` from the repo root, online, with Chrome (set `CHROME_PATH` if it isn't in /Applications; in a Linux sandbox add `CHROME_FLAGS="--no-sandbox --ignore-certificate-errors"` and `PLAYWRIGHT_MODULE=<path to playwright/index.js>`). It must end with `wrote sitemap.xml` and print no `warning:` line. For a post without a custom `image`, the first build after a new or changed title, dek, type, date or venue prints `rendered images/cards/<id>-<hash>.png`; a warning means Chrome failed and the post got `portrait.jpg` or a stale card. If it throws, fix and re-run; never commit after a failed run.
2. Check (drop `body.html` from the commands for inline-body talks, which have none):
   - `perl -ne 'print "$ARGV:$.\n" if /\x00/' writing/<id>/body.html feed.xml` prints nothing (run first), and `xmllint --noout feed.xml sitemap.xml` passes.
   - `grep -anE '"undefined"|>undefined<|\(undefined\)' writing/<id>/index.html feed.xml` prints nothing (the last pattern catches a `links` entry missing its `source`).
   - Open `images/cards/<id>-????????.png` (or the custom `image`): title fits, dek not badly cut, Inter/JetBrains Mono fonts (if not, delete it and rebuild online).
   - `grep -aE 'og:|twitter:|article:' writing/<id>/index.html`: `og:image` is `https://kellock.com.au/images/cards/<id>-….png` (or the `image` path), with type, width and height; times carry `+10:00` or `+11:00`.
   - Links to posts exist: `for h in $(grep -aoh 'href="/writing/[^"#]*' writing/*/body.html | sed 's/href="//' | sort -u); do [ -f ".${h%/}/index.html" ] || echo MISSING $h; done`
   - In-page anchors and footnotes resolve: `f=writing/<id>/body.html; for a in $(grep -ao 'href="#[^"]*' $f | sed 's/href="#//' | sort -u); do grep -aq "id=\"$a\"" $f || echo MISSING "#$a"; done`. No duplicate ids: `grep -ao 'id="[^"]*"' $f | sort | uniq -d`. No empty alt: `grep -n '!\[\]' posts/<id>.md`. All print nothing.
3. Preview with `python3 -m http.server 8080`: open the article directly and by clicking it from the home page (that path fetches `body.html`). Check both themes, 320px and desktop widths (no sideways scroll), 200% zoom, every link, footnote and back link, the Next card, Elsewhere and Copy link.
4. Accessibility pass: Tab from the top (skip link appears) through every link and button; headings form an h1, h2, h3 outline; every informative image has alt text and its meaning is also in the prose; no colour-only meaning; tables read as label and value on a phone.
5. Commit everything the build changed, including deletions: `git add -A -- . ':!.roam' ':!.playwright-mcp'`, then check `git status`. That includes `writing/<id>/body.html`, `images/cards/` and the rewritten `index.html`, feed and sitemap.

### 10. After deploy: search and social
- `curl -s -o /dev/null -w '%{http_code}\n' https://kellock.com.au/writing/<id>/` must print 200, and so must `…/body.html` for a Markdown post (until the deploy finishes, the 404 page is served with the site card's `og:image`). Then `curl -s https://kellock.com.au/writing/<id>/ | grep 'og:image"'` must show the post's own image, not `site-….png` or `profile.jpg`, and that image URL must return 200.
- Google Search Console (property `https://kellock.com.au/`, verified through the Google Analytics tag, so never remove the gtag snippet): URL Inspection → Request indexing. The sitemap is read automatically; Bing imports from Search Console and reads the sitemap.
- Refresh LinkedIn's cache with Post Inspector (`https://www.linkedin.com/post-inspector/inspect/<url-encoded URL>`) before posting. Bluesky fixes the link card when a post is created, so check the preview in the composer. Optionally run Google's Rich Results Test (expect Article and Breadcrumbs).
- Social posts (drafted in Typefully): house style is one or two plain sentences and the link; no em dashes; no employer name. X: keep well under 280 characters (a link counts as 23), about 200 is safer. Bluesky: 300 characters including the full URL. LinkedIn: up to three short paragraphs and the link. Attaching an image replaces the link card; otherwise platforms show the page's `og:image`.

### 11. Updating, renaming or deleting
- Update: set `updated: 'YYYY-MM-DD'` (leave `date`/`dt`), change the "Last updated" line to match (inline-body talks: add a `P()` if it should be visible), rebuild, commit, request re-indexing, and re-run Post Inspector if the title, dek or image changed. `updated` reaches only the modified-time metadata, the sitemap and the feed's `lastBuildDate`; lists, the header and each RSS item's `pubDate` keep the original date. Without a custom `image`, a changed title, dek, type, date or venue renders a new card (needs Chrome); a custom `image` must be re-made under a new filename.
- Rename: avoid (step 2). If unavoidable, change `id`, rename `posts/<id>.md`, fix links and `#<old-id>-…` anchors, rebuild, then hand-write a redirect page at `writing/<old-id>/index.html` (meta refresh and canonical to the new URL) without the `GENERATED by scripts/build.mjs` marker (the build deletes marked folders). Old anchors and share counts stay broken.
- Delete: remove the `POSTS` entry, fix links to it (`grep -rn '/writing/<id>/' posts`), rebuild (removes `writing/<id>/` and the card), run the step 9 link check, then delete `posts/<id>.md`, post-only images (both variants) and their `.diagram.html` sources, and commit as in step 9 (`git add -A -- . ':!.roam' ':!.playwright-mcp'`).

### Known site limits (fix in code, not per article)
- No figure captions, `<abbr>`, fenced code blocks, nested lists, multi-tag or keywords support in posts.
- Caching (Cloudflare in front of GitHub Pages): HTML, `body.html` and `feed.xml` are cached for 10 minutes, but scripts and images for 4 hours (`max-age=14400`). Script URLs carry a build-time content hash (`?v=`), so a changed `tech-bg.js` or `support.js` reaches visitors with the next HTML fetch; a changed image still needs a new filename (as the share cards already do).
- `setTitle()` rewrites `og:title` in the live DOM with the " · Matt Kellock" suffix; check share tags in the generated files.

## Deployment

Push to `master`: GitHub Pages publishes automatically. The CNAME file maps the domain to `kellock.com.au`.
