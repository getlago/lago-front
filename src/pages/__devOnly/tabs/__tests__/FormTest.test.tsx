import { revalidateLogic, useStore } from '@tanstack/react-form'
import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { designSystemFormDefaultValues, designSystemValidationSchema } from '../../validationSchema'
import {
  DESIGN_SYSTEM_FORM_ID,
  FORM_TEST_ALL_CONDITIONS_CHECKBOX_TEST_ID,
  FORM_TEST_SUBMIT_BUTTON_TEST_ID,
  FormTest,
} from '../FormTest'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/form/JsonEditor/JsonEditorFieldForTanstack', () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div>{label}</div>,
}))

const CONDITIONS_STATE_TEST_ID = 'conditions-state'

const FormTestWrapper = () => {
  const form = useAppForm({
    defaultValues: designSystemFormDefaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: designSystemValidationSchema },
    onSubmit: () => {},
  })

  const checkboxCond1 = useStore(form.store, (state) => state.values.checkboxCond1)
  const checkboxCond2 = useStore(form.store, (state) => state.values.checkboxCond2)

  return (
    <>
      <FormTest form={form} />
      <span data-test={CONDITIONS_STATE_TEST_ID}>{`${checkboxCond1}-${checkboxCond2}`}</span>
    </>
  )
}

describe('FormTest', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  describe('GIVEN the design-system form tab is rendered', () => {
    describe('WHEN in its default state', () => {
      it('THEN should display the submit button', async () => {
        await act(() => render(<FormTestWrapper />))

        expect(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should submit the form element itself, so Enter in an input submits', async () => {
        const { container } = await act(() => render(<FormTestWrapper />))

        expect(container.querySelector(`form#${DESIGN_SYSTEM_FORM_ID}`)).toBeInTheDocument()
        expect(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID)).toHaveAttribute(
          'type',
          'submit',
        )
      })

      it('THEN should display no error before the first submit attempt', async () => {
        await act(() => render(<FormTestWrapper />))

        expect(screen.queryAllByText("I thought you'd be more fun... 😏")).toHaveLength(0)
      })
    })

    describe('WHEN the answers are submitted', () => {
      it('THEN should display the error of the fields left unanswered', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        await user.click(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID))

        expect(
          (await screen.findAllByText("I thought you'd be more fun... 😏")).length,
        ).toBeGreaterThan(0)
      })

      it('THEN should keep the submit button enabled so the answers can be checked again', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        await user.click(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID))

        expect(screen.getByTestId(FORM_TEST_SUBMIT_BUTTON_TEST_ID)).not.toBeDisabled()
      })
    })

    describe('WHEN the "accept all conditions" checkbox is toggled', () => {
      it('THEN should drive both condition fields at once', async () => {
        const user = userEvent.setup()

        await act(() => render(<FormTestWrapper />))

        expect(screen.getByTestId(CONDITIONS_STATE_TEST_ID)).toHaveTextContent('true-true')

        await user.click(screen.getByTestId(FORM_TEST_ALL_CONDITIONS_CHECKBOX_TEST_ID))

        expect(screen.getByTestId(CONDITIONS_STATE_TEST_ID)).toHaveTextContent('false-false')
      })
    })
  })
})
