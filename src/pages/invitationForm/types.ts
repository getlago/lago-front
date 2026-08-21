export interface InvitationFormProps {
  email?: string
  formId: string
  loading?: boolean
  submitDataTest: string
  onSubmit: (password: string) => Promise<void>
}
