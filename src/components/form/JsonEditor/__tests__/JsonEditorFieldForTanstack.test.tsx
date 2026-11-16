import { revalidateLogic } from '@tanstack/react-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => `translated(${key})`,
  }),
}))

const FIELD_NAME = 'payload'
const CUSTOM_INVALID_ERROR = 'The payload is not valid JSON'
const SCHEMA_MESSAGE = 'payload.is.required'
const SET_ERROR_BUTTON_TEST_ID = 'set-payload-error'
const FIX_VALUE_BUTTON_TEST_ID = 'fix-payload-value'
const SUBMIT_BUTTON_TEST_ID = 'submit-form'

const MALFORMED_JSON = '{ "a": '
const VALID_JSON = '{ "a": 1 }'

const schema = z.object({ [FIELD_NAME]: z.string().min(1, { message: SCHEMA_MESSAGE }) })

type TestFormProps = {
  defaultValue?: string
  customInvalidError?: string
  silentError?: boolean
  onSubmit?: () => void
}

const TestForm = ({
  defaultValue = VALID_JSON,
  customInvalidError,
  silentError,
  onSubmit,
}: TestFormProps) => {
  const form = useAppForm({
    defaultValues: { [FIELD_NAME]: defaultValue },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: () => onSubmit?.(),
  })

  return (
    <>
      <form.AppField name={FIELD_NAME}>
        {(field) => (
          <field.JsonEditorField
            label="Payload"
            customInvalidError={customInvalidError}
            silentError={silentError}
          />
        )}
      </form.AppField>

      <button
        data-test={SET_ERROR_BUTTON_TEST_ID}
        onClick={() =>
          form.setErrorMap({
            onDynamic: {
              fields: { [FIELD_NAME]: { message: SCHEMA_MESSAGE, path: [FIELD_NAME] } },
            },
          })
        }
      >
        set error
      </button>

      <button
        data-test={FIX_VALUE_BUTTON_TEST_ID}
        onClick={() => form.setFieldValue(FIELD_NAME, VALID_JSON)}
      >
        fix value
      </button>

      <button data-test={SUBMIT_BUTTON_TEST_ID} onClick={() => form.handleSubmit()}>
        submit
      </button>
    </>
  )
}

const blurEditor = (container: HTMLElement): void => {
  const textarea = container.querySelector('textarea') as HTMLTextAreaElement

  fireEvent.focus(textarea)
  fireEvent.blur(textarea)
}

describe('JsonEditorFieldForTanstack', () => {
  describe('GIVEN a registered JSON editor field', () => {
    describe('WHEN the form renders', () => {
      it('THEN should bind the editor to the field name', () => {
        render(<TestForm />)

        expect(screen.getByLabelText(FIELD_NAME)).toBeInTheDocument()
      })

      it('THEN should not display any error', () => {
        render(<TestForm customInvalidError={CUSTOM_INVALID_ERROR} />)

        expect(screen.queryByText(CUSTOM_INVALID_ERROR)).not.toBeInTheDocument()
      })
    })

    describe('WHEN an error is set on the field', () => {
      it('THEN should display the custom invalid error', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<TestForm customInvalidError={CUSTOM_INVALID_ERROR} />)

        await user.click(screen.getByTestId(SET_ERROR_BUTTON_TEST_ID))

        expect(await screen.findByText(CUSTOM_INVALID_ERROR)).toBeInTheDocument()
      })

      // Guards the empty red caption: an untranslated key matches none of the editor codes.
      it('THEN should translate the schema message', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(<TestForm />)

        await user.click(screen.getByTestId(SET_ERROR_BUTTON_TEST_ID))

        expect(await screen.findByText(`translated(${SCHEMA_MESSAGE})`)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the editor holds malformed JSON', () => {
    describe('WHEN the editor is blurred', () => {
      // Guards the dropped `onError`, which left malformed JSON with no feedback at all.
      it('THEN should display the malformed JSON error', () => {
        const { container } = render(
          <TestForm defaultValue={MALFORMED_JSON} customInvalidError={CUSTOM_INVALID_ERROR} />,
        )

        blurEditor(container)

        expect(screen.getByText(CUSTOM_INVALID_ERROR)).toBeInTheDocument()
      })

      // An error owned by the field would never be cleared by the submit-first cycle and
      // would keep the form unsubmittable for good.
      it('THEN should not block submission', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })
        const onSubmit = jest.fn()
        const { container } = render(<TestForm defaultValue={MALFORMED_JSON} onSubmit={onSubmit} />)

        blurEditor(container)
        await user.click(screen.getByTestId(SUBMIT_BUTTON_TEST_ID))

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())
      })

      it('THEN should keep it silent when silentError is set', () => {
        const { container } = render(
          <TestForm
            defaultValue={MALFORMED_JSON}
            customInvalidError={CUSTOM_INVALID_ERROR}
            silentError
          />,
        )

        blurEditor(container)

        expect(screen.queryByText(CUSTOM_INVALID_ERROR)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the value changes afterwards', () => {
      it('THEN should clear the malformed JSON error', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })
        const { container } = render(
          <TestForm defaultValue={MALFORMED_JSON} customInvalidError={CUSTOM_INVALID_ERROR} />,
        )

        blurEditor(container)
        expect(screen.getByText(CUSTOM_INVALID_ERROR)).toBeInTheDocument()

        await user.click(screen.getByTestId(FIX_VALUE_BUTTON_TEST_ID))

        expect(screen.queryByText(CUSTOM_INVALID_ERROR)).not.toBeInTheDocument()
      })
    })
  })
})
