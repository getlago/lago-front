import { act, render } from '@testing-library/react'

import { ActionItem } from '~/components/designSystem/Table/types'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { AllTheProviders } from '~/test-utils'

import { useCatalogPlanTableActions } from '../useCatalogPlanTableActions'

const COPY_PLAN_CODE_KEY = 'text_17890300495282w8aw4i2783'
const PLAN_CODE_COPIED_KEY = 'text_1789030049528x3nlpl7hu7x'
const EDIT_PLAN_KEY = 'text_1789030049528hmelti5lsxj'
const DELETE_PLAN_KEY = 'text_1789030049528pjeaakmg1nc'
const DELETE_LOCKED_TOOLTIP_KEY = 'text_1789030049528ow0evnxq68g'

const mockOpenDrawer = jest.fn()
const mockOpenDeleteDialog = jest.fn()
const mockHasPermissions = jest.fn()

jest.mock('../drawers/catalogPlan/useCatalogPlanDrawer', () => ({
  useCatalogPlanDrawer: () => ({ openDrawer: mockOpenDrawer }),
}))

jest.mock('../dialogs/useDeleteCatalogPlanDialog', () => ({
  useDeleteCatalogPlanDialog: () => ({ openDeleteCatalogPlanDialog: mockOpenDeleteDialog }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({ copyToClipboard: jest.fn() }))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const catalogPlan = {
  __typename: 'CatalogPlan' as const,
  id: 'plan-1',
  name: 'Premium',
  code: 'premium',
  attachedToContracts: false,
}

let actions: ReturnType<typeof useCatalogPlanTableActions>

const Host = () => {
  actions = useCatalogPlanTableActions()

  return null
}

const itemsFor = (plan: typeof catalogPlan): ActionItem<never>[] =>
  actions.buildActionItems(plan as never) as ActionItem<never>[]

const titles = (plan: typeof catalogPlan): unknown[] => itemsFor(plan).map((item) => item.title)

describe('useCatalogPlanTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  it('GIVEN every permission THEN offers copy, edit and delete', () => {
    render(<Host />, { wrapper: AllTheProviders })

    expect(titles(catalogPlan)).toEqual([COPY_PLAN_CODE_KEY, EDIT_PLAN_KEY, DELETE_PLAN_KEY])
  })

  it('GIVEN no update or delete permission THEN offers copy only', () => {
    mockHasPermissions.mockReturnValue(false)
    render(<Host />, { wrapper: AllTheProviders })

    expect(titles(catalogPlan)).toEqual([COPY_PLAN_CODE_KEY])
  })

  it('GIVEN copy THEN writes the code and toasts', () => {
    render(<Host />, { wrapper: AllTheProviders })

    act(() => {
      itemsFor(catalogPlan)[0].onAction(catalogPlan as never)
    })

    expect(copyToClipboard).toHaveBeenCalledWith('premium')
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info', message: PLAN_CODE_COPIED_KEY }),
    )
  })

  it('GIVEN edit THEN opens the drawer seeded with the plan', () => {
    render(<Host />, { wrapper: AllTheProviders })

    act(() => {
      itemsFor(catalogPlan)[1].onAction(catalogPlan as never)
    })

    expect(mockOpenDrawer).toHaveBeenCalledWith(catalogPlan)
  })

  // DestroyService refuses a contracted plan with `plan_locked`, so the control is
  // disabled rather than left to fail on click.
  it('GIVEN a contracted plan THEN disables delete with an explanation', () => {
    render(<Host />, { wrapper: AllTheProviders })

    const deleteItem = itemsFor({ ...catalogPlan, attachedToContracts: true })[2]

    expect(deleteItem.disabled).toBe(true)
    expect(deleteItem.tooltip).toBe(DELETE_LOCKED_TOOLTIP_KEY)
  })

  it('GIVEN an unattached plan THEN leaves delete enabled', () => {
    render(<Host />, { wrapper: AllTheProviders })

    expect(itemsFor(catalogPlan)[2].disabled).toBe(false)
  })

  it('GIVEN a row THEN links to its overview tab', () => {
    render(<Host />, { wrapper: AllTheProviders })

    expect(actions.getRowActionLink({ id: 'plan-1' })).toBe('/plan-pricing/plan-1/overview')
  })
})
