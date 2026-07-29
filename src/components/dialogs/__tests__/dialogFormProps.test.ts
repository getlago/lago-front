import { dialogFormProps } from '../dialogFormProps'
import { SubmittableForm } from '../types'

const FORM_ID = 'my-form'

const createMockForm = (overrides: Partial<SubmittableForm> = {}): SubmittableForm => ({
  handleSubmit: jest.fn().mockResolvedValue(undefined),
  state: { isSubmitSuccessful: false },
  ...overrides,
})

describe('dialogFormProps', () => {
  describe('GIVEN a form and an id', () => {
    describe('WHEN building the dialog form props', () => {
      it('THEN should forward the given id', () => {
        const props = dialogFormProps(FORM_ID, createMockForm())

        expect(props.id).toBe(FORM_ID)
      })

      it('THEN should not submit the form before submit is called', () => {
        const form = createMockForm()

        dialogFormProps(FORM_ID, form)

        expect(form.handleSubmit).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the built props are used', () => {
    describe('WHEN submit is called', () => {
      it('THEN should submit the form', async () => {
        const form = createMockForm()

        await dialogFormProps(FORM_ID, form).submit()

        expect(form.handleSubmit).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN didSubmitSucceed is called', () => {
      it.each([
        ['the submit succeeded', true, true],
        ['the validation failed', false, false],
      ])('THEN should report %s', (_, isSubmitSuccessful, expected) => {
        const form = createMockForm({ state: { isSubmitSuccessful } })

        expect(dialogFormProps(FORM_ID, form).didSubmitSucceed?.()).toBe(expected)
      })

      it('THEN should read the form state on every call rather than capture it', () => {
        const form = createMockForm()
        const { didSubmitSucceed } = dialogFormProps(FORM_ID, form)

        expect(didSubmitSucceed?.()).toBe(false)

        form.state.isSubmitSuccessful = true

        expect(didSubmitSucceed?.()).toBe(true)
      })
    })
  })
})
