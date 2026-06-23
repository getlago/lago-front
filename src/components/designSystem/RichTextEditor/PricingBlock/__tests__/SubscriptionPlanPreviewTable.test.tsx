import { screen } from '@testing-library/react'

import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'
import type { PlanPreviewData } from '~/core/serializers/buildPlanPreviewData'

import {
  SubscriptionPlanPreviewTable,
  SUBSCRIPTION_PLAN_PREVIEW_TABLE_TEST_ID,
} from '../SubscriptionPlanPreviewTable'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockTranslate = (key: string) => key

const data: PlanPreviewData = {
  rows: [
    {
      kind: 'main',
      rowType: 'subscriptionFee',
      name: undefined,
      interval: PlanInterval.Monthly,
      timing: 'beginningOfPeriod',
      units: { type: 'count', value: 1 },
      price: { type: 'amount', amountCents: '1300' },
    },
    {
      kind: 'main',
      rowType: 'usageCharge',
      name: 'API calls',
      interval: PlanInterval.Monthly,
      timing: 'endOfPeriod',
      units: { type: 'usageBased' },
      price: { type: 'variesWithUsage' },
    },
    {
      kind: 'detail',
      label: { type: 'tierRange', from: 1, to: 10 },
      qualifier: { type: 'perUnit' },
      value: { type: 'amount', amountCents: '10' },
    },
  ],
}

const defaultProps = {
  data,
  translate: mockTranslate,
  currency: CurrencyEnum.Usd,
}

describe('SubscriptionPlanPreviewTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the component is rendered with plan data', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the table container with correct data-test id', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        expect(screen.getByTestId(SUBSCRIPTION_PLAN_PREVIEW_TABLE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the preview table with correct testid', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        expect(
          screen.getByTestId('preview-table-subscription-plan-preview'),
        ).toBeInTheDocument()
      })

      it('THEN should render 4 header columns', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        const table = screen.getByTestId('preview-table-subscription-plan-preview')
        const headerCells = table.querySelectorAll('th')

        expect(headerCells).toHaveLength(4)
      })

      it('THEN should render the correct number of rows matching fixture', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        const rows = screen.getAllByTestId(/^preview-table-subscription-plan-preview-row-/)

        expect(rows).toHaveLength(data.rows.length)
      })

      it('THEN should display the usage charge name', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        expect(screen.getByText('API calls')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN multiple rows', () => {
    describe('WHEN rendered with 3 rows (2 main + 1 detail)', () => {
      it('THEN should render 3 table rows total', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        const rows = screen.getAllByTestId(/^preview-table-subscription-plan-preview-row-/)

        expect(rows).toHaveLength(3)
      })
    })
  })

  describe('GIVEN a row with an explicit name', () => {
    describe('WHEN the usage charge has a name', () => {
      it('THEN should display the charge name text', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        expect(screen.getByText('API calls')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the footer is rendered', () => {
    describe('WHEN the table renders', () => {
      it('THEN the outer container and preview table are both present', () => {
        render(<SubscriptionPlanPreviewTable {...defaultProps} />)

        expect(screen.getByTestId(SUBSCRIPTION_PLAN_PREVIEW_TABLE_TEST_ID)).toBeInTheDocument()
        expect(
          screen.getByTestId('preview-table-subscription-plan-preview'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a locale is provided', () => {
    describe('WHEN locale is set', () => {
      it('THEN should render the table without errors', () => {
        render(
          <SubscriptionPlanPreviewTable
            {...defaultProps}
            locale={'fr' as never}
          />,
        )

        expect(screen.getByTestId(SUBSCRIPTION_PLAN_PREVIEW_TABLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN different currency values', () => {
    describe('WHEN EUR currency is used', () => {
      it('THEN should render the table without errors', () => {
        render(
          <SubscriptionPlanPreviewTable
            {...defaultProps}
            currency={CurrencyEnum.Eur}
          />,
        )

        expect(screen.getByTestId(SUBSCRIPTION_PLAN_PREVIEW_TABLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })
})
