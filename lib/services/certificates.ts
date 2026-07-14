import { prisma } from '@/lib/db'
import type { CreateCertificateInput, UpdateCertificateInput } from '@/lib/validations/schemas'

export async function getCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: [{ status: 'asc' }, { targetDate: 'asc' }],
  })
}

export async function getCertificate(certId: string, userId: string) {
  return prisma.certificate.findFirst({
    where: { id: certId, userId },
  })
}

export async function createCert(userId: string, data: CreateCertificateInput) {
  return prisma.certificate.create({
    data: {
      userId,
      title: data.title,
      provider: data.provider ?? null,
      status: data.status,
      resumeUrl: data.resumeUrl ?? null,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
    },
  })
}

export async function updateCert(certId: string, userId: string, data: UpdateCertificateInput) {
  return prisma.certificate.updateMany({
    where: { id: certId, userId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.provider !== undefined && { provider: data.provider }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.resumeUrl !== undefined && { resumeUrl: data.resumeUrl }),
      ...(data.targetDate !== undefined && {
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      }),
      lastVisited: new Date(),
    },
  })
}

export async function deleteCert(certId: string, userId: string) {
  return prisma.certificate.deleteMany({
    where: { id: certId, userId },
  })
}

export async function getUpcomingDeadlines(userId: string, withinDays = 14) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + withinDays)
  return prisma.certificate.findMany({
    where: {
      userId,
      status: { not: 'completed' },
      targetDate: { lte: cutoff, gte: new Date() },
    },
    orderBy: { targetDate: 'asc' },
  })
}
