// express.d.ts — augment Passport's User, don't override Request.user
import type { UserType } from '@prisma/client'
declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      type: UserType | string
      firstName?: string
      lastName?: string
    }
  }
}
export {}