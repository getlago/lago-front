import { addToast } from '~/core/apolloClient'

export const copyToClipboard: (value: string) => void = (value) => {
  try {
    navigator.clipboard.writeText(value)
  } catch (error) {
    addToast({
      severity: 'danger',
      translateKey: 'text_63a5ba11eb4e7e17ef88e9f0',
    })
    throw new Error('Browser running in non secure context')
  }
}
