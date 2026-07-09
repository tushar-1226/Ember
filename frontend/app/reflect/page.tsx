"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModelPicker } from "@/components/model-picker";
import { Sidebar } from "@/components/sidebar";
import { CustomizePanel } from "@/components/customize-panel";
import { MessageContent } from "@/components/message-content";
import {
  streamChat,
  getModels,
  getChats,
  getChatHistory,
  deleteChat,
  uploadFile,
  exportChatPdf,
  type ModelKey,
  type ModelInfo,
  type ChatSummary,
  type UploadedAttachment,
} from "@/lib/api";

// One line per hour (index = local hour 0–23), tuned to the time of day.
const HOURLY_PROMPTS = [
  "What's still awake with you tonight?",       // 12am
  "What's keeping you up right now?",           // 1am
  "What's on your mind in these small hours?",  // 2am
  "What's stirring in the quiet of the night?", // 3am
  "What's with you before the dawn?",           // 4am
  "What's rising with you this early?",         // 5am
  "What's on your mind as the day begins?",     // 6am
  "What are you carrying into this morning?",   // 7am
  "What's on your mind this morning?",          // 8am
  "What's taking shape as your day starts?",    // 9am
  "What's occupying your morning?",             // 10am
  "What's on your mind before noon?",           // 11am
  "What's sitting with you midday?",            // 12pm
  "What's on your mind this afternoon?",        // 1pm
  "What's turning over in your afternoon?",     // 2pm
  "What's on your mind as the day settles?",    // 3pm
  "What's with you this late afternoon?",       // 4pm
  "What are you winding down with?",            // 5pm
  "What's on your mind this evening?",          // 6pm
  "What's settling in as evening falls?",       // 7pm
  "What's on your mind tonight?",               // 8pm
  "What's sitting with you tonight?",           // 9pm
  "What's sitting on your mind tonight?",       // 10pm
  "What's lingering as the night deepens?",     // 11pm
];

function promptForNow() {
  return HOURLY_PROMPTS[new Date().getHours()];
}

const ACCEPT = ".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.gif,.webp,image/*";

type Msg = { role: "user" | "assistant"; content: string };
type Att = UploadedAttachment & { previewUrl?: string };

