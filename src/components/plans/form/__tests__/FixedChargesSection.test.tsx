import { revalidateLogic } from '@tanstack/react-form'
import { act, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { planFormSchema } from '~/formValidation/planFormSchema'
import { ChargeModelEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'
import { createMockPlanForm } from '~/test-utils/createMockPlanForm'

import { FIXED_CHARGES_ADD_BUTTON_TEST_ID } from '../../chargeTestIds'
import { LocalFixedChargeInput, PlanFormInput } from '../../types'
import { FixedChargesSection } from '../FixedChargesSection'

// --- Mocks ---

const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/plans/drawers/fixedCharge/FixedChargeDrawer', () => {
  const React = jest.requireActual('react')

  const MockedDrawer = React.forwardRef((_props: unknown, ref: unknown) => {
    React.useImperativeHandle(ref, () => ({
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
    }))

    return React.createElement('div', { 'data-test': 'fixed-charge-drawer-mock' })
  })

  MockedDrawer.displayName = 'FixedChargeDrawer'

  return { FixedChargeDrawer: MockedDrawer }
})

jest.mock('~/components/plans/RemoveChargeWarningDialog', () => ({
  useRemoveChargeWarningDialog: () => ({
    openRemoveChargeWarningDialog: jest.fn(),
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated_${key}`,
  }),
}))

jest.mock('~/core/apolloClient', () => ({
  useDuplicatePlanVar: () => ({ type: '' }),
  envGlobalVar: () => ({ sentryDsn: '', apiUrl: '', appVersion: '' }),
  initializeTranslations: jest.fn(),
}))

jest.mock('~/core/apolloClient/reactiveVars/duplicatePlanVar', () => ({
  useDuplicatePlanVar: () => ({ type: '' }),
}))

// --- Helpers ---

const createMockFixedCharge = (
  overrides: Partial<LocalFixedChargeInput> = {},
): LocalFixedChargeInput =>
  ({
    id: 'fixed-charge-1',
    chargeModel: ChargeModelEnum.Standard,
    invoiceDisplayName: 'Fixed Charge',
    payInAdvance: false,
    prorated: false,
    properties: { amount: '50' },
    addOn: {
      id: 'addon-1',
      name: 'Setup Fee',
      code: 'setup_fee',
    },
    taxes: [],
    ...overrides,
  }) as unknown as LocalFixedChargeInput

const createForm = (overrides: Partial<PlanFormInput> = {}) => createMockPlanForm(overrides)

// --- Tests ---

describe('FixedChargesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN there are no fixed charges', () => {
    describe('WHEN the component renders', () => {
      it('THEN should render the add fixed charge button', () => {
        const form = createForm()

        render(<FixedChargesSection form={form} alreadyExistingFixedChargesIds={[]} />)

        expect(screen.getByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should render the mocked drawer', () => {
        const form = createForm()

        render(<FixedChargesSection form={form} alreadyExistingFixedChargesIds={[]} />)

        expect(screen.getByTestId('fixed-charge-drawer-mock')).toBeInTheDocument()
      })
    })

    describe('WHEN isInSubscriptionForm is true', () => {
      it('THEN should return null', () => {
        const form = createForm()

        const { container } = render(
          <FixedChargesSection
            form={form}
            alreadyExistingFixedChargesIds={[]}
            isInSubscriptionForm
          />,
        )

        expect(screen.queryByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
        expect(container.querySelector('section')).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN there are fixed charges', () => {
    const fixedCharge = createMockFixedCharge()

    describe('WHEN the component renders', () => {
      it('THEN should render fixed charge selectors', () => {
        const form = createForm({ fixedCharges: [fixedCharge] })

        render(<FixedChargesSection form={form} alreadyExistingFixedChargesIds={[]} />)

        expect(screen.getByTestId('fixed-charge-selector-0')).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the add button is visible', () => {
    describe('WHEN the user clicks the add fixed charge button', () => {
      it('THEN should open the drawer', async () => {
        const user = userEvent.setup()
        const form = createForm()

        render(<FixedChargesSection form={form} alreadyExistingFixedChargesIds={[]} />)

        await user.click(screen.getByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenDrawer).toHaveBeenCalledWith()
      })
    })
  })

  describe('GIVEN a fixed charge exists', () => {
    describe('WHEN the user clicks on a fixed charge selector', () => {
      it('THEN should open the drawer with the charge data', async () => {
        const user = userEvent.setup()
        const fixedCharge = createMockFixedCharge()
        const form = createForm({ fixedCharges: [fixedCharge] })

        render(<FixedChargesSection form={form} alreadyExistingFixedChargesIds={[]} />)

        await user.click(screen.getByTestId('fixed-charge-selector-0'))

        expect(mockOpenDrawer).toHaveBeenCalledTimes(1)
        expect(mockOpenDrawer).toHaveBeenCalledWith(fixedCharge, 0, {
          alreadyUsedChargeAlertMessage: undefined,
          isUsedInSubscription: false,
        })
      })
    })
  })

  describe('GIVEN the component is in subscription form', () => {
    describe('WHEN there are charges and isInSubscriptionForm is true', () => {
      it('THEN should not render the add button', () => {
        const fixedCharge = createMockFixedCharge()
        const form = createForm({ fixedCharges: [fixedCharge] })

        render(
          <FixedChargesSection
            form={form}
            alreadyExistingFixedChargesIds={[]}
            isInSubscriptionForm
          />,
        )

        expect(screen.queryByTestId(FIXED_CHARGES_ADD_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should still render the charge selectors', () => {
        const fixedCharge = createMockFixedCharge()
        const form = createForm({ fixedCharges: [fixedCharge] })

        render(
          <FixedChargesSection
            form={form}
            alreadyExistingFixedChargesIds={[]}
            isInSubscriptionForm
          />,
        )

        expect(screen.getByTestId('fixed-charge-selector-0')).toBeInTheDocument()
      })
    })
  })
})

describe('Fixed charge duplicate warnings with a real form', () => {
  it('refreshes duplicate warnings after same-length resets, additions and removals', async () => {
    const user = userEvent.setup()
    const first = createMockFixedCharge({ invoiceDisplayName: 'First charge' })
    const duplicate = createMockFixedCharge({ id: 'charge-2', invoiceDisplayName: 'Second charge' })
    const other = createMockFixedCharge({
      id: 'charge-3',
      invoiceDisplayName: 'Second charge',
      addOn: { ...first.addOn, id: 'other-catalog-item' },
    })
    const { result } = renderHook(() =>
      useAppForm({
        defaultValues: createForm({ fixedCharges: [first, duplicate] }).state.values,
        validationLogic: revalidateLogic(),
        validators: { onDynamic: planFormSchema },
      }),
    )
    const form = result.current

    render(<FixedChargesSection form={form} alreadyExistingFixedChargesIds={[]} />)

    const expectWarning = async (expected: string | undefined): Promise<void> => {
      await user.click(screen.getByText('First charge'))
      expect(mockOpenDrawer).toHaveBeenLastCalledWith(
        first,
        0,
        expect.objectContaining({ alreadyUsedChargeAlertMessage: expected }),
      )
    }

    await expectWarning('translated_text_1760729707268h378x60alri')
    act(() => form.reset({ ...form.state.values, fixedCharges: [first, other] }))
    await expectWarning(undefined)
    act(() => form.reset({ ...form.state.values, fixedCharges: [first, duplicate] }))
    await expectWarning('translated_text_1760729707268h378x60alri')
    await act(async () => form.removeFieldValue('fixedCharges', 1))
    await expectWarning(undefined)
    act(() => form.pushFieldValue('fixedCharges', duplicate))
    await expectWarning('translated_text_1760729707268h378x60alri')
  })
})
