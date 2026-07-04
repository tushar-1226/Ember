/**
 * Ember — single requestAnimationFrame loop.
 * ONE rAF drives everything (Lenis, cursor, canvas ember field) so nothing
 * competes. Subscribers get (timeMs, deltaMs); lower priority runs first.
 */
export type RafCallback = (timeMs: number, deltaMs: number) => void;

class RafManager {
  private subs: { cb: RafCallback; priority: number }[] = [];
  private running = false;
  private rafId = 0;
  private last = 0;

  add(cb: RafCallback, priority = 10): () => void {
    this.subs.push({ cb, priority });
    this.subs.sort((a, b) => a.priority - b.priority);
    this.start();
    return () => this.remove(cb);
  }

  remove(cb: RafCallback) {
    this.subs = this.subs.filter((s) => s.cb !== cb);
    if (this.subs.length === 0) this.stop();
  }

  private start() {
    if (this.running || typeof window === "undefined") return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private loop = (time: number) => {
    if (!this.running) return;
    const delta = Math.min(time - this.last, 64);
    this.last = time;
    for (const sub of this.subs.slice()) sub.cb(time, delta);
    this.rafId = requestAnimationFrame(this.loop);
  };
}

export const raf = new RafManager();
