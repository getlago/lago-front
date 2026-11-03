import { useEffect, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Typography } from '~/components/designSystem/Typography'
import { Checkbox } from '~/components/form/Checkbox'
import { DatePicker } from '~/components/form/DatePicker'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import {
  buildFilterOptionsParams,
  fetchAnalyticsFilterOptions,
  getAnalyticsHeaders,
} from './common/api'
import { joinTimeValue, splitTimeValue } from './common/filters'
import { AnalyticsFilter, AnalyticsFilterValues } from './common/types'

export const ANALYTICS_D3SET_FILTER_BAR_TEST_ID = 'analytics-d3set-filter-bar'
export const ANALYTICS_D3SET_FILTER_RESET_TEST_ID = 'analytics-d3set-filter-reset'

const MAX_SHOWN_VALUES = 2

type FilterBarProps = {
  baseUrl: string
  filters: AnalyticsFilter[]
  values: AnalyticsFilterValues
  hasValues: boolean
  onChange: (filter: AnalyticsFilter, values: string[]) => void
  onReset: () => void
}

type FilterProps = Omit<FilterBarProps, 'hasValues' | 'onReset'> & { filter: AnalyticsFilter }

const OptionsMenu = ({
  baseUrl,
  filter,
  filters,
  values,
  onChange,
  closePopper,
}: FilterProps & { closePopper: () => void }) => {
  const { translate } = useInternationalization()
  const [options, setOptions] = useState<string[] | null>(null)
  const selected = values[filter.param] ?? []

  useEffect(() => {
    const controller = new AbortController()

    fetchAnalyticsFilterOptions({
      baseUrl,
      filterId: filter.id,
      params: buildFilterOptionsParams(filter, filters, values),
      headers: getAnalyticsHeaders(),
      signal: controller.signal,
    })
      .then(setOptions)
      .catch(() => {
        if (!controller.signal.aborted) setOptions([])
      })

    return () => controller.abort()
    // The options load once, when the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderOptions = () => {
    if (options === null) {
      return [0, 1, 2].map((index) => <Skeleton key={index} variant="text" className="my-2 w-32" />)
    }

    if (filter.multiple) {
      return options.map((option) => (
        <Checkbox
          key={option}
          className="px-2 py-1"
          label={option}
          value={selected.includes(option)}
          onChange={(_, checked) =>
            onChange(
              filter,
              checked ? [...selected, option] : selected.filter((value) => value !== option),
            )
          }
        />
      ))
    }

    return options.map((option) => (
      <Button
        key={option}
        variant="quaternary"
        align="left"
        className={selected[0] === option ? 'text-blue-600' : undefined}
        onClick={() => {
          onChange(filter, [option])
          closePopper()
        }}
      >
        {option}
      </Button>
    ))
  }

  return (
    <MenuPopper className="min-w-48">
      {(filter.multiple || filter.default === null) && (
        <Button
          variant="quaternary"
          align="left"
          className={selected.length === 0 ? 'text-blue-600' : undefined}
          onClick={() => {
            onChange(filter, [])
            closePopper()
          }}
        >
          {translate('text_1792668632006rpirkcifav7')}
        </Button>
      )}
      {renderOptions()}
    </MenuPopper>
  )
}

const SelectFilter = (props: FilterProps) => {
  const { translate } = useInternationalization()
  const { filter, values } = props
  const selected = values[filter.param] ?? []

  const getLabel = (): string => {
    if (!selected.length) return translate('text_1792668632006rpirkcifav7')
    if (selected.length <= MAX_SHOWN_VALUES) return selected.join(', ')

    return `${selected.slice(0, MAX_SHOWN_VALUES).join(', ')} +${selected.length - MAX_SHOWN_VALUES}`
  }

  return (
    <Popper
      PopperProps={{ placement: 'bottom-start' }}
      maxHeight={360}
      opener={
        <Button variant="tertiary" endIcon="chevron-down">
          <span className="font-normal text-grey-600">{filter.name}</span>
          <span className="ml-1 text-grey-700">{getLabel()}</span>
        </Button>
      }
    >
      {({ closePopper }) => <OptionsMenu {...props} closePopper={closePopper} />}
    </Popper>
  )
}

const TimeFilter = ({ filter, values, onChange }: FilterProps) => {
  const { translate } = useInternationalization()
  const { from, to } = splitTimeValue(values[filter.param]?.[0])
  const day = (value?: string | null): string => (value ? value.slice(0, 10) : '')

  return (
    <div className="flex items-center gap-2" role="group" aria-label={filter.name}>
      <Typography variant="captionHl" color="grey600">
        {filter.name}
      </Typography>
      <DatePicker
        className="w-40"
        name={`${filter.param}-from`}
        defaultZone="UTC"
        placeholder={translate('text_1793702953940abb4n32stoz')}
        value={from || null}
        onChange={(value) => onChange(filter, joinTimeValue(day(value), to))}
      />
      <DatePicker
        className="w-40"
        name={`${filter.param}-to`}
        defaultZone="UTC"
        placeholder={translate('text_1793702953940auxviskavwa')}
        value={to || null}
        onChange={(value) => onChange(filter, joinTimeValue(from, day(value)))}
      />
    </div>
  )
}

export const AnalyticsD3setFilterBar = ({ hasValues, onReset, ...props }: FilterBarProps) => {
  const { translate } = useInternationalization()

  if (!props.filters.length) return null

  return (
    <div
      className="flex flex-wrap items-center gap-3"
      data-test={ANALYTICS_D3SET_FILTER_BAR_TEST_ID}
    >
      {props.filters.map((filter) =>
        filter.kind === 'time' ? (
          <TimeFilter key={filter.id} {...props} filter={filter} />
        ) : (
          <SelectFilter key={filter.id} {...props} filter={filter} />
        ),
      )}
      <Button
        variant="quaternary"
        disabled={!hasValues}
        onClick={onReset}
        data-test={ANALYTICS_D3SET_FILTER_RESET_TEST_ID}
      >
        {translate('text_1793702953940n7tvuqqt5e4')}
      </Button>
    </div>
  )
}
