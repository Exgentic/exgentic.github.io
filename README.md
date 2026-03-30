# Exgentic Website

The website and HuggingFace Space for the [Open Agent Leaderboard](https://exgentic.github.io).

## Project Structure

```
├── index.html              # Main website (HTML structure)
├── styles.css              # All styles (dark/light themes, responsive)
├── scripts/
│   ├── loading.js          # Loading screen animation
│   ├── leaderboard.js      # Leaderboard table + efficiency chart (shared with HF space)
│   ├── animations.js       # GSAP scroll-triggered animations
│   └── main.js             # Theme toggle, header, FAQ, network graph
├── hf-space/
│   ├── index.html          # Leaderboard-only page for HuggingFace Spaces
│   └── README.md           # HF space metadata
├── data/
│   └── results.csv         # Single source of truth for all evaluation data
├── hf-dataset/
│   ├── README.md           # HF dataset metadata
│   └── data/               # Generated parquet (from data/results.csv)
├── .github/workflows/
│   ├── deploy-hf-space.yml   # Auto-deploys HF space on push to main
│   └── deploy-hf-dataset.yml # Auto-deploys HF dataset on push to main
├── results.csv             # Generated website CSV (from data/results.csv)
├── results-README.md       # Data dictionary
├── LICENSE-DATA.txt         # Data license (CDLA-Permissive-2.0)
├── favicon.png
└── CNAME                   # Custom domain (www.exgentic.ai)
```

## Local Development

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Website

The main website is deployed via **GitHub Pages** from this repo. It includes the full experience: hero section, interactive leaderboard, efficiency chart, findings, network graph, FAQ, and footer.

**Custom domain**: `www.exgentic.ai` (configured via `CNAME`).

## HuggingFace Space

The [HF Space](https://huggingface.co/spaces/Exgentic/leaderboard) shows a focused view with just the leaderboard table and efficiency chart.

It reuses `styles.css` and `scripts/leaderboard.js` from the main website. A GitHub Action (`.github/workflows/deploy-hf-space.yml`) automatically deploys updates when relevant files change on `main`.

## HuggingFace Dataset

The [HF Dataset](https://huggingface.co/datasets/Exgentic/open-agent-leaderboard-results) contains detailed evaluation results in Parquet format. Source files live in `hf-dataset/` and are auto-deployed via `.github/workflows/deploy-hf-dataset.yml`.

### Setup

Add a `HF_TOKEN` secret to the GitHub repo with a HuggingFace token that has write access to the `Exgentic/leaderboard` space and the `Exgentic/open-agent-leaderboard-results` dataset.

## Updating Data

Edit `data/results.csv` — this is the single source of truth for all evaluation results. Then run:

```bash
python3 scripts/build_data.py
```

This generates:
- `results.csv` — website-format CSV (used by the leaderboard and HF space)
- `hf-dataset/data/train-00000-of-00001.parquet` — parquet for the HF dataset

The GitHub Actions run this build step automatically before deploying.

## Resources

- [Paper (arXiv)](https://arxiv.org/abs/2602.22953)
- [Evaluation Framework (GitHub)](https://github.com/Exgentic/exgentic)
