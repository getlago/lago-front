import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FilterValueInputProps } from '~/components/Filters/presentation/types'
import { PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  AttributionEntityFilterInput,
  AttributionTimeRangeFilterInput,
  buildAttributionDynamicFilters,
} from '../AttributionFilterInputs'
import {
  ATTRIBUTION_TIME_RANGE_FILTER_KEY,
  getAttributionEntityFilterKey,
} from '../attributionFilters'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/Filters/graphql/useFilters', () => ({
  useFilters: () => ({ displayInDialog: false }),
}))

const OPTION_TEST_ID = 'stub-combobox-option'
const CUSTOM_VALUE_TEST_ID = 'stub-combobox-custom-value'

type StubOption = { value: string; label?: string }

jest.mock('~/components/form', () => ({
  ...jest.requireActual('~/components/form'),
  ComboBox: ({ data, onChange }: { data: StubOption[]; onChange: (value: string) => void }) => (
    <div>
      {data.map((option) => (
        <button
          key={option.value}
          data-test={OPTION_TEST_ID}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  ),
  MultipleComboBox: ({
    data,
    value,
    onChange,
  }: {
    data: StubOption[]
    value: StubOption[]
    onChange: (value: StubOption[]) => void
  }) => (
    <div>
      {data.map((option) => (
        <button
          key={option.value}
          data-test={OPTION_TEST_ID}
          onClick={() => onChange([...value, option])}
        />
      ))}
      <button
        data-test={CUSTOM_VALUE_TEST_ID}
        onClick={() => onChange([...value, { value: 'data,science' }])}
      />
    </div>
  ),
}))

const mockFilterValuesQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetAttributionFilterValuesQuery: (options: unknown) => mockFilterValuesQuery(options),
}))

const translate = (key: string): string => key

const subscription = {
  startedAt: '2025-01-01T00:00:00Z',
  currentBillingPeriodStartedAt: '2026-10-01T00:00:00Z',
  plan: { interval: PlanInterval.Monthly },
}

const departmentType = { id: 'type-department', code: 'department', name: 'Department' }
const teamType = { id: 'type-team', code: 'team', name: null }
const apiKeyType = { id: 'type-api-key', code: 'api_key', name: 'API Key' }

const mockValues = (values: string[] = []): void => {
  mockFilterValuesQuery.mockReturnValue({
    data: { attributedUsage: { rows: values.map((value) => ({ value })) } },
    loading: false,
  })
}

