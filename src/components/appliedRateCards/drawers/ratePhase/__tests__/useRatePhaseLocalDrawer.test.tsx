import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum, ProductTypeEnum, RateCardBillingTimingEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { useRatePhaseLocalDrawer } from '../useRatePhaseLocalDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

const rateCard = {
  productType: ProductTypeEnum.Metered,
  currency: CurrencyEnum.Usd,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  appliedPricingUnitCode: null,
  rateModelConfiguration: undefined,
}

const Host = ({ onSave }: { onSave: jest.Mock }) => {
  const { openDrawer } = useRatePhaseLocalDrawer()

  return (
    <button onClick={() => openDrawer({ rateCard, isLastPosition: true, onSave })}>open</button>
  )
}

describe('useRatePhaseLocalDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('GIVEN the form is filled and submitted THEN onSave receives the values with no API call', async () => {
    const onSave = jest.fn()

    render(<Host onSave={onSave} />)
    await userEvent.click(screen.getByText('open'))

    const opened = mockOpen.mock.calls.at(-1)?.[0]

    render(<>{opened.children}</>)
    await userEvent.type(screen.getByLabelText(/code/i), 'phase-1')
    await opened.form.submit()

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ code: 'phase-1' }), {
      replaceIndex: undefined,
    })
    expect(mockClose).toHaveBeenCalled()
  })
})
