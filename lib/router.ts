import { os } from '@orpc/server'
import * as z from 'zod'

export const router = {
  echo: os.input(z.object({ slug: z.string() })).handler(({ input }) => input),
}
