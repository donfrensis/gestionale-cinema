//  src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Estendi i tipi di default di NextAuth
declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    isAdmin: boolean;
    firstAccess: boolean;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      isAdmin: boolean;
      firstAccess: boolean;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    isAdmin: boolean;
    firstAccess: boolean;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          username: user.username,
          isAdmin: user.isAdmin,
          firstAccess: user.firstAccess
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.firstAccess = user.firstAccess;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
        session.user.firstAccess = token.firstAccess;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt" as const
  },
  pages: {
    signIn: "/login"
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };