import { screen, waitFor } from '@testing-library/react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { GetGovernanceEntitiesRoleCountsDocument } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import GovernanceSettings, {
  GOVERNANCE_SETTINGS_FLAT_TAB_TEST_ID,
  GOVERNANCE_SETTINGS_HIERARCHICAL_TAB_TEST_ID,
} from '../GovernanceSettings'

const GOVERNANCE_ENTITIES_TABLE_STUB_TEST_ID = 'governance-entities-table-stub'

jest.mock('../GovernanceEntitiesTable', () => ({
  GovernanceEntitiesTable: ({ role }: { role: string }) => (
    <div data-test="governance-entities-table-stub" data-role={role} />
  ),
}))

const roleCountsMock = (hierarchical: number, flat: number): TestMocksType => [
  {
    request: { query: GetGovernanceEntitiesRoleCountsDocument, variables: {} },
    result: {
      data: {
        hierarchical: { metadata: { totalCount: hierarchical } },
        flat: { metadata: { totalCount: flat } },
      },
    },
  },
]

const renderPage = (mocks: TestMocksType) =>
  render(<GovernanceSettings />, { useParams: { organizationSlug: 'acme' }, mocks })

describe('GovernanceSettings', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/acme/settings/governance')
  })

  describe('GIVEN both roles have entities', () => {
    describe('WHEN the counts resolve', () => {
      it('THEN should render both tabs, hierarchical first', async () => {
        renderPage(roleCountsMock(2, 3))

        const hierarchicalTab = await screen.findByTestId(
          GOVERNANCE_SETTINGS_HIERARCHICAL_TAB_TEST_ID,
        )

        expect(hierarchicalTab).toBeInTheDocument()
        expect(screen.getByTestId(GOVERNANCE_SETTINGS_FLAT_TAB_TEST_ID)).toBeInTheDocument()

        const tabs = screen.getAllByRole('tab')

        expect(tabs[0]).toHaveAttribute('data-test', GOVERNANCE_SETTINGS_HIERARCHICAL_TAB_TEST_ID)
      })

      it('THEN should link the first tab to the hierarchical tab route', async () => {
        renderPage(roleCountsMock(2, 3))

        const hierarchicalTab = await screen.findByTestId(
          GOVERNANCE_SETTINGS_HIERARCHICAL_TAB_TEST_ID,
        )

        expect(hierarchicalTab).toHaveAttribute('href', '/acme/settings/governance/hierarchical')
      })
    })
  })

  describe('GIVEN only the flat role has entities', () => {
    describe('WHEN the counts resolve', () => {
      it('THEN should render no tabs', async () => {
        renderPage(roleCountsMock(0, 3))

        await screen.findByTestId(GOVERNANCE_ENTITIES_TABLE_STUB_TEST_ID)

        expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      })

      it('THEN should render a single table scoped to the flat role', async () => {
        renderPage(roleCountsMock(0, 3))

        const table = await screen.findByTestId(GOVERNANCE_ENTITIES_TABLE_STUB_TEST_ID)

        expect(table).toHaveAttribute('data-role', 'flat')
      })
    })
  })

  describe('GIVEN only the hierarchical role has entities', () => {
    describe('WHEN the counts resolve', () => {
      it('THEN should render a single table scoped to the hierarchical role', async () => {
        renderPage(roleCountsMock(4, 0))

        const table = await screen.findByTestId(GOVERNANCE_ENTITIES_TABLE_STUB_TEST_ID)

        expect(table).toHaveAttribute('data-role', 'hierarchical')
      })
    })
  })

  describe('GIVEN no role has entities', () => {
    describe('WHEN the counts resolve', () => {
      it('THEN should render the empty state and no table', async () => {
        renderPage(roleCountsMock(0, 0))

        expect(await screen.findByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(GOVERNANCE_ENTITIES_TABLE_STUB_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the counts are still loading', () => {
    describe('WHEN the page first renders', () => {
      it('THEN should render neither the empty state nor a table', () => {
        renderPage(roleCountsMock(0, 0))

        expect(screen.queryByTestId(GENERIC_PLACEHOLDER_TEST_ID)).not.toBeInTheDocument()
        expect(screen.queryByTestId(GOVERNANCE_ENTITIES_TABLE_STUB_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the counts query fails', () => {
    describe('WHEN the error resolves', () => {
      it('THEN should render the error placeholder with a reload action', async () => {
        renderPage([
          {
            request: { query: GetGovernanceEntitiesRoleCountsDocument, variables: {} },
            error: new Error('boom'),
          },
        ])

        await waitFor(() => {
          expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        })

        expect(screen.getByTestId('generic-placeholder-button')).toBeInTheDocument()
      })
    })
  })
})