describe('AttributionFilterInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValues()
  })

  describe('GIVEN the time range input', () => {
    const renderTimeRange = (
      props: Partial<FilterValueInputProps & { hasPastPeriod: boolean }> = {},
    ): jest.Mock => {
      const setFilterValue = jest.fn()

      render(
        <AttributionTimeRangeFilterInput
          value="current"
          setFilterValue={setFilterValue}
          hasPastPeriod
          {...props}
        />,
      )

      return setFilterValue
    }

    describe('WHEN the subscription has a past period', () => {
      it('THEN should offer current, past and custom', () => {
        renderTimeRange()

        expect(screen.getAllByTestId(OPTION_TEST_ID)).toHaveLength(3)
      })
    })

    describe('WHEN the subscription has no past period', () => {
      it('THEN should hide the past option', () => {
        renderTimeRange({ hasPastPeriod: false })

        expect(screen.getAllByTestId(OPTION_TEST_ID)).toHaveLength(2)
      })
    })

    describe('WHEN picking the custom option', () => {
      it('THEN should store an empty range to fill', async () => {
        const user = userEvent.setup()
        const setFilterValue = renderTimeRange()

        await user.click(screen.getAllByTestId(OPTION_TEST_ID)[2])

        expect(setFilterValue).toHaveBeenCalledWith(',')
      })
    })

    describe('WHEN picking the past option', () => {
      it('THEN should store the past value', async () => {
        const user = userEvent.setup()
        const setFilterValue = renderTimeRange()

        await user.click(screen.getAllByTestId(OPTION_TEST_ID)[1])

        expect(setFilterValue).toHaveBeenCalledWith('past')
      })
    })
  })

  describe('GIVEN the entity input', () => {
    const renderEntity = (
      props: Partial<FilterValueInputProps & { canListValues: boolean }> = {},
    ): jest.Mock => {
      const setFilterValue = jest.fn()

      render(
        <AttributionEntityFilterInput
          value=""
          setFilterValue={setFilterValue}
          subscriptionId="subscription-1"
          typeCode="department"
          canListValues
          {...props}
        />,
      )

      return setFilterValue
    }

    describe('WHEN its values can be listed', () => {
      it('THEN should query the type values of the subscription', () => {
        renderEntity()

        expect(mockFilterValuesQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            variables: { subscriptionId: 'subscription-1', groupBy: 'department', limit: 100 },
            skip: false,
          }),
        )
      })

      it('THEN should offer every non empty value', () => {
        mockValues(['rnd', '', 'gtm'])
        renderEntity()

        expect(screen.getAllByTestId(OPTION_TEST_ID)).toHaveLength(2)
      })

      it('THEN should store the picked values joined by commas', async () => {
        const user = userEvent.setup()

        mockValues(['rnd', 'gtm'])

        const setFilterValue = renderEntity({ value: 'rnd' })

        await user.click(screen.getAllByTestId(OPTION_TEST_ID)[1])

        expect(setFilterValue).toHaveBeenCalledWith('rnd,gtm')
      })
    })

    describe('WHEN its values cannot be listed', () => {
      it('THEN should skip the values query', () => {
        renderEntity({ canListValues: false })

        expect(mockFilterValuesQuery).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
      })

      it('THEN should store a typed value with its commas escaped', async () => {
        const user = userEvent.setup()
        const setFilterValue = renderEntity({ canListValues: false })

        await user.click(screen.getByTestId(CUSTOM_VALUE_TEST_ID))

        expect(setFilterValue).toHaveBeenLastCalledWith('data|-COMMA-|science')
      })
    })
  })

  describe('GIVEN the dynamic filters are built', () => {
    const build = (overrides: Partial<Parameters<typeof buildAttributionDynamicFilters>[0]> = {}) =>
      buildAttributionDynamicFilters({
        translate,
        subscriptionId: 'subscription-1',
        subscription,
        flatTypes: [apiKeyType],
        hierarchicalTypes: [departmentType, teamType],
        rootTypes: [departmentType],
        ...overrides,
      })

    const renderInput = (input: ReactNode): void => {
      render(<>{input}</>)
    }

    describe('WHEN listing them', () => {
      it('THEN should put the time range first, then one filter per flat and hierarchical type', () => {
        expect(build().map(({ key, label }) => ({ key, label }))).toEqual([
          { key: ATTRIBUTION_TIME_RANGE_FILTER_KEY, label: expect.any(String) },
          { key: getAttributionEntityFilterKey('api_key'), label: 'API Key' },
          { key: getAttributionEntityFilterKey('department'), label: 'Department' },
          { key: getAttributionEntityFilterKey('team'), label: 'team' },
        ])
      })
    })

    describe('WHEN rendering the entity inputs', () => {
      it.each([
        ['a flat type', 1, false],
        ['a root hierarchical type', 2, false],
        ['a non root hierarchical type', 3, true],
      ])('THEN %s should skip the values query: %p', (_, index, skip) => {
        renderInput(build()[index].renderValueInput({ value: '', setFilterValue: jest.fn() }))

        expect(mockFilterValuesQuery).toHaveBeenLastCalledWith(expect.objectContaining({ skip }))
      })
    })

    describe('WHEN rendering the time range input', () => {
      it('THEN should hide the past option when the subscription has no past period', () => {
        renderInput(
          build({ subscription: null })[0].renderValueInput({
            value: 'current',
            setFilterValue: jest.fn(),
          }),
        )

        expect(screen.getAllByTestId(OPTION_TEST_ID)).toHaveLength(2)
      })
    })

    describe('WHEN formatting the chip values', () => {
      it('THEN should label a preset time range', () => {
        expect(build()[0].formatValue('past')).toEqual(expect.any(String))
        expect(build()[0].formatValue('past')).not.toBe(build()[0].formatValue('current'))
      })

      it('THEN should format both bounds of a custom time range', () => {
        expect(
          build()[0].formatValue('2026-09-01T00:00:00.000Z,2026-09-10T23:59:59.999Z').split(' - '),
        ).toHaveLength(2)
      })

      it('THEN should list the unescaped entity values', () => {
        expect(build()[1].formatValue('k_1,a|-COMMA-|b')).toBe('k_1, a,b')
      })
    })

    describe('WHEN validating the values', () => {
      it('THEN should reject a custom time range over 31 days', () => {
        expect(build()[0].isValueValid?.('2026-08-01T00:00:00.000Z,2026-10-01T23:59:59.999Z')).toBe(
          false,
        )
      })

      it.each([
        [20, true],
        [21, false],
      ])('THEN %p entity values should be valid: %p', (count, expected) => {
        const value = Array.from({ length: count }, (_, index) => `v${index}`).join(',')

        expect(build()[1].isValueValid?.(value)).toBe(expected)
      })
    })
  })
})
