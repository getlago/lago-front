import { Typography } from '@mui/material'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useInternationalization } from '~/hooks/core/useInternationalization'

import { AvailableFiltersEnum, mapFilterToTranslationKey } from './types'
import { formatActiveFilterValueDisplay } from './utils'

interface ActiveFiltersListProps {
  filters: AvailableFiltersEnum[]
  hideBorderBottom?: boolean
  noPadding?: boolean
}

export const ActiveFiltersList = ({ filters }: ActiveFiltersListProps) => {
  const { translate } = useInternationalization()
  const [searchParams] = useSearchParams()

  const activeFilters = useMemo(() => {
    const setFilters = Object.fromEntries(searchParams.entries())

    const filtersToDisplay = Object.entries(setFilters).reduce(
      (acc, cur) => {
        const [key, value] = cur as [AvailableFiltersEnum, string]

        if (!filters.includes(key)) {
          return acc
        }

        return [
          ...acc,
          {
            label: translate(mapFilterToTranslationKey(key)),
            value: formatActiveFilterValueDisplay(key, value, translate),
          },
        ]
      },
      [] as Record<string, string>[],
    )

    return filtersToDisplay

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchParams])

  if (!activeFilters.length) {
    return null
  }

  return (
    <>
      {activeFilters.map(({ label, value }, index) => (
        <div
          className="flex h-8 items-center rounded-[100px] bg-grey-100 px-3 py-0"
          key={`active-filter-${index}`}
        >
          <Typography variant="captionHl" color="grey600">
            {translate(label)}: {value}
          </Typography>
        </div>
      ))}
    </>
  )
}
