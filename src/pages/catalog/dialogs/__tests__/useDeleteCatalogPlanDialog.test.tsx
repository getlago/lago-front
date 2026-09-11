import { act, render } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { evictFromCache } from '~/core/apolloClient/evictFromCache'
import { CatalogPlansDocument } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CATALOG_PLAN_DELETE_SUCCESS_TOAST_KEY,
  useDeleteCatalogPlanDialog,
} from '../useDeleteCatalogPlanDialog'

const mockOpen = jest.fn()
const mockDestroy = jest.fn()

const DELETE_DIALOG_TITLE_KEY = 'text_1789030049528hcqrjpyn74e'

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockOpen, close: jest.fn() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/apolloClient/evictFromCache', () => ({
  evictFromCache: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, data?: Record<string, unknown>) =>
      data ? [key, ...Object.values(data)].join('|') : key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useDestroyCatalogPlanMutation: () => [mockDestroy],
}))

const catalogPlan = { __typename: 'CatalogPlan' as const, id: 'plan-1', name: 'Premium' }

let openDialog: (args: { catalogPlan: typeof catalogPlan; callback?: () => void }) => void

const Host = () => {
  openDialog = useDeleteCatalogPlanDialog().openDeleteCatalogPlanDialog

  return null
}

describe('useDeleteCatalogPlanDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    render(<Host />, { wrapper: AllTheProviders })
  })

  it('GIVEN a plan THEN opens a danger dialog naming it', () => {
    act(() => openDialog({ catalogPlan }))

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        title: `${DELETE_DIALOG_TITLE_KEY}|Premium`,
        colorVariant: 'danger',
      }),
    )
  })

  it('GIVEN a successful destroy THEN evicts, calls back and toasts', async () => {
    mockDestroy.mockResolvedValue({ data: { destroyCatalogPlan: { id: 'plan-1' } } })
    const callback = jest.fn()

    act(() => openDialog({ catalogPlan, callback }))

    await act(async () => {
      await mockOpen.mock.calls.at(-1)?.[0].onAction()
    })

    expect(mockDestroy).toHaveBeenCalledWith({ variables: { input: { id: 'plan-1' } } })
    expect(evictFromCache).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: 'plan-1',
        __typename: 'CatalogPlan',
        listFieldName: 'catalogPlans',
        listQueryDocument: [CatalogPlansDocument],
      }),
    )
    expect(callback).toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        message: CATALOG_PLAN_DELETE_SUCCESS_TOAST_KEY,
      }),
    )
  })

  // A `plan_locked` rejection resolves with no data; the global error link owns the toast.
  it('GIVEN a rejection THEN does not evict or call back', async () => {
    mockDestroy.mockResolvedValue({ data: { destroyCatalogPlan: null } })
    const callback = jest.fn()

    act(() => openDialog({ catalogPlan, callback }))

    await act(async () => {
      await mockOpen.mock.calls.at(-1)?.[0].onAction()
    })

    expect(evictFromCache).not.toHaveBeenCalled()
    expect(callback).not.toHaveBeenCalled()
  })
})
