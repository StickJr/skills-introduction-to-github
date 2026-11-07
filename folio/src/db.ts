import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export type Mode = "summary" | "tutor";
export type Status = "pending" | "ready" | "failed";

export interface Article {
  id: number;
  created_at: string;
  source: string;
  source_type: "url" | "topic";
  mode: Mode;
  status: Status;
  title: string | null;
  dek: string | null;
  body: string | null;
  cover_image: string | null;
  error: string | null;
}

export type ArticleSummary = Omit<Article, "body"> & { snippet: string | null };

export function openDb(dataDir: string) {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, "folio.db"));

  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      source      TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK (source_type IN ('url', 'topic')),
      mode        TEXT NOT NULL CHECK (mode IN ('summary', 'tutor')),
      status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
      title       TEXT,
      dek         TEXT,
      body        TEXT,
      cover_image TEXT,
      error       TEXT
    );

    -- Full-text index over everything worth searching, kept in sync by triggers.
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
      title, dek, body, source,
      content = 'articles', content_rowid = 'id',
      tokenize = 'porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
      INSERT INTO articles_fts (rowid, title, dek, body, source)
      VALUES (new.id, new.title, new.dek, new.body, new.source);
    END;
    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
      INSERT INTO articles_fts (articles_fts, rowid, title, dek, body, source)
      VALUES ('delete', old.id, old.title, old.dek, old.body, old.source);
    END;
    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
      INSERT INTO articles_fts (articles_fts, rowid, title, dek, body, source)
      VALUES ('delete', old.id, old.title, old.dek, old.body, old.source);
      INSERT INTO articles_fts (rowid, title, dek, body, source)
      VALUES (new.id, new.title, new.dek, new.body, new.source);
    END;
  `);

  const listColumns = `a.id, a.created_at, a.source, a.source_type, a.mode, a.status,
    a.title, a.dek, a.cover_image, a.error`;

  const stmts = {
    insert: db.prepare(
      `INSERT INTO articles (source, source_type, mode) VALUES (?, ?, ?) RETURNING id`,
    ),
    get: db.prepare(`SELECT * FROM articles WHERE id = ?`),
    list: db.prepare(
      `SELECT ${listColumns}, NULL AS snippet FROM articles a ORDER BY a.id DESC`,
    ),
    search: db.prepare(
      `SELECT ${listColumns},
              snippet(articles_fts, 2, '<mark>', '</mark>', '…', 18) AS snippet
       FROM articles_fts f JOIN articles a ON a.id = f.rowid
       WHERE articles_fts MATCH ?
       ORDER BY bm25(articles_fts, 8.0, 4.0, 1.0, 2.0)
       LIMIT 100`,
    ),
    complete: db.prepare(
      `UPDATE articles SET status = 'ready', title = ?, dek = ?, body = ?, cover_image = ?, error = NULL
       WHERE id = ?`,
    ),
    fail: db.prepare(`UPDATE articles SET status = 'failed', error = ? WHERE id = ?`),
    reset: db.prepare(
      `UPDATE articles SET status = 'pending', error = NULL WHERE id = ? AND status = 'failed'`,
    ),
    pending: db.prepare(`SELECT id FROM articles WHERE status = 'pending' ORDER BY id`),
    remove: db.prepare(`DELETE FROM articles WHERE id = ?`),
  };

  return {
    create(source: string, sourceType: Article["source_type"], mode: Mode): number {
      const row = stmts.insert.get(source, sourceType, mode) as { id: number };
      return row.id;
    },
    get(id: number): Article | undefined {
      return stmts.get.get(id) as Article | undefined;
    },
    list(query?: string): ArticleSummary[] {
      const match = query ? toFtsQuery(query) : "";
      if (!match) return stmts.list.all() as unknown as ArticleSummary[];
      return stmts.search.all(match) as unknown as ArticleSummary[];
    },
    complete(id: number, a: { title: string; dek: string | null; body: string; cover: string | null }) {
      stmts.complete.run(a.title, a.dek, a.body, a.cover, id);
    },
    fail(id: number, error: string) {
      stmts.fail.run(error, id);
    },
    retry(id: number): boolean {
      return Number(stmts.reset.run(id).changes) > 0;
    },
    pendingIds(): number[] {
      return (stmts.pending.all() as { id: number }[]).map((r) => r.id);
    },
    remove(id: number): boolean {
      return Number(stmts.remove.run(id).changes) > 0;
    },
  };
}

export type Db = ReturnType<typeof openDb>;

/**
 * Turn free text into a safe FTS5 query: every word becomes a quoted prefix
 * term, so "photo synth" matches "photosynthesis" and punctuation can't break
 * the query syntax.
 */
export function toFtsQuery(input: string): string {
  const words = input.match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.map((w) => `"${w}"*`).join(" ");
}
