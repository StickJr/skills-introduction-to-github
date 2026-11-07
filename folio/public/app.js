import { marked } from "/vendor/marked.js";
import DOMPurify from "/vendor/purify.js";

const view = document.getElementById("view");
const POLL_MS = 4000;
let pollTimer = null;
let renderToken = 0;

// ---------- API ----------

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ---------- Helpers ----------

const MODE_LABEL = { summary: "Summary", tutor: "Tutor" };

function clone(id) {
  return document.getElementById(id).content.firstElementChild.cloneNode(true);
}

function domain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function shortDate(iso) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}

function kickerText(a) {
  const parts = [MODE_LABEL[a.mode]];
  if (a.source_type === "url") parts.push(domain(a.source));
  parts.push(shortDate(a.created_at));
  return parts.filter(Boolean).join("  ·  ");
}

function placeholderTitle(a) {
  return a.source_type === "url" ? domain(a.source) || a.source : a.source;
}

function stopPolling() {
  clearTimeout(pollTimer);
  pollTimer = null;
}

function poll(fn) {
  stopPolling();
  pollTimer = setTimeout(fn, POLL_MS);
}

// ---------- Router ----------

function route() {
  stopPolling();
  const token = ++renderToken;
  const hash = location.hash.replace(/^#/, "") || "/";
  const match = hash.match(/^\/a\/(\d+)$/);
  window.scrollTo(0, 0);
  if (match) return renderArticle(Number(match[1]), token);
  if (hash.startsWith("/new")) return renderNew(new URLSearchParams(hash.split("?")[1] || ""));
  return renderLibrary(token);
}

// Web Share Target: the OS opens /new?url=…&text=…  →  prefill the compose view.
if (location.pathname === "/new") {
  const p = new URLSearchParams(location.search);
  const shared = p.get("url") || (p.get("text") || "").match(/https?:\/\/\S+/)?.[0] || p.get("text") || p.get("title") || "";
  history.replaceState(null, "", `/#/new?input=${encodeURIComponent(shared)}`);
}


// ---------- Library ----------

let lastQuery = "";

function renderLibrary(token) {
  const el = clone("tpl-library");
  view.replaceChildren(el);
  const input = el.querySelector("input");
  const list = el.querySelector(".entries");
  const empty = el.querySelector(".empty");
  input.value = lastQuery;

  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { lastQuery = input.value.trim(); load(); }, 180);
  });

  async function load() {
    stopPolling();
    let articles;
    try {
      articles = await api(`/api/articles?q=${encodeURIComponent(lastQuery)}`);
    } catch (err) {
      list.innerHTML = `<li class="no-results"></li>`;
      list.firstChild.textContent = err.message;
      return;
    }
    if (token !== renderToken) return;

    empty.hidden = !(articles.length === 0 && !lastQuery);
    input.closest(".search").hidden = articles.length === 0 && !lastQuery;
    list.replaceChildren(...articles.map(entry));
    if (articles.length === 0 && lastQuery) {
      const li = document.createElement("li");
      li.className = "no-results";
      li.textContent = `Nothing matches “${lastQuery}”.`;
      list.append(li);
    }
    if (articles.some((a) => a.status === "pending")) poll(load);
  }

  load();
}

function entry(a) {
  const li = document.createElement("li");
  li.className = `entry ${a.status}`;
  const link = document.createElement("a");
  link.href = `#/a/${a.id}`;

  const title = document.createElement("h2");
  title.className = "entry-title";

  if (a.status === "ready") {
    title.textContent = a.title;
    link.append(title);
    if (a.snippet?.includes("<mark>")) {
      const snip = document.createElement("p");
      snip.className = "entry-snippet";
      snip.innerHTML = DOMPurify.sanitize(cleanSnippet(a.snippet), { ALLOWED_TAGS: ["mark"] });
      link.append(snip);
    } else if (a.dek) {
      const dek = document.createElement("p");
      dek.className = "entry-dek";
      dek.textContent = a.dek;
      link.append(dek);
    }
  } else {
    title.textContent = placeholderTitle(a);
    link.append(title);
    const note = document.createElement("p");
    note.className = "entry-dek" + (a.status === "pending" ? " pulse" : "");
    note.textContent = a.status === "pending" ? "Writing" : "Couldn’t create this one — tap to retry";
    link.append(note);
  }

  const kicker = document.createElement("p");
  kicker.className = "kicker";
  kicker.textContent = kickerText(a);
  link.append(kicker);

  li.append(link);
  return li;
}

// Search snippets come from raw Markdown; strip the syntax but keep <mark>.
function cleanSnippet(s) {
  return s
    .replaceAll("<mark>", "\u0001").replaceAll("</mark>", "\u0002")
    .replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c])
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/```\w*|[#*_`|]+|&gt;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replaceAll("\u0001", "<mark>").replaceAll("\u0002", "</mark>");
}

// ---------- New ----------

function renderNew(params) {
  const el = clone("tpl-new");
  view.replaceChildren(el);
  const form = el.querySelector(".step-input");
  const textarea = form.querySelector("textarea");
  const modeStep = el.querySelector(".step-mode");
  const preview = el.querySelector(".source-preview");
  const error = el.querySelector(".form-error");

  textarea.value = params.get("input") || "";
  setTimeout(() => textarea.focus(), 50);

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = textarea.value.trim();
    if (!value) return;
    preview.textContent = value.length > 120 ? value.slice(0, 117) + "…" : value;
    form.hidden = true;
    modeStep.hidden = false;
    error.hidden = true;
    modeStep.querySelector(".mode").focus();
  });

  el.querySelector(".back").addEventListener("click", () => {
    modeStep.hidden = true;
    form.hidden = false;
    textarea.focus();
  });

  for (const btn of el.querySelectorAll(".mode")) {
    btn.addEventListener("click", async () => {
      el.querySelectorAll(".mode").forEach((b) => (b.disabled = true));
      try {
        const article = await api("/api/articles", {
          method: "POST",
          body: JSON.stringify({ input: textarea.value.trim(), mode: btn.dataset.mode }),
        });
        location.hash = `#/a/${article.id}`;
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
        el.querySelectorAll(".mode").forEach((b) => (b.disabled = false));
      }
    });
  }
}

