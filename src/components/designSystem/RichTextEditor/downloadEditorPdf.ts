import { printHtmlContent } from './printHtmlContent'

export const downloadEditorPdf = (wrapperElement: HTMLDivElement | null): void => {
  if (!wrapperElement) return

  const proseMirror = wrapperElement.querySelector('.ProseMirror') as HTMLElement | null

  if (!proseMirror) return

  printHtmlContent(`<div class="rich-text-editor">${proseMirror.outerHTML}</div>`)
}
