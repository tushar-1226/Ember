"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ModelPicker } from "@/components/model-picker";
import { MessageContent } from "@/components/message-content";
import { EmberCritter } from "@/components/ember-critter";
import {
  streamChat,
  getModels,
  getWorkspaceFiles,
  getWorkspaceFile,
  type ModelKey,
  type ModelInfo,
  type WorkspaceEntry,
} from "@/lib/api";
import { loadProfile } from "@/lib/preferences";

/* --------------------------------------------------------------------------
 * Ember Code — an agentic coding console in Ember's monochrome system.
 * Wired to Ember's live agent: it reads/writes/edits/runs files in a per-session
 * sandboxed workspace, streams each action into a timeline, and lets you browse
 * the resulting files.
 * ------------------------------------------------------------------------ */

type Step = { tool: string; target: string };
type Msg = { role: "user" | "assistant"; content: string; steps?: Step[] };
type Session = { id: string; title: string };

const REASONING = ["Low", "Medium", "High"] as const;
const MODES = ["Accept edits", "Plan", "Ask first"] as const;

const TOOL_LABEL: Record<string, string> = {
  read_file: "Read",
  write_file: "Wrote",
  edit_file: "Edited",
  list_dir: "Listed",
  run_command: "Ran",
  scrape_url: "Fetched",
  google_search: "Searched",
  generate_image: "Generated image",
};

function toStep(tool: string, input: unknown): Step {
  const o = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const target = o.path ?? o.command ?? o.url ?? o.query ?? o.prompt ?? "";
  return { tool, target: String(target) };
}

function newThreadId() {
  return `code-${Math.random().toString(36).slice(2, 10)}`;
}

const I = {
  plus: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  artifacts: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  customize: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9h6M7 13h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  chevron: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  env: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M4 15a4 4 0 0 1 .5-8 5.5 5.5 0 0 1 10.6-1.4A4.5 4.5 0 1 1 17 15z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  code: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  branch: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 8.5v7M8.5 6H14a4 4 0 0 1 4 4v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  files: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="15" height="15" className={p.className}>
      <path d="M4 4h5l2 2h9v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  ),
  file: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  folder: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  refresh: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="15" height="15" className={p.className}>
      <path d="M20 11a8 8 0 1 0-.5 4M20 5v6h-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  attach: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  mic: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" className={p.className}>
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  send: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  menu: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className={p.className}>
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  close: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={p.className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  eye: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  copy: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  download: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M12 3v13m0 0l-4.5-4.5M12 16l4.5-4.5M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  expand: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M9 4H4v5M15 20h5v-5M4 4l6 6M20 20l-6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  collapse: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M4 9h5V4M20 15h-5v5M9 9L3 3M15 15l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  check: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" className={p.className}>
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

type ArtifactKind = "svg" | "html" | "markdown" | "code" | "text";

const ARTIFACT_META: Record<string, { label: string; kind: ArtifactKind }> = {
  svg: { label: "Image · SVG", kind: "svg" },
  html: { label: "Web · HTML", kind: "html" },
  htm: { label: "Web · HTML", kind: "html" },
  md: { label: "Document · Markdown", kind: "markdown" },
  json: { label: "Data · JSON", kind: "code" },
  py: { label: "Code · Python", kind: "code" },
  js: { label: "Code · JavaScript", kind: "code" },
  jsx: { label: "Code · JavaScript", kind: "code" },
  ts: { label: "Code · TypeScript", kind: "code" },
  tsx: { label: "Code · TypeScript", kind: "code" },
  css: { label: "Code · CSS", kind: "code" },
  sh: { label: "Code · Shell", kind: "code" },
  yml: { label: "Data · YAML", kind: "code" },
  yaml: { label: "Data · YAML", kind: "code" },
  txt: { label: "Text", kind: "text" },
};

function artifactMeta(path: string): { label: string; kind: ArtifactKind } {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ARTIFACT_META[ext] ?? { label: ext ? `${ext.toUpperCase()} file` : "File", kind: "text" };
}

const PREVIEWABLE: ArtifactKind[] = ["svg", "html", "markdown"];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-soft bg-raised/60 px-2.5 py-1.5 text-[12px] text-muted">
      <span className="text-faint">{icon}</span>
      {children}
    </span>
  );
}

function StepRow({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border-soft bg-surface/60 px-2.5 py-1.5 font-mono text-[12px]">
      <span className="shrink-0 text-faint">{TOOL_LABEL[step.tool] ?? step.tool}</span>
      {step.target && <span className="truncate text-foreground">{step.target}</span>}
    </div>
  );
}

