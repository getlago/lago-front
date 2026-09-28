import { DateTime } from 'luxon'
import { z } from 'zod'

import { addUnparseableDateIssue } from '~/formValidation/zodCustoms'

// The backend rejects an execution scheduled for today or the past: it must be a future day.
export const addExecuteAtIssue = (ctx: z.RefinementCtx, executeAt: string | undefined): void => {
  if (!executeAt || addUnparseableDateIssue(ctx, executeAt, ['executeAt'])) return

  if (DateTime.fromISO(executeAt).startOf('day') > DateTime.now().startOf('day')) return

  ctx.addIssue({ code: 'custom', message: 'text_1781698831945d8qod1ugqsu', path: ['executeAt'] })
}
