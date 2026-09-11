import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import { addToast } from '~/core/apolloClient'
import { EXISTING_CODE_FIELD_ERRORS } from '~/core/form/existingCodeError'
import {
  CatalogPlanForCatalogPlanDrawerFragment,
  CurrencyEnum,
  LagoApiError,
} from '~/generated/graphql'
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

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: () => ({ organizationSlug: 'acme' }),
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
  useInternationalization: () => ({
    translate: (key: string, vars?: Record<string, unknown>) =>
      vars ? [key, ...Object.values(vars)].join('|') : key,
  }),
}))

// Non-USD on purpose: CurrencyEnum.Usd is also the hook's hardcoded fallback, so a
// USD fixture could not tell a real org default apart from a dropped one.
jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({ organization: { defaultCurrency: 'EUR' } }),
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

const fillValidCreateValues = (): void => {
  const { form } = lastOpenPayload().children.props

  act(() => {
    form.setFieldValue('name', 'New plan')
    form.setFieldValue('code', 'new_plan')
  })
}

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
      // Drives `disableAutoGenerateCode` on `NameAndCodeGroup` (CatalogPlanDrawerContent.tsx).
      expect(lastOpenPayload().children.props.isEdit).toBe(false)
    })

    it('GIVEN empty values THEN submit-first validation blocks the create mutation', async () => {
      mountHost()
      act(() => openDrawer())

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('GIVEN valid values THEN creates the plan, closes, navigates and toasts', async () => {
      mountHost()
      act(() => openDrawer())
      fillValidCreateValues()

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockCreate).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'New plan',
            code: 'new_plan',
            currency: CurrencyEnum.Eur,
            description: undefined,
            invoiceDisplayName: undefined,
          },
        },
      })
      expect(mockClose).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/plan-pricing/new-1/overview')
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          message: 'text_1789030049529bjp3ly202fr',
        }),
      )
    })

    it('GIVEN create more is enabled THEN keeps the drawer open and links the new plan with the slug prepended', async () => {
      mountHost()
      act(() => openDrawer())

      render(<>{lastOpenPayload().secondaryAction}</>, { wrapper: AllTheProviders })
      await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))

      fillValidCreateValues()

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockClose).not.toHaveBeenCalled()
      expect(addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          message: 'text_1789030049529lpefaj6vz74|Premium|/acme/plan-pricing/new-1/overview',
        }),
      )
    })

    it('GIVEN a duplicate code THEN surfaces the existing-code error and keeps the drawer open', async () => {
      mockCreate.mockResolvedValue({
        data: undefined,
        errors: [
          { message: 'value_already_exist', extensions: { code: LagoApiError.ValueAlreadyExist } },
        ],
      })
      mountHost()
      act(() => openDrawer())
      fillValidCreateValues()

      await act(async () => {
        await lastOpenPayload().form.submit()
      })

      expect(mockClose).not.toHaveBeenCalled()

      const { form } = lastOpenPayload().children.props

      expect(form.getFieldMeta('code')?.errorMap?.onDynamic).toEqual(
        EXISTING_CODE_FIELD_ERRORS.code,
      )
    })
  })

  describe('edit mode', () => {
    it('GIVEN a plan THEN opens with the edit title and no create-more control', () => {
      mountHost()
      act(() => openDrawer(existingPlan))

      expect(lastOpenPayload().title).toBe(CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY)
      expect(lastOpenPayload().secondaryAction).toBeUndefined()
      expect(lastOpenPayload().children.props.isEdit).toBe(true)
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

    const { shouldPromptOnClose, children } = lastOpenPayload()

    expect(shouldPromptOnClose()).toBe(false)

    act(() => {
      children.props.form.setFieldValue('name', 'Updated name')
    })

    expect(shouldPromptOnClose()).toBe(true)
  })
})
