import Anthropic from "@anthropic-ai/sdk";
import type { Mode } from "./db.ts";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.ts";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface GenerateOptions {
  input: string;
  sourceType: "url" | "topic";
  mode: Mode;
  model: string;
  effort: Effort;
}

export interface GeneratedArticle {
  title: string;
  dek: string | null;
  body: string;
}

/** Function that turns an input into a Markdown article (swappable in tests). */
export type Generator = (opts: GenerateOptions) => Promise<string>;

// Server tools may pause a long research turn; we send it back to resume.
const MAX_CONTINUATIONS = 6;

export function createClaudeGenerator(client: Anthropic): Generator {
  return async ({ input, sourceType, mode, model, effort }) => {
    const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [
      { role: "user", content: buildUserPrompt(input, sourceType, mode) },
    ];

    for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
      const message = await client.beta.messages
        .stream({
          model,
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          output_config: { effort },
          tools: [
            { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6 },
            { type: "web_search_20260209", name: "web_search", max_uses: 6 },
          ],
          // If a safety classifier declines, let the API retry on its recommended fallback model.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          messages,
        })
        .finalMessage();

      if (message.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: message.content });
        continue;
      }
      if (message.stop_reason === "refusal") {
        throw new Error("Claude declined to write about this content.");
      }
      if (message.stop_reason === "max_tokens") {
        throw new Error("The article ran too long and was cut off. Try a narrower topic.");
      }

      const text = finalText(message.content);
      if (!text.trim()) throw new Error("Claude returned an empty article.");
      return text;
    }
    throw new Error("Research took too many steps. Try again or use a more specific link.");
  };
}

/**
 * The article is the run of text blocks after the last tool call/result.
 * (Text blocks can be split up by citations, so they are joined back together.)
 */
export function finalText(content: Anthropic.Beta.Messages.BetaContentBlock[]): string {
  let start = 0;
  content.forEach((block, i) => {
    if (block.type !== "text" && block.type !== "thinking" && block.type !== "redacted_thinking") {
      start = i + 1;
    }
  });
  return content
    .slice(start)
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

/** Split the model's Markdown into title, dek and body. */
export function parseArticle(markdown: string, fallbackTitle: string): GeneratedArticle {
  let text = markdown.replace(/\r\n/g, "\n").trim();

  // Drop any stray lead-in before the title heading.
  const h1 = text.search(/^# /m);
  if (h1 > 0) text = text.slice(h1);

  const lines = text.split("\n");
  let title = fallbackTitle;
  if (lines[0]?.startsWith("# ")) {
    title = lines.shift()!.slice(2).trim();
  }
  while (lines.length && !lines[0].trim()) lines.shift();

  let dek: string | null = null;
  if (lines[0]?.startsWith(">")) {
    dek = lines.shift()!.replace(/^>\s?/, "").trim() || null;
  }

  return { title, dek, body: lines.join("\n").trim() };
}

/** Decide whether the input is a link or a topic, normalizing bare domains. */
export function classifyInput(raw: string): { input: string; sourceType: "url" | "topic" } {
  const input = raw.trim();
  const candidate = /^https?:\/\//i.test(input)
    ? input
    : /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(input)
      ? `https://${input}`
      : null;
  if (candidate) {
    try {
      const url = new URL(candidate);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { input: url.toString(), sourceType: "url" };
      }
    } catch {
      // not a URL; treat as topic
    }
  }
  return { input, sourceType: "topic" };
}

/** Best-effort lookup of a page's share image (og:image) to use as a cover. */
export async function fetchCoverImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; Folio/1.0)", accept: "text/html" },
    });
    if (!res.ok || !res.headers.get("content-type")?.includes("html")) return null;
    const html = (await res.text()).slice(0, 400_000);
    const meta =
      html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i)?.[0] ?? "";
    const content = meta.match(/content=["']([^"']+)["']/i)?.[1];
    if (!content) return null;
    const url = new URL(content.replace(/&amp;/g, "&"), res.url);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Short, human-friendly error message for the UI. */
export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "The Anthropic API key is missing or invalid. Check ANTHROPIC_API_KEY.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Rate limited by the API. Wait a minute and retry.";
  }
  if (err instanceof Anthropic.APIError) {
    return `API error${err.status ? ` ${err.status}` : ""}: ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
