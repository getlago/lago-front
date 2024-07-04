import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

import { AvailableFilters } from './types'

import { Button } from '../Button'
import { Popper } from '../Popper'
import { Typography } from '../Typography'

type FiltersPanelPoperProps = {
  filters: AvailableFilters[]
}

type FormValues = {
  filters: Array<{
    filterType?: AvailableFilters
    value?: string | string[] | boolean
  }>
}

export const FiltersPanelPoper = ({ filters }: FiltersPanelPoperProps) => {
  const { translate } = useInternationalization()
  let [searchParams] = useSearchParams()
  const filtersAlreadySet = Object.fromEntries(searchParams.entries())

  const initialFilters = useMemo(() => {
    return Object.entries(filtersAlreadySet).reduce(
      (acc, cur) => {
        const [key, value] = cur as [AvailableFilters, string]

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
      [] as FormValues['filters'],
    )
  }, [filtersAlreadySet, filters])

  const formikProps = useFormik<FormValues>({
    initialValues: {
      // Default has to contain an empty object to display the first filter placeholder
      filters: !!initialFilters.length ? initialFilters : [{}],
    },
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: (values) => {
      console.log('Form values:', values)
      // TODO: Update URL with filters
    },
  })

  console.log('formikProps:', formikProps.values)

  return (
    <Popper
      PopperProps={{ placement: 'bottom-start' }}
      opener={
        <Button startIcon="filter" variant="quaternary">
          {translate('TODO: Filters')}
        </Button>
      }
    >
      {({ closePopper }) => (
        <FiltersContainer>
          <FiltersHeader>
            <Typography variant="body" color="grey700">
              {translate('TODO: Filters')}
            </Typography>

            <Button onClick={() => console.log('Reset form')} variant="quaternary">
              {translate('TODO: Clear all')}
            </Button>
          </FiltersHeader>
          <FiltersBody>
            {/* TODO: display all filters row */}
            {/* TODO: Update translations */}
            {formikProps.values.filters.map((filter, filterIndex) => (
              <FilterItem key={`filter-item-${filter.filterType}`}>
                <>
                  <div className="hide-above-md">
                    <Typography variant="bodyHl" color="grey700">
                      {translate('Filter 1')}
                      {/* TODO: ujse filter index */}
                    </Typography>
                  </div>
                  <div className="show-bellow-md">
                    {filterIndex === 0 ? (
                      <Typography variant="bodyHl" color="grey700">
                        {translate('Where')}
                      </Typography>
                    ) : (
                      <Typography variant="bodyHl" color="grey700">
                        {translate('and')}
                      </Typography>
                    )}
                  </div>
                </>

                <div className="filter-item-inner-container">
                  <div>Combobox</div>
                  <Typography variant="body" color="grey700">
                    {translate('is')}
                  </Typography>
                  <div>Input or date range</div>
                </div>
                <>
                  <div className="hide-above-md">
                    <Button
                      fitContent
                      align="left"
                      size="small"
                      startIcon="trash"
                      variant="quaternary"
                      onClick={() => console.log('Remove filter')}
                    >
                      {translate('TODO: Remove')}
                    </Button>
                  </div>
                  <div className="show-bellow-md">
                    <Button
                      align="left"
                      size="small"
                      icon="trash"
                      variant="quaternary"
                      onClick={() => console.log('Remove filter')}
                    />
                  </div>
                </>
              </FilterItem>
            ))}
          </FiltersBody>
          <FiltersFooter>
            <Button startIcon="plus" onClick={() => console.log('Add filter')} variant="quaternary">
              {translate('TODO: Add filter')}
            </Button>

            <Stack direction="row" spacing={2}>
              <Button onClick={closePopper} variant="quaternary">
                {translate('TODO: Cancel')}
              </Button>
              <Button
                onClick={() => {
                  console.log('Apply filters')
                  closePopper()
                }}
                variant="primary"
              >
                {translate('TODO: Apply')}
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
  max-width: 815px;
  max-height: 480px;

  ${theme.breakpoints.up('md')} {
    /* width: 815px; */
  }
`

const FiltersHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(4)};
  box-sizing: border-box;
  box-shadow: ${theme.shadows[7]};
  height: 64px;

  ${theme.breakpoints.up('md')} {
    padding: 0 ${theme.spacing(6)};
  }
`

const FiltersBody = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${theme.spacing(6)};
  box-sizing: border-box;
  box-shadow: ${theme.shadows[7]};
  padding: ${theme.spacing(4)};
  gap: ${theme.spacing(6)};

  ${theme.breakpoints.up('md')} {
    gap: none;
    padding: ${theme.spacing(4)} ${theme.spacing(6)};
  }
`

const FiltersFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${theme.spacing(4)};
  box-sizing: border-box;
  height: ${NAV_HEIGHT};
  ${theme.breakpoints.up('md')} {
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

  .show-bellow-md {
    display: none;

    ${theme.breakpoints.up('md')} {
      display: block;
    }
  }

  .hide-above-md {
    display: block;

    ${theme.breakpoints.up('md')} {
      display: none;
    }
  }

  .filter-item-inner-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: ${theme.spacing(2)};
  }

  ${theme.breakpoints.up('md')} {
    flex: 1;
    border: none;
    align-items: center;
    flex-direction: row;
    padding: 0;

    .filter-item-inner-container {
      align-items: center;
      flex-direction: row;
      flex: 1;

      > :nth-child(3) {
        flex: 1;
      }
    }
  }
`
