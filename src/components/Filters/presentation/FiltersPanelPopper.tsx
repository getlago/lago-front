import Stack from '@mui/material/Stack'
import { revalidateLogic } from '@tanstack/react-form'
import { tw } from 'lago-design-system'
import { useEffect, useMemo, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { FiltersPanelItemTypeSwitch } from '~/components/Filters/graphql/FiltersPanelItemTypeSwitch'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import { buildFiltersPanelValidationSchema } from '~/components/Filters/presentation/filtersPanelPopper/validationSchema'
import {
  AvailableFiltersEnum,
  FiltersFormValues,
  mapFilterToPanelTranslationKey,
} from '~/components/Filters/presentation/types'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

export const FILTERS_PANEL_OPENER_TEST_ID = 'filters-panel-opener'
export const FILTERS_PANEL_TEST_ID = 'filters-panel'
export const FILTERS_PANEL_CLEAR_ALL_TEST_ID = 'filters-panel-clear-all'
export const FILTERS_PANEL_FILTER_ITEM_TEST_ID = 'filters-panel-filter-item'
export const FILTERS_PANEL_REMOVE_FILTER_TEST_ID = 'filters-panel-remove-filter'
export const FILTERS_PANEL_ADD_FILTER_TEST_ID = 'filters-panel-add-filter'
export const FILTERS_PANEL_CANCEL_TEST_ID = 'filters-panel-cancel'
export const FILTERS_PANEL_APPLY_TEST_ID = 'filters-panel-apply'

const buildDefaultValues = (filters: FiltersFormValues['filters']): FiltersFormValues => ({
  // Default has to contain an empty object to display the first filter placeholder
  filters: filters.length ? [...filters] : [{}],
})

export const FiltersPanelPopper = () => {
  const { translate } = useInternationalization()
  const {
    availableFilters,
    initialFiltersFormValues,
    staticFiltersFormValues,
    applyFilters,
    buttonOpener,
    displayInDialog,
  } = useFilters()

  const listContainerElementRef = useRef<HTMLDivElement>(null)
  const closePopperRef = useRef<(() => void) | null>(null)

  const hasInitialFilters = initialFiltersFormValues.length > 0

  const validationSchema = useMemo(
    () => buildFiltersPanelValidationSchema(hasInitialFilters),
    [hasInitialFilters],
  )

  const form = useAppForm({
    defaultValues: buildDefaultValues(initialFiltersFormValues),
    validationLogic: revalidateLogic({ mode: 'change' }),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: ({ value }) => {
      applyFilters(value)
      closePopperRef.current?.()
    },
  })

  const initialFiltersSignature = JSON.stringify(initialFiltersFormValues)
  const seededFiltersSignatureRef = useRef(initialFiltersSignature)

  // Filters also change outside the panel (an active-filter chip removed, a reset): re-seed the
  // form from the URL so reopening it shows what is actually applied.
  useEffect(() => {
    if (seededFiltersSignatureRef.current === initialFiltersSignature) {
      return
    }

    seededFiltersSignatureRef.current = initialFiltersSignature
    form.reset(buildDefaultValues(initialFiltersFormValues))
  }, [form, initialFiltersFormValues, initialFiltersSignature])

  return (
    <Popper
      displayInDialog={displayInDialog}
      PopperProps={{ placement: 'bottom-start' }}
      opener={
        buttonOpener || (
          <Button
            data-test={FILTERS_PANEL_OPENER_TEST_ID}
            startIcon="filter"
            size="small"
            variant="quaternary"
          >
            {translate('text_66ab42d4ece7e6b7078993ad')}
          </Button>
        )
      }
    >
      {({ closePopper }) => (
        /* About w-[calc(100vw_-_2px)], we needed to force the container to stick on max-width */
        /* Also, need to remove 2px to prevent border to get out of screen view, and trigger underlying elements scroll to be trigger by scroll on the popper element: https://linear.app/getlago/issue/LAGO-180/when-panel-touch-screen-borders-window-can-scroll-horizontally */
        <form
          data-test={FILTERS_PANEL_TEST_ID}
          className="grid max-h-[480px] w-[calc(100vw_-_2px)] max-w-[864px] grid-rows-[64px_1fr_72px]"
          onSubmit={(event) => {
            event.preventDefault()
            closePopperRef.current = closePopper
            form.handleSubmit()
          }}
        >
          <form.AppField name="filters" mode="array">
            {(filtersField) => {
              const filters = filtersField.state.value

              const updateFilter = (
                filterIndex: number,
                filter: FiltersFormValues['filters'][0],
              ): void => {
                filtersField.handleChange(
                  filters.map((current, index) => (index === filterIndex ? filter : current)),
                )
              }

              // `canSubmit` only turns false once a validator has run, so an untouched panel would
              // offer Apply on an incomplete filter. Gate it on the schema instead.
              const isFilterSetApplicable = validationSchema.safeParse({ filters }).success

              const comboboxFiltersData = availableFilters.map((filter) => ({
                label: translate(mapFilterToPanelTranslationKey(filter)),
                value: filter,
                disabled: filters.some(({ filterType }) => filterType === filter),
              }))

              return (
                <>
                  <div className="flex h-16 items-center justify-between px-4 py-0 shadow-b lg:px-6">
                    <Typography variant="bodyHl" color="grey700">
                      {translate('text_66ab42d4ece7e6b7078993ad')}
                    </Typography>
                    <Button
                      data-test={FILTERS_PANEL_CLEAR_ALL_TEST_ID}
                      onClick={() => {
                        filtersField.handleChange(
                          staticFiltersFormValues.length ? [...staticFiltersFormValues] : [{}],
                        )
                      }}
                      variant="quaternary"
                    >
                      {translate('text_66ab42d4ece7e6b7078993a9')}
                    </Button>
                  </div>
                  <div
                    className="flex flex-col gap-6 overflow-y-auto p-4 lg:gap-3 lg:px-6 lg:py-4"
                    ref={listContainerElementRef}
                  >
                    {filters.map((filter, filterIndex) => (
                      <div
                        data-test={FILTERS_PANEL_FILTER_ITEM_TEST_ID}
                        key={`filter-item-${filterIndex}`}
                        className="border-1 flex flex-col justify-start gap-4 rounded-xl border border-solid border-grey-300 p-4 lg:flex-1 lg:flex-row lg:border-none lg:p-0"
                      >
                        {
                          // h = 48px to mimic the height of the ComboBox
                        }
                        <div className="flex lg:h-12 lg:w-[49px] lg:items-center">
                          <div className="block lg:hidden">
                            <Typography variant="bodyHl" color="grey700">
                              {`${translate('text_65e9c6d183491188fbbcf070')} ${filterIndex + 1}`}
                            </Typography>
                          </div>
                          <div className="hidden lg:block">
                            {filterIndex === 0 ? (
                              <Typography variant="body" color="grey700">
                                {translate('text_66ab42d4ece7e6b7078993b5')}
                              </Typography>
                            ) : (
                              <Typography variant="body" color="grey700">
                                {translate('text_65f8472df7593301061e27d6').toLowerCase()}
                              </Typography>
                            )}
                          </div>
                        </div>
                        {
                          // Metadata behaves differently, needs more space and is designed as a whole block on its own
                        }
                        <div
                          className={tw(
                            'flex flex-col justify-start gap-2 lg:flex-1 lg:flex-row lg:gap-3 lg:[&>div:first-child]:w-[200px] lg:[&>div:last-child]:flex-1',
                            {
                              'rounded-xl border border-grey-300 p-3':
                                filter.filterType === 'metadata',
                              'lg:items-center': filter.filterType !== 'metadata',
                            },
                          )}
                        >
                          <ComboBox
                            PopperProps={{
                              displayInDialog,
                            }}
                            disableClearable
                            data={comboboxFiltersData}
                            placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
                            value={filter.filterType}
                            disabled={filter.disabled}
                            onChange={(value) => {
                              updateFilter(filterIndex, {
                                ...filter,
                                filterType: value as AvailableFiltersEnum,
                                // Value needs to be reset when changing type
                                value: undefined,
                              })
                            }}
                          />

                          <FiltersPanelItemTypeSwitch
                            filterType={filter.filterType}
                            value={filter.value}
                            setFilterValue={(value: string) => {
                              updateFilter(filterIndex, { ...filter, value })
                            }}
                          />
                        </div>

                        {/* Actions */}
                        {!filter.disabled && (
                          <>
                            <div className="block lg:hidden">
                              <Button
                                fitContent
                                align="left"
                                size="small"
                                startIcon="trash"
                                variant="quaternary"
                                disabled={filters.length === 1}
                                onClick={() => filtersField.removeValue(filterIndex)}
                              >
                                {translate('text_66ab4ad87fc8510054f237c2')}
                              </Button>
                            </div>
                            <div className="hidden lg:block">
                              <Tooltip
                                title={translate('text_63ea0f84f400488553caa786')}
                                placement="top-end"
                                disableHoverListener={filters.length === 1}
                              >
                                <Button
                                  data-test={FILTERS_PANEL_REMOVE_FILTER_TEST_ID}
                                  icon="trash"
                                  variant="quaternary"
                                  disabled={filters.length === 1}
                                  onClick={() => filtersField.removeValue(filterIndex)}
                                />
                              </Tooltip>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-18 items-center justify-between px-4 py-0 shadow-t lg:px-6">
                    <Button
                      data-test={FILTERS_PANEL_ADD_FILTER_TEST_ID}
                      startIcon="plus"
                      disabled={filters.length === availableFilters.length}
                      onClick={() => {
                        filtersField.pushValue({})

                        // After adding a new filter, scroll to the bottom of the container
                        setTimeout(() => {
                          listContainerElementRef.current?.scrollTo({
                            top: listContainerElementRef.current.scrollHeight,
                            behavior: 'smooth',
                          })
                        })
                      }}
                      variant="inline"
                    >
                      {translate('text_66ab42d4ece7e6b7078993b9')}
                    </Button>

                    <Stack direction="row" spacing={2}>
                      <Button
                        data-test={FILTERS_PANEL_CANCEL_TEST_ID}
                        onClick={() => {
                          closePopper()
                          form.reset()
                        }}
                        variant="quaternary"
                      >
                        {translate('text_6411e6b530cb47007488b027')}
                      </Button>
                      <form.AppForm>
                        <form.SubmitButton
                          dataTest={FILTERS_PANEL_APPLY_TEST_ID}
                          disabled={!isFilterSetApplicable}
                          variant="primary"
                        >
                          {translate('text_66ab42d4ece7e6b7078993c1')}
                        </form.SubmitButton>
                      </form.AppForm>
                    </Stack>
                  </div>
                </>
              )
            }}
          </form.AppField>
        </form>
      )}
    </Popper>
  )
}
