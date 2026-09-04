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

        // Production security: Strictly NO auto-provisioning.
        // User must explicitly register via /api/v1/auth/register.
        const user = await db.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: {
                organization: true,
              },
              take: 1,
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        const primaryOrg = user.memberships[0]?.organization;

        return {
          id: user.id,
          email: user.email,
          name: user.name || undefined,
          organizationId: primaryOrg?.id,
          role: user.memberships[0]?.role || "MEMBER",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; organizationId?: string; role?: string }).id =
          token.id as string | undefined;
        (session.user as { id?: string; organizationId?: string; role?: string }).organizationId =
          token.organizationId as string | undefined;
        (session.user as { id?: string; organizationId?: string; role?: string }).role =
          token.role as string | undefined;
      }
      return session;
    },
  },
};
