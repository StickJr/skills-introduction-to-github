# Folio

A minimalist personal learning library. Send it a link (article, paper, docs page, video) or just name a topic, choose **Summary** or **Tutor**, and it writes you a clean, readable article with diagrams and pictures where they help. Everything you add is saved and searchable.

- **Summary**: the essentials of the content, with key takeaways, written clearly.
- **Tutor**: a guided path to learn the topic yourself: prerequisites, the big picture, staged exercises with self-checks, common pitfalls, and vetted resources.

Articles are written by Claude, which reads the link (or researches the topic) using web fetch and web search. Diagrams are drawn with Mermaid, and images come from the source page.

## Run it

You need **Node.js 22.18 or newer** and an [Anthropic API key](https://console.anthropic.com).

```bash
cd folio
npm install
cp .env.example .env      # then put your key in ANTHROPIC_API_KEY
npm start
```

Open http://localhost:3000.

## Use it from your phone

Folio is a small web server with a SQLite file for storage (`data/folio.db`), so it needs to run somewhere your phone can reach:

- **Your own computer + [Tailscale](https://tailscale.com)** (free, private): run `npm start` at home and open `http://<computer-name>:3000` on your phone.
- **A host with a persistent disk** (Railway, Render, Fly.io, a small VPS): set `ANTHROPIC_API_KEY` and `APP_PASSWORD`, and mount a volume at `FOLIO_DATA_DIR` so your library survives redeploys.

Then use **Add to Home Screen** in your phone's browser. It opens full-screen like an app. On Android, once installed (over HTTPS), Folio shows up in the **Share** sheet, so you can share a link from any app directly to it.

> If the app is reachable from the internet, set `APP_PASSWORD`. Anyone who can open it can spend your API credits.

## Settings

| Variable | Default | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key |
| `APP_PASSWORD` | none | Password prompt for the whole app (any username works) |
| `PORT` | `3000` | Port to listen on |
| `FOLIO_MODEL` | `claude-opus-5-5` | Claude model used to write articles |
| `FOLIO_EFFORT` | `high` | How hard Claude thinks: `low`, `medium`, `high`, `xhigh`, `max`. Lower is faster and cheaper |
| `FOLIO_DATA_DIR` | `./data` | Where the library database is stored |

## How it works

```
phone ──► POST /api/articles {input, mode}
             │  saved right away as "pending"
             ▼
     background queue ──► Claude (web_fetch + web_search) ──► Markdown article
             │                                                 (title, dek, sections,
             ▼                                                  mermaid diagrams, images)
     SQLite + full-text index ◄── saved as "ready"
```

- `src/server.ts`: HTTP API, background queue (two articles at a time; unfinished ones resume after a restart), optional password.
- `src/generate.ts`: the Claude call, link/topic detection, cover-image lookup (the page's share image).
- `src/prompts.ts`: the writing instructions for Summary and Tutor. Edit these to change the voice or structure.
- `src/db.ts`: SQLite storage with a full-text search index (prefix matching, ranked by title first).
- `public/`: the front end. Plain HTML/CSS/JS, no build step. Newsreader serif, light and dark themes.

## Development

```bash
npm run dev        # restart on file changes
npm test           # API + parsing tests (uses a fake writer, no API calls)
npm run typecheck
```

## Notes

- Each article is one Claude request with web research, which usually takes 1–3 minutes. You can leave the page; it keeps working in the background.
- Paywalled pages and videos without transcripts can't be read directly. Claude falls back to searching for coverage of the same content and says so in the article.
- Images are only used if they appear on pages Claude actually read. Any that fail to load are hidden.
