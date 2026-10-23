import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { CREATE_MORE_SWITCH_TEST_ID } from '~/components/drawers/createMore/CreateMoreControl'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardRateBillingIntervalUnitEnum,
  RateCardRateModelEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID,
  RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID,
} from '../RatePhaseFormFields'
import { RATE_PHASE_FORM_DEFAULTS, RatePhaseFormValues } from '../ratePhaseFormSchema'
import { scrollToFirstRatePhaseError } from '../scrollToFirstRatePhaseError'
import { RateCardForRatePhaseFields } from '../types'
import { useRatePhaseLocalDrawer } from '../useRatePhaseLocalDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('../scrollToFirstRatePhaseError', () => ({
  scrollToFirstRatePhaseError: jest.fn(),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

const rateCard: RateCardForRatePhaseFields = {
  productType: ProductTypeEnum.Fixed,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  proration: false,
  activeRate: {
    id: 'active-rate',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    rateModel: RateCardRateModelEnum.Standard,
    billingIntervalCount: 14,
    billingIntervalUnit: RateCardRateBillingIntervalUnitEnum.Day,
    minAmountCents: '0',
    appliedPricingUnitConversionRate: null,
    rateProperties: { amount: '10' },
  },
}

type OpenedDrawerArgs = {
  children: ReactNode
  secondaryAction?: ReactNode
  form: { id: string; submit: () => void | Promise<void> }
}

const Host = ({ onSave }: { onSave: jest.Mock }) => {
  const { openDrawer } = useRatePhaseLocalDrawer()

  return <button onClick={() => openDrawer({ rateCard, otherPhases: [], onSave })}>open</button>
}

const openDrawer = async (onSave: jest.Mock): Promise<OpenedDrawerArgs> => {
  render(<Host onSave={onSave} />)
  await userEvent.click(screen.getByText('open'))

  return mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawerArgs
}

describe('useRatePhaseLocalDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN a missing code WHEN submitted THEN scrolls to the first error and saves nothing', async () => {
    const onSave = jest.fn()
    const opened = await openDrawer(onSave)

    render(<>{opened.children}</>)
    await opened.form.submit()

    expect(scrollToFirstRatePhaseError).toHaveBeenCalledWith(
      opened.form.id,
      expect.objectContaining({ code: expect.anything() }),
    )
    expect(onSave).not.toHaveBeenCalled()
  })

  it('GIVEN the form is filled and submitted THEN onSave receives the values with no API call', async () => {
    const onSave = jest.fn()
    const opened = await openDrawer(onSave)

    render(<>{opened.children}</>)
    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await opened.form.submit()

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ code: 'phase-1' }), {
      replaceIndex: undefined,
    })
    expect(mockClose).toHaveBeenCalled()
  })

  it('GIVEN a new phase WHEN the drawer opens THEN the rate fields are seeded from the active rate, override off', async () => {
    const onSave = jest.fn()
    const opened = await openDrawer(onSave)

    render(<>{opened.children}</>)
    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await opened.form.submit()

    const saved = onSave.mock.calls[0][0] as RatePhaseFormValues

    expect(saved.overrideEnabled).toBe(false)
    expect(saved.billingIntervalCount).toBe('14')
    expect(saved.billingIntervalUnit).toBe(RateCardRateBillingIntervalUnitEnum.Day)
    expect(saved.properties.amount).toBe('10')
  })

  it('GIVEN the override is switched on without any change THEN the phase is saved on the active rate', async () => {
    const onSave = jest.fn()
    const opened = await openDrawer(onSave)

    render(<>{opened.children}</>)
    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await userEvent.click(screen.getByTestId(RATE_PHASE_OVERRIDE_TOGGLE_TEST_ID))
    await opened.form.submit()

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'phase-1', overrideEnabled: false }),
      { replaceIndex: undefined },
    )
  })

  it('GIVEN an existing phase WHEN its name is edited THEN its code is kept', async () => {
    const onSave = jest.fn()
    const phase: RatePhaseFormValues = { ...RATE_PHASE_FORM_DEFAULTS, code: 'trial', name: 'Trial' }

    const EditHost = (): JSX.Element => {
      const { openDrawer: openEditDrawer } = useRatePhaseLocalDrawer()

      return (
        <button
          onClick={() =>
            openEditDrawer({ rateCard, otherPhases: [], onSave, phase, replaceIndex: 0 })
          }
        >
          open edit
        </button>
      )
    }

    render(<EditHost />)
    await userEvent.click(screen.getByText('open edit'))

    const opened = mockOpen.mock.calls.at(-1)?.[0] as OpenedDrawerArgs

    render(<>{opened.children}</>)

    const nameInput = screen.getByDisplayValue('Trial')

    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Free trial')
    await opened.form.submit()

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'trial', name: 'Free trial' }),
      { replaceIndex: 0 },
    )
  })

  it('GIVEN create more is on WHEN a phase is saved THEN the drawer stays open and the next phase is placed before it', async () => {
    const onSave = jest.fn()
    const opened = await openDrawer(onSave)

    render(<>{opened.secondaryAction}</>)
    render(<>{opened.children}</>)
    await userEvent.click(screen.getByTestId(CREATE_MORE_SWITCH_TEST_ID))
    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await opened.form.submit()

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(mockClose).not.toHaveBeenCalled()

    await userEvent.type(await screen.findByLabelText(/code/i), 'phase-2')
    await userEvent.type(
      screen
        .getByTestId(RATE_PHASE_DURATION_CYCLE_COUNT_TEST_ID)
        .querySelector('input') as HTMLElement,
      '1',
    )
    await opened.form.submit()

    expect(onSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        code: 'phase-2',
        positionMode: 'before',
        positionReferenceCode: 'phase-1',
        durationType: 'finite',
      }),
      { replaceIndex: undefined },
    )
  })
})
