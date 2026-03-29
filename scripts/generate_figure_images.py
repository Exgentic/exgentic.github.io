# SPDX-License-Identifier: Apache-2.0
# /// script
# requires-python = ">=3.11"
# dependencies = ["playwright"]
# ///
"""Generate static PNG fallbacks from interactive HTML figures.

Usage: uv run scripts/generate_figure_images.py [--force]

Scans blogs/*/figures/ for .html files and renders each to .png
using Playwright (headless Chromium). Skips files where the .png
is newer than the .html unless --force is given.

Requires: uv run --with playwright python -m playwright install chromium
"""

from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

LIGHT_CSS = """
<style>
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f0;
  --bg-card: rgba(255,255,255,0.95);
  --bg-glass: rgba(255,255,255,0.95);
  --text-primary: #1a1a1a;
  --text-secondary: #555;
  --text-muted: #888;
  --border: rgba(0,0,0,0.1);
  --cyan: #4a9690;
  --blue: #5a7da8;
  --purple: #8a7eb5;
}
body { background: #ffffff; margin: 0; padding: 0;
       font-family: Inter, system-ui, sans-serif; color: #1a1a1a; }
.diagram-wrap { background: #ffffff !important;
                border: 1px solid rgba(0,0,0,0.1) !important; }
.screenshot-pad { padding: 8px; background: #ffffff; display: inline-block; }
</style>
"""

REPO_ROOT = Path(__file__).resolve().parent.parent
BLOGS_DIR = REPO_ROOT / "blogs"

# Figures wider than default get a larger viewport
WIDE_FIGURES = {"protocol-diagram.html": 960}
DEFAULT_WIDTH = 820
# Animated figures need extra wait time (ms)
ANIMATED_FIGURES = {"general-vs-specialized.html": 3000}
DEFAULT_WAIT = 500


def main() -> None:
    force = "--force" in sys.argv

    html_files: list[tuple[Path, Path]] = []
    for blog_dir in sorted(BLOGS_DIR.iterdir()):
        fig_dir = blog_dir / "figures"
        if not fig_dir.is_dir():
            continue
        for html_file in sorted(fig_dir.glob("*.html")):
            png_file = html_file.with_suffix(".png")
            if (
                not force
                and png_file.exists()
                and png_file.stat().st_mtime > html_file.stat().st_mtime
            ):
                print(f"  Skip {html_file.name} (png is newer)")
                continue
            html_files.append((html_file, png_file))

    if not html_files:
        print("Nothing to generate.")
        return

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for html_file, png_file in html_files:
            name = html_file.name
            width = WIDE_FIGURES.get(name, DEFAULT_WIDTH)
            wait = ANIMATED_FIGURES.get(name, DEFAULT_WAIT)

            page = browser.new_page(
                viewport={"width": width, "height": 600},
                device_scale_factor=2,
            )

            html = html_file.read_text(encoding="utf-8")
            full_html = (
                f"<!DOCTYPE html><html><head>{LIGHT_CSS}</head>"
                f'<body class="light-mode">'
                f'<div class="screenshot-pad">{html}</div>'
                f"</body></html>"
            )

            # Write to a temp file in the blog root so relative paths
            # like "figures/image.png" resolve correctly
            blog_root = html_file.parent.parent
            tmp_html = blog_root / f"_screenshot_{name}"
            tmp_html.write_text(full_html, encoding="utf-8")
            page.goto(f"file://{tmp_html}")
            page.wait_for_timeout(wait)
            tmp_html.unlink()

            wrapper = page.query_selector(".screenshot-pad")
            if wrapper:
                wrapper.screenshot(path=str(png_file))
            else:
                page.screenshot(path=str(png_file), full_page=False)

            print(f"  {name} -> {png_file.name} (w={width})")
            page.close()

        browser.close()

    print(f"\nDone. Generated {len(html_files)} image(s).")


if __name__ == "__main__":
    main()
