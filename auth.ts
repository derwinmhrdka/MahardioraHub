import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { UserRole } from "@prisma/client";
import { authConfig } from "@/auth.config";
import { isAdminEmail, upsertGoogleUser } from "@/lib/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
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
    async jwt({ token, user }) {
      const email = (user?.email || token.email)?.toString();
      if (!email) {
        token.role = UserRole.visitor;
        return token;
      }

      if (user) {
        const dbUser = await upsertGoogleUser({
          email,
          name: user.name,
          image: user.image,
        });
        token.id = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.picture = dbUser.image;
        token.role = dbUser.role;
      } else {
        token.role = (await isAdminEmail(email))
          ? UserRole.admin
          : UserRole.visitor;
      }

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
