import { generatePath } from 'react-router'

import { ActionItem } from '~/components/designSystem/Table/types'
import { COPY_TO_PRODUCTION_ACTION_TEST_ID } from '~/components/sandbox/useCopyToProduction'
import { CopyToProductionItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import FeaturesList from '../FeaturesList'

const mockMainHeaderConfigure = jest.fn()
const mockTableProps = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: Record<string, unknown>) => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePageSearchParam: () => ({ page: 1, goToPage: jest.fn() }),
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: () => null,
}))

jest.mock('~/components/features/DeleteFeatureDialog', () => ({
  useDeleteFeatureDialog: () => ({ openDeleteFeatureDialog: jest.fn() }),
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(() => jest.fn()),
  generatePath: jest.fn((route: string) => route),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: jest.fn(),
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetFeaturesListLazyQuery: () => [
    jest.fn(),
    {
      data: null,
      error: null,
      loading: false,
      fetchMore: jest.fn(),
      variables: {},
    },
  ],
}))

const mockCopyToProduction = jest.fn()
let mockCanCopyToProduction = false

jest.mock('~/components/sandbox/useCopyToProduction', () => ({
  ...jest.requireActual('~/components/sandbox/useCopyToProduction'),
  useCopyToProduction: () => ({
    canCopyToProduction: mockCanCopyToProduction,
    copyToProduction: mockCopyToProduction,
  }),
}))

describe('FeaturesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN user has featuresCreate permission', () => {
      it('THEN should pass a create action to MainHeader.Configure', () => {
        mockHasPermissions.mockImplementation((perms: string[]) => perms.includes('featuresCreate'))

        render(<FeaturesList />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: expect.objectContaining({
              items: expect.arrayContaining([
                expect.objectContaining({
                  type: 'action',
                  variant: 'primary',
                }),
              ]),
            }),
          }),
        )
      })
    })

    describe('WHEN user has no create permission', () => {
      it('THEN should pass empty actions to MainHeader.Configure', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<FeaturesList />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: expect.objectContaining({
              items: expect.arrayContaining([
                expect.objectContaining({
                  hidden: true,
                }),
              ]),
            }),
          }),
        )
      })
    })

    it('THEN should configure entity with view name', () => {
      mockHasPermissions.mockReturnValue(false)

      render(<FeaturesList />)

      expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: expect.objectContaining({
            viewName: expect.any(String),
          }),
        }),
      )
    })

    it('THEN should pass filtersSection to MainHeader.Configure', () => {
      mockHasPermissions.mockReturnValue(false)

      render(<FeaturesList />)

      expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
        expect.objectContaining({
          filtersSection: expect.anything(),
        }),
      )
    })
  })

  describe('GIVEN user has all row-level permissions', () => {
    describe('WHEN actionColumn is called for a feature', () => {
      it('THEN should return edit and delete actions', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<FeaturesList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({ id: 'feat-1', name: 'Test Feature', code: 'test' })

        expect(actions).toHaveLength(2)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'pen' }))
        expect(actions[1]).toEqual(expect.objectContaining({ startIcon: 'trash' }))
      })
    })
  })

  describe('GIVEN user has no row-level permissions', () => {
    describe('WHEN actionColumn is called for a feature', () => {
      it('THEN should return empty array', () => {
        mockHasPermissions.mockReturnValue(false)

        render(<FeaturesList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => unknown[]

        const actions = actionColumn({ id: 'feat-1', name: 'Test Feature', code: 'test' })

        expect(actions).toEqual([])
      })
    })
  })

  describe('GIVEN user has only featuresUpdate permission', () => {
    describe('WHEN actionColumn is called', () => {
      it('THEN should return only the edit action', () => {
        mockHasPermissions.mockImplementation((perms: string[]) => perms.includes('featuresUpdate'))

        render(<FeaturesList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({ id: 'feat-1', name: 'Test Feature', code: 'test' })

        expect(actions).toHaveLength(1)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'pen' }))
      })
    })
  })

  describe('GIVEN user has only featuresDelete permission', () => {
    describe('WHEN actionColumn is called', () => {
      it('THEN should return only the delete action', () => {
        mockHasPermissions.mockImplementation((perms: string[]) => perms.includes('featuresDelete'))

        render(<FeaturesList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({ id: 'feat-1', name: 'Test Feature', code: 'test' })

        expect(actions).toHaveLength(1)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'trash' }))
      })
    })
  })

  describe('GIVEN the edit action is a link', () => {
    describe('WHEN its target is built', () => {
      it('THEN should point at the feature edit route', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<FeaturesList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => ActionItem<{ id: string }>[]

        const [editAction] = actionColumn({ id: 'feat-1', name: 'Test Feature', code: 'test' })

        editAction?.link?.({ id: 'feat-1' })

        expect(generatePath).toHaveBeenLastCalledWith('/update/feature/:featureId', {
          featureId: 'feat-1',
        })
      })
    })
  })

  describe('GIVEN copy to production', () => {
    const COPY_ROW = { id: 'feat-1', name: 'Test Feature', code: 'test' }

    const getCopyAction = () => {
      const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
        item: typeof COPY_ROW,
      ) => ActionItem<typeof COPY_ROW>[]

      return actionColumn(COPY_ROW).find(
        (action) => action.dataTest === COPY_TO_PRODUCTION_ACTION_TEST_ID,
      )
    }

    afterEach(() => {
      mockCanCopyToProduction = false
    })

    it('WHEN the member can copy items THEN the row action copies the item to production', () => {
      mockCanCopyToProduction = true

      render(<FeaturesList />)

      const moveAction = getCopyAction()

      expect(moveAction?.startIcon).toBe('outside')

      moveAction?.onAction?.(COPY_ROW)

      expect(mockCopyToProduction).toHaveBeenCalledWith({
        itemType: CopyToProductionItemTypeEnum.Feature,
        id: COPY_ROW.id,
        code: COPY_ROW.code,
      })
    })

    it('WHEN the member cannot copy items THEN there is no copy to production row action', () => {
      render(<FeaturesList />)

      expect(getCopyAction()).toBeUndefined()
    })
  })
})
