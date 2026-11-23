import { z } from 'zod'

const REQUIRED_FIELD_MESSAGE = 'text_1771342994699klxu2paz7g8'

type IntegrationMapItemEntryRules<Entry> = {
  isFilled: (entry: Entry) => boolean
  getMissingFields: (entry: Entry) => Array<keyof Entry & string>
}

export const refineIntegrationMapItemEntries =
  <Entry extends Record<string, unknown>>({
    isFilled,
    getMissingFields,
  }: IntegrationMapItemEntryRules<Entry>) =>
  (mappings: Record<string, Entry>, ctx: z.RefinementCtx): void => {
    Object.entries(mappings).forEach(([billingEntityKey, entry]) => {
      if (!entry || !isFilled(entry)) return

      getMissingFields(entry).forEach((field) => {
        ctx.addIssue({
          code: 'custom',
          message: REQUIRED_FIELD_MESSAGE,
          path: [billingEntityKey, field],
        })
      })
    })
  }

// Keep `isFilled` on the same fields as `getMissingFields`: an entry holding only values
// hidden in the current context (Netsuite external ids under a tax mapping) must stay clearable.
export const refineRequiredIntegrationMapItemFields = <Entry extends Record<string, unknown>>(
  fields: ReadonlyArray<keyof Entry & string>,
): ((mappings: Record<string, Entry>, ctx: z.RefinementCtx) => void) =>
  refineIntegrationMapItemEntries<Entry>({
    isFilled: (entry) => fields.some((field) => !!entry[field]),
    getMissingFields: (entry) => fields.filter((field) => !entry[field]),
  })
