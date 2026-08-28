import { MockedResponse } from '@apollo/client/testing'
import { act, render as rtlRender, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import {
  ENTITY_SECTION_METADATA_TEST_ID,
  ENTITY_SECTION_VIEW_NAME_TEST_ID,
} from '~/components/MainHeader/mainHeaderTestIds'
import {
  GetRateCardRateForDetailsDocument,
  RateCardBillingTimingEnum,
  RateCardRateStatusEnum,
} from '~/generated/graphql'
import { AllTheProviders, testMockNavigateFn } from '~/test-utils'

import RateCardRateDetails, {
  buildRateCardRateSnapshotKey,
  RATE_CARD_RATE_ACTIVITY_LOGS_EMPTY_KEY,
  RATE_CARD_RATE_BREADCRUMB_KEY,
  RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID,
  RATE_CARD_RATE_DETAILS_DELETE_TEST_ID,
  RATE_CARD_RATE_DETAILS_EDIT_TEST_ID,
} from '../RateCardRateDetails'

// Every test mounts the whole page, so the default 5s budget is tight under parallel jest.
jest.setTimeout(15000)

const mockOpenRateDrawer = jest.fn()
const mockOpenDeleteRateDialog = jest.fn()
const mockHasPermissions = jest.fn()
let mockIsPremium = true

jest.mock('~/pages/catalog/drawers/rateCardRate/useRateCardRateDrawer', () => ({
  useRateCardRateDrawer: () => ({ openDrawer: mockOpenRateDrawer }),
}))

jest.mock('~/pages/catalog/dialogs/useDeleteRateCardRateDialog', () => ({
  useDeleteRateCardRateDialog: () => ({
    openDeleteRateCardRateDialog: mockOpenDeleteRateDialog,
  }),
}))

jest.mock('../RateCardRateDetailsOverview', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const rateFixture = {
  __typename: 'RateCardRate',
  id: 'rate-1',
  code: 'rate_01_24_2026',
  effectiveFrom: '2026-01-24T00:00:00.000Z',
  status: RateCardRateStatusEnum.Pending,
  rateModel: 'standard',
  billingIntervalCount: 1,
  billingIntervalUnit: 'month',
  minAmountCents: '0',
  appliedPricingUnitConversionRate: null,
  rateProperties: {
    __typename: 'Properties',
    amount: '10',
    pricingGroupKeys: null,
    packageSize: null,
    freeUnits: null,
    fixedAmount: null,
    freeUnitsPerEvents: null,
    freeUnitsPerTotalAggregation: null,
    rate: null,
    perTransactionMinAmount: null,
    perTransactionMaxAmount: null,
    customProperties: null,
    graduatedRanges: null,
    graduatedPercentageRanges: null,
    volumeRanges: null,
  },
}

const rateCardFixture = {
  __typename: 'RateCard',
  id: 'rc-1',
  name: 'Standard rate card',
  code: 'standard_rate_card',
  currency: 'USD',
  appliedPricingUnitCode: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: 'product-1',
    name: 'API calls',
    productType: 'usage',
    productCategory: { __typename: 'ProductCategory', id: 'pcategory-1', name: 'Platform' },
    billableMetric: {
      __typename: 'BillableMetric',
      id: 'bm-1',
      aggregationType: 'sum_agg',
      recurring: false,
    },
  },
  productFilter: null,
  activeRate: null,
}

const detailsQueryMock = (rate: Record<string, unknown> = rateFixture): MockedResponse => ({
  request: {
    query: GetRateCardRateForDetailsDocument,
    variables: { rateId: 'rate-1', rateCardId: 'rc-1' },
  },
  result: { data: { rateCardRate: rate, rateCard: rateCardFixture } },
})

const RateCardRateDetailsWithHeader = () => (
  <>
    <MainHeader />
    <RateCardRateDetails />
  </>
)

// The cache only writes fragment fields when it can match the typename.
const renderPage = (mocks: MockedResponse[] = [detailsQueryMock()], tab = 'overview') =>
  rtlRender(<RateCardRateDetailsWithHeader />, {
    wrapper: ({ children }) => (
      <AllTheProviders
        forceTypenames
        mocks={mocks}
        useParams={{ rateCardId: 'rc-1', rateId: 'rate-1', tab }}
      >
        {children}
      </AllTheProviders>
    ),
  })

describe('RateCardRateDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
    mockIsPremium = true
    window.history.pushState({}, '', '/')
  })

  describe('GIVEN a rate is loaded', () => {
    describe('WHEN the page renders', () => {
      it('THEN shows the parent rate card name and code in the header', async () => {
        await act(() => renderPage())

        await waitFor(() => {
          expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
            'Standard rate card',
          )
        })
        expect(screen.getAllByTestId(ENTITY_SECTION_METADATA_TEST_ID)[0]).toHaveTextContent(
          'standard_rate_card',
        )
      })

      it('THEN links the catalog breadcrumb to the rate cards list', async () => {
        await act(() => renderPage())

        const catalogCrumb = await screen.findByRole('link', {
          name: 'text_1783019143196z1oi70j03vt',
        })

        expect(catalogCrumb).toHaveAttribute('href', '/product-catalog/rate-cards')
      })

      it('THEN links the rate card breadcrumb to its rates tab, where this rate lives', async () => {
        await act(() => renderPage())

        const rateCardCrumb = await screen.findByRole('link', { name: 'Standard rate card' })

        expect(rateCardCrumb).toHaveAttribute('href', '/product-catalog/rate-cards/rc-1/rates')
      })

      it('THEN ends the breadcrumb on a static rate crumb', async () => {
        await act(() => renderPage())

        await waitFor(() =>
          expect(screen.getByText(RATE_CARD_RATE_BREADCRUMB_KEY)).toBeInTheDocument(),
        )
        expect(screen.getByText(RATE_CARD_RATE_BREADCRUMB_KEY).closest('a')).toBeNull()
      })

      it('THEN shows the overview and activity logs tabs', async () => {
        await act(() => renderPage())

        expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
        expect(screen.getByText('text_1747314141347qq6rasuxisl')).toBeInTheDocument()
      })

      it.each([
        [
          'without premium',
          () => (mockIsPremium = false),
          () => mockHasPermissions.mockReturnValue(true),
        ],
        [
          'without the auditLogsView permission',
          () => (mockIsPremium = true),
          () =>
            mockHasPermissions.mockImplementation(
              (permissions: string[]) => !permissions.includes('auditLogsView'),
            ),
        ],
      ])('THEN hides the activity logs tab %s', async (_, setPremium, setPermissions) => {
        setPremium()
        setPermissions()

        await act(() => renderPage())

        expect(await screen.findByText('text_628cf761cbe6820138b8f2e4')).toBeInTheDocument()
        expect(screen.queryByText('text_1747314141347qq6rasuxisl')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the activity logs tab is active', () => {
    describe('WHEN the page renders', () => {
      // `ResourceTypeEnum` has no rate member yet, so the tab says where changes are tracked.
      it('THEN points at the parent rate card, with no table mounted', async () => {
        window.history.pushState(
          {},
          '',
          '/product-catalog/rate-cards/rc-1/rates/rate-1/activity-logs',
        )

        await act(() => renderPage([detailsQueryMock()], 'activity-logs'))

        await waitFor(() =>
          expect(screen.getByText(RATE_CARD_RATE_ACTIVITY_LOGS_EMPTY_KEY)).toBeInTheDocument(),
        )
        expect(screen.queryByRole('table')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a pending rate', () => {
    describe('WHEN the edit action is used', () => {
      it('THEN opens the drawer with the loaded rate and its card', async () => {
        await act(() => renderPage())

        await userEvent.click(
          (await screen.findAllByTestId(RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID))[0],
        )
        await userEvent.click(screen.getByTestId(RATE_CARD_RATE_DETAILS_EDIT_TEST_ID))

        expect(mockOpenRateDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            rate: expect.objectContaining({ id: 'rate-1' }),
            rateCard: expect.objectContaining({ id: 'rc-1' }),
          }),
        )
      })
    })

    describe('WHEN the delete action is used', () => {
      it('THEN opens the dialog whose callback returns to the rates tab', async () => {
        await act(() => renderPage())

        await userEvent.click(
          (await screen.findAllByTestId(RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID))[0],
        )
        await userEvent.click(screen.getByTestId(RATE_CARD_RATE_DETAILS_DELETE_TEST_ID))

        expect(mockOpenDeleteRateDialog).toHaveBeenCalledWith(
          expect.objectContaining({ rate: expect.objectContaining({ id: 'rate-1' }) }),
        )

        const { callback } = mockOpenDeleteRateDialog.mock.calls[0][0]

        callback()

        expect(testMockNavigateFn).toHaveBeenCalledWith('/product-catalog/rate-cards/rc-1/rates')
      })
    })
  })

  describe('GIVEN a terminated rate', () => {
    describe('WHEN the actions dropdown is opened', () => {
      it('THEN offers neither edit nor delete, because the backend refuses both', async () => {
        await act(() =>
          renderPage([
            detailsQueryMock({ ...rateFixture, status: RateCardRateStatusEnum.Terminated }),
          ]),
        )

        await waitFor(() =>
          expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
            'Standard rate card',
          ),
        )

        expect(screen.queryByTestId(RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN an active rate', () => {
    describe('WHEN the actions dropdown is opened', () => {
      it('THEN keeps edit but drops delete', async () => {
        await act(() =>
          renderPage([detailsQueryMock({ ...rateFixture, status: RateCardRateStatusEnum.Active })]),
        )

        await userEvent.click(
          (await screen.findAllByTestId(RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID))[0],
        )

        expect(screen.getByTestId(RATE_CARD_RATE_DETAILS_EDIT_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(RATE_CARD_RATE_DETAILS_DELETE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the user has neither the update nor the delete permission', () => {
    describe('WHEN the page renders', () => {
      it('THEN hides the whole actions dropdown', async () => {
        mockHasPermissions.mockReturnValue(false)

        await act(() => renderPage())

        await waitFor(() =>
          expect(screen.getAllByTestId(ENTITY_SECTION_VIEW_NAME_TEST_ID)[0]).toHaveTextContent(
            'Standard rate card',
          ),
        )

        expect(screen.queryByTestId(RATE_CARD_RATE_DETAILS_ACTIONS_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the rate does not exist', () => {
    describe('WHEN the page renders', () => {
      it('THEN redirects to the parent rate card rates tab', async () => {
        const notFoundMock = {
          request: {
            query: GetRateCardRateForDetailsDocument,
            variables: { rateId: 'rate-1', rateCardId: 'rc-1' },
          },
          result: {
            errors: [{ message: 'Resource not found', extensions: { code: 'not_found' } }],
          },
        }

        await act(() => renderPage([notFoundMock]))

        await waitFor(() => {
          expect(testMockNavigateFn).toHaveBeenCalledWith(
            '/product-catalog/rate-cards/rc-1/rates',
            { replace: true },
          )
        })
      })
    })
  })
})

// The config is re-pushed only when this key changes, so a pricing-only save has to move it.
describe('buildRateCardRateSnapshotKey', () => {
  type SnapshotArgs = Parameters<typeof buildRateCardRateSnapshotKey>[0]

  const rate = rateFixture as unknown as NonNullable<SnapshotArgs['rate']>
  const rateCard = rateCardFixture as unknown as NonNullable<SnapshotArgs['rateCard']>

  describe('GIVEN two rates differing only in a pricing value', () => {
    describe('WHEN their snapshot keys are compared', () => {
      it.each([
        ['the amount', { rateProperties: { ...rate.rateProperties, amount: '20' } }],
        ['the spending minimum', { minAmountCents: '2500' }],
        ['the pricing unit conversion rate', { appliedPricingUnitConversionRate: 2 }],
      ])('THEN %s changes the key', (_, override) => {
        expect(buildRateCardRateSnapshotKey({ rate, rateCard })).not.toBe(
          buildRateCardRateSnapshotKey({ rate: { ...rate, ...override }, rateCard }),
        )
      })
    })
  })

  describe('GIVEN the card gained an active rate', () => {
    describe('WHEN the snapshot keys are compared', () => {
      it('THEN the key changes, so the append boundary handed down cannot go stale', () => {
        expect(buildRateCardRateSnapshotKey({ rate, rateCard })).not.toBe(
          buildRateCardRateSnapshotKey({
            rate,
            rateCard: {
              ...rateCard,
              activeRate: { id: 'rate-0', effectiveFrom: '2026-01-01T00:00:00.000Z' },
            },
          }),
        )
      })
    })
  })

  describe('GIVEN the very same rate and card', () => {
    describe('WHEN the snapshot keys are compared', () => {
      it('THEN the key is stable, so the header is not re-pushed on every render', () => {
        expect(buildRateCardRateSnapshotKey({ rate, rateCard })).toBe(
          buildRateCardRateSnapshotKey({ rate, rateCard }),
        )
      })
    })
  })
})
