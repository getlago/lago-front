import { z } from 'zod'

import {
  FiltersItemDates,
  isValidDateRangeValue,
  METADATA_SPLITTER,
} from '~/components/Filters/graphql/utils'
import { AvailableFiltersEnum } from '~/components/Filters/presentation/types'

// The panel renders no field-level error: these messages are never displayed, the schema only
// gates the Apply button — exactly what the Yup schema it replaces did with `required('')`.
const INVALID_FILTER_MESSAGE = 'text_1771342994699klxu2paz7g8'

const MAX_METADATA_FILTERS = 5

const filterItemSchema = z.object({
  filterType: z.enum(AvailableFiltersEnum).optional(),
  value: z.string().optional(),
  disabled: z.boolean().optional(),
})

const isValidMetadataValue = (value: string): boolean => {
  const metadatas = value.split(METADATA_SPLITTER)

  if (metadatas.length > MAX_METADATA_FILTERS) {
    return false
  }

  return metadatas.every((metadata) => {
    const [key, metadataValue] = metadata.split('=')

    return metadata.includes('=') && !!key && !!metadataValue
  })
}

// A row holding nothing but empty values is the placeholder row, not a filter being built.
const isEmptyFilter = (filter: z.infer<typeof filterItemSchema>): boolean =>
  Object.values(filter).every((value) => value === undefined || value === '')

const isClearedFilters = (filters: Array<z.infer<typeof filterItemSchema>>): boolean =>
  filters.length === 1 && isEmptyFilter(filters[0])

export const buildFiltersPanelValidationSchema = (hasInitialFilters: boolean) =>
  z.object({
    filters: z.array(filterItemSchema).superRefine((filters, ctx) => {
      // "Clear all" leaves a single empty row behind: it has to stay submittable, otherwise the
      // user can never apply the removal of the filters currently in the URL.
      if (hasInitialFilters && isClearedFilters(filters)) {
        return
      }

      filters.forEach((filter, index) => {
        if (!filter.filterType) {
          ctx.addIssue({
            code: 'custom',
            message: INVALID_FILTER_MESSAGE,
            path: [index, 'filterType'],
          })
        }

        if (!filter.value) {
          ctx.addIssue({ code: 'custom', message: INVALID_FILTER_MESSAGE, path: [index, 'value'] })
          return
        }

        const isDateFilter = !!filter.filterType && FiltersItemDates.includes(filter.filterType)
        const isMetadataFilter = filter.filterType === AvailableFiltersEnum.metadata

        if (isDateFilter && !isValidDateRangeValue(filter.value)) {
          ctx.addIssue({ code: 'custom', message: INVALID_FILTER_MESSAGE, path: [index, 'value'] })
        }

        if (isMetadataFilter && !isValidMetadataValue(filter.value)) {
          ctx.addIssue({ code: 'custom', message: INVALID_FILTER_MESSAGE, path: [index, 'value'] })
        }
      })
    }),
  })