// ---------- Article ----------

async function renderArticle(id, token) {
  let a;
  try {
    a = await api(`/api/articles/${id}`);
  } catch (err) {
    view.innerHTML = `<p class="no-results"></p>`;
    view.firstChild.textContent = err.message === "Not found" ? "This article no longer exists." : err.message;
    return;
  }
  if (token !== renderToken) return;

  const el = clone("tpl-article");
  view.replaceChildren(el);
  el.querySelector(".kicker").textContent = kickerText(a);
  const status = el.querySelector(".status");
  const foot = el.querySelector(".article-foot");

  const sourceLink = el.querySelector(".source-link");
  if (a.source_type === "url") sourceLink.href = a.source;
  else sourceLink.hidden = true;

  el.querySelector(".delete").addEventListener("click", async () => {
    if (!confirm("Delete this from your library?")) return;
    await api(`/api/articles/${id}`, { method: "DELETE" });
    location.hash = "#/";
  });

  if (a.status === "pending") {
    document.title = "Writing… · Folio";
    el.querySelector(".title").textContent = placeholderTitle(a);
    status.hidden = false;
    status.innerHTML = `<p class="pulse">Writing your ${MODE_LABEL[a.mode].toLowerCase()}</p>
      <p>This usually takes a minute or two. You can leave — it will be waiting in your library.</p>`;
    foot.hidden = false;
    poll(() => token === renderToken && renderArticle(id, token));
    return;
  }

  if (a.status === "failed") {
    document.title = "Folio";
    el.querySelector(".title").textContent = placeholderTitle(a);
    status.hidden = false;
    status.innerHTML = `<p>Something went wrong while writing this.</p><p class="kicker err"></p>
      <button type="button" class="button retry">Try again</button>`;
    status.querySelector(".err").textContent = a.error || "";
    status.querySelector(".retry").addEventListener("click", async () => {
      await api(`/api/articles/${id}/retry`, { method: "POST" });
      route();
    });
    foot.hidden = false;
    return;
  }

  document.title = `${a.title} · Folio`;
  el.querySelector(".title").textContent = a.title;
  el.querySelector(".dek").textContent = a.dek || "";
  foot.hidden = false;

  if (a.cover_image) {
    const fig = el.querySelector(".cover");
    const img = fig.querySelector("img");
    img.addEventListener("load", () => (fig.hidden = false));
    img.addEventListener("error", () => fig.remove());
    img.src = a.cover_image;
  }

  const prose = el.querySelector(".prose");
  renderMarkdown(prose, a.body || "");
}

function renderMarkdown(container, markdown) {
  const html = DOMPurify.sanitize(marked.parse(markdown, { gfm: true }), {
    ADD_ATTR: ["target"],
  });
  container.innerHTML = html;

  for (const link of container.querySelectorAll("a[href]")) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  for (const img of container.querySelectorAll("img")) {
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      // Hide images that fail to load, along with their caption line.
      const p = img.closest("p");
      const next = p?.nextElementSibling;
      if (next?.matches("p") && next.children.length === 1 && next.firstElementChild.tagName === "EM" && next.textContent === next.firstElementChild.textContent) next.remove();
      if (p && p.textContent.trim() === "") p.remove(); else img.remove();
    });
  }

  const diagrams = [...container.querySelectorAll("pre > code.language-mermaid")];
  if (diagrams.length) renderDiagrams(diagrams);
}

let mermaidReady = null;

async function renderDiagrams(blocks) {
  if (!mermaidReady) {
    mermaidReady = import("/vendor/mermaid.js").then(({ default: mermaid }) => {
      const dark = matchMedia("(prefers-color-scheme: dark)").matches;
      const css = getComputedStyle(document.documentElement);
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: css.getPropertyValue("--serif"),
        themeVariables: {
          fontSize: "15px",
          background: css.getPropertyValue("--paper").trim(),
          primaryColor: css.getPropertyValue("--tint").trim(),
          primaryBorderColor: css.getPropertyValue("--muted").trim(),
          primaryTextColor: css.getPropertyValue("--ink").trim(),
          lineColor: css.getPropertyValue("--muted").trim(),
          secondaryColor: dark ? "#2a2824" : "#e9e5da",
          tertiaryColor: css.getPropertyValue("--paper").trim(),
          darkMode: dark,
        },
      });
      return mermaid;
    });
  }
  const mermaid = await mermaidReady;

  for (const code of blocks) {
    const pre = code.parentElement;
    const id = `diagram-${Math.random().toString(36).slice(2)}`;
    try {
      let source = code.textContent;
      // Sideways flowcharts get tiny on a phone; stack them vertically instead.
      if (innerWidth < 640) source = source.replace(/^(\s*(?:flowchart|graph))\s+(LR|RL)\b/m, "$1 TD");
      const { svg } = await mermaid.render(id, source);
      const figure = document.createElement("figure");
      figure.className = "diagram";
      figure.innerHTML = svg;
      pre.replaceWith(figure);
    } catch {
      // Leave the diagram source visible if it can't be drawn.
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
    }
  }
}

// ---------- Start ----------

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
