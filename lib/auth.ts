import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Resend from 'next-auth/providers/resend'
import { prisma } from '@/lib/db'

export const { handlers, signIn, signOut, auth: nextAuthAuth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM,
      apiKey: process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY,
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/verify-request',
    error: '/login',
  },
  session: {
    strategy: 'database',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})

export const auth = async () => {
  let user = await prisma.user.findFirst({ where: { email: 'dev@local.host' } })
  if (!user) {
    user = await prisma.user.create({
      data: { email: 'dev@local.host', name: 'Dev User' }
    })
  }
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}
