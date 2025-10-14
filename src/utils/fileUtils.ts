export const downloadFileFromURL = async (fileName?: string, url?: string | null) => {
  if (!url) return

  const response = await fetch(url)
  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.setAttribute('download', fileName || 'download.xml')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
