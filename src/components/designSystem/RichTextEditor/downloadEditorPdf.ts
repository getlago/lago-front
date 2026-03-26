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

  printStyle.textContent = `
    @page { margin: 0; }
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    }
    body { margin: 0; padding: 0; }
    .print-padding { padding: 20mm; }
  `
  iframeDoc.head.appendChild(printStyle)

  // Wrap the cloned content in a padded div — @page margin: 0 removes default page margins,
  // and the inner padding restores the visual margin (browser print headers/footers may still appear)
  iframeDoc.body.innerHTML = `<div class="print-padding"><div class="rich-text-editor">${proseMirror.outerHTML}</div></div>`

  // Wait for all linked stylesheets to load before printing
  const stylesheetLinks = Array.from(
    iframeDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  )

  const waitForStylesheets = Promise.all(
    stylesheetLinks.map(
      (link) =>
        new Promise<void>((resolve) => {
          if ((link as unknown as { sheet: CSSStyleSheet | null }).sheet) {
            resolve()
            return
          }

          const onDone = (): void => {
            link.removeEventListener('load', onDone)
            link.removeEventListener('error', onDone)
            resolve()
          }

          link.addEventListener('load', onDone)
          link.addEventListener('error', onDone)
        }),
    ),
  )

  waitForStylesheets
    .catch(() => {
      // If waiting fails, fall through and attempt to print anyway
    })
    .finally(() => {
      const contentWindow = iframe.contentWindow

      if (!contentWindow) {
        iframe.remove()
        return
      }

      const cleanup = (): void => {
        iframe.remove()
      }

      // Clean up when printing finishes, with a fallback timeout
      const fallbackTimeout = globalThis.setTimeout(cleanup, 10_000)

      contentWindow.onafterprint = () => {
        globalThis.clearTimeout(fallbackTimeout)
        cleanup()
      }

      contentWindow.print()
    })
}
