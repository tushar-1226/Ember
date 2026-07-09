/**
 * Ember — API client for the FastAPI memory-agent backend.
 * One typed function per backend task. Base URL is configurable via
 * NEXT_PUBLIC_API_URL (defaults to the local backend on :8080).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080";

async function getAuthToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    return (session as any)?.backendToken || null;
  }
  return null;
}

/**
 * A 401 means the session token the backend was handed is missing/expired/invalid.
 * There's nothing a retry or a generic error message can do about that — the only
 * correct move is to drop the (already-dead) client session and send the user back
 * to /login, rather than surface it as "couldn't reach Ember".
 */
async function handleUnauthorized(): Promise<void> {
  if (typeof window !== "undefined") {
    const { signOut } = await import("next-auth/react");
    await signOut({ callbackUrl: "/login" });
  }
}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** Shared fetch wrapper: attaches the bearer token and redirects to /login on 401. */
async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await authHeaders(init.headers as unknown as Record<string, string> | undefined);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    await handleUnauthorized();
    throw new Error("Session expired. Please sign in again.");
  }
  return res;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await authFetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await authFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Auth  (task: create an account / verify credentials)
// ---------------------------------------------------------------------------
/** Registers a new account. Throws with the backend's own message on failure
 * (duplicate email, weak password, etc.) so the signup form can show it as-is. */
export async function registerAccount(email: string, password: string): Promise<{ id: string; email: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || "Could not create account.");
  }
  return res.json();
}

/** Permanently deletes the signed-in account and everything it owns. Irreversible. */
export async function deleteAccount(): Promise<void> {
  const res = await authFetch("/users/me", { method: "DELETE" });
  if (!res.ok) throw new Error(`delete account failed: ${res.status}`);
}

/** Wipes every stored memory (semantic facts + procedural workflows) for this user. Irreversible. */
export async function clearAllMemory(): Promise<void> {
  const res = await authFetch("/memory/clear", { method: "DELETE" });
  if (!res.ok) throw new Error(`clear memory failed: ${res.status}`);
}

