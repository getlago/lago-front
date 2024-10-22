import { addToast } from '../apolloClient'

export const handleDownloadFile = (fileUrl?: string | null) => {
  const showError = () => {
    addToast({
      severity: 'danger',
      translateKey: 'text_62b31e1f6a5b8b1b745ece48',
    })
  }

  if (!fileUrl) return showError()

  // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
  // It could be seen as unexpected popup as not immediatly done on user action
  // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
  // Also, we need to use setTimeout to avoid Safari blocking the popup
  setTimeout(() => {
    const myWindow = window.open('', '_blank')

    if (myWindow?.location?.href) {
      myWindow.location.href = fileUrl
      return myWindow?.focus()
    }

    myWindow?.close()
    showError()
  }, 0)
}
