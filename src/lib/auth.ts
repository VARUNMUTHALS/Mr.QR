import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/" },
  providers: [
    CredentialsProvider({
      name: "Studio",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email || "").trim().toLowerCase();
        const password = credentials?.password || "";
        if (!email || !password) return null;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        if (password.length < 4) return null;

        // Auto-provision: if the user doesn't exist, create them.
        // This keeps the studio frictionless — enter any email + password to
        // start. Passwords are hashed.
        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          const passwordHash = await bcrypt.hash(password, 10);
          const name = email.split("@")[0].replace(/[._-]+/g, " ");
          user = await db.user.create({
            data: { email, passwordHash, name },
          });
        } else {
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
      }
      return session;
    },
  },
};
