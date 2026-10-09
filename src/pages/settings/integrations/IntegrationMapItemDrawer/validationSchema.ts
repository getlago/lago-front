import { z } from 'zod'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

export const refineIntegrationMapItemEntries =
  <Entry extends Record<string, unknown>>(
    getMissingFields: (entry: Entry) => Array<keyof Entry & string>,
  ) =>
  (mappings: Record<string, Entry>, ctx: z.RefinementCtx): void => {
    Object.entries(mappings).forEach(([billingEntityKey, entry]) => {
      if (!Object.values(entry ?? {}).some(Boolean)) return

      getMissingFields(entry).forEach((field) => {
        ctx.addIssue({
          code: 'custom',
          message: REQUIRED_FIELD_MESSAGE,
          path: [billingEntityKey, field],
        })
      })
    })
  }
