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
        // Simplified auth for demonstration. Accept any non-empty credentials.
        if (credentials?.email && credentials?.password) {
          return { id: "default_user", name: "Test User", email: credentials.email as string };
        }
        return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Mint a standard HS256 JWT for the backend
        const secretText = process.env.AUTH_SECRET || "default_super_secret_for_local_dev_only";
        const secret = new TextEncoder().encode(secretText);
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
