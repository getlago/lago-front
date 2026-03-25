import { downloadEditorPdf } from '../downloadEditorPdf'

describe('downloadEditorPdf', () => {
  let mockPrint: jest.Mock
  let mockIframeRemove: jest.Mock
  let mockIframeContentDocument: Document

  beforeEach(() => {
    jest.useFakeTimers()
    mockPrint = jest.fn()
    mockIframeRemove = jest.fn()

    mockIframeContentDocument = {
      head: { appendChild: jest.fn() },
      body: { innerHTML: '' },
      createElement: jest.fn((tag: string) => {
        const element: Record<string, unknown> = { tagName: tag }

        if (tag === 'link') {
          element.rel = ''
          element.href = ''
        }
        if (tag === 'style') {
          element.textContent = ''
        }

        return element
      }),
    } as unknown as Document

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'iframe') {
        return {
          style: {} as CSSStyleDeclaration,
          remove: mockIframeRemove,
          contentDocument: mockIframeContentDocument,
          contentWindow: { document: mockIframeContentDocument, print: mockPrint },
        } as unknown as HTMLIFrameElement
      }

      return document.createElement.call(document, tag)
    })

    jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('GIVEN a null wrapper element', () => {
    describe('WHEN downloadEditorPdf is called', () => {
      it('THEN should return early without creating an iframe', () => {
        downloadEditorPdf(null)

        expect(document.createElement).not.toHaveBeenCalledWith('iframe')
      })
    })
  })

  describe('GIVEN a wrapper element without a ProseMirror child', () => {
    describe('WHEN downloadEditorPdf is called', () => {
      it('THEN should return early without creating an iframe', () => {
        const realCreateElement = Document.prototype.createElement.bind(document)
        const wrapper = realCreateElement('div')

        downloadEditorPdf(wrapper)

        expect(document.createElement).not.toHaveBeenCalledWith('iframe')
      })
    })
  })

  describe('GIVEN a valid wrapper element with ProseMirror content', () => {
    let wrapper: HTMLDivElement

    beforeEach(() => {
      const realCreateElement = Document.prototype.createElement.bind(document)

      wrapper = realCreateElement('div')
      const proseMirror = realCreateElement('div')

      proseMirror.className = 'ProseMirror'
      proseMirror.innerHTML = '<p>Test content</p>'
      wrapper.appendChild(proseMirror)
    })

    describe('WHEN downloadEditorPdf is called', () => {
      it('THEN should create a hidden iframe and append it to the body', () => {
        downloadEditorPdf(wrapper)

        expect(document.createElement).toHaveBeenCalledWith('iframe')
        expect(document.body.appendChild).toHaveBeenCalled()
      })

      it('THEN should copy the ProseMirror content into the iframe', () => {
        downloadEditorPdf(wrapper)

        expect(mockIframeContentDocument.body.innerHTML).toContain('ProseMirror')
        expect(mockIframeContentDocument.body.innerHTML).toContain('print-padding')
        expect(mockIframeContentDocument.body.innerHTML).toContain('rich-text-editor')
      })

      it('THEN should add print styles to the iframe', () => {
        downloadEditorPdf(wrapper)

        const appendCalls = (mockIframeContentDocument.head.appendChild as jest.Mock).mock.calls
        const printStyle = appendCalls.find(
          ([el]: [{ textContent?: string }]) => el.textContent && el.textContent.includes('@page'),
        )

        expect(printStyle).toBeDefined()
      })

      it('THEN should trigger print after a delay', () => {
        downloadEditorPdf(wrapper)

        expect(mockPrint).not.toHaveBeenCalled()

        jest.advanceTimersByTime(500)

        expect(mockPrint).toHaveBeenCalledTimes(1)
      })

      it('THEN should remove the iframe after printing', () => {
        downloadEditorPdf(wrapper)

        jest.advanceTimersByTime(500)
        expect(mockIframeRemove).not.toHaveBeenCalled()

        jest.advanceTimersByTime(1000)
        expect(mockIframeRemove).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN parent document has linked stylesheets', () => {
      it('THEN should copy linked stylesheets into the iframe', () => {
        const mockSheet = {
          href: 'https://example.com/styles.css',
          cssRules: null,
        } as unknown as CSSStyleSheet

        jest
          .spyOn(document, 'styleSheets', 'get')
          .mockReturnValue([mockSheet] as unknown as StyleSheetList)

        downloadEditorPdf(wrapper)

        const appendCalls = (mockIframeContentDocument.head.appendChild as jest.Mock).mock.calls
        const linkElement = appendCalls.find(
          ([el]: [{ tagName?: string; href?: string }]) => el.tagName === 'link',
        )

        expect(linkElement).toBeDefined()
        expect(linkElement[0].href).toBe('https://example.com/styles.css')
      })
    })

    describe('WHEN parent document has inline stylesheets', () => {
      it('THEN should copy inline style rules into the iframe', () => {
        const mockSheet = {
          href: null,
          cssRules: [{ cssText: 'body { color: red; }' }, { cssText: 'p { margin: 0; }' }],
        } as unknown as CSSStyleSheet

        jest
          .spyOn(document, 'styleSheets', 'get')
          .mockReturnValue([mockSheet] as unknown as StyleSheetList)

        downloadEditorPdf(wrapper)

        const appendCalls = (mockIframeContentDocument.head.appendChild as jest.Mock).mock.calls
        const styleElement = appendCalls.find(
          ([el]: [{ tagName?: string; textContent?: string }]) =>
            el.tagName === 'style' && el.textContent?.includes('body { color: red; }'),
        )

        expect(styleElement).toBeDefined()
      })
    })

    describe('WHEN a cross-origin stylesheet throws an error', () => {
      it('THEN should silently skip it and continue', () => {
        const throwingSheet = {
          href: null,
          get cssRules(): never {
            throw new DOMException('Blocked by CORS')
          },
        } as unknown as CSSStyleSheet

        const validSheet = {
          href: 'https://example.com/valid.css',
          cssRules: null,
        } as unknown as CSSStyleSheet

        jest
          .spyOn(document, 'styleSheets', 'get')
          .mockReturnValue([throwingSheet, validSheet] as unknown as StyleSheetList)

        downloadEditorPdf(wrapper)

        // Should not throw and should still process the valid sheet
        const appendCalls = (mockIframeContentDocument.head.appendChild as jest.Mock).mock.calls
        const linkElement = appendCalls.find(
          ([el]: [{ tagName?: string; href?: string }]) =>
            el.tagName === 'link' && el.href === 'https://example.com/valid.css',
        )

        expect(linkElement).toBeDefined()
      })
    })
  })

  describe('GIVEN the iframe has no contentDocument', () => {
    describe('WHEN downloadEditorPdf is called', () => {
      it('THEN should remove the iframe and return early', () => {
        const realCreateElement = Document.prototype.createElement.bind(document)
        const wrapper = realCreateElement('div')
        const proseMirror = realCreateElement('div')

        proseMirror.className = 'ProseMirror'
        wrapper.appendChild(proseMirror)

        jest.restoreAllMocks()

        const mockRemove = jest.fn()

        jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
          if (tag === 'iframe') {
            return {
              style: {} as CSSStyleDeclaration,
              remove: mockRemove,
              contentDocument: null,
              contentWindow: null,
            } as unknown as HTMLIFrameElement
          }

          return realCreateElement(tag)
        })
        jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node)

        downloadEditorPdf(wrapper)

        expect(mockRemove).toHaveBeenCalledTimes(1)
      })
    })
  })
})
