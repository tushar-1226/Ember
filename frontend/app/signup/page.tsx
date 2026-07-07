"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    // TODO: Implement FastAPI /auth/register then NextAuth signIn
    setTimeout(() => {
      setIsLoading(false);
      router.push("/reflect");
    }, 1500);
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const rotateX = useTransform(mouseY, [-1, 1], [8, -8]);
  const rotateY = useTransform(mouseX, [-1, 1], [-8, 8]);

  return (
    <div 
      className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Deep Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-60"
          style={{
            transform: 'perspective(1000px) rotateX(60deg) scale(4) translateY(-10%)',
            transformOrigin: 'top center',
            maskImage: 'radial-gradient(circle at center, black, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 75%)'
          }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              y: [0, 64] // 4rem = 64px
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear"
            }}
            style={{
              top: '-50%',
              bottom: '-50%',
              left: '-50%',
              right: '-50%',
              backgroundImage: `
                linear-gradient(to right, #333 1px, transparent 1px),
                linear-gradient(to bottom, #333 1px, transparent 1px)
              `,
              backgroundSize: '4rem 4rem',
            }}
          />
        </div>
        {/* Glow behind the card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ember-amber/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-10 w-full max-w-lg perspective-1000"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full rounded-[2rem] border border-border-soft bg-[#050505]/90 p-10 sm:p-14 shadow-[0_0_100px_rgba(217,160,102,0.15)] backdrop-blur-3xl"
        >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block group" data-cursor="hot">
            <span className="relative grid h-10 w-10 place-items-center">
              <span className="absolute h-3 w-3 rounded-full bg-ember-amber shadow-[0_0_15px_rgba(255,183,77,0.5)]" />
              <span className="absolute h-10 w-10 rounded-full border border-ember-amber/25 transition-transform group-hover:scale-110" />
            </span>
          </Link>
          <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground">
            Join Ember
          </h1>
          <p className="mt-2 text-sm text-muted">
            Start remembering what matters.
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border-soft bg-raised px-4 py-3 text-foreground outline-none transition-colors focus:border-ember-amber focus:ring-1 focus:ring-ember-amber"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border-soft bg-raised px-4 py-3 text-foreground outline-none transition-colors focus:border-ember-amber focus:ring-1 focus:ring-ember-amber"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-xl border border-border-soft bg-raised px-4 py-3 text-foreground outline-none transition-colors focus:border-ember-amber focus:ring-1 focus:ring-ember-amber"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 group relative overflow-hidden rounded-xl bg-ember-amber px-4 py-3 text-sm font-medium text-void shadow-[0_0_15px_rgba(255,183,77,0.2)] transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoading ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
                Creating account...
              </motion.span>
            ) : (
              <span>Sign Up</span>
            )}
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100" />
          </button>
        </form>

        <div className="mt-8 relative flex items-center py-4">
          <div className="flex-grow border-t border-border-soft"></div>
          <span className="flex-shrink-0 mx-4 text-xs text-muted">OR</span>
          <div className="flex-grow border-t border-border-soft"></div>
        </div>

        <button className="w-full flex items-center justify-center gap-3 rounded-xl border border-border-soft bg-raised px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-overlay">
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ember-amber hover:underline">
            Sign in
          </Link>
        </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
