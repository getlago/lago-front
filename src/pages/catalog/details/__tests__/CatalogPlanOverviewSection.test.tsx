import { render, screen, waitFor } from '@testing-library/react'

import { GetCatalogPlanForDetailsOverviewDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID,
  CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID,
  CatalogPlanOverviewSection,
} from '../CatalogPlanOverviewSection'

const mockHasPermissions = jest.fn()

jest.mock('../../drawers/catalogPlan/useCatalogPlanDrawer', () => ({
  useCatalogPlanDrawer: () => ({ openDrawer: jest.fn() }),
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

const buildMock = (appliedRateCardsCount: number) => ({
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
        description: 'A description',
        invoiceDisplayName: 'Cards',
        appliedRateCardsCount,
        attachedToContracts: false,
      },
    },
  },
})

const renderSection = (appliedRateCardsCount = 0): void => {
  render(<CatalogPlanOverviewSection />, {
    wrapper: ({ children }) => (
      <AllTheProviders forceTypenames mocks={[buildMock(appliedRateCardsCount)]}>
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

  it('GIVEN update permission THEN offers Edit plan', async () => {
    renderSection()

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).toBeInTheDocument(),
    )
  })

  it('GIVEN no update permission THEN hides Edit plan', async () => {
    mockHasPermissions.mockReturnValue(false)
    renderSection()

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByTestId(CATALOG_PLAN_OVERVIEW_EDIT_TEST_ID)).not.toBeInTheDocument()
  })

  it('GIVEN no rate card THEN offers the quick action', async () => {
    renderSection(0)

    await waitFor(() =>
      expect(screen.getByTestId(CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID)).toBeInTheDocument(),
    )
    expect(screen.getByText('text_17890300495307orirxcvgn8')).toBeInTheDocument()
  })

  it('GIVEN existing rate cards THEN hides the quick action', async () => {
    renderSection(2)

    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(
      screen.queryByTestId(CATALOG_PLAN_QUICK_ACTION_RATE_CARDS_TEST_ID),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('text_17890300495307orirxcvgn8')).not.toBeInTheDocument()
  })
})
