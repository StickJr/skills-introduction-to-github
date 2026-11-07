import express from "express";
import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { openDb, type Db, type Mode } from "./db.ts";
import {
  classifyInput,
  createClaudeGenerator,
  describeError,
  fetchCoverImage,
  parseArticle,
  type Generator,
} from "./generate.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

export interface AppConfig {
  db: Db;
  generate: Generator;
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  password?: string;
  concurrency?: number;
  lookupCover?: (url: string) => Promise<string | null>;
}

export function createApp(config: AppConfig) {
  const { db, generate, model, effort } = config;
  const lookupCover = config.lookupCover ?? fetchCoverImage;

  // --- Background work queue: articles are written while you do other things.
  const queue: number[] = [];
  let running = 0;
  const concurrency = config.concurrency ?? 2;

  function enqueue(id: number) {
    queue.push(id);
    drain();
  }

  function drain() {
    while (running < concurrency && queue.length) {
      const id = queue.shift()!;
      running++;
      work(id).finally(() => {
        running--;
        drain();
      });
    }
  }

  async function work(id: number) {
    const article = db.get(id);
    if (!article || article.status !== "pending") return;
    try {
      const [markdown, cover] = await Promise.all([
        generate({ input: article.source, sourceType: article.source_type, mode: article.mode, model, effort }),
        article.source_type === "url" ? lookupCover(article.source) : Promise.resolve(null),
      ]);
      const parsed = parseArticle(markdown, article.source);
      if (db.get(id)) db.complete(id, { ...parsed, cover });
    } catch (err) {
      console.error(`Article ${id} failed:`, err);
      if (db.get(id)) db.fail(id, describeError(err));
    }
  }

  // Resume anything left unfinished by a restart.
  for (const id of db.pendingIds()) enqueue(id);

  // --- HTTP
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  if (config.password) app.use(basicAuth(config.password));

  app.get("/api/articles", (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.slice(0, 200) : "";
    res.json(db.list(q));
  });

  app.post("/api/articles", (req, res) => {
    const rawInput = typeof req.body?.input === "string" ? req.body.input.trim() : "";
    const mode = req.body?.mode as Mode;
    if (!rawInput || rawInput.length > 2000) {
      return res.status(400).json({ error: "Paste a link or type a topic (up to 2000 characters)." });
    }
    if (mode !== "summary" && mode !== "tutor") {
      return res.status(400).json({ error: "Mode must be 'summary' or 'tutor'." });
    }
    const { input, sourceType } = classifyInput(rawInput);
    const id = db.create(input, sourceType, mode);
    enqueue(id);
    res.status(201).json(db.get(id));
  });

  app.get("/api/articles/:id", (req, res) => {
    const article = db.get(Number(req.params.id));
    if (!article) return res.status(404).json({ error: "Not found" });
    res.json(article);
  });

  app.post("/api/articles/:id/retry", (req, res) => {
    const id = Number(req.params.id);
    if (!db.retry(id)) return res.status(409).json({ error: "Only failed articles can be retried." });
    enqueue(id);
    res.json(db.get(id));
  });

  app.delete("/api/articles/:id", (req, res) => {
    if (!db.remove(Number(req.params.id))) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  // Front-end libraries served straight from node_modules (no build step).
  const vendor: Record<string, string> = {
    "marked.js": "node_modules/marked/lib/marked.esm.js",
    "purify.js": "node_modules/dompurify/dist/purify.es.mjs",
    "mermaid.js": "node_modules/mermaid/dist/mermaid.esm.min.mjs",
  };
  app.get("/vendor/:file", (req, res, next) => {
    const file = vendor[req.params.file];
    if (!file) return next();
    res.sendFile(path.join(root, file), { maxAge: "7d" });
  });
  app.use("/vendor/chunks", express.static(path.join(root, "node_modules/mermaid/dist/chunks"), { maxAge: "7d" }));

  app.use(express.static(path.join(root, "public")));

  // Single-page app: any other GET (e.g. the share target /new) gets index.html.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(root, "public/index.html"));
  });

  return app;
}

function basicAuth(password: string) {
  const expected = Buffer.from(password);
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded) {
      const supplied = Buffer.from(Buffer.from(encoded, "base64").toString().split(":").slice(1).join(":"));
      if (supplied.length === expected.length && timingSafeEqual(supplied, expected)) return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="Folio"').status(401).send("Password required");
  };
}

// --- Start the server when run directly.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = Number(process.env.PORT ?? 3000);
  const dataDir = path.resolve(root, process.env.FOLIO_DATA_DIR ?? "data");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠ ANTHROPIC_API_KEY is not set — new articles will fail until it is. See .env.example.");
  }

  const app = createApp({
    db: openDb(dataDir),
    generate: createClaudeGenerator(new Anthropic()),
    model: process.env.FOLIO_MODEL || "claude-opus-5-5",
    effort: (process.env.FOLIO_EFFORT as AppConfig["effort"]) || "high",
    password: process.env.APP_PASSWORD || undefined,
  });

  app.listen(port, () => console.log(`Folio is running at http://localhost:${port}`));
}
