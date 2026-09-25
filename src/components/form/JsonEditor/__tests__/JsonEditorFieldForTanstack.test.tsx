import { revalidateLogic } from '@tanstack/react-form'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

const FIELD_NAME = 'payload'
const CUSTOM_INVALID_ERROR = 'The payload is not valid JSON'
const SET_ERROR_BUTTON_TEST_ID = 'set-payload-error'

const TestForm = () => {
  const form = useAppForm({
    defaultValues: { [FIELD_NAME]: '{ "a": 1 }' },
    validationLogic: revalidateLogic(),
  })

  return (
    <>
      <form.AppField name={FIELD_NAME}>
        {(field) => (
          <field.JsonEditorField label="Payload" customInvalidError={CUSTOM_INVALID_ERROR} />
        )}
      </form.AppField>

      <button
        data-test={SET_ERROR_BUTTON_TEST_ID}
        onClick={() =>
          form.setErrorMap({
            onDynamic: {
              fields: { [FIELD_NAME]: { message: 'invalid', path: [FIELD_NAME] } },
            },
          })
        }
      >
        set error
      </button>
    </>
  )
}

describe('JsonEditorFieldForTanstack', () => {
  describe('GIVEN a registered JSON editor field', () => {
    describe('WHEN the form renders', () => {
      it('THEN should bind the editor to the field name', () => {
        render(<TestForm />)

        expect(screen.getByLabelText(FIELD_NAME)).toBeInTheDocument()
      })

      it('THEN should not display any error', () => {
        render(<TestForm />)

        expect(screen.queryByText(CUSTOM_INVALID_ERROR)).not.toBeInTheDocument()
      })
    })

    describe('WHEN an error is set on the field', () => {
      it('THEN should display the custom invalid error', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<TestForm />)

        await user.click(screen.getByTestId(SET_ERROR_BUTTON_TEST_ID))

        expect(await screen.findByText(CUSTOM_INVALID_ERROR)).toBeInTheDocument()
      })
    })
  })
})