function makeThreadId(prefix = "reflect") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isImage(type: string) {
  return ["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(type.toLowerCase());
}

export default function ReflectPage() {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const [model, setModel] = useState<ModelKey>("glm");
  const [defaultModel, setDefaultModel] = useState<ModelKey>("glm");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [threadId, setThreadId] = useState<string>("");
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [attachments, setAttachments] = useState<Att[]>([]);
  const [uploading, setUploading] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  // Start with the 10pm line so server and first client render match, then
  // switch to the real hour after mount to avoid a hydration mismatch.
  const [prompt, setPrompt] = useState(HOURLY_PROMPTS[22]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Stable thread id per browser so the conversation continues across visits.
  useEffect(() => {
    let id = localStorage.getItem("ember_thread");
    if (!id) {
      id = makeThreadId();
      localStorage.setItem("ember_thread", id);
    }
    setThreadId(id);
  }, []);

  // Pick the line for the current hour, then refresh it on each hour boundary.
  useEffect(() => {
    setPrompt(promptForNow());
    let timer: ReturnType<typeof setTimeout>;
    const scheduleNextHour = () => {
      const now = new Date();
      const msToNextHour =
        (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1_000 - now.getMilliseconds();
      timer = setTimeout(() => {
        setPrompt(promptForNow());
        scheduleNextHour();
      }, msToNextHour);
    };
    scheduleNextHour();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getModels().then(setModels).catch(() => setModels([]));
    loadChats();
    const stored = localStorage.getItem("ember_default_model") as ModelKey | null;
    if (stored) {
      setDefaultModel(stored);
      setModel(stored);
    }
  }, []);

  function changeDefaultModel(key: ModelKey) {
    setDefaultModel(key);
    setModel(key);
    localStorage.setItem("ember_default_model", key);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function loadChats() {
    getChats().then(setChats).catch(() => setChats([]));
  }

  function newChat(temp = false) {
    const id = makeThreadId(temp ? "temp" : "reflect");
    setThreadId(id);
    setMessages([]);
    setAttachments([]);
    setValue("");
    setTemporary(temp);
    setModel(defaultModel);
    if (!temp) localStorage.setItem("ember_thread", id);
  }

  async function selectChat(id: string) {
    setThreadId(id);
    setTemporary(false);
    setAttachments([]);
    localStorage.setItem("ember_thread", id);
    try {
      const history = await getChatHistory(id);
      setMessages(
        history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({ role: m.role, content: m.content }))
      );
    } catch {
      setMessages([]);
    }
  }

  async function removeChat(id: string) {
    try {
      await deleteChat(id);
    } catch {
      /* ignore */
    }
    setChats((c) => c.filter((x) => x.id !== id));
    if (id === threadId) newChat();
  }

  async function onFiles(list: FileList | null) {
    if (!list || !threadId) return;
    setUploading(true);
    for (const file of Array.from(list)) {
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      try {
        const att = await uploadFile(file, threadId);
        setAttachments((a) => [...a, { ...att, previewUrl }]);
      } catch {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((x) => {
      const target = x.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return x.filter((f) => f.id !== id);
    });
  }

  function toggleTemporary() {
    newChat(!temporary);
  }

  const [exporting, setExporting] = useState(false);
  async function downloadPdf() {
    if (exporting || messages.length === 0) return;
    setExporting(true);
    try {
      const title =
        messages.find((m) => m.role === "user")?.content.slice(0, 60) || "Ember conversation";
      const blob = await exportChatPdf(title, messages);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ember-conversation.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setExporting(false);
    }
  }

  async function send() {
    const text = value.trim();
    if ((!text && attachments.length === 0) || streaming || !threadId) return;
    setValue("");
    const attNote =
      attachments.length > 0
        ? `\n\n📎 ${attachments.map((a) => a.filename).join(", ")}`
        : "";
    setMessages((m) => [
      ...m,
      { role: "user", content: text + attNote },
      { role: "assistant", content: "" },
    ]);
    attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setStreaming(true);
    setTool(null);

    try {
      await streamChat(
        { message: text || "Please look at the attached file.", thread_id: threadId, model_key: model, temporary, enable_web_search: webSearchEnabled },
        (e) => {
          if ("text" in e) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: "assistant",
                content: copy[copy.length - 1].content + e.text,
              };
              return copy;
            });
          } else if ("tool_start" in e) {
            setTool(e.tool_start);
          } else if ("tool_end" in e) {
            setTool(null);
          } else if ("error" in e) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: "⚠️ Something went wrong reaching Ember." };
              return copy;
            });
          }
        }
      );
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "⚠️ Couldn't reach the backend. Is it running on :8080?" };
        return copy;
      });
    } finally {
      setStreaming(false);
      setTool(null);
      if (!temporary) loadChats();
    }
  }

  const started = messages.length > 0;

  return (
    <div className="h-[100dvh] overflow-hidden">
      <Sidebar
        chats={chats}
        activeId={threadId}
        onNewChat={() => newChat(false)}
        onSelectChat={selectChat}
        onDeleteChat={removeChat}
        onOpenCustomize={() => setCustomizeOpen(true)}
      />

      <CustomizePanel
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        models={models}
        defaultModel={defaultModel}
        onDefaultModelChange={changeDefaultModel}
      />

      <main className="relative flex h-[100dvh] w-full flex-col items-center overflow-hidden bg-background px-6 md:pl-64">

        {/* Export PDF (top-right, only with a conversation) */}
        {started && (
          <button
            onClick={downloadPdf}
            data-cursor="hot"
            title="Download this conversation as a PDF"
            className="absolute right-5 top-16 z-20 flex items-center gap-2 rounded-full border border-border-soft bg-surface/60 px-3 py-1.5 text-[12px] text-muted backdrop-blur transition-colors hover:text-foreground disabled:opacity-50"
            disabled={exporting}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "PDF"}</span>
          </button>
        )}

        {/* Temporary-chat toggle (top-right) */}
        <button
          onClick={toggleTemporary}
          data-cursor="hot"
          title={temporary ? "Temporary chat is on — nothing is saved" : "Start a temporary chat"}
          className={`absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] backdrop-blur transition-colors ${
            temporary
              ? "border-ember-amber/50 bg-ember-amber/10 text-ember-gold"
              : "border-border-soft bg-surface/60 text-muted hover:text-foreground"
          }`}
        >
          {/* ghost / incognito icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 3a7 7 0 0 0-7 7v9l2.5-1.5L10 20l2-1.5L14 20l2.5-1.5L19 19v-9a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <circle cx="9.5" cy="10.5" r="1" fill="currentColor" />
            <circle cx="14.5" cy="10.5" r="1" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">{temporary ? "Temporary" : "Temporary chat"}</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`relative z-10 flex min-h-0 w-full max-w-3xl flex-1 flex-col ${
            started ? "pt-20 pb-6" : "justify-center"
          }`}
        >
          {!started && (
            <div className="mb-10 text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-faint">
                {temporary ? "Temporary" : "Tonight"}
              </p>
              <h1 className="mx-auto mt-5 max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
                {prompt}
              </h1>
              <p className="mt-5 text-[15px] text-muted">
                A quiet space to think out loud — Ember keeps what matters.
              </p>
            </div>
          )}

          {/* Conversation */}
          {started && (
            <div ref={scrollRef} data-lenis-prevent className="mb-4 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-[15px] text-void"
                          : "max-w-[85%] overflow-hidden rounded-2xl rounded-bl-md border border-border-soft bg-surface/80 px-4 py-2.5 text-[15px] leading-relaxed text-foreground backdrop-blur"
                      }
                    >
                      {m.content ? (
                        m.role === "assistant" ? (
                          <MessageContent content={m.content} />
                        ) : (
                          m.content
                        )
                      ) : streaming && i === messages.length - 1 ? (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ember-amber" />
                          {tool ? `using ${tool}…` : "thinking…"}
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Composer */}
          <div className="rounded-[32px] border border-border-soft bg-surface/50 p-3 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors focus-within:border-white/20 focus-within:shadow-[0_0_36px_rgba(255,255,255,0.06)]">
            {/* Attachment chips (file names show in the composer corner) */}
            <AnimatePresence>
              {(attachments.length > 0 || uploading) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 px-3 pt-2"
                >
                  {attachments.map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex max-w-[220px] items-center gap-2 rounded-lg border border-border-soft bg-raised/70 py-1.5 pl-1.5 pr-2.5 text-[12px] text-foreground"
                    >
                      {a.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.previewUrl} alt={a.filename} className="h-7 w-7 shrink-0 rounded object-cover" />
                      ) : (
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded ${isImage(a.type) ? "bg-ember-coral/20 text-ember-coral" : "bg-ember-amber/15 text-ember-amber"}`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                            {isImage(a.type) ? (
                              <path d="M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            ) : (
                              <path d="M14 3v5h5M7 3h8l5 5v13H7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            )}
                          </svg>
                        </span>
                      )}
                      <span className="truncate">{a.filename}</span>
                      <button
                        onClick={() => removeAttachment(a.id)}
                        className="shrink-0 text-faint hover:text-ember-coral"
                        aria-label="Remove attachment"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      </button>
                    </span>
                  ))}
                  {uploading && (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border-soft bg-raised/70 px-2.5 py-1.5 text-[12px] text-muted">
                      <span className="h-1.5 w-1.5 animate-flicker rounded-full bg-ember-amber" />
                      uploading…
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={started ? 2 : 5}
              placeholder="Tell Ember anything. It will remember what matters."
              className="w-full resize-none bg-transparent px-5 py-4 text-[17px] leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2 px-3 pb-2">
              <div className="flex min-w-0 items-center gap-2">
                {/* Upload button */}
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  data-cursor="hot"
                  title="Attach PDF, Excel, CSV or image"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border-soft bg-surface/60 text-muted transition-colors hover:border-ember-amber/40 hover:text-foreground"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
                <button 
                  type="button"
                  onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${webSearchEnabled ? 'border-ember-amber/40 bg-ember-amber/10 text-ember-amber hover:bg-ember-amber/20' : 'border-border-soft bg-surface/60 text-muted hover:border-ember-amber/40 hover:text-foreground'}`}
                  title={webSearchEnabled ? "Web Search enabled" : "Web Search disabled"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </button>
                <ModelPicker models={models} value={model} onChange={setModel} />
                <span className="hidden truncate font-mono text-[11px] text-faint sm:inline">
                  {temporary ? "temporary · not saved" : "private · remembered"}
                </span>
              </div>
              <button
                data-cursor="hot"
                onClick={send}
                disabled={(!value.trim() && attachments.length === 0) || streaming}
                className="shrink-0 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-void transition-transform enabled:hover:scale-[1.03] disabled:opacity-30"
              >
                {streaming ? "…" : "Reflect"}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
