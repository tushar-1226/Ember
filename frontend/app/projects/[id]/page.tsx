"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ModelPicker } from "@/components/model-picker";
import { motion, AnimatePresence } from "framer-motion";
import { getChats, getProject, getChatHistory, streamChat, getModels, deleteChat, type ChatSummary, type ProjectSummary, type ModelInfo, type ModelKey } from "@/lib/api";
import { MessageContent } from "@/components/message-content";


export default function ProjectDetailView({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.id;

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [model, setModel] = useState<ModelKey>("nemotron");
  const [isRecording, setIsRecording] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => prev + (prev ? " " : "") + transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  useEffect(() => {
    getChats(projectId).then(setChats).catch(() => setChats([]));
    getModels().then(setModels).catch(() => setModels([]));
    getProject(projectId).then(setProject).catch(console.error);
  }, [projectId]);

  useEffect(() => {
    if (activeThreadId) {
      getChatHistory(activeThreadId).then((history) => {
        setMessages(history.filter(m => m.role === "user" || m.role === "assistant") as any);
      }).catch(console.error);
    } else {
      setMessages([]);
    }
  }, [activeThreadId]);

  const handleSend = async () => {
    if (!value.trim() || streaming) return;
    const msg = value;
    setValue("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setStreaming(true);

    const threadId = activeThreadId || `c-${Math.random().toString(36).substring(2, 10)}`;
    if (!activeThreadId) {
      setActiveThreadId(threadId);
    }

    try {
      let assistantMsg = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      await streamChat(
        { message: msg, thread_id: threadId, project_id: projectId, model_key: model },
        (e) => {
          if ("text" in e) {
            assistantMsg += e.text;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1].content = assistantMsg;
              return next;
            });
          }
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
      getChats(projectId).then(setChats).catch(() => {});
    }
  };

  const renderComposer = (className = "") => (
    <div className={`relative rounded-3xl border border-border-soft bg-surface/50 p-2 shadow-lg backdrop-blur-xl transition-colors focus-within:border-white/20 ${className}`}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        rows={2}
        placeholder="Message Ember..."
        className="w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-faint focus:outline-none"
      />
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex gap-2">
          <button className="p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-surface">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button 
            className={`p-2 transition-colors rounded-full hover:bg-surface ${isRecording ? 'text-red-500 animate-pulse' : 'text-muted hover:text-foreground'}`}
            onClick={toggleRecording}
            title="Voice typing"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ModelPicker
            models={models}
            value={model}
            onChange={setModel}
          />
          <button className="text-muted hover:text-foreground transition-colors" onClick={handleSend}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] overflow-hidden bg-background">
      {/* Main App Sidebar */}
      <Sidebar
        chats={chats} // This is the global sidebar, it might make sense to leave it as global chats or hide it? We leave it for now.
        activeId=""
        onNewChat={() => {}}
        onSelectChat={() => {}}
      />

      <div className="flex h-full w-full md:pl-64">
        {/* Project Content Area */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-4 px-6 py-4">
            <Link href="/projects" className="text-muted hover:text-foreground transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div className="flex items-center gap-2 text-[13px] text-muted">
              <span>All projects</span>
              <span className="text-border-soft">/</span>
              <span className="text-foreground">{project?.title || "Loading..."}</span>
            </div>
            
            {activeThreadId && (
              <button 
                onClick={() => setActiveThreadId(null)}
                className="ml-auto text-[13px] font-medium text-foreground bg-surface/80 hover:bg-surface border border-border-soft px-3 py-1.5 rounded-full transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                New chat
              </button>
            )}
          </header>

          {!activeThreadId ? (
            // Landing Page View
            <div className="flex-1 overflow-y-auto px-6 py-12 flex flex-col items-center">
              <div className="w-full max-w-3xl flex flex-col justify-center min-h-[50vh]">
                <h2 className="text-5xl text-foreground font-display font-medium tracking-tight mb-12 text-left leading-tight">
                  {project?.title || "Loading..."}
                </h2>
                
                {renderComposer("mb-12 shadow-2xl")}

                {chats.length > 0 && (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-[11px] font-medium text-faint uppercase tracking-wider mb-4 px-2">Recent chats in this project</h3>
                    <div className="space-y-1">
                      {chats.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setActiveThreadId(c.id)} 
                          className="w-full text-left p-4 rounded-2xl hover:bg-surface/50 transition-colors border border-transparent hover:border-border-soft flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center text-muted group-hover:text-foreground transition-colors border border-border-soft">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <span className="text-foreground text-[14px] font-medium">{c.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-faint text-[12px] group-hover:text-muted transition-colors">
                              {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatToDelete(c.id);
                              }}
                              className="text-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                              aria-label="Delete chat"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Active Chat View
            <div className="flex-1 flex flex-col min-h-0" data-lenis-prevent>
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4 flex flex-col">
                <div className="mx-auto w-full max-w-3xl flex min-h-full flex-col">
                  <div className="space-y-6 mt-auto">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.role === 'user' ? 'bg-foreground text-void' : 'bg-surface/80 border border-border-soft text-foreground overflow-x-auto'}`}>
                          {m.role === 'user' ? m.content : <MessageContent content={m.content} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="shrink-0 px-6 pb-6 pt-2">
                <div className="mx-auto w-full max-w-3xl">
                  {renderComposer()}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Project Knowledge Sidebar */}
        <div className="hidden xl:flex h-full flex-col justify-start pr-6 py-6 overflow-y-auto">
          {project && <ProjectSidebar project={project} />}
        </div>
      </div>

      <AnimatePresence>
        {chatToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setChatToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-2xl border border-ember-amber/20 bg-surface shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-ember-amber/10 flex items-center justify-center text-ember-amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Delete Chat</h3>
                </div>
                <p className="text-muted text-[13px] leading-relaxed mb-6">
                  Are you sure you want to permanently delete this chat? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setChatToDelete(null)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-foreground bg-surface hover:bg-surface/80 border border-border-soft transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await deleteChat(chatToDelete);
                        setChats(chats.filter(chat => chat.id !== chatToDelete));
                        setChatToDelete(null);
                      } catch (err) {
                        console.error(err);
                        alert("Failed to delete chat.");
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-void bg-ember-amber hover:bg-ember-gold transition-colors"
                  >
                    Delete Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
