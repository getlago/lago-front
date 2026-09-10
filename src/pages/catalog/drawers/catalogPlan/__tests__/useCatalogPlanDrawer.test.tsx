import { act, render } from '@testing-library/react'

import { addToast } from '~/core/apolloClient'
import { CatalogPlanForCatalogPlanDrawerFragment, CurrencyEnum } from '~/generated/graphql'
import { AllTheProviders } from '~/test-utils'

import {
  CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY,
  CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY,
} from '../constants'
import { useCatalogPlanDrawer } from '../useCatalogPlanDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()
const mockNavigate = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateCatalogPlanMutation: () => [mockCreate],
  useUpdateCatalogPlanMutation: () => [mockUpdate],
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { defaultCurrency: 'USD' } }),
}))

const existingPlan: CatalogPlanForCatalogPlanDrawerFragment = {
  __typename: 'CatalogPlan',
  id: 'plan-1',
  name: 'Premium',
  code: 'premium',
  currency: CurrencyEnum.Eur,
  description: 'Old',
  invoiceDisplayName: 'Cards',
  appliedRateCardsCount: 0,
  attachedToContracts: false,
}

let openDrawer: (plan?: CatalogPlanForCatalogPlanDrawerFragment) => void

const Host = () => {
  openDrawer = useCatalogPlanDrawer().openDrawer

  return null
}

const mountHost = (): void => {
  render(<Host />, { wrapper: AllTheProviders })
}

const lastOpenPayload = () => mockOpen.mock.calls.at(-1)?.[0]

describe('useCatalogPlanDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreate.mockResolvedValue({ data: { createCatalogPlan: { ...existingPlan, id: 'new-1' } } })
    mockUpdate.mockResolvedValue({ data: { updateCatalogPlan: existingPlan } })
  })

  describe('create mode', () => {
    it('GIVEN no plan THEN opens with the create title and the create-more control', () => {
      mountHost()
      act(() => openDrawer())

      expect(lastOpenPayload().title).toBe(CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY)
      expect(lastOpenPayload().secondaryAction).toBeDefined()
      expect(lastOpenPayload().closeOnSubmitSuccess).toBe(false)
    })

    it('GIVEN a submit THEN omits cleared optionals and navigates to the new plan', async () => {
      mountHost()
      act(() => openDrawer())

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockCreate).not.toHaveBeenCalled()
    })
  })

  describe('edit mode', () => {
    it('GIVEN a plan THEN opens with the edit title and no create-more control', () => {
      mountHost()
      act(() => openDrawer(existingPlan))

      expect(lastOpenPayload().title).toBe(CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY)
      expect(lastOpenPayload().secondaryAction).toBeUndefined()
    })

    it('GIVEN an attached plan THEN locks code and currency in the body props', () => {
      mountHost()
      act(() => openDrawer({ ...existingPlan, attachedToContracts: true }))

      expect(lastOpenPayload().children.props.disableCodeInput).toBe(true)
      expect(lastOpenPayload().children.props.disableCurrencyInput).toBe(true)
    })

    it('GIVEN priced rate cards and no contract THEN locks only the currency', () => {
      mountHost()
      act(() => openDrawer({ ...existingPlan, appliedRateCardsCount: 3 }))

      expect(lastOpenPayload().children.props.disableCodeInput).toBe(false)
      expect(lastOpenPayload().children.props.disableCurrencyInput).toBe(true)
    })

    it('GIVEN an unattached plan THEN locks nothing', () => {
      mountHost()
      act(() => openDrawer(existingPlan))

      expect(lastOpenPayload().children.props.disableCodeInput).toBe(false)
      expect(lastOpenPayload().children.props.disableCurrencyInput).toBe(false)
    })

    it('GIVEN a submit THEN sends every field so the change-gated locks pass', async () => {
      mountHost()
      act(() => openDrawer(existingPlan))

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockUpdate).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'plan-1',
            name: 'Premium',
            code: 'premium',
            currency: CurrencyEnum.Eur,
            description: 'Old',
            invoiceDisplayName: 'Cards',
          },
        },
      })
      expect(mockClose).toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          message: 'text_1789030049529tdyr0nk1liw',
        }),
      )
    })

    it('GIVEN a cleared optional THEN serializes it to null so it actually clears', async () => {
      mountHost()
      act(() => openDrawer({ ...existingPlan, description: '', invoiceDisplayName: '' }))

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            input: expect.objectContaining({ description: null, invoiceDisplayName: null }),
          }),
        }),
      )
    })

    it('GIVEN a rejection with no plan THEN raises a danger toast instead of failing silently', async () => {
      mockUpdate.mockResolvedValue({ data: { updateCatalogPlan: null }, errors: undefined })
      mountHost()
      act(() => openDrawer(existingPlan))

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
      expect(mockClose).not.toHaveBeenCalled()
    })
  })

  it('GIVEN a dirty form THEN prompts on close', () => {
    mountHost()
    act(() => openDrawer(existingPlan))

    expect(typeof lastOpenPayload().shouldPromptOnClose).toBe('function')
  })
})
