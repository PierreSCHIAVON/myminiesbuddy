import { prisma } from '@warforge/db'
import type { NotificationType } from '@prisma/client'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({ data: input })
  } catch (error) {
    // Les notifications sont non-critiques — on logue sans faire planter la requête principale
    console.error('Failed to create notification:', error)
  }
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  if (inputs.length === 0) return
  try {
    return await prisma.notification.createMany({ data: inputs })
  } catch (error) {
    console.error('Failed to create notifications:', error)
  }
}
