# SPDX-License-Identifier: Apache-2.0
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "markdown",
#     "pyyaml",
# ]
# ///
"""Build blog HTML pages from Markdown sources.

Usage:
    uv run scripts/build_blog.py                  # build all blogs
    uv run scripts/build_blog.py <slug>            # build one blog

Source layout:  blogs/<slug>/blog.md  +  blogs/<slug>/figures/
Output:         blog/index.html       (first/only blog)
                blog/<slug>/index.html (future multi-blog)
"""
from __future__ import annotations

import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

import markdown
import yaml

ROOT = Path(__file__).resolve().parent.parent
BLOGS_SRC = ROOT / "blogs"
BLOG_OUT = ROOT / "blog"
MAIN_INDEX = ROOT / "index.html"

# ---------------------------------------------------------------------------
# Template fragments — extracted from the existing blog/index.html
# ---------------------------------------------------------------------------

HEAD_TEMPLATE = """\
<!--
SPDX-License-Identifier: Apache-2.0
Copyright (C) 2025, The Exgentic organization and its contributors.
-->
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/favicon.png?v=3" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{meta_description}" />
  <title>{title} - Exgentic Blog</title>
  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{meta_description}" />
  <meta property="og:url" content="https://exgentic.ai{url}" />
  <meta property="og:image" content="https://exgentic.ai/og-image.png" />
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{title}" />
  <meta name="twitter:description" content="{meta_description}" />
  <meta name="twitter:image" content="https://exgentic.ai/og-image.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XKC51P054L"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-XKC51P054L');
  </script>
  <script>
    var t=localStorage.getItem('exgentic-theme');
    if(t==='light'||(t===null&&window.matchMedia('(prefers-color-scheme:light)').matches))
      document.documentElement.classList.add('light-mode-early');
  </script>
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/blog/blog.css">
</head>
<body>
"""

HEADER_NAV = """\
<!-- Header -->
<header class="site-header" id="header">
  <div class="header-inner">
    <a href="/" aria-label="Exgentic Home" class="nav-logo-link">
      <svg class="nav-logo-icon" viewBox="0 0 40 48" fill="none" stroke="none">
        <polygon points="4,8 36,8 20,30" class="tri-outer"/>
        <polygon points="4,44 36,44 20,22" class="tri-outer"/>
        <polygon points="9,42 31,42 20,35" class="tri-inner"/>
      </svg>
      <span class="nav-logo-text">Exgentic</span>
    </a>
    <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle navigation">&#9776;</button>
    <nav class="header-nav" id="headerNav">
      <a href="/#leaderboard">Leaderboard</a>
      <a href="/#findings">Findings</a>
      <a href="/#faq">FAQ</a>
      <a href="/#blog" class="nav-active">Blog</a>
      <a href="https://arxiv.org/abs/2602.22953" target="_blank" rel="noopener">Paper</a>
      <a href="https://github.com/Exgentic/exgentic" target="_blank" rel="noopener" class="btn-nav">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="vertical-align:middle;margin-right:4px"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        GitHub
      </a>
      <button class="theme-toggle" id="themeToggle" title="Toggle light/dark mode">&#9790;</button>
    </nav>
  </div>
</header>
"""

ARTICLE_HEADER_TEMPLATE = """\
<article class="blog-post">
  <div class="blog-post-header">
    <h1 class="blog-post-title">{title}</h1>
    <p class="blog-post-subtitle">{subtitle}</p>
    <div class="blog-post-meta">
      <span>{author}</span>
      <span>&middot;</span>
      <time datetime="{date_iso}">{date_display}</time>
      <span>&middot;</span>
      <span>{reading_time} read</span>
      <button class="blog-share-btn" id="shareBtn" title="Copy link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span class="blog-share-label">Share</span>
      </button>
    </div>
  </div>

  <div class="blog-post-body">
"""

ARTICLE_FOOTER = """\
  </div>
</article>
"""

FOOTER_HTML = """\
<!-- Footer -->
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><h3>Exgentic</h3><p>The open community for evaluating AI agents.</p></div>
      <div class="footer-col"><h4>Resources</h4><ul><li><a href="https://github.com/Exgentic/exgentic" target="_blank" rel="noopener">GitHub</a></li><li><a href="https://arxiv.org/abs/2602.22953" target="_blank" rel="noopener">Paper</a></li><li><a href="/#blog">Blog</a></li></ul></div>
      <div class="footer-col"><h4>Community</h4><ul><li><a href="https://github.com/Exgentic/exgentic/blob/main/LICENSE" target="_blank" rel="noopener">License</a></li><li><a href="https://github.com/Exgentic/exgentic/blob/main/README.md#-citing-exgentic" target="_blank" rel="noopener">Citation</a></li><li><a href="https://github.com/Exgentic/exgentic/issues" target="_blank" rel="noopener">Contact</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>&copy; 2026 Exgentic</span></div>
  </div>
</footer>
"""

