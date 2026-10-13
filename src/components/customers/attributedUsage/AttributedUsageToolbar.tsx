import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { ComponentPropsWithoutRef, forwardRef, ReactNode, RefObject, useState } from 'react'

import { Popper } from '~/components/designSystem/Popper'
import { AttributedUsageBasisEnum, useGetAttributedUsageQuery } from '~/generated/graphql'
import { tw } from '~/styles/utils'

import {
  aggregationLabel,
  AttributionType,
  chargeLabel,
  chargeMeta,
  countDays,
  customRangeError,
  FILTER_VALUES_SIZE,
  isAttributableCharge,
  MAX_CUSTOM_WINDOW_DAYS,
  MAX_FILTER_VALUES,
  MAX_FLAT_FILTERS,
  MAX_SELECTED_CHARGES,
  Period,
  PeriodKindEnum,
  PlanCharge,
  ScopeFilter,
  typeLabel,
  useDebouncedValue,
} from './utils'

export type PopperHandle = { openPopper: () => unknown; closePopper: () => unknown }

const POPPER_PLACEMENT = { placement: 'bottom-start' as const }

export const ToolbarButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<'button'>>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={tw(
        'inline-flex items-center gap-2 rounded-lg border border-grey-300 bg-white px-2.5 py-1 text-xs font-medium text-grey-700 hover:bg-grey-100',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
)

ToolbarButton.displayName = 'ToolbarButton'

export const ToolbarDivider = (): JSX.Element => <div className="h-6 w-px bg-grey-300" />

export const ToolbarLabel = ({ children }: { children: ReactNode }): JSX.Element => (
  <span className="text-xs text-grey-500">{children}</span>
)

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}): JSX.Element => (
  <div className="flex gap-0.5 rounded-lg bg-grey-100 p-0.5">
    {options.map((option) => (
      <button
        type="button"
        key={option.value}
        onClick={() => onChange(option.value)}
        className={tw(
          'rounded-md px-3 py-1 text-xs font-medium',
          option.value === value
            ? 'bg-white text-grey-700 shadow-[0px_2px_4px_0px_rgba(25,33,46,0.10)]'
            : 'text-grey-500',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
)

const Checkbox = ({ checked, disabled }: { checked: boolean; disabled?: boolean }): JSX.Element => {
  const getClasses = (): string => {
    if (checked) return 'border-blue-600 bg-blue-600'
    if (disabled) return 'border-grey-300 bg-grey-100'

    return 'border-grey-400 bg-white'
  }

  return (
    <span
      className={tw(
        'flex size-4 shrink-0 items-center justify-center rounded border',
        getClasses(),
      )}
    >
      {checked && <Icon name="checkmark" size="small" color="light" />}
    </span>
  )
}

const PopoverFooter = ({ children }: { children: ReactNode }): JSX.Element => (
  <div className="flex items-center justify-end gap-2 bg-grey-100 px-3.5 py-2.5 shadow-[inset_0_1px_0_0_#E7EAEE]">
    {children}
  </div>
)

const SectionTitle = ({
  children,
  bordered,
}: {
  children: ReactNode
  bordered?: boolean
}): JSX.Element => (
  <div
    className={tw(
      'px-3.5 pb-1 pt-2.5 text-[11px] font-medium uppercase leading-4 tracking-wide text-grey-500',
      bordered && 'mt-1 shadow-[inset_0_1px_0_0_#E7EAEE]',
    )}
  >
    {children}
  </div>
)

/* Period */

type PeriodPickerProps = {
  period: Period
  onApply: (period: Period) => void
  rangeLabel: string
  currentRangeLabel: string
  previousRangeLabel?: string
  subscriptionStartedAt?: string | null
  popperRef: RefObject<PopperHandle>
}

const PERIOD_KIND_LABELS: Record<PeriodKindEnum, string> = {
  [PeriodKindEnum.current]: 'Current billing period',
  [PeriodKindEnum.previous]: 'Previous billing period',
  [PeriodKindEnum.custom]: 'Custom range',
}

export const periodKindLabel = (period: Period): string =>
  period.kind === PeriodKindEnum.custom
    ? `Custom · ${countDays(period.from, period.to)} days`
    : PERIOD_KIND_LABELS[period.kind]

const PeriodPopover = ({
  period,
  onApply,
  close,
  currentRangeLabel,
  previousRangeLabel,
  subscriptionStartedAt,
}: Omit<PeriodPickerProps, 'popperRef' | 'rangeLabel'> & { close: () => void }): JSX.Element => {
  const today = DateTime.now().toISODate() ?? ''
  const minDate = subscriptionStartedAt
    ? (DateTime.fromISO(subscriptionStartedAt, { zone: 'utc' }).toISODate() ?? undefined)
    : undefined
  const [kind, setKind] = useState(period.kind)
  const [from, setFrom] = useState(
    period.kind === PeriodKindEnum.custom
      ? period.from
      : (DateTime.now().startOf('month').toISODate() ?? ''),
  )
  const [to, setTo] = useState(period.kind === PeriodKindEnum.custom ? period.to : today)

  const draftError =
    kind === PeriodKindEnum.custom
      ? customRangeError({ from, to, minDate, maxDate: today })
      : undefined
  const canApply = !draftError

  const options = [
    { kind: PeriodKindEnum.current, range: currentRangeLabel },
    ...(previousRangeLabel ? [{ kind: PeriodKindEnum.previous, range: previousRangeLabel }] : []),
    { kind: PeriodKindEnum.custom, range: `Up to ${MAX_CUSTOM_WINDOW_DAYS} days` },
  ]

  const apply = (): void => {
    if (!canApply) return

    onApply(kind === PeriodKindEnum.custom ? { kind, from, to } : { kind })
    close()
  }

  return (
    <div className="w-[360px]">
      <div className="py-1.5">
        {options.map((option) => {
          const selected = option.kind === kind

          return (
            <button
              type="button"
              key={option.kind}
              onClick={() => setKind(option.kind)}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-grey-100"
            >
              <span
                className={tw(
                  'flex size-4 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-blue-600' : 'border-grey-400',
                )}
              >
                {selected && <span className="size-2 rounded-full bg-blue-600" />}
              </span>
              <span className="text-sm font-medium text-grey-700">
                {PERIOD_KIND_LABELS[option.kind]}
              </span>
              <span className="flex-1" />
              <span className="text-xs text-grey-500">{option.range}</span>
            </button>
          )
        })}
      </div>
      {kind === PeriodKindEnum.custom && (
        <div className="flex flex-col gap-2 pb-3.5 pl-10 pr-3.5">
          <div className="flex gap-2">
            {[
              { label: 'From', value: from, onChange: setFrom },
              { label: 'To', value: to, onChange: setTo },
            ].map((field) => (
              <label
                key={field.label}
                className="flex flex-1 flex-col gap-1 text-[11px] font-medium leading-4 text-grey-500"
              >
                {field.label}
                <input
                  type="date"
                  value={field.value}
                  min={minDate}
                  max={today}
                  onChange={(event) => field.onChange(event.target.value)}
                  className={tw(
                    'rounded-lg border px-2 py-1 text-xs text-grey-700 outline-none',
                    draftError ? 'border-grey-500' : 'border-grey-300',
                  )}
                />
              </label>
            ))}
          </div>
          <span className="text-[11px] leading-4 text-grey-500">
            Up to {MAX_CUSTOM_WINDOW_DAYS} days
            {minDate
              ? `, between ${DateTime.fromISO(minDate).toFormat('LLL d, yyyy')} (subscription start) and today.`
              : '.'}
          </span>
          {draftError && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-100 px-2.5 py-2">
              <Icon name="warning-unfilled" size="small" color="warning" className="mt-0.5" />
              <span className="text-xs text-grey-700">{draftError}</span>
            </div>
          )}
        </div>
      )}
      <PopoverFooter>
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-grey-300 bg-white px-3 py-1 text-xs font-medium text-grey-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className={tw(
            'rounded-lg px-3 py-1 text-xs font-medium',
            canApply ? 'bg-blue-600 text-white' : 'cursor-not-allowed bg-grey-100 text-grey-400',
          )}
        >
          Apply
        </button>
      </PopoverFooter>
    </div>
  )
}

export const PeriodPicker = ({
  popperRef,
  rangeLabel,
  ...props
}: PeriodPickerProps): JSX.Element => (
  <div className="flex items-center gap-2">
    <ToolbarLabel>Period</ToolbarLabel>
    <Popper
      ref={popperRef}
      PopperProps={POPPER_PLACEMENT}
      opener={
        <ToolbarButton>
          <Icon name="calendar" size="small" color="dark" />
          {rangeLabel}
          <span className="font-normal text-grey-500">{periodKindLabel(props.period)}</span>
          <Icon name="chevron-down" size="small" color="dark" />
        </ToolbarButton>
      }
    >
      {({ closePopper }) => <PeriodPopover {...props} close={closePopper} />}
    </Popper>
  </div>
)

/* Charges */

type ChargesPickerProps = {
  charges: PlanCharge[]
  selectedIds: string[]
  onToggle: (chargeId: string) => void
  popperRef: RefObject<PopperHandle>
}

const lockedReason = (charge: PlanCharge): string =>
  charge.billableMetric.recurring
    ? 'Recurring'
    : aggregationLabel(charge.billableMetric.aggregationType)

export const ChargesPicker = ({
  charges,
  selectedIds,
  onToggle,
  popperRef,
}: ChargesPickerProps): JSX.Element => {
  const attributable = charges.filter(isAttributableCharge)
  const locked = charges.filter((charge) => !isAttributableCharge(charge))
  const atLimit = selectedIds.length >= MAX_SELECTED_CHARGES

  return (
    <Popper
      ref={popperRef}
      PopperProps={POPPER_PLACEMENT}
      opener={
        <ToolbarButton>
          <Icon name="pulse" size="small" color="dark" />
          Charges
          <span className="font-normal text-grey-500">
            {selectedIds.length} of {attributable.length}
          </span>
          <Icon name="chevron-down" size="small" color="dark" />
        </ToolbarButton>
      }
    >
      <div className="w-[360px]">
        <SectionTitle>Columns</SectionTitle>
        {attributable.map((charge) => {
          const selected = selectedIds.includes(charge.id)
          const disabled = (selected && selectedIds.length === 1) || (!selected && atLimit)

          return (
            <button
              type="button"
              key={charge.id}
              onClick={() => !disabled && onToggle(charge.id)}
              className={tw(
                'flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-grey-100',
                disabled && 'cursor-not-allowed',
              )}
            >
              <Checkbox checked={selected} disabled={disabled} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-grey-700">{chargeLabel(charge)}</span>
                <span className="text-[11px] leading-4 text-grey-500">{chargeMeta(charge)}</span>
              </div>
            </button>
          )
        })}
        {!!locked.length && (
          <>
            <SectionTitle bordered>Not attributable</SectionTitle>
            {locked.map((charge) => (
              <div
                key={charge.id}
                title="This metric can't be split across entities"
                className="flex cursor-not-allowed items-center gap-2.5 px-3.5 py-2"
              >
                <Checkbox checked={false} disabled />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-grey-400">{chargeLabel(charge)}</span>
                  <span className="text-[11px] leading-4 text-grey-400">
                    {lockedReason(charge)}
                  </span>
                </div>
                <span className="flex-1" />
                <span className="whitespace-nowrap rounded-lg bg-grey-100 px-1.5 text-[11px] font-medium leading-4 text-grey-600">
                  Not attributable
                </span>
              </div>
            ))}
          </>
        )}
        <div className="bg-grey-100 px-3.5 py-2 text-[11px] leading-4 text-grey-500 shadow-[inset_0_1px_0_0_#E7EAEE]">
          Up to {MAX_SELECTED_CHARGES} charges. Fewer charges make the view faster.
        </div>
      </div>
    </Popper>
  )
}

/* Filters */

type FilterBarProps = {
  flatTypes: AttributionType[]
  filters: ScopeFilter[]
  onChange: (filters: ScopeFilter[]) => void
  subscriptionId: string
  fromDatetime?: string
  toDatetime?: string
  popperRef: RefObject<PopperHandle>
}

const FilterValues = ({
  type,
  selected,
  onToggle,
  onBack,
  close,
  subscriptionId,
  fromDatetime,
  toDatetime,
}: {
  type: AttributionType
  selected: string[]
  onToggle: (value: string) => void
  onBack: () => void
  close: () => void
  subscriptionId: string
  fromDatetime?: string
  toDatetime?: string
}): JSX.Element => {
  const [search, setSearch] = useState('')
  const searchTerm = useDebouncedValue(search.trim(), 300)
  const { data, loading } = useGetAttributedUsageQuery({
    variables: {
      subscriptionId,
      groupBy: type.code,
      fromDatetime,
      toDatetime,
      basis: AttributedUsageBasisEnum.Units,
      limit: FILTER_VALUES_SIZE,
      searchTerm: searchTerm || undefined,
    },
    context: { silentError: true },
  })
  const values = [
    ...selected.filter((value) => !searchTerm || value.includes(searchTerm)),
    ...(data?.attributedUsage.rows ?? [])
      .map((row) => row.value)
      .filter((value) => !selected.includes(value)),
  ]
  const atLimit = selected.length >= MAX_FILTER_VALUES

  const renderValues = (): ReactNode => {
    if (loading && !data)
      return <div className="px-3 py-2 text-xs text-grey-500">Loading values…</div>
    if (!values.length)
      return <div className="px-3 py-2 text-xs text-grey-500">No value found.</div>

    return values.map((value) => {
      const checked = selected.includes(value)
      const blocked = !checked && atLimit

      return (
        <button
          type="button"
          key={value}
          onClick={() => !blocked && onToggle(value)}
          className={tw(
            'flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-grey-100',
            blocked && 'cursor-not-allowed',
          )}
        >
          <Checkbox checked={checked} disabled={blocked} />
          <span className={tw('font-mono text-xs', blocked ? 'text-grey-400' : 'text-grey-700')}>
            {value}
          </span>
        </button>
      )
    })
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 shadow-[inset_0_-1px_0_0_#E7EAEE]">
        <button type="button" onClick={onBack} aria-label="Back">
          <Icon name="chevron-left" size="small" color="dark" />
        </button>
        <span className="font-mono text-xs">{type.code}</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 shadow-[inset_0_-1px_0_0_#E7EAEE]">
        <Icon name="magnifying-glass" size="small" color="input" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${type.code} values`}
          className="bg-transparent flex-1 border-0 text-sm text-grey-700 outline-none"
        />
      </div>
      <div className="max-h-64 overflow-y-auto">{renderValues()}</div>
      <div className="flex items-center gap-2 bg-grey-100 px-3 py-2 shadow-[inset_0_1px_0_0_#E7EAEE]">
        <span
          className={tw(
            'flex-1 text-[11px] leading-4',
            atLimit ? 'text-grey-700' : 'text-grey-500',
          )}
        >
          {atLimit
            ? `${MAX_FILTER_VALUES} of ${MAX_FILTER_VALUES} selected · max ${MAX_FILTER_VALUES} values per dimension`
            : `${selected.length} selected · max ${MAX_FILTER_VALUES}`}
        </span>
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-grey-300 bg-white px-2.5 py-0.5 text-xs font-medium text-grey-700"
        >
          Done
        </button>
      </div>
    </>
  )
}

const FilterPopover = ({
  flatTypes,
  filters,
  onChange,
  initialCode,
  close,
  ...queryProps
}: Omit<FilterBarProps, 'popperRef'> & {
  initialCode?: string
  close: () => void
}): JSX.Element => {
  const [code, setCode] = useState(initialCode)
  const [search, setSearch] = useState('')
  const type = flatTypes.find((flatType) => flatType.code === code)
  const current = filters.find((filter) => filter.code === code)

  const toggleValue = (value: string): void => {
    if (!code) return

    if (!current) {
      if (filters.length >= MAX_FLAT_FILTERS) return

      onChange([...filters, { code, values: [value] }])

      return
    }

    const values = current.values.includes(value)
      ? current.values.filter((item) => item !== value)
      : [...current.values, value]

    onChange(
      values.length
        ? filters.map((filter) => (filter.code === code ? { code, values } : filter))
        : filters.filter((filter) => filter.code !== code),
    )
  }

  if (type) {
    return (
      <div className="w-[300px]">
        <FilterValues
          type={type}
          selected={current?.values ?? []}
          onToggle={toggleValue}
          onBack={() => setCode(undefined)}
          close={close}
          {...queryProps}
        />
      </div>
    )
  }

  const available = flatTypes.filter(
    (flatType) =>
      !filters.some((filter) => filter.code === flatType.code) &&
      flatType.code.includes(search.trim().toLowerCase()),
  )

  return (
    <div className="w-[300px]">
      <div className="flex items-center gap-2 px-3 py-2 shadow-[inset_0_-1px_0_0_#E7EAEE]">
        <Icon name="magnifying-glass" size="small" color="input" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search dimensions"
          className="bg-transparent flex-1 border-0 text-sm text-grey-700 outline-none"
        />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {available.map((flatType) => (
          <button
            type="button"
            key={flatType.id}
            onClick={() => setCode(flatType.code)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-grey-100"
          >
            <span className="font-mono text-xs">{flatType.code}</span>
            <span className="flex-1" />
            <span className="text-[11px] leading-4 text-grey-500">{typeLabel(flatType)}</span>
            <Icon name="chevron-right" size="small" color="dark" />
          </button>
        ))}
        {!available.length && (
          <div className="px-3 py-2 text-xs text-grey-500">No flat dimension left.</div>
        )}
      </div>
      <div className="flex items-center gap-2 bg-grey-100 px-3 py-2 shadow-[inset_0_1px_0_0_#E7EAEE]">
        <span className="flex-1 text-[11px] leading-4 text-grey-500">
          {filters.length} of {MAX_FLAT_FILTERS} dimensions used
        </span>
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-grey-300 bg-white px-2.5 py-0.5 text-xs font-medium text-grey-700"
        >
          Done
        </button>
      </div>
    </div>
  )
}

export const FilterBar = ({ popperRef, ...props }: FilterBarProps): JSX.Element => {
  const { flatTypes, filters, onChange } = props
  const [initialCode, setInitialCode] = useState<string>()
  const atLimit = filters.length >= MAX_FLAT_FILTERS

  if (!flatTypes.length) return <></>

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Icon name="filter" size="small" color="input" />
      {filters.map((filter) => (
        <div
          key={filter.code}
          role="button"
          tabIndex={0}
          onClick={() => {
            setInitialCode(filter.code)
            popperRef.current?.openPopper()
          }}
          onKeyDown={() => undefined}
          className="inline-flex cursor-pointer items-center overflow-hidden rounded-lg border border-blue-600"
        >
          <span className="font-mono bg-blue-100 px-2 py-0.5 text-[11px] leading-4 text-blue-700">
            {filter.code}
          </span>
          <span className="font-mono bg-blue-600 px-2 py-0.5 text-[11px] leading-4 text-white">
            {filter.values.length === 1 ? filter.values[0] : `${filter.values.length} values`}
          </span>
          <button
            type="button"
            aria-label={`Remove ${filter.code} filter`}
            onClick={(event) => {
              event.stopPropagation()
              onChange(filters.filter((item) => item.code !== filter.code))
            }}
            className="flex items-center bg-blue-600 px-1.5 py-1 hover:bg-blue-700"
          >
            <Icon name="close" size="small" color="light" />
          </button>
        </div>
      ))}
      <Popper
        ref={popperRef}
        PopperProps={POPPER_PLACEMENT}
        onClickAway={() => setInitialCode(undefined)}
        opener={
          <button
            type="button"
            disabled={atLimit}
            onClick={() => setInitialCode(undefined)}
            className={tw(
              'inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-0.5 text-xs font-medium',
              atLimit
                ? 'cursor-not-allowed border-grey-300 bg-grey-100 text-grey-400'
                : 'border-grey-400 bg-white text-grey-600',
            )}
          >
            <Icon name="plus" size="small" color={atLimit ? 'disabled' : 'dark'} />
            Add filter
          </button>
        }
      >
        {({ closePopper }) => (
          <FilterPopover
            key={initialCode ?? 'dimensions'}
            {...props}
            initialCode={initialCode}
            close={() => {
              closePopper()
              setInitialCode(undefined)
            }}
          />
        )}
      </Popper>
      <span className={tw('text-[11px] leading-4', atLimit ? 'text-grey-700' : 'text-grey-500')}>
        {atLimit
          ? `Max ${MAX_FLAT_FILTERS} dimensions per view. Remove one to add another.`
          : 'Filter by flat dimensions. Drill into the tree to narrow the hierarchy.'}
      </span>
    </div>
  )
}
