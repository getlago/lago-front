import { addToast } from '~/core/apolloClient'

const filterComment = (value: string) => {
  return value
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
}

export const copyToClipboard: (value: string, options?: { ignoreComment?: boolean }) => void = (
  value,
  ignoreComment,
) => {
  const serializedValue = ignoreComment ? filterComment(value) : value

  try {
    navigator.clipboard.writeText(serializedValue)
  } catch (error) {
    addToast({
      severity: 'danger',
      translateKey: 'text_63a5ba11eb4e7e17ef88e9f0',
    })
    throw new Error('Browser running in non secure context')
  }
}
