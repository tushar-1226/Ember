"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ChatSummary } from "@/lib/api";

/* --- Inline icons (no external icon lib) ------------------------------------ */
type IconProps = { className?: string };
const I = {
  new: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="18" height="18">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chats: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="18" height="18">
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  projects: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="18" height="18">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  customize: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="18" height="18">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  code: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="18" height="18">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  menu: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="20" height="20">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  trash: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className={p.className} width="14" height="14">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Sidebar({
  chats,
  activeId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenCustomize,
}: {
  chats: ChatSummary[];
  activeId: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onOpenCustomize?: () => void;
}) {
  const NAV_ITEMS = [
    { key: "chats", label: "Chats", Icon: I.chats, href: "/reflect" },
    { key: "projects", label: "Projects", Icon: I.projects, href: "/projects" },
    { key: "customize", label: "Customize", Icon: I.customize, onClick: onOpenCustomize },
  ];

  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile drawer
  // TODO: Replace with NextAuth useSession
  const user = { firstName: "U", fullName: "User", imageUrl: "" };

  const content = (
    <div className="flex h-full w-64 flex-col border-r border-border-soft bg-surface/95 backdrop-blur-xl">
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-4 pb-2 pt-5">
        <span className="relative grid h-6 w-6 place-items-center">
          <span className="absolute h-2 w-2 rounded-full bg-ember-amber shadow-ember animate-flicker" />
          <span className="absolute h-6 w-6 rounded-full border border-ember-amber/25" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">Ember</span>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            onNewChat();
            setOpen(false);
          }}
          data-cursor="hot"
          className="flex w-full items-center gap-2.5 rounded-xl border border-border-soft bg-raised/60 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-ember-amber/40 hover:bg-raised"
        >
          <I.new className="text-ember-amber" />
          New chat
        </button>
      </div>

      {/* Primary nav */}
      <nav className="mt-3 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ key, label, Icon, onClick, href }) => {
          const isActive = href && (pathname === href || (href !== "/" && pathname.startsWith(href)));
          
          if (href) {
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-foreground text-void shadow-sm"
                    : "text-muted hover:bg-raised/60 hover:text-foreground"
                }`}
                title={label}
              >
                <Icon className={isActive ? "text-void" : "text-faint"} />
                {label}
              </Link>
            );
          }
          return (
            <button
              key={key}
              onClick={
                onClick
                  ? () => {
                      onClick();
                      setOpen(false);
                    }
                  : undefined
              }
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-muted transition-colors hover:bg-raised/60 hover:text-foreground"
              title={onClick ? label : `${label} (coming soon)`}
            >
              <Icon className="text-faint" />
              {label}
            </button>
          );
        })}
        <Link
          href="/code"
          onClick={() => setOpen(false)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
            pathname?.startsWith("/code")
              ? "bg-foreground text-void shadow-sm"
              : "text-muted hover:bg-raised/60 hover:text-foreground"
          }`}
          title="Ember Code"
        >
          <I.code className={pathname?.startsWith("/code") ? "text-void" : "text-faint"} />
          Ember Code
        </Link>
      </nav>

      {/* Recents */}
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-lenis-prevent>
        <p className="px-3 pb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Recents</p>
        {chats.length === 0 ? (
          <p className="px-3 py-2 text-[13px] text-faint">No conversations yet.</p>
        ) : (
          <div className="space-y-0.5">
            {chats.map((c) => {
              const active = c.id === activeId;
              return (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
                    active ? "bg-ember-amber/10" : "hover:bg-raised/60"
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectChat(c.id);
                      setOpen(false);
                    }}
                    className={`min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px] ${
                      active ? "text-foreground" : "text-muted group-hover:text-foreground"
                    }`}
                    title={c.title}
                  >
                    {c.title || "Untitled"}
                  </button>
                  {onDeleteChat && (
                    <button
                      onClick={() => onDeleteChat(c.id)}
                      className="shrink-0 rounded-md p-1.5 text-faint opacity-0 transition hover:text-ember-coral group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <I.trash />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User footer — opens Settings & User Profile */}
      <div className="flex items-center justify-between border-t border-border-soft px-3 py-3">
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className="flex flex-1 items-center gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-raised/60"
          title="Settings"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-raised text-xs font-semibold text-foreground overflow-hidden">
            {user?.imageUrl ? <img src={user.imageUrl} alt="Avatar" className="h-full w-full object-cover" /> : user?.firstName?.[0] || "U"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-foreground">{user?.fullName || "User"}</p>
            <p className="text-[11px] text-faint">Ember · private</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className="shrink-0 text-faint">
            <line x1="21" x2="14" y1="4" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="10" x2="3" y1="4" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="21" x2="12" y1="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" x2="3" y1="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="21" x2="16" y1="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" x2="3" y1="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" x2="14" y1="2" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" x2="8" y1="10" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" x2="16" y1="18" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        <div className="pl-2">
          {/* TODO: Add NextAuth SignOut button */}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile open button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-xl border border-border-soft bg-surface/80 text-muted backdrop-blur md:hidden"
        aria-label="Open menu"
      >
        <I.menu />
      </button>

      {/* Desktop: fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">{content}</aside>

      {/* Mobile: slide-over drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