SCRIPTS = """\
<script>
// Theme toggle
const toggle = document.getElementById('themeToggle');
const body = document.body;
const stored = localStorage.getItem('exgentic-theme');
if (stored === 'light' || (stored === null && window.matchMedia('(prefers-color-scheme:light)').matches)) {
  body.classList.add('light-mode');
  toggle.textContent = '\\u2600';
}
toggle.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  const isLight = body.classList.contains('light-mode');
  localStorage.setItem('exgentic-theme', isLight ? 'light' : 'dark');
  toggle.textContent = isLight ? '\\u2600' : '\\u263E';
});
// Mobile nav
document.getElementById('mobileToggle').addEventListener('click', () => {
  document.getElementById('headerNav').classList.toggle('open');
});
// Share button
document.getElementById('shareBtn').addEventListener('click', () => {
  const btn = document.getElementById('shareBtn');
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href).then(() => {
      btn.classList.add('copied');
      btn.querySelector('.blog-share-label').textContent = 'Copied';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.querySelector('.blog-share-label').textContent = 'Share';
      }, 2000);
    });
  }
});
</script>

</body>
</html>
"""

# ---------------------------------------------------------------------------
# Markdown processing
# ---------------------------------------------------------------------------

INCLUDE_HTML_RE = re.compile(r"\{%\s*include_html\s+(.*?)\s*%\}")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Split YAML frontmatter from markdown body."""
    if not text.startswith("---"):
        raise SystemExit("blog.md must start with YAML frontmatter (---)")
    _, fm, body = text.split("---", 2)
    meta = yaml.safe_load(fm)
    return meta, body.strip()


STRIP_WRAPPER_RE = re.compile(
    r"(?s)<!DOCTYPE[^>]*>\s*<html[^>]*>\s*<head>.*?</head>\s*<body[^>]*>\s*"
    r"(.*?)\s*</body>\s*</html>",
    re.IGNORECASE,
)


def _strip_html_wrapper(html: str) -> str:
    """Strip standalone page wrapper (DOCTYPE/html/head/body) from inlined HTML."""
    m = STRIP_WRAPPER_RE.search(html)
    return m.group(1) if m else html


def process_include_html(body: str, figures_dir: Path) -> str:
    """Replace {% include_html figures/chart.html %} with file contents."""
    def replacer(m: re.Match) -> str:
        rel_path = m.group(1).strip()
        html_file = figures_dir / rel_path.removeprefix("figures/")
        if not html_file.exists():
            html_file = figures_dir.parent / rel_path
        if not html_file.exists():
            print(f"  WARNING: include_html file not found: {rel_path}")
            return f"<!-- missing: {rel_path} -->"
        content = html_file.read_text(encoding="utf-8")
        return _strip_html_wrapper(content)
    return INCLUDE_HTML_RE.sub(replacer, body)


def convert_image_paths(html: str, figures_url: str) -> str:
    """Rewrite relative image paths (figures/...) to absolute blog paths."""
    html = re.sub(
        r'<img\s+([^>]*)src="figures/([^"]+)"',
        rf'<img \1src="{figures_url}/\2"',
        html,
    )
    return html


def style_leaderboard_table(html: str) -> str:
    """Post-process markdown-generated tables to match the main page leaderboard style.

    Adds rank badges, splits agent name/version, formats scores as percentages
    with background bars, and styles cost cells.
    """
    import re as _re

    def _process_table(table_match: _re.Match) -> str:
        table_html = table_match.group(0)

        # Only process tables that have a "Rank" header
        if ">Rank<" not in table_html:
            return table_html

        # Add wrapper class
        table_html = table_html.replace("<table>", '<table class="lb-table-blog">', 1)

        # Process each row in tbody
        row_idx = 0

        def _process_row(row_match: _re.Match) -> str:
            nonlocal row_idx
            row_html = row_match.group(0)
            cells = _re.findall(r"<td>(.*?)</td>", row_html, _re.DOTALL)
            if len(cells) < 5:
                return row_html

            rank_val = cells[0].strip()
            agent_raw = cells[1].strip()
            model_val = cells[2].strip()
            score_val = cells[3].strip()
            cost_val = cells[4].strip()

            # Rank badge
            rank_num = int(rank_val)
            if rank_num <= 3:
                rank_cls = f"rank-{rank_num}"
                rank_cell = f'<span class="rank-badge {rank_cls}">{rank_num}</span>'
            else:
                rank_cell = f'<span class="rank-default">{rank_num}</span>'

            # Agent: split name and version (version is in parentheses)
            agent_m = _re.match(r"^(.*?)\s*\((.+?)\)\s*$", agent_raw)
            if agent_m:
                agent_name = agent_m.group(1).strip()
                agent_ver = agent_m.group(2).strip()
                agent_cell = (
                    f'<span class="agent-name">{agent_name}</span>'
                    f'<span class="agent-version">{agent_ver}</span>'
                )
            else:
                agent_cell = f'<span class="agent-name">{agent_raw}</span>'

            # Model
            model_cell = f'<span class="model-name">{model_val}</span>'

            # Score: format as percentage with bar
            try:
                score_num = float(score_val)
                pct = score_num * 100
                pct_str = f"{pct:.1f}".rstrip("0").rstrip(".") + "%"
                bar_width = pct
                if score_num >= 0.7:
                    sc_cls = "score-high"
                elif score_num >= 0.5:
                    sc_cls = "score-mid"
                else:
                    sc_cls = "score-low"
                score_cell = (
                    f'<div class="bar bar-cyan" style="width:{bar_width}%"></div>'
                    f'<span class="val">{pct_str}</span>'
                )
                score_td_cls = f"score-cell {sc_cls}"
            except ValueError:
                score_cell = score_val
                score_td_cls = ""

            # Cost
            cost_cell = cost_val

            new_row = (
                f"<tr>"
                f'<td class="rank-cell">{rank_cell}</td>'
                f'<td class="agent-cell">{agent_cell}</td>'
                f'<td class="model-cell">{model_cell}</td>'
                f'<td class="{score_td_cls}">{score_cell}</td>'
                f'<td class="cost-cell">{cost_cell}</td>'
                f"</tr>"
            )
            row_idx += 1
            return new_row

        table_html = _re.sub(r"<tr>\s*<td>.*?</tr>", _process_row, table_html, flags=_re.DOTALL)
        return table_html

    return re.sub(r"<table>.*?</table>", _process_table, html, flags=re.DOTALL)


def wrap_tables_in_scroll(html: str) -> str:
    """Wrap <table> elements in a scrollable container div."""
    return re.sub(
        r"(<table.*?</table>)",
        r'<div class="table-scroll">\1</div>',
        html,
        flags=re.DOTALL,
    )


def wrap_images_in_figures(html: str) -> str:
    """Wrap standalone <img> with alt text into <figure> + <figcaption>."""
    def replacer(m: re.Match) -> str:
        img_tag = m.group(1)
        alt_m = re.search(r'alt="([^"]*)"', img_tag)
        alt = alt_m.group(1) if alt_m else ""
        if alt:
            return f'<figure class="blog-figure">{img_tag}<figcaption>{alt}</figcaption></figure>'
        return f'<figure class="blog-figure">{img_tag}</figure>'
    return re.sub(r"<p>\s*(<img [^>]+>)\s*</p>", replacer, html)


def format_date(date_val) -> tuple[str, str]:
    """Return (iso date, display date) from a string or datetime."""
    if isinstance(date_val, datetime):
        dt = date_val
    else:
        dt = datetime.strptime(str(date_val), "%Y-%m-%d")
    return dt.strftime("%Y-%m-%d"), dt.strftime("%b %-d, %Y")


# ---------------------------------------------------------------------------
# Blog card on main index.html
# ---------------------------------------------------------------------------

BLOG_CARDS_RE = re.compile(
    r"(<div\s+class=\"blog-cards-grid\">).*?(<div\s+class=\"blog-card-placeholder\")",
    re.DOTALL,
)


def _render_blog_card(meta: dict, url: str) -> str:
    """Render a single blog card HTML fragment."""
    _, date_display = format_date(meta["date"])
    return (
        f'<div class="blog-card-home glass">\n'
        f'        <div class="blog-card-home-meta">\n'
        f"          <time>{date_display}</time>\n"
        f"          <span>&middot;</span>\n"
        f'          <span>{meta["reading_time"]} read</span>\n'
        f"        </div>\n"
        f'        <h3><a href="{url}">{meta["title"]}</a></h3>\n'
        f'        <p>{meta["subtitle"]}</p>\n'
        f'        <a href="{url}" class="blog-card-home-link">Read more &rarr;</a>\n'
        f"      </div>"
    )


def update_main_index_all(all_metas: list[tuple[dict, str]]) -> None:
    """Rewrite all blog cards on index.html from the full list of posts."""
    if not MAIN_INDEX.exists():
        return
    html = MAIN_INDEX.read_text(encoding="utf-8")

    # Sort by date descending (newest first)
    all_metas.sort(key=lambda x: str(x[0].get("date", "")), reverse=True)

    cards = "\n      ".join(_render_blog_card(meta, url) for meta, url in all_metas)
    replacement = rf'\1\n      {cards}\n      \2'

    new_html, n = BLOG_CARDS_RE.subn(replacement, html, count=1)
    if n:
        MAIN_INDEX.write_text(new_html, encoding="utf-8")
        print(f"  Updated {len(all_metas)} blog card(s) in {MAIN_INDEX}")
    else:
        print("  Skipped blog card update (no matching grid in index.html)")


# ---------------------------------------------------------------------------
# Build one blog
# ---------------------------------------------------------------------------

def build_blog(slug: str) -> tuple[dict, str] | None:
    src_dir = BLOGS_SRC / slug
    md_file = src_dir / "blog.md"
    if not md_file.exists():
        print(f"  Skipping {slug}: no blog.md found")
        return None

    print(f"Building blog: {slug}")
    text = md_file.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)

    # Required fields
    for key in ("title", "subtitle", "author", "date", "reading_time", "slug"):
        if key not in meta:
            raise SystemExit(f"blog.md frontmatter missing required field: {key}")

    # Each blog post gets its own directory: /blog/<slug>/
    out_dir = BLOG_OUT / slug
    url = f"/blog/{slug}/"
    figures_url = f"/blog/{slug}/figures"

    out_dir.mkdir(parents=True, exist_ok=True)

    # Process include_html directives before markdown conversion
    figures_dir = src_dir / "figures"
    body = process_include_html(body, figures_dir)

    # Convert markdown to HTML
    md = markdown.Markdown(extensions=["fenced_code", "codehilite", "tables", "toc"])
    body_html = md.convert(body)

    # Post-process HTML
    body_html = convert_image_paths(body_html, figures_url)
    body_html = wrap_images_in_figures(body_html)
    body_html = style_leaderboard_table(body_html)
    body_html = wrap_tables_in_scroll(body_html)

    # Format date
    date_iso, date_display = format_date(meta["date"])

    # Assemble full page
    page = (
        HEAD_TEMPLATE.format(
            title=meta["title"],
            meta_description=meta["subtitle"],
            url=url,
        )
        + HEADER_NAV
        + ARTICLE_HEADER_TEMPLATE.format(
            title=meta["title"],
            subtitle=meta["subtitle"],
            author=meta["author"],
            date_iso=date_iso,
            date_display=date_display,
            reading_time=meta["reading_time"],
        )
        + body_html
        + "\n"
        + ARTICLE_FOOTER
        + FOOTER_HTML
        + SCRIPTS
    )

    out_file = out_dir / "index.html"
    out_file.write_text(page, encoding="utf-8")
    print(f"  Wrote {out_file}")

    # Copy blog.css to blog/ root (shared across all posts)
    blog_css_src = BLOGS_SRC / "blog.css"
    if blog_css_src.exists():
        shutil.copy2(blog_css_src, BLOG_OUT / "blog.css")

    # Copy figures
    if figures_dir.exists() and any(figures_dir.iterdir()):
        dest_figures = out_dir / "figures"
        if dest_figures.exists():
            shutil.rmtree(dest_figures)
        shutil.copytree(figures_dir, dest_figures)
        n_files = sum(1 for _ in dest_figures.rglob("*") if _.is_file())
        print(f"  Copied {n_files} figure(s) to {dest_figures}")

    return meta, url


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) > 1:
        slugs = sys.argv[1:]
    else:
        if not BLOGS_SRC.exists():
            raise SystemExit(f"No blogs source directory: {BLOGS_SRC}")
        slugs = sorted(
            d.name for d in BLOGS_SRC.iterdir()
            if d.is_dir() and (d / "blog.md").exists()
        )

    if not slugs:
        print("No blogs with blog.md found in", BLOGS_SRC)
        return

    all_metas = []
    for slug in slugs:
        result = build_blog(slug)
        if result:
            all_metas.append(result)

    if all_metas:
        update_main_index_all(all_metas)

    print("\nDone.")


if __name__ == "__main__":
    main()
