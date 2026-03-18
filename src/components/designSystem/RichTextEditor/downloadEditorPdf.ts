export const downloadEditorPdf = (wrapperElement: HTMLDivElement | null): void => {
  if (!wrapperElement) return

  const proseMirror = wrapperElement.querySelector('.ProseMirror') as HTMLElement | null

  if (!proseMirror) return

  const iframe = document.createElement('iframe')

  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

  if (!iframeDoc) {
    iframe.remove()
    return
  }

  // Copy all stylesheets from the parent document into the iframe
  const styleSheets = Array.from(document.styleSheets)

  styleSheets.forEach((sheet) => {
    try {
      if (sheet.href) {
        const link = iframeDoc.createElement('link')

        link.rel = 'stylesheet'
        link.href = sheet.href
        iframeDoc.head.appendChild(link)
      } else if (sheet.cssRules) {
        const style = iframeDoc.createElement('style')
        const rules = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n')

        style.textContent = rules
        iframeDoc.head.appendChild(style)
      }
    } catch {
      // Skip cross-origin stylesheets that can't be read
    }
  })

  // Force backgrounds to print (browsers strip them by default)
  const printStyle = iframeDoc.createElement('style')

  printStyle.textContent = `@media print { * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; } }`
  iframeDoc.head.appendChild(printStyle)

  // Wrap the cloned content in the same class scope so CSS selectors match
  iframeDoc.body.innerHTML = `<div class="rich-text-editor">${proseMirror.outerHTML}</div>`

  // Give stylesheets a moment to load, then print
  setTimeout(() => {
    iframe.contentWindow?.print()

    // Clean up after the print dialog closes
    setTimeout(() => {
      iframe.remove()
    }, 1000)
  }, 500)
}
