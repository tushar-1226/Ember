"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "./reveal";
import { ease, prefersReducedMotion } from "@/lib/motion";

type NodePos = { x: number; y: number };
type MomentSize = "sm" | "md" | "lg";
type MomentNode = { id: string; label: string; size: MomentSize; desktop: NodePos; mobile: NodePos };
type Connection = readonly [string, string];

const RADIUS: Record<MomentSize, number> = { sm: 3, md: 4.5, lg: 6 };

const NODES: MomentNode[] = [
  { id: "skate", label: "Learned to skate", size: "md", desktop: { x: 120, y: 460 }, mobile: { x: 90, y: 420 } },
  { id: "5k", label: "First 5k, no walking", size: "md", desktop: { x: 230, y: 340 }, mobile: { x: 220, y: 380 } },
  { id: "marathon", label: "Signed up for the marathon", size: "sm", desktop: { x: 200, y: 180 }, mobile: { x: 320, y: 320 } },
  { id: "guitar", label: "Three guitar chords, finally", size: "sm", desktop: { x: 340, y: 460 }, mobile: { x: 280, y: 460 } },
  { id: "mom", label: "Mom's birthday call", size: "lg", desktop: { x: 480, y: 120 }, mobile: { x: 80, y: 220 } },
  { id: "grandpa", label: "Grandpa's fishing stories", size: "md", desktop: { x: 560, y: 240 }, mobile: { x: 180, y: 280 } },
  { id: "miso", label: "Adopted Miso the cat", size: "md", desktop: { x: 640, y: 400 }, mobile: { x: 140, y: 520 } },
  { id: "book", label: "Finished the book she lent me", size: "md", desktop: { x: 760, y: 300 }, mobile: { x: 300, y: 560 } },
  { id: "lisbon", label: "Moved apartments", size: "lg", desktop: { x: 860, y: 420 }, mobile: { x: 180, y: 600 } },
  { id: "quit", label: "Quit the 9-to-5", size: "md", desktop: { x: 420, y: 300 }, mobile: { x: 200, y: 120 } },
  { id: "redesign", label: "Shipped the redesign", size: "sm", desktop: { x: 300, y: 60 }, mobile: { x: 300, y: 40 } },
  { id: "studio", label: "Founded the studio", size: "lg", desktop: { x: 620, y: 120 }, mobile: { x: 320, y: 180 } },
];

const CONNECTIONS: Connection[] = [
  ["mom", "grandpa"],
  ["mom", "miso"],
  ["skate", "5k"],
  ["5k", "marathon"],
  ["skate", "guitar"],
  ["redesign", "quit"],
  ["quit", "studio"],
  ["quit", "5k"],
  ["studio", "lisbon"],
  ["lisbon", "book"],
  ["lisbon", "miso"],
  ["book", "guitar"],
  ["book", "grandpa"],
  ["marathon", "studio"],
];

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

const NEIGHBORS = new Map<string, Set<string>>();
for (const [a, b] of CONNECTIONS) {
  if (!NEIGHBORS.has(a)) NEIGHBORS.set(a, new Set());
  if (!NEIGHBORS.has(b)) NEIGHBORS.set(b, new Set());
  NEIGHBORS.get(a)!.add(b);
  NEIGHBORS.get(b)!.add(a);
}

const DESKTOP_VIEW = { w: 1000, h: 560 };
const MOBILE_VIEW = { w: 400, h: 640 };

function ConstellationSvg({
  variant,
  hoveredId,
  setHoveredId,
  inView,
  reduced,
}: {
  variant: "desktop" | "mobile";
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  inView: boolean;
  reduced: boolean;
}) {
  const view = variant === "desktop" ? DESKTOP_VIEW : MOBILE_VIEW;
  const built = reduced || inView;
  const hoveredNode = hoveredId ? NODE_BY_ID.get(hoveredId) ?? null : null;

  return (
    <div className={variant === "desktop" ? "relative hidden md:block" : "relative block md:hidden"}>
      <svg viewBox={`0 0 ${view.w} ${view.h}`} className={variant === "desktop" ? "w-full md:aspect-[25/14]" : "w-full aspect-[5/8]"} aria-hidden="true">
      <g>
        {CONNECTIONS.map(([aId, bId], i) => {
          const a = NODE_BY_ID.get(aId)!;
          const b = NODE_BY_ID.get(bId)!;
          const pa = a[variant];
          const pb = b[variant];
          const active = hoveredId != null && (aId === hoveredId || bId === hoveredId);
          const dimmed = hoveredId != null && !active;
          return (
            <motion.line
              key={`${aId}-${bId}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={active ? "var(--color-accent)" : "var(--color-border-soft)"}
              strokeWidth={active ? 1.5 : 1}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                built
                  ? { pathLength: 1, opacity: dimmed ? 0.15 : 0.6 }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : !inView
                    ? { duration: 0.6, delay: 0.55 + i * 0.03, ease: ease.emberOut }
                    : { duration: 0.18, ease: ease.emberOut }
              }
            />
          );
        })}

        {NODES.map((node, i) => {
          const p = node[variant];
          const active = hoveredId === node.id || (hoveredId != null && NEIGHBORS.get(hoveredId)?.has(node.id));
          const dimmed = hoveredId != null && !active;
          return (
            <motion.circle
              key={node.id}
              cx={p.x}
              cy={p.y}
              r={RADIUS[node.size]}
              fill={active ? "var(--color-accent)" : "var(--color-foreground)"}
              data-cursor="interactive"
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                built
                  ? { opacity: dimmed ? 0.35 : 1, scale: hoveredId === node.id ? 1.15 : 1 }
                  : { opacity: 0, scale: 0 }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : !inView
                    ? { duration: 0.45, delay: i * 0.045, ease: ease.emberOut }
                    : { duration: 0.18, ease: ease.emberOut }
              }
            >
              <title>{node.label}</title>
            </motion.circle>
          );
        })}
      </g>
      </svg>

      {hoveredNode && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.15 }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+14px)] whitespace-nowrap rounded-full border border-border-soft bg-surface/90 px-3 py-1 font-mono text-xs text-foreground backdrop-blur"
          style={{
            left: `${(hoveredNode[variant].x / view.w) * 100}%`,
            top: `${(hoveredNode[variant].y / view.h) * 100}%`,
          }}
        >
          {hoveredNode.label}
        </motion.div>
      )}
    </div>
  );
}

export function ConstellationOfMoments() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  return (
    <section className="relative w-full border-t border-border-soft/30 bg-background px-6 py-32 md:px-12 lg:px-24">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">Constellation of moments</p>
          <h2 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-6xl">
            Every memory, <span className="text-accent">a point of light.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Ember doesn&apos;t just store what you tell it — it quietly maps how your moments relate to each
            other. Hover a memory to see what it&apos;s connected to.
          </p>
        </Reveal>
      </div>

      <motion.div
        className="relative mx-auto mt-16 max-w-6xl"
        viewport={{ once: true, margin: "-100px" }}
        onViewportEnter={() => setInView(true)}
      >
        <ConstellationSvg variant="desktop" hoveredId={hoveredId} setHoveredId={setHoveredId} inView={inView} reduced={reduced} />
        <ConstellationSvg variant="mobile" hoveredId={hoveredId} setHoveredId={setHoveredId} inView={inView} reduced={reduced} />
      </motion.div>
    </section>
  );
}
