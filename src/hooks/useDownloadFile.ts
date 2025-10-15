import { addToast } from '~/core/apolloClient'

export const useDownloadFile = () => {
  const showDownloadError = () => {
    addToast({
      severity: 'danger',
      translateKey: 'text_1760517105743y1n6z2u1063',
    })
  }

  const downloadFileFromURL = async (fileName: string, url?: string | null) => {
    if (!url) {
      showDownloadError()
      return
    }

    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = objectUrl
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch {
      showDownloadError()
    }
  }

  return { downloadFileFromURL }
}
