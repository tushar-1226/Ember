"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { ProjectSidebar } from "@/components/project-sidebar";
import { ModelPicker } from "@/components/model-picker";
import { motion, AnimatePresence } from "framer-motion";
import { getChats, getProject, getChatHistory, streamChat, getModels, type ChatSummary, type ProjectSummary, type ModelInfo, type ModelKey } from "@/lib/api";

const TypewriterText = () => {
  const parts = [
    { text: "It ", className: "" },
    { text: "remembers", className: "text-[#D4A068]" },
    { text: "\nyour life, and\n", className: "" },
    { text: "reflects", className: "text-[#D4A068]" },
    { text: " it back.", className: "" }
  ];

  const fullText = parts.map(p => p.text).join("");
  const [length, setLength] = useState(0);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setLength((prev) => {
        if (prev >= fullText.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 60);
    return () => clearInterval(timer);
  }, [fullText.length]);

  let currentLength = 0;

  return (
    <>
      {parts.map((part, index) => {
        const partStart = currentLength;
        const partEnd = currentLength + part.text.length;
        currentLength = partEnd;
        
        if (length <= partStart) return null;
        
        const visibleText = part.text.substring(0, length - partStart);
        const lines = visibleText.split('\n');
        
        return (
          <span key={index} className={part.className}>
            {lines.map((line, i) => (
              <span key={i}>
                {line}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      })}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="inline-block w-[3px] h-[40px] bg-foreground ml-2 rounded-sm align-middle"
      />
    </>
  );
};

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

  const Composer = ({ className = "" }: { className?: string }) => (
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
                <h2 className="text-5xl text-foreground font-display font-medium tracking-tight mb-12 text-left min-h-[160px] leading-tight">
                  <TypewriterText />
                </h2>
                
                <Composer className="mb-12 shadow-2xl" />

                {chats.length > 0 && (
                  <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-[11px] font-medium text-faint uppercase tracking-wider mb-4 px-2">Recent chats in this project</h3>
                    <div className="space-y-1">
                      {chats.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => setActiveThreadId(c.id)} 
                          className="w-full text-left p-4 rounded-2xl hover:bg-surface/50 transition-colors border border-transparent hover:border-border-soft flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center text-muted group-hover:text-foreground transition-colors border border-border-soft">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <span className="text-foreground text-[14px] font-medium">{c.title}</span>
                          </div>
                          <span className="text-faint text-[12px] group-hover:text-muted transition-colors">
                            {new Date(c.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Active Chat View
            <div className="flex-1 overflow-y-auto px-6 py-6" data-lenis-prevent>
              <div className="mx-auto max-w-3xl flex h-full flex-col justify-end">
                <div className="space-y-6 mb-6">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${m.role === 'user' ? 'bg-foreground text-void' : 'bg-surface/80 border border-border-soft text-foreground'}`}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
                <Composer className="mt-auto" />
              </div>
            </div>
          )}
        </main>

        {/* Project Knowledge Sidebar */}
        <div className="hidden xl:flex h-full flex-col justify-start pr-6 py-6 overflow-y-auto">
          {project && <ProjectSidebar project={project} />}
        </div>
      </div>
    </div>
  );
}
