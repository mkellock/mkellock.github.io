// Minimal Markdown to HTML for posts/*.md. Covers what the articles use:
// ## / ### headings, paragraphs, > callouts (nested), - and 1. lists, pipe tables,
// standalone images (as figures), ---, **bold**, *italic*, `code`, [links](url),
// bare URLs, and footnotes ([^n] references with [^n]: definitions).
// idPrefix keeps footnote and heading ids unique per post.

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function markdownToHtml(md, idPrefix) {
  const notes = new Map();
  const refCount = new Map();

  function inline(text) {
    const keep = [];
    const stash = html => `\u0000${keep.push(html) - 1}\u0000`;
    let s = esc(text);
    s = s.replace(/`([^`]+)`/g, (_, c) => stash(`<code>${c}</code>`));
    s = s.replace(/\[\^([^\]]+)\]/g, (_, n) => {
      const k = (refCount.get(n) || 0) + 1;
      refCount.set(n, k);
      return stash(`<sup class="fn"><a href="#${idPrefix}-fn-${n}"${k === 1 ? ` id="${idPrefix}-ref-${n}"` : ''} aria-label="Reference ${n}">${n}</a></sup>`);
    });
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => stash(`<img src="${src}" alt="${alt}" loading="lazy">`));
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, href) => stash(`<a href="${href}">${t}</a>`));
    s = s.replace(/https?:\/\/[^\s<]+[^\s<.,;:)]/g, url => stash(`<a href="${url}">${url.replace(/^https?:\/\//, '')}</a>`));
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i]);
  }

  function blocks(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    const isBlank = l => !l.trim();
    const startsBlock = l => /^(#{1,6} |> ?|[-*] |\d+\. |\|)/.test(l) || /^---+\s*$/.test(l) || /^\[\^[^\]]+\]:/.test(l) || /^!\[.*\]\(.*\)\s*$/.test(l);

    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }

      let m;
      if ((m = line.match(/^(#{1,6}) (.*)$/))) {
        const level = Math.max(2, m[1].length);
        const html = inline(m[2]);
        out.push(`<h${level} id="${idPrefix}-${slug(html)}">${html}</h${level}>`);
        i++;
      } else if (/^---+\s*$/.test(line)) {
        out.push('<hr>');
        i++;
      } else if (/^> ?/.test(line)) {
        const inner = [];
        while (i < lines.length && /^>/.test(lines[i])) inner.push(lines[i++].replace(/^> ?/, ''));
        out.push(`<blockquote>${blocks(inner.join('\n'))}</blockquote>`);
      } else if (/^[-*] /.test(line) || /^\d+\. /.test(line)) {
        const ordered = /^\d+\. /.test(line);
        const re = ordered ? /^\d+\. / : /^[-*] /;
        const items = [];
        while (i < lines.length && re.test(lines[i])) {
          let item = lines[i++].replace(re, '');
          while (i < lines.length && /^\s{2,}\S/.test(lines[i])) item += ' ' + lines[i++].trim();
          items.push(`<li>${inline(item)}</li>`);
        }
        out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
      } else if (/^\|/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
        const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const [head, , ...body] = rows;
        out.push('<div class="mk-table"><table><thead><tr>' + cells(head).map(c => `<th scope="col">${inline(c)}</th>`).join('')
          + '</tr></thead><tbody>' + body.map(r => '<tr>' + cells(r).map((c, j) => j === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`).join('') + '</tr>').join('')
          + '</tbody></table></div>');
      } else if (/^\[\^[^\]]+\]:/.test(line)) {
        const defs = [];
        while (i < lines.length && (/^\[\^[^\]]+\]:/.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
          const d = lines[i++].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
          if (d) { defs.push([d[1], d[2]]); notes.set(d[1], true); }
          else defs[defs.length - 1][1] += ' ' + lines[i - 1].trim();
        }
        out.push('<ol class="mk-refs">' + defs.map(([n, t]) =>
          `<li id="${idPrefix}-fn-${n}" value="${esc(n)}">${inline(t)} <a href="#${idPrefix}-ref-${n}" class="mk-back" aria-label="Back to reference ${n} in the text">↩</a></li>`).join('') + '</ol>');
      } else if ((m = line.match(/^!\[(.*)\]\((\S+)\)\s*$/))) {
        out.push(`<figure><img src="${m[2]}" alt="${esc(m[1])}" loading="lazy"></figure>`);
        i++;
      } else {
        const para = [];
        while (i < lines.length && !isBlank(lines[i]) && !(para.length && startsBlock(lines[i]))) para.push(lines[i++]);
        out.push(`<p>${inline(para.join(' '))}</p>`);
      }
    }
    return out.join('\n');
  }

  const html = blocks(md);
  const words = md.replace(/\[\^[^\]]+\]:.*$/gm, '').replace(/[#>*|`[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
  return { html, words };
}