/** Downloads everything Ember remembers about this user as a JSON file. */
export async function exportUserData(): Promise<Blob> {
  const res = await authFetch("/export/data");
  if (!res.ok) throw new Error(`data export failed: ${res.status}`);
  return res.blob();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SemanticMemory = {
  id: string;
  timestamp: string | null;
  confidence: number | null;
  fact: string;
  category: string;
  entity: string;
};

export type EpisodicMemory = {
  id: string;
  timestamp: string | null;
  confidence: number;
  summary: string;
  participants: string[];
  relevanceScore: number;
  sourceConversationId: string;
  tags: string[];
};

export type MemoryStats = {
  semantic_count: number;
  procedural_count: number;
  oldest_memory: string | null;
  newest_memory: string | null;
  avg_confidence: number | null;
};

export type ChatSummary = { id: string; title: string; updated_at: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// Memory  (task: recall what Ember knows)
// ---------------------------------------------------------------------------
export const getSemanticMemories = () =>
  getJSON<SemanticMemory[]>("/memory/semantic");

export const getEpisodicMemories = () =>
  getJSON<EpisodicMemory[]>("/memory/episodic");

export const getMemoryStats = () => getJSON<MemoryStats>("/memory/stats");

export const getMemoryGraph = () => getJSON<any>("/memory/graph");
export const getMemoryFacts = () => getJSON<any[]>("/memory/facts");
export async function deleteMemoryFact(id: string): Promise<void> {
  const res = await authFetch(`/memory/facts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete memory fact failed: ${res.status}`);
}

export type UserProfile = {
  preferred_language: string;
  asking_tone: string;
  user_style: string;
  last_updated: string | null;
};

export const getUserProfile = () => getJSON<UserProfile>("/dashboard/profile");


export const searchMemories = (q: string, topK = 5) =>
  getJSON<
    { id: string; memory_type: string; content: string; confidence: number }[]
  >(`/memory/search?q=${encodeURIComponent(q)}&top_k=${topK}`);

export const correctMemory = (id: string, correction: string) =>
  postJSON<{ status: string }>(`/memory/${id}/correct`, { correction });

// ---------------------------------------------------------------------------
// Proactive resurfacing  (task: the "I remembered this…" moment)
// ---------------------------------------------------------------------------
export type Resurfacing = {
  id: string;
  memory_id: string;
  memory_type: string;
  message: string;
  provenance: string;
  score: number;
  status: string;
  created_at: string | null;
};

export type ResurfacingReaction = "helpful" | "not_now" | "forget";

/** The current proactive nudge, or null when there's nothing worth surfacing. */
export const getPendingResurfacing = () =>
  getJSON<{ nudge: Resurfacing | null }>("/resurfacing/pending");

/** Record the user's response; reinforces or releases the source memory. */
export const reactToResurfacing = (id: string, reaction: ResurfacingReaction) =>
  postJSON<{ status: string }>(`/resurfacing/${id}/react`, { reaction });

// ---------------------------------------------------------------------------
// Chats  (task: manage conversation threads)
// ---------------------------------------------------------------------------
export const getChats = (projectId?: string) => 
  getJSON<ChatSummary[]>(projectId ? `/chats?project_id=${encodeURIComponent(projectId)}` : "/chats");
export const getChatHistory = (id: string) =>
  getJSON<ChatMessage[]>(`/chats/${id}`);

export async function deleteChat(id: string): Promise<void> {
  const res = await authFetch(`/chats/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete chat failed: ${res.status}`);
}

/** Render the given conversation to a PDF and return it as a downloadable blob. */
export async function exportChatPdf(
  title: string,
  messages: { role: string; content: string }[]
): Promise<Blob> {
  const res = await authFetch("/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, messages }),
  });
  if (!res.ok) throw new Error(`pdf export failed: ${res.status}`);
  return res.blob();
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const getProjects = () => getJSON<ProjectSummary[]>("/projects");
export const getProject = (id: string) => getJSON<ProjectSummary>(`/projects/${id}`);
export const createProject = (title: string, description: string = "") =>
  postJSON<{ id: string; title: string; description: string }>("/projects", { title, description });

export async function deleteProject(id: string): Promise<void> {
  const res = await authFetch(`/projects/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`delete project failed: ${res.status}`);
}

// ---------------------------------------------------------------------------
// File uploads  (task: attach a PDF / Excel / CSV / image to a conversation)
// ---------------------------------------------------------------------------
export type UploadedAttachment = {
  id: string;
  filename: string;
  type: string;
  chars: number;
};

/** Upload a file, scoped to a conversation thread, for retrieval during chat. */
export async function uploadFile(
  file: File,
  sessionId: string
): Promise<UploadedAttachment> {
  const form = new FormData();
  form.append("file", file);
  form.append("session_id", sessionId);
  const res = await authFetch("/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return res.json() as Promise<UploadedAttachment>;
}

// ---------------------------------------------------------------------------
// Chat streaming  (task: talk to Ember)
// ---------------------------------------------------------------------------
export type ChatStreamEvent =
  | { text: string }
  | { tool_start: string; tool_input?: unknown }
  | { tool_end: string }
  | { done: true; tokens_in?: number; tokens_out?: number }
  | { error: string };

// ---------------------------------------------------------------------------
// Ember Code  (task: browse a coding session's sandboxed workspace)
// ---------------------------------------------------------------------------
export type WorkspaceEntry = { path: string; type: "file" | "dir"; size: number };

export const getWorkspaceFiles = (threadId: string) =>
  getJSON<WorkspaceEntry[]>(`/code/files?thread_id=${encodeURIComponent(threadId)}`);

export const getWorkspaceFile = (threadId: string, path: string) =>
  getJSON<{ path: string; content: string }>(
    `/code/file?thread_id=${encodeURIComponent(threadId)}&path=${encodeURIComponent(path)}`
  );

export type ModelKey =
  | "nemotron"
  | "mistral"
  | "deepseek"
  | "gemma"
  | "qwen"
  | "glm"
  | "kimi"
  | "nvidia"
  | "indian";

export type ModelInfo = {
  key: ModelKey;
  label: string;
  ability: string;
  description: string;
  kind: "chat" | "image";
};

/** The models Ember can use, with each one's special ability (source of truth). */
export const getModels = () => getJSON<ModelInfo[]>("/models");

// ---------------------------------------------------------------------------
// Token usage  (task: how many tokens each model has generated)
// ---------------------------------------------------------------------------
export type TokenStat = { model: string; tokens_in: number; tokens_out: number };

/** Real per-model token totals, aggregated from the TokenUsage table. */
export const getTokenStats = () => getJSON<TokenStat[]>("/tokens/stats");

/**
 * Streams the assistant reply token-by-token from POST /chat/stream (SSE).
 * The browser EventSource can't POST, so we parse the SSE frames off fetch.
 */
export async function streamChat(
  params: {
    message: string;
    thread_id: string;
    model_key?: ModelKey;
    temporary?: boolean;
    project_id?: string;
    enable_web_search?: boolean;
  },
  onEvent: (e: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await authFetch("/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_key: "glm", ...params }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`chat stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line. sse-starlette emits CRLF
    // (\r\n\r\n); tolerate LF-only too. Splitting on "\n\n" alone would miss
    // \r\n\r\n and never yield a frame.
    const frames = buffer.split(/\r\n\r\n|\n\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        const trimmed = line.trimStart();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload) continue;
        try {
          onEvent(JSON.parse(payload) as ChatStreamEvent);
        } catch {
          /* ignore keep-alive / non-JSON lines */
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Flower API
// ---------------------------------------------------------------------------
export type FlowerConnection = {
  provider: string;
  status: string;
  last_synced: string | null;
};

export type FlowerEvent = {
  id: string;
  provider: string;
  summary: string;
  timestamp: string | null;
};

export const getFlowerConnections = () => getJSON<FlowerConnection[]>("/flower/connections");
export const getFlowerFeed = () => getJSON<FlowerEvent[]>("/flower/feed");
export const forceSyncFlower = () => postJSON<{ status: string }>("/flower/sync", {});
export const connectFlowerService = (provider: string, token?: string) => postJSON<{ status: string; provider: string }>("/flower/connect", { provider, token });
export type NotionDashboardData = {
  status: string;
  error?: string;
  databases: { id: string; title: string; url: string; last_edited: string }[];
  recent_pages: { id: string; title: string; url: string; last_edited: string }[];
};

export const getNotionDashboardData = () => getJSON<NotionDashboardData>("/flower/notion/dashboard");

export type FlowerSettings = {
  allow_notifications: boolean;
  morning_window: boolean;
  afternoon_window: boolean;
  evening_window: boolean;
  delivery_method: string;
};

export const getFlowerSettings = () => getJSON<FlowerSettings>("/flower/settings");
export const updateFlowerSettings = (settings: FlowerSettings) =>
  postJSON<{ status: string }>("/flower/settings", settings);

export async function clearAmbientFeed(): Promise<void> {
  const res = await authFetch("/flower/feed", { method: "DELETE" });
  if (!res.ok) throw new Error(`clear ambient feed failed: ${res.status}`);
}
