export const scrollToFirstInputError = (formId: string, errorMap: Record<string, unknown>) => {
  const inputs = Array.from(
    // Must match the selector used in your form
    document.querySelectorAll(`#${formId} input`),
  ) as HTMLInputElement[]

  const firstInput = inputs.find((input) => {
    const fieldErrors = errorMap[input.name]

    return fieldErrors !== undefined && fieldErrors !== null && fieldErrors !== ''
  })

  if (firstInput) {
    firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    firstInput.focus()
  }
}
