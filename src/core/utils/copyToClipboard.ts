import { addToast } from '~/core/apolloClient'

const filterComment = (value: string) => {
  return value
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
}

const unsecuredCopyToClipboard = (text: string) => {
  const textArea = document.createElement('textarea')

  textArea.value = text.trim()
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
  } catch {
    addToast({
      severity: 'danger',
      translateKey: 'text_1745919770448pvibiukolis',
    })
    throw new Error('Unable to copy to clipboard')
  } finally {
    document.body.removeChild(textArea)
  }
}

const fallbackCopyToClipboard = (value: string) => {
  unsecuredCopyToClipboard(value)
  addToast({
    severity: 'info',
    translateKey: 'text_63a5ba11eb4e7e17ef88e9f0',
  })
}

export const copyToClipboard: (value: string, options?: { ignoreComment?: boolean }) => void = (
  value,
  ignoreComment,
) => {
  const serializedValue = ignoreComment ? filterComment(value) : value

  try {
    // `writeText` rejects asynchronously (eg. `NotAllowedError` when the document is not
    // focused), so the rejection has to be caught on the promise itself: a synchronous
    // try/catch alone lets it escape as an unhandled rejection.
    navigator.clipboard.writeText(serializedValue).catch(() => {
      try {
        fallbackCopyToClipboard(serializedValue)
      } catch {
        // `unsecuredCopyToClipboard` already warned the user before throwing. Swallow it here
        // so the failure does not bubble up as an unhandled rejection either.
      }
    })
  } catch {
    fallbackCopyToClipboard(serializedValue)
  }
}
