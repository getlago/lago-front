import { screen, within } from '@testing-library/react'

import { DEFAULT_PAGE_SIZE } from '~/core/constants/pagination'
import { GetGovernanceEntitiesDocument, UsageAttributionTypeRoleEnum } from '~/generated/graphql'
import { render, TestMocksType } from '~/test-utils'

import {
  GOVERNANCE_ENTITIES_TABLE_TEST_ID,
  GovernanceEntitiesTable,
} from '../GovernanceEntitiesTable'

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
  role: UsageAttributionTypeRoleEnum
  createdAt: string
  parent: { __typename: 'UsageAttributionType'; id: string; name: string | null } | null
}

// `__typename` is what lets the cache match the `GovernanceEntityItem` fragment condition;
// without it every fragment field reads back undefined.
const buildEntity = (overrides: Partial<Entity> = {}): Entity => ({
  __typename: 'UsageAttributionType',
  id: 'entity-1',
  name: 'Engineering',
  code: 'engineering',
  role: UsageAttributionTypeRoleEnum.Hierarchical,
  createdAt: '2026-01-01T00:00:00Z',
  parent: null,
  ...overrides,
})

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
      variables: { role, limit: DEFAULT_PAGE_SIZE, page },
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

        // The mock only matches `{ role, limit: DEFAULT_PAGE_SIZE, page: 1 }`; rendering a row
        // proves those exact variables were sent.
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

      it('THEN should render the Parent column', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity()],
          }),
        )

        await screen.findByText('Engineering')

        expect(screen.getAllByRole('columnheader')).toHaveLength(4)
      })

      it('THEN should render a dash when the entity has no parent', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [buildEntity({ parent: null })],
          }),
        )

        await screen.findByText('Engineering')

        const table = screen.getByTestId(GOVERNANCE_ENTITIES_TABLE_TEST_ID)

        expect(within(table).getByText('-')).toBeInTheDocument()
      })

      it('THEN should render the parent name when the entity has one', async () => {
        renderTable(
          UsageAttributionTypeRoleEnum.Hierarchical,
          entitiesMock({
            role: UsageAttributionTypeRoleEnum.Hierarchical,
            collection: [
              buildEntity({
                parent: { __typename: 'UsageAttributionType', id: 'parent-1', name: 'Teams' },
              }),
            ],
          }),
        )

        expect(await screen.findByText('Teams')).toBeInTheDocument()
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

  describe('GIVEN the flat role', () => {
    describe('WHEN the list resolves', () => {
      it('THEN should not render the Parent column', async () => {
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
})
