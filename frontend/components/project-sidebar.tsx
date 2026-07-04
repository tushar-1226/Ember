"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ProjectSummary } from "@/lib/api";

type SectionProps = {
  title: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  children: React.ReactNode;
};

function SidebarSection({ title, actionIcon, onAction, children }: SectionProps) {
  return (
    <div className="border-b border-border-soft pb-5 pt-5 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {actionIcon && (
          <button
            onClick={onAction}
            className="text-faint hover:text-foreground transition-colors"
          >
            {actionIcon}
          </button>
        )}
      </div>
      <div className="text-[13px] leading-relaxed text-muted">
        {children}
      </div>
    </div>
  );
}

export function ProjectSidebar({ project }: { project: ProjectSummary }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Future: handle file upload
  };

  return (
    <div className="w-[340px] shrink-0 rounded-2xl border border-border-soft bg-surface/40 p-5 hidden xl:block shadow-sm">
      <SidebarSection
        title="Memory"
        actionIcon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      >
        <div className="mb-3 inline-flex items-center gap-1.5 rounded bg-surface border border-border-soft px-2 py-0.5 text-[11px] font-medium text-foreground">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Only you
        </div>
        
        <p className="mb-3 text-[12px] text-faint leading-relaxed">
          Memory is what Ember observes and remembers from user context, instructions set by the user, and user uploaded files for the project. 
        </p>

        {project.description && (
          <div className="mt-4 pt-4 border-t border-border-soft">
            <p className="line-clamp-4">
              {project.description}
            </p>
            <p className="mt-2 text-[11px] text-faint">Last updated {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
        )}
      </SidebarSection>

      <SidebarSection
        title="Instructions"
        actionIcon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      >
        <p className="text-faint">Add instructions to tailor Ember's responses for this project.</p>
      </SidebarSection>

      <SidebarSection
        title="Files"
        actionIcon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed ${
            dragActive ? "border-ember-amber bg-ember-amber/5" : "border-border-soft bg-[#1E1E1E]"
          } p-6 text-center transition-colors`}
        >
          <div className="mb-3 flex justify-center text-muted">
            {/* Folder / Files Icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[12px] text-foreground">
            Add PDFs, documents, or other text to reference in this project.
          </p>
        </div>
      </SidebarSection>
    </div>
  );
}
