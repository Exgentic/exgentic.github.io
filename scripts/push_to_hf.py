# /// script
# requires-python = ">=3.10"
# dependencies = ["huggingface_hub"]
# ///
# SPDX-License-Identifier: Apache-2.0

"""Push the built blog to the open-agent-leaderboard/blog Hugging Face Space."""

import re
import shutil
import tempfile
from pathlib import Path

from huggingface_hub import upload_folder

REPO_ROOT = Path(__file__).resolve().parent.parent
SPACE_ID = "open-agent-leaderboard/blog"

README_CONTENT = """\
---
title: The Open Agent Leaderboard
emoji: "\U0001F4CA"
colorFrom: green
colorTo: blue
sdk: static
pinned: false
---
"""


def fixup_html(html: str) -> str:
    """Rewrite absolute paths so the page works as a standalone static space."""
    # /styles.css -> styles.css
    html = html.replace('href="/styles.css"', 'href="styles.css"')
    # /blog/blog.css -> blog.css
    html = html.replace('href="/blog/blog.css"', 'href="blog.css"')
    # /blog/<slug>/figures/ -> figures/
    html = re.sub(r'src="/blog/[^/]+/figures/', 'src="figures/', html)
    # Navigation links: point back to the main site
    html = re.sub(r'href="/(#[^"]*)"', r'href="https://exgentic.ai/\1"', html)
    html = html.replace('href="/"', 'href="https://exgentic.ai/"')
    return html


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        staging = Path(tmp)

        # Find the blog post directory
        blog_dirs = sorted(
            d for d in (REPO_ROOT / "blog").iterdir()
            if d.is_dir() and (d / "index.html").exists()
        )
        if not blog_dirs:
            raise SystemExit("No blog posts found in blog/*/index.html")
        blog_dir = blog_dirs[0]

        # index.html — with path fixups
        raw_html = (blog_dir / "index.html").read_text()
        (staging / "index.html").write_text(fixup_html(raw_html))

        # figures/
        if (blog_dir / "figures").exists():
            shutil.copytree(blog_dir / "figures", staging / "figures")

        # CSS files
        shutil.copy2(REPO_ROOT / "blog" / "blog.css", staging / "blog.css")
        shutil.copy2(REPO_ROOT / "styles.css", staging / "styles.css")

        # HF space metadata
        (staging / "README.md").write_text(README_CONTENT)

        # Push
        upload_folder(
            repo_id=SPACE_ID,
            repo_type="space",
            folder_path=str(staging),
        )
        print(f"Pushed to https://huggingface.co/spaces/{SPACE_ID}")


if __name__ == "__main__":
    main()
