import { scrollToFirstRatePhaseError } from '../scrollToFirstRatePhaseError'

const FORM_ID = 'rate-phase-form'

const mockScrollIntoView = jest.fn()

const getScrolledInputName = (): string | null =>
  (mockScrollIntoView.mock.contexts[0] as HTMLInputElement | undefined)?.name ?? null

describe('scrollToFirstRatePhaseError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(HTMLInputElement.prototype, 'scrollIntoView', {
      value: mockScrollIntoView,
      writable: true,
    })
    document.body.innerHTML = `
      <form id="${FORM_ID}">
        <input name="code" />
        <input name="durationCycleCount" />
        <input type="checkbox" />
        <input name="rateModel" />
        <input name="properties.amount" />
      </form>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('GIVEN an error on a named input THEN scrolls to that input', () => {
    scrollToFirstRatePhaseError(FORM_ID, { 'properties.amount': ['required'] })

    expect(getScrolledInputName()).toBe('properties.amount')
  })

  it('GIVEN an error on the forever checkbox THEN scrolls to the duration input above it', () => {
    scrollToFirstRatePhaseError(FORM_ID, { durationType: ['forever must be last'] })

    expect(getScrolledInputName()).toBe('durationCycleCount')
  })

  it('GIVEN several errors THEN scrolls to the first one in the form', () => {
    scrollToFirstRatePhaseError(FORM_ID, {
      'properties.amount': ['required'],
      durationType: ['forever must be last'],
      code: ['required'],
    })

    expect(mockScrollIntoView).toHaveBeenCalledTimes(1)
    expect(getScrolledInputName()).toBe('code')
  })
})
