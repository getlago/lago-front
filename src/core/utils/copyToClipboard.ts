import { addToast } from '~/core/apolloClient'

const filterComment = (value: string): string => {
  return value
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .join('\n')
}

// Returns whether the value could be copied — `execCommand` reports a silent failure with
// `false` and throws in some browsers.
const unsecuredCopyToClipboard = (text: string): boolean => {
  const textArea = document.createElement('textarea')

  textArea.value = text.trim()
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textArea)
  }
}

const notifyCopyFailure = (): void => {
  addToast({
    severity: 'danger',
    translateKey: 'text_1745919770448pvibiukolis',
  })
}

export const copyToClipboard: (value: string, options?: { ignoreComment?: boolean }) => void = (
  value,
  options,
) => {
  const serializedValue = options?.ignoreComment ? filterComment(value) : value

  try {
    // `writeText` rejects asynchronously — with a NotAllowedError when the document is not
    // focused, for instance — so the promise needs its own handler on top of the surrounding
    // catch. Errors must not escape it either: they would become unhandled rejections.
    navigator.clipboard.writeText(serializedValue).catch(() => {
      if (!unsecuredCopyToClipboard(serializedValue)) {
        notifyCopyFailure()
      }
    })
  } catch {
    // The clipboard API itself is unreachable: unsecure context, or no permission at all.
    if (!unsecuredCopyToClipboard(serializedValue)) {
      notifyCopyFailure()
      throw new Error('Unable to copy to clipboard')
    }

    addToast({
      severity: 'info',
      translateKey: 'text_63a5ba11eb4e7e17ef88e9f0',
    })
  }
}
