# /// script
# requires-python = ">=3.10"
# dependencies = ["huggingface_hub"]
# ///
# SPDX-License-Identifier: Apache-2.0

"""Push the built blog to the Exgentic/open-leaderboard-blog Hugging Face Space."""

import re
import shutil
import tempfile
from pathlib import Path

from huggingface_hub import upload_folder

REPO_ROOT = Path(__file__).resolve().parent.parent
SPACE_ID = "Exgentic/open-leaderboard-blog"

README_CONTENT = """\
---
title: The Open General Agent Leaderboard
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
    # /blog/figures/ -> figures/
    html = html.replace('src="/blog/figures/', 'src="figures/')
    # Navigation links: point back to the main site
    html = re.sub(r'href="/(#[^"]*)"', r'href="https://exgentic.ai/\1"', html)
    html = html.replace('href="/"', 'href="https://exgentic.ai/"')
    return html


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        staging = Path(tmp)

        # index.html — with path fixups
        raw_html = (REPO_ROOT / "blog" / "index.html").read_text()
        (staging / "index.html").write_text(fixup_html(raw_html))

        # figures/
        shutil.copytree(REPO_ROOT / "blog" / "figures", staging / "figures")

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
