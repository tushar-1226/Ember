import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SignJWT } from "jose";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        try {
          const res = await fetch(`${apiBase}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          if (!res.ok) return null;
          const user = await res.json();
          return { id: user.id, email: user.email };
        } catch (err) {
          console.error("Backend login request failed:", err);
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Mint a standard HS256 JWT for the backend. Must match the backend's
        // AUTH_SECRET exactly — no insecure fallback here; if it's unset, fail loudly
        // instead of silently signing tokens the backend will also happily accept.
        if (!process.env.AUTH_SECRET) {
          throw new Error("AUTH_SECRET is not set — cannot mint a backend session token.");
        }
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        token.backendToken = await new SignJWT({ sub: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("30d")
          .sign(secret);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      // Pass the backend token to the client session
      (session as any).backendToken = token.backendToken;
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
});
