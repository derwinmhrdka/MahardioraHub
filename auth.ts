import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { UserRole } from "@prisma/client";
import { authConfig } from "@/auth.config";
import {
  isAdminEmail,
  upsertDevUser,
  upsertGoogleUser,
} from "@/lib/users";

const isProd = process.env.NODE_ENV === "production";

// Auth.js also reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET by convention.
if (!process.env.AUTH_GOOGLE_ID && process.env.GOOGLE_OAUTH_CLIENT_ID) {
  process.env.AUTH_GOOGLE_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
}
if (!process.env.AUTH_GOOGLE_SECRET && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
  process.env.AUTH_GOOGLE_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
}
if (!process.env.AUTH_URL && !isProd) {
  process.env.AUTH_URL = "http://localhost:13000";
}

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;

const providers = isProd
  ? [
      Google({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        allowDangerousEmailAccountLinking: true,
      }),
    ]
  : [
      Credentials({
        id: "dev",
        name: "Dev",
        credentials: {
          role: { label: "Role", type: "text" },
        },
        async authorize(credentials) {
          if (process.env.NODE_ENV === "production") return null;
          const role =
            credentials?.role === "admin" ? "admin" : "visitor";
          const dbUser = await upsertDevUser(role);
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            image: dbUser.image,
            role: dbUser.role === UserRole.admin ? "admin" : "visitor",
          };
        },
      }),
    ];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "dev") {
        return process.env.NODE_ENV !== "production";
      }
      if (account?.provider !== "google") return false;
      const email = user.email?.trim();
      if (!email) return false;
      await upsertGoogleUser({
        email,
        name: user.name,
        image: user.image,
      });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        if (account?.provider === "dev" && user.role) {
          token.role =
            user.role === "admin" ? UserRole.admin : UserRole.visitor;
          return token;
        }

        if (user.email) {
          const dbUser = await upsertGoogleUser({
            email: user.email,
            name: user.name,
            image: user.image,
          });
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.role = dbUser.role;
        }
        return token;
      }

      const email = token.email?.toString();
      if (!email) {
        token.role = UserRole.visitor;
        return token;
      }

      if (email.endsWith("@localhost")) {
        token.role = email.startsWith("dev-admin")
          ? UserRole.admin
          : UserRole.visitor;
        return token;
      }

      token.role = (await isAdminEmail(email))
        ? UserRole.admin
        : UserRole.visitor;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") session.user.id = token.id;
        session.user.role =
          token.role === UserRole.admin ? UserRole.admin : UserRole.visitor;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
});
