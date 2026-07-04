"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getChats, getProjects, createProject, type ChatSummary, type ProjectSummary } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    getChats().then(setChats).catch(() => setChats([]));
    getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const proj = await createProject(newTitle, newDescription);
      router.push(`/projects/${proj.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <div className="h-[100dvh] overflow-hidden bg-background">
      <Sidebar
        chats={chats}
        activeId=""
        onNewChat={() => {}}
        onSelectChat={() => {}}
      />

      <main className="relative flex h-[100dvh] w-full flex-col overflow-y-auto px-6 md:pl-64">
        <div className="mx-auto w-full max-w-5xl py-12">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
              Projects
            </h1>
            <div className="flex items-center gap-4">
              {projects.length > 0 && (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-border-soft px-3 py-1.5 text-sm text-muted">
                    <span>Sort by</span>
                    <span className="text-foreground">Last updated</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    data-cursor="hot"
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-void transition-transform hover:scale-[1.02]"
                  >
                    New project
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          {projects.length === 0 ? (
            <div className="mt-16 flex flex-col items-center justify-center text-center">
              <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-border-soft bg-surface/50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-muted">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-medium tracking-tight text-foreground">
                No projects yet
              </h2>
              <p className="mb-8 max-w-md text-[15px] leading-relaxed text-muted">
                Create a dedicated, isolated workspace to organize your specific goals, system instructions, and customized AI context.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                data-cursor="hot"
                className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-void shadow-sm transition-transform hover:scale-[1.02]"
              >
                Create your first project
              </button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="mb-10 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-border-soft bg-surface/50 py-3 pl-11 pr-4 text-[15px] text-foreground placeholder:text-muted focus:border-border focus:outline-none"
                />
              </div>

              {/* Grid or Search Empty State */}
              {filteredProjects.length === 0 ? (
                <div className="mt-12 flex flex-col items-center justify-center text-center">
                  <p className="text-[15px] text-muted">
                    No projects found matching &quot;<span className="text-foreground">{search}</span>&quot;
                  </p>
                  <button
                    onClick={() => setSearch("")}
                    className="mt-4 text-sm font-medium text-ember-amber hover:text-ember-amber/80 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {filteredProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="group flex h-40 flex-col rounded-2xl border border-border-soft bg-surface/50 p-5 shadow-sm transition-colors hover:border-ember-amber/40 hover:bg-surface/80"
                    >
                      <div className="min-h-0 flex-1">
                        <h3 className="font-semibold text-foreground transition-colors group-hover:text-ember-amber">
                          {p.title}
                        </h3>
                        {p.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 shrink-0 text-xs text-faint">
                        {new Date(p.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-2xl border border-border-soft bg-surface/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <h2 className="text-xl font-medium text-foreground mb-4">Create New Project</h2>
              <form onSubmit={handleCreateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Project Name</label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-border-soft bg-surface/50 px-4 py-2.5 text-[15px] text-foreground placeholder:text-faint focus:border-ember-amber focus:outline-none"
                      placeholder="e.g., Q3 Marketing Strategy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1.5">Description (Optional)</label>
                    <textarea
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full resize-none rounded-xl border border-border-soft bg-surface/50 px-4 py-2.5 text-[15px] text-foreground placeholder:text-faint focus:border-ember-amber focus:outline-none"
                      placeholder="Context or goals for this project..."
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-void transition-transform hover:scale-[1.02]"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
