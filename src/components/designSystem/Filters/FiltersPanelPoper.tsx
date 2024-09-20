/* eslint-disable tailwindcss/no-custom-classname */
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { array, lazy, object, string } from 'yup'

import { Button, Popper, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

import { FiltersPanelItemTypeSwitch } from './FiltersPanelItemTypeSwitch'
import { AvailableFiltersEnum, mapFilterToTranslationKey } from './types'

type FiltersPanelPoperProps = {
  filters: AvailableFiltersEnum[]
}

export type FiltersFormValues = {
  filters: Array<{
    filterType?: AvailableFiltersEnum
    value?: string
  }>
}

export const FiltersPanelPoper = ({ filters }: FiltersPanelPoperProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  let [searchParams] = useSearchParams()
  const listContainerElementRef = useRef<HTMLDivElement>(null)
  const filtersAlreadySet = Object.fromEntries(searchParams.entries())

  const initialFilters = useMemo(() => {
    return Object.entries(filtersAlreadySet).reduce(
      (acc, cur) => {
        const [key, value] = cur as [AvailableFiltersEnum, FiltersFormValues['filters'][0]['value']]

        if (!filters.includes(key)) {
          return acc
        }

        return [
          ...acc,
          {
            filterType: key,
            value,
          },
        ]
      },
      [] as FiltersFormValues['filters'],
    )
  }, [filtersAlreadySet, filters])

  const formikProps = useFormik<FiltersFormValues>({
    initialValues: {
      // Default has to contain an empty object to display the first filter placeholder
      filters: !!initialFilters.length ? initialFilters : [{}],
    },
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: (values) => {
      const newUrlSearchParams = values.filters.reduce((acc, cur) => {
        if (!cur.filterType || cur.value === undefined || !filters.includes(cur.filterType)) {
          return acc
        }

        acc.set(cur.filterType, cur.value as string)

        return acc
      }, new URLSearchParams())

      navigate({ search: newUrlSearchParams.toString() })
    },
    validationSchema: object().shape({
      filters: lazy((value: FiltersFormValues['filters']) => {
        // Make sure schema is valid on "Clear all" button press
        if (initialFilters.length > 0 && value.length === 1 && Object.keys(value[0]).length === 0) {
          return array().of(object())
        }

        return array().of(
          object().shape({
            filterType: string().required(''),
            value: string().when('filterType', {
              is: (filterType: AvailableFiltersEnum) =>
                !!filterType && filterType === AvailableFiltersEnum.issuingDate,
              then: (schema) => schema.matches(/\w+,\w+/, '').required(''),
              otherwise: (schema) => schema.required(''),
            }),
          }),
        )
      }),
    }),
  })

  const comboboxFiltersData = useMemo(() => {
    const alreadySelectedFiltersTypes = formikProps.values.filters.map(
      (filter) => filter.filterType,
    )

    return filters.map((filter) => {
      return {
        label: translate(mapFilterToTranslationKey(filter)),
        value: filter,
        disabled: alreadySelectedFiltersTypes.includes(filter),
      }
    })
  }, [formikProps.values.filters, filters, translate])

  return (
    <Popper
      PopperProps={{ placement: 'bottom-start' }}
      opener={
        <Button startIcon="filter" size="small" variant="quaternary">
          {translate('text_66ab42d4ece7e6b7078993ad')}
        </Button>
      }
    >
      {({ closePopper }) => (
        <FiltersContainer>
          <FiltersHeader>
            <Typography variant="bodyHl" color="grey700">
              {translate('text_66ab42d4ece7e6b7078993ad')}
            </Typography>

            <Button
              onClick={() => {
                formikProps.setFieldValue('filters', [{}])
              }}
              variant="quaternary"
            >
              {translate('text_66ab42d4ece7e6b7078993a9')}
            </Button>
          </FiltersHeader>
          <FiltersBody ref={listContainerElementRef}>
            {formikProps.values.filters.map((filter, filterIndex) => (
              <FilterItem key={`filter-item-${filterIndex}`}>
                <FilterItemPrefix>
                  <div className="show-bellow-lg">
                    <Typography variant="bodyHl" color="grey700">
                      {`${translate('text_65e9c6d183491188fbbcf070')} ${filterIndex + 1}`}
                    </Typography>
                  </div>
                  <div className="show-above-lg">
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
                </FilterItemPrefix>

                <div className="filter-item-inner-container">
                  <ComboBox
                    disableClearable
                    data={comboboxFiltersData}
                    placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
                    value={filter.filterType}
                    onChange={(value) => {
                      const newFilterObject = {
                        ...formikProps.values.filters[filterIndex],
                        filterType: value,
                        // Value needs to be reset when changing type
                        value: undefined,
                      }

                      formikProps.setFieldValue(`filters[${filterIndex}]`, newFilterObject)
                    }}
                  />

                  <FiltersPanelItemTypeSwitch
                    filterType={filter.filterType}
                    value={filter.value}
                    setFilterValue={(value: string) => {
                      formikProps.setFieldValue(`filters[${filterIndex}].value`, value)
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="show-bellow-lg">
                  <Button
                    fitContent
                    align="left"
                    size="small"
                    startIcon="trash"
                    variant="quaternary"
                    disabled={formikProps.values.filters.length === 1}
                    onClick={() => {
                      const newFilters = formikProps.values.filters.filter(
                        (_, index) => index !== filterIndex,
                      )

                      formikProps.setFieldValue('filters', newFilters)
                    }}
                  >
                    {translate('text_66ab4ad87fc8510054f237c2')}
                  </Button>
                </div>
                <div className="show-above-lg">
                  <Tooltip
                    title={translate('text_63ea0f84f400488553caa786')}
                    placement="top-end"
                    disableHoverListener={formikProps.values.filters.length === 1}
                  >
                    <Button
                      icon="trash"
                      variant="quaternary"
                      disabled={formikProps.values.filters.length === 1}
                      onClick={() => {
                        const newFilters = formikProps.values.filters.filter(
                          (_, index) => index !== filterIndex,
                        )

                        formikProps.setFieldValue('filters', newFilters)
                      }}
                    />
                  </Tooltip>
                </div>
              </FilterItem>
            ))}
          </FiltersBody>
          <FiltersFooter>
            <Button
              startIcon="plus"
              disabled={formikProps.values.filters.length === filters.length}
              onClick={() => {
                formikProps.setFieldValue('filters', [...formikProps.values.filters, {}])

                // After adding a new filter, scroll to the bottom of the container
                setTimeout(() => {
                  listContainerElementRef.current?.scrollTo({
                    top: listContainerElementRef.current.scrollHeight,
                    behavior: 'smooth',
                  })
                })
              }}
              variant="quaternary"
            >
              {translate('text_66ab42d4ece7e6b7078993b9')}
            </Button>

            <Stack direction="row" spacing={2}>
              <Button
                onClick={() => {
                  closePopper()
                  formikProps.resetForm()
                }}
                variant="quaternary"
              >
                {translate('text_6411e6b530cb47007488b027')}
              </Button>
              <Button
                disabled={!formikProps.dirty || !formikProps.isValid}
                onClick={() => {
                  formikProps.submitForm()
                  closePopper()
                }}
                variant="primary"
              >
                {translate('text_66ab42d4ece7e6b7078993c1')}
              </Button>
            </Stack>
          </FiltersFooter>
        </FiltersContainer>
      )}
    </Popper>
  )
}

const FiltersContainer = styled.div`
  display: grid;
  grid-template-rows: 64px 1fr 72px;
  max-height: 480px;
  max-width: 864px;
  /* Needed to force the container to stick on max-width */
  /* Also, need to remove 2px to prevent border to get out of screen view, and trigger underlying elements scroll to be trigger by scroll on the popper element: https://linear.app/getlago/issue/LAGO-180/when-panel-touch-screen-borders-window-can-scroll-horizontally */
  width: calc(100vw - 2px);
`

const FiltersHeader = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(4)};
  box-sizing: border-box;
  box-shadow: ${theme.shadows[7]};

  ${theme.breakpoints.up('lg')} {
    padding: 0 ${theme.spacing(6)};
  }
`

const FiltersBody = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing(6)};
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  gap: ${theme.spacing(6)};
  overflow-y: auto;

  ${theme.breakpoints.up('lg')} {
    gap: ${theme.spacing(3)};
    padding: ${theme.spacing(4)} ${theme.spacing(6)};
  }
`

const FiltersFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(4)};
  box-sizing: border-box;
  /* NOTE: -1 stands to include the border-top 1px */
  height: ${NAV_HEIGHT - 1};
  border-top: 1px solid ${theme.palette.grey[300]};

  ${theme.breakpoints.up('lg')} {
    padding: 0 ${theme.spacing(6)};
  }
`

const FilterItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: ${theme.spacing(4)};
  gap: ${theme.spacing(4)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;

  .show-above-lg {
    display: none;

    ${theme.breakpoints.up('lg')} {
      display: block;
    }
  }

  .show-bellow-lg {
    display: block;

    ${theme.breakpoints.up('lg')} {
      display: none;
    }
  }

  .filter-item-inner-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: ${theme.spacing(2)};
  }

  ${theme.breakpoints.up('lg')} {
    flex: 1;
    border: none;
    align-items: center;
    flex-direction: row;
    padding: 0;

    .filter-item-inner-container {
      align-items: center;
      flex-direction: row;
      flex: 1;
      gap: ${theme.spacing(3)};

      > :nth-child(1) {
        width: 200px;
      }

      > :nth-child(3) {
        flex: 1;
      }
    }
  }
`

const FilterItemPrefix = styled.div`
  ${theme.breakpoints.up('lg')} {
    width: 49px;
  }
`
