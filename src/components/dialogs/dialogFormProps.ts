import { FormProps, SubmittableForm } from './types'

/**
 * Builds the `form` prop of `FormDialog` / `FormDialogOpeningDialog` from a TanStack form.
 *
 * Submitting an invalid form no longer closes the dialog: `handleSubmit()` resolves
 * without running `onSubmit`, and the `didSubmitSucceed` guard keeps the dialog open so
 * the inline field errors stay visible.
 *
 * @example
 * formDialog.open({
 *   // …
 *   form: dialogFormProps(MY_FORM_ID, form),
 * })
 */
export const dialogFormProps = (id: string, form: SubmittableForm): FormProps => ({
  id,
  submit: () => form.handleSubmit(),
  didSubmitSucceed: () => form.state.isSubmitSuccessful,
})
