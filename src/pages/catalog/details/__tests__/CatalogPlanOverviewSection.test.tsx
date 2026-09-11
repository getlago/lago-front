import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { GetCatalogPlanForDetailsOverviewDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID,
  CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID,
  CatalogPlanOverviewSection,
} from '../CatalogPlanOverviewSection'

const mockOpenEditCatalogPlanDrawer = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('../../drawers/catalogPlan/useCatalogPlanDrawer', () => ({
  useCatalogPlanDrawer: () => ({ openDrawer: mockOpenEditCatalogPlanDrawer }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ catalogPlanId: 'plan-1' }),
}))

type PlanOverrides = {
  appliedRateCardsCount?: number
  description?: string | null
  invoiceDisplayName?: string | null
}

const buildMock = ({
  appliedRateCardsCount = 0,
  description = 'A description',
  invoiceDisplayName = 'Cards',
}: PlanOverrides) => ({
  request: {
    query: GetCatalogPlanForDetailsOverviewDocument,
    variables: { id: 'plan-1' },
  },
  result: {
    data: {
      catalogPlan: {
        __typename: 'CatalogPlan',
        id: 'plan-1',
        name: 'Premium',
        code: 'premium',
        currency: 'USD',
        description,
        invoiceDisplayName,
        appliedRateCardsCount,
        attachedToContracts: false,
      },
    },
  },
})

const renderSection = (overrides: PlanOverrides = {}): void => {
  render(<CatalogPlanOverviewSection />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={[buildMock(overrides)]}>
        {children}
      </AllTheProviders>
    ),
  })
}

describe('CatalogPlanOverviewSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('GIVEN a plan THEN renders every info grid value', async () => {
    renderSection()

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.getByText('premium')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('Cards')).toBeInTheDocument()
    expect(screen.getByText('A description')).toBeInTheDocument()
  })

  it('GIVEN no description THEN hides the description row', async () => {
    renderSection({ description: null })

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByText('text_6388b923e514213fed58331c')).not.toBeInTheDocument()
  })

  it('GIVEN no invoice display name THEN hides the invoice display name row', async () => {
    renderSection({ invoiceDisplayName: null })

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByText('text_65018c8e5c6b626f030bcf26')).not.toBeInTheDocument()
  })

  it('GIVEN update permission THEN offers Edit plan', async () => {
    renderSection()

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).toBeInTheDocument(),
    )
  })

  it('GIVEN a click on Edit plan THEN opens the drawer seeded with the plan', async () => {
    renderSection()

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).toBeInTheDocument(),
    )
    await userEvent.click(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID))

    expect(mockOpenEditCatalogPlanDrawer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'plan-1', code: 'premium' }),
    )
  })

  it('GIVEN no update permission THEN hides Edit plan', async () => {
    mockHasPermissions.mockReturnValue(false)
    renderSection()

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN no rate card THEN offers the quick action', async () => {
    renderSection({ appliedRateCardsCount: 0 })

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID)).toBeInTheDocument(),
    )
    expect(screen.getByText('text_17890300495307orirxcvgn8')).toBeInTheDocument()
  })

  it('GIVEN existing rate cards THEN hides the quick action', async () => {
    renderSection({ appliedRateCardsCount: 2 })

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(
      screen.queryByTestId(CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('text_17890300495307orirxcvgn8')).not.toBeInTheDocument()
  })
})
