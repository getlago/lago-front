import { addToast } from '~/core/apolloClient'

const showDownloadError = (): void => {
  addToast({
    severity: 'danger',
    translateKey: 'text_1760517105743y1n6z2u1063',
  })
}

const openFileTab = (url: string, closeAfterMs?: number): void => {
  // Safari requires deferred opening, with navigation and focus as separate steps.
  setTimeout(() => {
    const fileWindow = window.open('', '_blank')

    if (!fileWindow?.location?.href) {
      fileWindow?.close()
      showDownloadError()
      return
    }

    fileWindow.location.href = url
    fileWindow.focus()

    if (closeAfterMs !== undefined) {
      setTimeout(() => fileWindow.close(), closeAfterMs)
    }
  }, 0)
}

export const openNewTab = (url: string): void => {
  openFileTab(url)
}

export const handleDownloadFile = (fileUrl?: string | null): void => {
  if (!fileUrl) return showDownloadError()

  openFileTab(fileUrl)
}

export const handleDownloadFileWithCors = (fileUrl?: string | null): void => {
  if (!fileUrl) return showDownloadError()

  openFileTab(fileUrl, 500)
}
