import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { ChargeDisplayInQuoteDocumentOption } from '../ChargeDisplayInQuoteDocumentOption'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const LABEL_KEY = 'text_1788938888298p8mb2uxfk5l'
const DESCRIPTION_KEY = 'text_1788938888298tobp5ik7edt'

// Only the values slice is read back, so the ref is typed to just that.
let formRef: { state: { values: { displayInQuoteDocument: boolean } } } | null = null

const Wrapper = ({
  displayInQuoteDocument = true,
  disabled = false,
}: {
  displayInQuoteDocument?: boolean
  disabled?: boolean
}) => {
  const form = useAppForm({ defaultValues: { displayInQuoteDocument } })

  formRef = form

  return (
    <form.AppForm>
      <form>
        <ChargeDisplayInQuoteDocumentOption
          form={form}
          fields={{ displayInQuoteDocument: 'displayInQuoteDocument' }}
          disabled={disabled}
        />
      </form>
    </form.AppForm>
  )
}

describe('ChargeDisplayInQuoteDocumentOption', () => {
  afterEach(() => {
    cleanup()
    formRef = null
  })

  describe('GIVEN the option renders', () => {
    describe('WHEN the charge is shown in the quote document', () => {
      it('THEN should render the heading, the description and a checked switch', () => {
        render(<Wrapper displayInQuoteDocument />)

        expect(screen.getAllByText(LABEL_KEY).length).toBeGreaterThan(0)
        expect(screen.getByText(DESCRIPTION_KEY)).toBeInTheDocument()
        expect(screen.getByRole('checkbox')).toBeChecked()
      })
    })

    describe('WHEN the charge is hidden from the quote document', () => {
      it('THEN should render an unchecked switch', () => {
        render(<Wrapper displayInQuoteDocument={false} />)

        expect(screen.getByRole('checkbox')).not.toBeChecked()
      })
    })
  })

  describe('GIVEN the user toggles the switch', () => {
    describe('WHEN it is turned off', () => {
      it('THEN should write false to the form field', async () => {
        const user = userEvent.setup()

        render(<Wrapper displayInQuoteDocument />)

        await user.click(screen.getByRole('checkbox'))

        expect(formRef?.state.values).toEqual({ displayInQuoteDocument: false })
      })
    })
  })

  describe('GIVEN the drawer is read-only', () => {
    describe('WHEN disabled is passed', () => {
      it('THEN should disable the switch', () => {
        render(<Wrapper disabled />)

        expect(screen.getByRole('checkbox')).toBeDisabled()
      })
    })
  })
})
