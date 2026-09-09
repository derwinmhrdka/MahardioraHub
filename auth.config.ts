import type { NextAuthConfig } from "next-auth";

/** Edge-safe Auth.js config (no Prisma). */
export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token }) {
      if (!token.role) token.role = "visitor";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") session.user.id = token.id;
        session.user.role = token.role === "admin" ? "admin" : "visitor";
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.picture === "string") session.user.image = token.picture;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