/** Inline artifact card — like Claude's file cards in chat. Click opens the side panel. */
function ArtifactCard({ path, onOpen, onDownload }: { path: string; onOpen: () => void; onDownload: () => void }) {
  const { label } = artifactMeta(path);
  const name = path.split("/").pop() || path;
  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border-soft bg-raised/60 py-2 pl-2.5 pr-2 transition-colors hover:border-border hover:bg-raised">
      <button onClick={onOpen} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface text-faint">
        <I.file />
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
        <span className="block text-[11px] text-faint">{label}</span>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        className="shrink-0 rounded-md border border-border-soft px-2.5 py-1.5 text-[12px] text-muted transition-colors hover:text-foreground"
      >
        Download
      </button>
    </div>
  );
}

export default function EmberCodePage() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModel] = useState<ModelKey>("glm");
  const [threadId, setThreadId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]>("Accept edits");
  const [reasoning, setReasoning] = useState<(typeof REASONING)[number]>("High");
  const [drawer, setDrawer] = useState(false);

  // Files / artifact panel
  const [filesOpen, setFilesOpen] = useState(false);
  const [files, setFiles] = useState<WorkspaceEntry[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [panelTab, setPanelTab] = useState<"preview" | "code">("code");
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setThreadId(newThreadId());
    setName(loadProfile().callYou || loadProfile().fullName || "");
    getModels().then(setModels).catch(() => setModels([]));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function refreshFiles(id = threadId) {
    if (!id) return;
    getWorkspaceFiles(id).then(setFiles).catch(() => setFiles([]));
  }

  function openFile(path: string) {
    setActiveFile(path);
    setFileContent("Loading…");
    setPanelTab(PREVIEWABLE.includes(artifactMeta(path).kind) ? "preview" : "code");
    getWorkspaceFile(threadId, path)
      .then((r) => setFileContent(r.content))
      .catch(() => setFileContent("Couldn't read file."));
  }

  function openArtifact(path: string) {
    setFilesOpen(true);
    openFile(path);
  }

  function copyFileContent() {
    navigator.clipboard?.writeText(fileContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function downloadFile(path: string) {
    getWorkspaceFile(threadId, path)
      .then((r) => downloadText(path.split("/").pop() || path, r.content))
      .catch(() => {});
  }

  function newSession() {
    setThreadId(newThreadId());
    setMessages([]);
    setValue("");
    setActiveSession("");
    setFiles([]);
    setActiveFile(null);
    setDrawer(false);
  }

  async function send() {
    const text = value.trim();
    if (!text || streaming || !threadId) return;
    setValue("");

    if (messages.length === 0) {
      setSessions((s) => [{ id: threadId, title: text.slice(0, 40) }, ...s].slice(0, 20));
      setActiveSession(threadId);
    }

    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "", steps: [] }]);
    setStreaming(true);
    setTool(null);

    const pushStep = (step: Step) =>
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        copy[copy.length - 1] = { ...last, steps: [...(last.steps ?? []), step] };
        return copy;
      });

    try {
      await streamChat({ message: text, thread_id: threadId, model_key: model }, (e) => {
        if ("text" in e) {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + e.text };
            return copy;
          });
        } else if ("tool_start" in e) {
          setTool(e.tool_start);
          pushStep(toStep(e.tool_start, e.tool_input));
        } else if ("tool_end" in e) {
          setTool(null);
        } else if ("error" in e) {
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { ...copy[copy.length - 1], content: "Something went wrong reaching Ember." };
            return copy;
          });
        }
      });
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: "Couldn't reach the backend. Is it running on :8080?" };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTool(null);
      refreshFiles(); // the agent may have created/changed files
    }
  }

  const started = messages.length > 0;

  const sidebar = (
    <div className="flex h-full w-64 flex-col border-r border-border-soft bg-surface">
      <div className="flex items-center gap-2 px-4 pb-1 pt-5">
        <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">Ember Code</span>
        <span className="rounded-full border border-accent/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-accent">Preview</span>
      </div>

      <div className="px-3 pt-3">
        <button onClick={newSession} className="flex w-full items-center gap-2.5 rounded-lg bg-raised px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-overlay">
          <I.plus className="text-accent" /> New session
        </button>
      </div>

      <nav className="mt-2 space-y-0.5 px-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-raised/60 hover:text-foreground">
          <I.artifacts className="text-faint" /> Artifacts
        </button>
        <Link href="/settings" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-raised/60 hover:text-foreground">
          <I.customize className="text-faint" /> Customize
        </Link>
        <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-raised/60 hover:text-foreground">
          <I.chevron className="text-faint" /> More
        </button>
      </nav>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-lenis-prevent>
        <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Recents</p>
        {sessions.length === 0 ? (
          <p className="px-3 py-2 text-[13px] text-faint">No sessions yet.</p>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((s) => {
              const active = s.id === activeSession;
              return (
                <div key={s.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${active ? "bg-raised text-foreground" : "text-muted"}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-accent" : "bg-faint"}`} />
                  <span className="truncate">{s.title || "Untitled"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border-soft px-3 py-3">
        <Link href="/settings" className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-raised/60">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-raised text-xs font-semibold text-foreground">{(name || "T").charAt(0).toUpperCase()}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">{name || "tushar"}</p>
            <p className="text-[11px] text-faint">Pro</p>
          </div>
          <I.chevron className="shrink-0 text-faint" />
        </Link>
      </div>
    </div>
  );

  const activeMeta = activeFile ? artifactMeta(activeFile) : null;
  const canPreview = activeMeta ? PREVIEWABLE.includes(activeMeta.kind) : false;

  const filesPanel = (
    <div className={`flex h-full w-full flex-col border-l border-border-soft bg-surface ${panelExpanded ? "md:w-[46rem]" : "md:w-80"}`}>
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          <I.files className="shrink-0 text-faint" />
          <span className="truncate">{activeFile ? activeFile.split("/").pop() : "Workspace"}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {activeFile ? (
            <button onClick={() => setActiveFile(null)} className="rounded-md px-2 py-1 text-[12px] text-muted hover:text-foreground">Back</button>
          ) : (
            <button onClick={() => refreshFiles()} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:text-foreground" title="Refresh"><I.refresh /></button>
          )}
          {activeFile && (
            <>
              <button onClick={copyFileContent} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:text-foreground" title="Copy">
                {copied ? <I.check className="text-accent" /> : <I.copy />}
              </button>
              <button onClick={() => downloadFile(activeFile)} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:text-foreground" title="Download"><I.download /></button>
              <button onClick={() => setPanelExpanded((e) => !e)} className="hidden h-7 w-7 place-items-center rounded-md text-faint hover:text-foreground md:grid" title={panelExpanded ? "Collapse" : "Expand"}>
                {panelExpanded ? <I.collapse /> : <I.expand />}
              </button>
            </>
          )}
          <button onClick={() => setFilesOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-faint hover:text-foreground" title="Close"><I.close /></button>
        </div>
      </div>

      {activeFile ? (
        <>
          {canPreview && (
            <div className="flex items-center gap-1 border-b border-border-soft px-3 py-2">
              <button
                onClick={() => setPanelTab("preview")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${panelTab === "preview" ? "bg-raised text-foreground" : "text-muted hover:text-foreground"}`}
              >
                <I.eye /> Preview
              </button>
              <button
                onClick={() => setPanelTab("code")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${panelTab === "code" ? "bg-raised text-foreground" : "text-muted hover:text-foreground"}`}
              >
                <I.code /> Code
              </button>
            </div>
          )}

          {canPreview && panelTab === "preview" ? (
            <div className="min-h-0 flex-1 overflow-auto bg-background" data-lenis-prevent>
              {activeMeta?.kind === "svg" && (
                <div className="grid h-full place-items-center p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(fileContent)}`}
                    alt={activeFile}
                    className="max-h-full max-w-full"
                  />
                </div>
              )}
              {activeMeta?.kind === "html" && (
                <iframe title={activeFile} srcDoc={fileContent} sandbox="allow-scripts" className="h-full w-full border-0 bg-white" />
              )}
              {activeMeta?.kind === "markdown" && (
                <div className="p-4">
                  <MessageContent content={fileContent} />
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto" data-lenis-prevent>
              <pre className="whitespace-pre-wrap p-4 font-mono text-[12px] leading-relaxed text-foreground">{fileContent}</pre>
            </div>
          )}
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-2" data-lenis-prevent>
          {files.length === 0 ? (
            <p className="px-3 py-3 text-[13px] text-faint">Empty workspace. The agent&apos;s files will appear here.</p>
          ) : (
            files.map((f) => (
              <button
                key={f.path}
                onClick={() => f.type === "file" && openFile(f.path)}
                disabled={f.type === "dir"}
                style={{ paddingLeft: `${8 + (f.path.split("/").length - 1) * 14}px` }}
                className={`flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left font-mono text-[12px] ${
                  f.type === "dir" ? "text-faint" : "text-muted hover:bg-raised/60 hover:text-foreground"
                }`}
              >
                {f.type === "dir" ? <I.folder className="shrink-0 text-faint" /> : <I.file className="shrink-0 text-faint" />}
                <span className="truncate">{f.path.split("/").pop()}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex h-dvh w-dvw bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:block">{sidebar}</aside>

      {/* Mobile menu button */}
      <button onClick={() => setDrawer(true)} className="fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-lg border border-border-soft bg-surface/80 text-muted backdrop-blur md:hidden" aria-label="Open menu">
        <I.menu />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 400, damping: 40 }} className="fixed inset-y-0 left-0 z-50 md:hidden">
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main row: conversation + files */}
      <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto" data-lenis-prevent>
            {!started ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <div className="mb-5 flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full"><span className="h-2.5 w-2.5 rounded-full bg-accent" /></span>
                  <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-[28px]">What&apos;s up next{name ? `, ${name}` : ""}?</h1>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-border-soft bg-raised px-4 py-2.5 text-sm text-foreground">{m.content}</div>
                    </div>
                  ) : (
                    <div key={i} className="space-y-2">
                      {m.steps && m.steps.length > 0 && (
                        <div className="space-y-1">
                          {m.steps.map((s, si) =>
                            s.tool === "write_file" && s.target ? (
                              <ArtifactCard key={si} path={s.target} onOpen={() => openArtifact(s.target)} onDownload={() => downloadFile(s.target)} />
                            ) : (
                              <StepRow key={si} step={s} />
                            )
                          )}
                        </div>
                      )}
                      {m.content ? (
                        <div className="text-[15px] leading-relaxed text-foreground"><MessageContent content={m.content} /></div>
                      ) : (
                        <span className="font-mono text-[13px] text-faint">{tool ? `Working · ${TOOL_LABEL[tool] ?? tool}…` : "Thinking…"}</span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-4 pb-5 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Chip icon={<I.env />}>Session Workspace</Chip>
                <Chip icon={<I.code />}>SAdvisor</Chip>
                <Chip icon={<I.branch />}>main</Chip>
                <button className="grid h-8 w-8 place-items-center rounded-lg border border-border-soft bg-raised/60 text-faint transition-colors hover:text-foreground" title="Add context"><I.plus /></button>
                <button
                  onClick={() => { setFilesOpen((o) => !o); refreshFiles(); }}
                  className={`ml-auto inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors ${
                    filesOpen ? "border-border bg-raised text-foreground" : "border-border-soft bg-raised/60 text-muted hover:text-foreground"
                  }`}
                >
                  <I.files /> Files
                </button>
                <span className="hidden shrink-0 sm:block"><EmberCritter busy={streaming} unit={5} /></span>
              </div>

              <div className="rounded-2xl border border-border-soft bg-surface/60 p-2.5 backdrop-blur-xl focus-within:border-border">
                <div className="flex items-end gap-2">
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    rows={1}
                    placeholder="Describe a task or ask a question"
                    className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-faint"
                    data-lenis-prevent
                  />
                  <button onClick={send} disabled={!value.trim() || streaming} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-foreground text-void transition enabled:hover:scale-[1.04] disabled:opacity-30" aria-label="Send">
                    <I.send />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => setMode(MODES[(MODES.indexOf(mode) + 1) % MODES.length])} className="rounded-md px-2 py-1 text-[13px] text-muted transition-colors hover:bg-raised hover:text-foreground" title="Edit mode">{mode}</button>
                  <button className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-foreground" title="Attach"><I.attach /></button>
                  <button className="grid h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-raised hover:text-foreground" title="Voice"><I.mic /></button>
                </div>
                <div className="flex items-center gap-2">
                  {models.length > 0 && <ModelPicker models={models} value={model} onChange={setModel} />}
                  <button onClick={() => setReasoning(REASONING[(REASONING.indexOf(reasoning) + 1) % REASONING.length])} className="rounded-md px-2 py-1 text-[13px] text-muted transition-colors hover:bg-raised hover:text-foreground" title="Reasoning effort">{reasoning}</button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Files panel — desktop split */}
        {filesOpen && <aside className="hidden md:block">{filesPanel}</aside>}
      </div>

      {/* Files panel — mobile overlay */}
      <AnimatePresence>
        {filesOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 400, damping: 40 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-sm md:hidden">
            {filesPanel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
