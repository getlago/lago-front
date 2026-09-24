import { captureMessage } from '@sentry/react'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'

import { OPEN_ACTION_BUTTON_TEST_ID } from '~/components/designSystem/Table/Table'
import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { GetGovernanceEntitiesDocument, UsageAttributionTypeRoleEnum } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import { MAX_GOVERNANCE_HIERARCHY_DEPTH } from '../constants'
import {
  GOVERNANCE_ENTITIES_TABLE_TEST_ID,
  GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID,
  GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID,
  GovernanceEntitiesTable,
} from '../GovernanceEntitiesTable'

const mockOpenDrawer = jest.fn()
const mockOpenDeleteDialog = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('../drawers/governanceEntity/useGovernanceEntityDrawer', () => ({
  useGovernanceEntityDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

jest.mock('../useDeleteGovernanceEntityDialog', () => ({
  useDeleteGovernanceEntityDialog: () => ({
    openDeleteGovernanceEntityDialog: mockOpenDeleteDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

const grantPermissions = (granted: string[]): void => {
  mockHasPermissions.mockImplementation((permissions: string[]) =>
    permissions.every((permission) => granted.includes(permission)),
  )
}

jest.mock('@sentry/react', () => ({
  ...jest.requireActual('@sentry/react'),
  captureMessage: jest.fn(),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: 'Jan 1, 2026', time: '', timezone: 'UTC' }),
  }),
}))

type Entity = {
  __typename: 'UsageAttributionType'
  id: string
  name: string | null
  code: string
  description: string | null
  role: UsageAttributionTypeRoleEnum
  attributionKeys: string[]
  createdAt: string
  children: Array<Entity | EntityProbe>
}

type EntityProbe = { __typename: 'UsageAttributionType'; id: string }

// `__typename` is what lets the cache match the `GovernanceEntityItem` fragment condition;
// without it every fragment field reads back undefined.
const buildEntity = (overrides: Partial<Entity> = {}): Entity => ({
  __typename: 'UsageAttributionType',
  id: 'entity-1',
  name: 'Engineering',
  code: 'engineering',
  description: null,
  role: UsageAttributionTypeRoleEnum.Hierarchical,
  attributionKeys: ['engineering_id'],
  createdAt: '2026-01-01T00:00:00Z',
  children: [],
  ...overrides,
})

const buildChain = (levels: number, { withProbe = false } = {}, depth = 0): Entity => {
  const isDeepest = depth === levels - 1
  const probe: EntityProbe[] = withProbe
    ? [{ __typename: 'UsageAttributionType', id: 'too-deep' }]
    : []

  return buildEntity({
    id: `depth-${depth}`,
    code: `depth-${depth}`,
    children: isDeepest ? probe : [buildChain(levels, { withProbe }, depth + 1)],
  })
}

const entitiesMock = ({
  role,
  collection,
  page = 1,
}: {
  role: UsageAttributionTypeRoleEnum
  collection: Entity[]
  page?: number
}): TestMocksType => [
  {
    request: {
      query: GetGovernanceEntitiesDocument,
      variables: {
        role,
        roots: role === UsageAttributionTypeRoleEnum.Hierarchical,
        limit: DEFAULT_PAGE_SIZE,
        page,
      },
    },
    result: {
      data: {
        usageAttributionTypes: {
          __typename: 'UsageAttributionTypeCollection',
          metadata: {
            __typename: 'CollectionMetadata',
            currentPage: page,
            totalPages: 1,
            totalCount: collection.length,
          },
          collection,
        },
      },
    },
  },
]

const renderTable = (role: UsageAttributionTypeRoleEnum, mocks: TestMocksType) =>
  render(<GovernanceEntitiesTable role={role} />, {
    useParams: { organizationSlug: 'acme' },
    mocks,
  })

describe('GovernanceEntitiesTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    grantPermissions([])
    window.history.replaceState({}, '', '/acme/settings/governance')
  })

  describe('GIVEN the hierarchical role', () => {
    describe('WHEN the list resolves', () => {
      it('THEN should query with the default page size and the page from the URL', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity()],
          }),
        )
        expect(await screen.findByText('Engineering')).toBeInTheDocument()
      })

      it('THEN should read the page from the URL search param', async () => {
        window.history.replaceState({}, '', '/acme/settings/governance?page=2')

        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity({ name: 'Page two entity' })],
            page: 2,
          }),
        )

        expect(await screen.findByText('Page two entity')).toBeInTheDocument()
      })

      it('THEN should render no Parent column', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity()],
          }),
        )

        await screen.findByText('Engineering')

        expect(screen.getAllByRole('columnheader')).toHaveLength(3)
      })

      it('THEN should list each root followed by its descendants, indented by depth', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [
              buildEntity({
                id: 'root',
                code: 'root',
                children: [
                  buildEntity({
                    id: 'child',
                    code: 'child',
                    children: [buildEntity({ id: 'grandchild', code: 'grandchild' })],
                  }),
                ],
              }),
              buildEntity({ id: 'sibling-root', code: 'sibling-root' }),
            ],
          }),
        )

        await screen.findByTestId('grandchild')

        const table = screen.getByTestId(GOVERNANCE_ENTITIES_TABLE_TEST_ID)
        const rowCodes = ['root', 'child', 'grandchild', 'sibling-root'].map((code) =>
          within(table).getByTestId(code),
        )

        rowCodes.reduce((previous, current) => {
          expect(previous.compareDocumentPosition(current)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

          return current
        })
        expect(within(table).getByTestId('root')).toHaveClass('pl-0')
        expect(within(table).getByTestId('child')).toHaveClass('pl-6')
        expect(within(table).getByTestId('grandchild')).toHaveClass('pl-12')
        expect(within(table).getByTestId('sibling-root')).toHaveClass('pl-0')
      })

      it('THEN should show the indent icon on every row, roots included', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity({ code: 'root' })],
          }),
        )

        expect(
          (await screen.findByTestId('root')).querySelector('[data-test^="indent/"]'),
        ).toBeInTheDocument()
      })

      it('THEN should fall back to the code when the name is null', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity({ name: null, code: 'no-name-code' })],
          }),
        )

        const table = screen.getByTestId(GOVERNANCE_ENTITIES_TABLE_TEST_ID)

        // Once as the name slot, once as the code subtitle.
        expect(await within(table).findAllByText('no-name-code')).toHaveLength(2)
      })
    })
  })

  describe('GIVEN a hierarchy at the maximum depth', () => {
    describe('WHEN the list resolves', () => {
      it('THEN should render every level and report nothing', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildChain(MAX_GOVERNANCE_HIERARCHY_DEPTH + 1)],
          }),
        )

        expect(
          await screen.findByTestId(`depth-${MAX_GOVERNANCE_HIERARCHY_DEPTH}`),
        ).toBeInTheDocument()
        expect(screen.getByTestId(`depth-${MAX_GOVERNANCE_HIERARCHY_DEPTH}`)).toHaveClass('pl-60')
        expect(captureMessage).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN a hierarchy deeper than the maximum depth', () => {
    describe('WHEN the list resolves', () => {
      it('THEN should report it to Sentry as an error', async () => {
        const chain = buildChain(MAX_GOVERNANCE_HIERARCHY_DEPTH + 1, { withProbe: true })

        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({ role: UsageAttributionTypeRoleEnum.Hierarchical, collection: [chain] }),
        )

        await waitFor(() =>
          expect(captureMessage).toHaveBeenCalledWith(expect.any(String), { level: 'error' }),
        )
      })
    })
  })

  describe('GIVEN the flat role', () => {
    describe('WHEN the list resolves', () => {
      it('THEN should render the name, type and creation date columns', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Flat,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Flat,
            collection: [buildEntity({ role: UsageAttributionTypeRoleEnum.Flat, name: 'Product' })],
          }),
        )

        await screen.findByText('Product')

        expect(screen.getAllByRole('columnheader')).toHaveLength(3)
      })

      it('THEN should render rows without the indent icon', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Flat,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Flat,
            collection: [buildEntity({ role: UsageAttributionTypeRoleEnum.Flat, code: 'product' })],
          }),
        )

        expect(
          (await screen.findByTestId('product')).querySelector('[data-test^="indent/"]'),
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the page is still resolving the roles', () => {
    describe('WHEN the table renders in loading mode', () => {
      it('THEN should show the table without querying the list', async () => {
        render(<GovernanceEntitiesTable isLoading />, {
          useParams: { organizationSlug: 'acme' },
          mocks: [],
        })

        await act(() => new Promise((resolve) => setTimeout(resolve, 0)))

        expect(screen.getByTestId(GOVERNANCE_ENTITIES_TABLE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId('generic-placeholder-button')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the list query fails', () => {
    describe('WHEN the error resolves', () => {
      it('THEN should render the error placeholder with a reload action', async () => {
        renderTable(UsageAttributionTypeRoleEnum.Flat, [
          {
            request: {
              query: GetGovernanceEntitiesDocument,
              variables: {
                role: UsageAttributionTypeRoleEnum.Flat,
                roots: false,
                limit: DEFAULT_PAGE_SIZE,
                page: 1,
              },
            },
            error: new Error('boom'),
          },
        ])

        expect(await screen.findByTestId('generic-placeholder-button')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN row actions', () => {
    const hierarchy = [
      buildEntity({
        children: [buildEntity({ id: 'entity-2', name: 'Backend', code: 'backend' })],
      }),
    ]

    const renderHierarchy = async (): Promise<void> => {
      renderTable(
        UsageAttributionTypeRoleEnum.Hierarchical,
        entitiesMock({ role: UsageAttributionTypeRoleEnum.Hierarchical, collection: hierarchy }),
      )

      await screen.findByTestId('backend')
    }

    const openRowMenu = async (rowIndex: number): Promise<void> => {
      fireEvent.click(screen.getAllByTestId(OPEN_ACTION_BUTTON_TEST_ID)[rowIndex])
    }

    describe('WHEN the user can neither update nor delete', () => {
      it('THEN should render no action column', async () => {
        await renderHierarchy()

        expect(screen.queryByTestId(OPEN_ACTION_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user can only delete', () => {
      it('THEN should offer only the delete action', async () => {
        grantPermissions(['usageAttributionTypesDelete'])
        await renderHierarchy()
        await openRowMenu(0)

        expect(
          await screen.findByTestId(GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID),
        ).toBeInTheDocument()
        expect(screen.queryByTestId(GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the user can both update and delete', () => {
      it('THEN should offer both actions', async () => {
        grantPermissions(['usageAttributionTypesUpdate', 'usageAttributionTypesDelete'])
        await renderHierarchy()
        await openRowMenu(0)

        expect(await screen.findByTestId(GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the user can only update', () => {
      it('THEN should offer only the edit action', async () => {
        grantPermissions(['usageAttributionTypesUpdate'])
        await renderHierarchy()
        await openRowMenu(0)

        expect(await screen.findByTestId(GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID)).toBeInTheDocument()
        expect(
          screen.queryByTestId(GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID),
        ).not.toBeInTheDocument()
      })
    })

    describe('WHEN a child row is edited', () => {
      it('THEN should open the drawer with the row and its parent', async () => {
        grantPermissions(['usageAttributionTypesUpdate', 'usageAttributionTypesDelete'])
        await renderHierarchy()
        await openRowMenu(1)
        fireEvent.click(await screen.findByTestId(GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'entity-2',
            attributionKeys: ['engineering_id'],
            parent: { id: 'entity-1', name: 'Engineering', code: 'engineering' },
          }),
        )
      })
    })

    describe('WHEN a root row is edited', () => {
      it('THEN should open the drawer without a parent', async () => {
        grantPermissions(['usageAttributionTypesUpdate'])
        await renderHierarchy()
        await openRowMenu(0)
        fireEvent.click(await screen.findByTestId(GOVERNANCE_ENTITY_EDIT_ACTION_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'entity-1', parent: null }),
        )
      })
    })

    describe('WHEN a row is deleted', () => {
      it('THEN should open the delete confirmation for that row', async () => {
        grantPermissions(['usageAttributionTypesDelete'])
        await renderHierarchy()
        await openRowMenu(1)
        fireEvent.click(await screen.findByTestId(GOVERNANCE_ENTITY_DELETE_ACTION_TEST_ID))

        expect(mockOpenDeleteDialog).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'entity-2' }),
        )
      })
    })
  })
})
