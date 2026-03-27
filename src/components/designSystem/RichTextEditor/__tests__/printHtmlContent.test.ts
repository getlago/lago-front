import { printHtmlContent } from '../printHtmlContent'

describe('printHtmlContent', () => {
  let appendChildSpy: jest.SpyInstance
  let removeSpy: jest.Mock

  const createMockIframeDoc = () => ({
    createElement: jest.fn((tag: string) => {
      const el = document.createElement(tag)

      jest.spyOn(el, 'addEventListener')

      return el
    }),
    head: {
      appendChild: jest.fn(),
    },
    body: {
      innerHTML: '',
    },
    querySelectorAll: jest.fn().mockReturnValue([]),
  })

  beforeEach(() => {
    removeSpy = jest.fn()
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      // Make the iframe accessible but don't actually add to DOM
      return node
    })
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('GIVEN an HTML string', () => {
    describe('WHEN printHtmlContent is called', () => {
      it('THEN should create an offscreen iframe', () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        expect(appendChildSpy).toHaveBeenCalledTimes(1)
      })

      it('THEN should wrap content in a print-padding div', () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        expect(mockDoc.body.innerHTML).toBe('<div class="print-padding"><p>Hello</p></div>')
      })

      it('THEN should add print styles to the iframe head', () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        // At minimum: the print style element
        expect(mockDoc.head.appendChild).toHaveBeenCalled()
      })

      it('THEN should call print on the iframe contentWindow', async () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        // waitForStylesheets is a Promise.all, need to flush microtasks
        await jest.runAllTimersAsync()

        expect(mockPrint).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the iframe has no contentDocument', () => {
    describe('WHEN printHtmlContent is called', () => {
      it('THEN should remove the iframe and return early', () => {
        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: null,
          contentWindow: null,
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        expect(removeSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the iframe has no contentWindow after stylesheets load', () => {
    describe('WHEN printHtmlContent is called', () => {
      it('THEN should remove the iframe without calling print', async () => {
        const mockDoc = createMockIframeDoc()

        const mockIframe = {
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: null,
          remove: removeSpy,
        } as unknown as HTMLIFrameElement

        jest.spyOn(document, 'createElement').mockReturnValueOnce(mockIframe)

        printHtmlContent('<p>Hello</p>')

        await jest.runAllTimersAsync()

        expect(removeSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN onafterprint fires', () => {
    describe('WHEN printing completes', () => {
      it('THEN should clean up the iframe', async () => {
        const mockDoc = createMockIframeDoc()
        const captured: { onafterprint: (() => void) | null } = { onafterprint: null }
        const mockPrint = jest.fn()

        const contentWindow = {
          print: mockPrint,
          set onafterprint(cb: (() => void) | null) {
            captured.onafterprint = cb
          },
          get onafterprint() {
            return captured.onafterprint
          },
        }

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow,
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        // Flush only the microtask queue (promise chain) without advancing timers
        await Promise.resolve()
        await Promise.resolve()

        expect(mockPrint).toHaveBeenCalled()
        expect(captured.onafterprint).toBeDefined()

        // Simulate onafterprint — this should clear the fallback timeout
        captured.onafterprint?.()

        // Advancing past the fallback timeout should NOT trigger a second remove
        jest.advanceTimersByTime(10_000)

        expect(removeSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the fallback timeout fires', () => {
    describe('WHEN onafterprint does not fire within 10 seconds', () => {
      it('THEN should clean up the iframe via timeout', async () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        // Flush the promise chain to get to the finally block
        await jest.runAllTimersAsync()

        expect(mockPrint).toHaveBeenCalled()

        // Advance to trigger the fallback timeout (10 seconds)
        jest.advanceTimersByTime(10_000)

        expect(removeSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN stylesheets with href exist in the document', () => {
    describe('WHEN printHtmlContent is called', () => {
      it('THEN should copy linked stylesheets to the iframe', async () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        // Mock a stylesheet with href
        const mockStyleSheet = {
          href: 'https://example.com/style.css',
          cssRules: null,
        } as unknown as CSSStyleSheet

        jest
          .spyOn(document, 'styleSheets', 'get')
          .mockReturnValue([mockStyleSheet] as unknown as StyleSheetList)

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        await jest.runAllTimersAsync()

        // Should have created a link element for the stylesheet
        expect(mockDoc.createElement).toHaveBeenCalledWith('link')
        expect(mockDoc.head.appendChild).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN inline stylesheets exist in the document', () => {
    describe('WHEN printHtmlContent is called', () => {
      it('THEN should copy inline styles to the iframe', async () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        // Mock an inline stylesheet
        const mockStyleSheet = {
          href: null,
          cssRules: [{ cssText: 'body { color: red; }' }],
        } as unknown as CSSStyleSheet

        jest
          .spyOn(document, 'styleSheets', 'get')
          .mockReturnValue([mockStyleSheet] as unknown as StyleSheetList)

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        printHtmlContent('<p>Hello</p>')

        await jest.runAllTimersAsync()

        // Should have created a style element for the inline stylesheet
        expect(mockDoc.createElement).toHaveBeenCalledWith('style')
      })
    })
  })

  describe('GIVEN cross-origin stylesheets that throw on access', () => {
    describe('WHEN printHtmlContent is called', () => {
      it('THEN should skip the cross-origin stylesheet without throwing', async () => {
        const mockDoc = createMockIframeDoc()
        const mockPrint = jest.fn()

        const mockStyleSheet = {
          href: null,
          get cssRules(): CSSRuleList {
            throw new DOMException('Blocked by CORS')
          },
        } as unknown as CSSStyleSheet

        jest
          .spyOn(document, 'styleSheets', 'get')
          .mockReturnValue([mockStyleSheet] as unknown as StyleSheetList)

        jest.spyOn(document, 'createElement').mockReturnValueOnce({
          style: {} as CSSStyleDeclaration,
          contentDocument: mockDoc,
          contentWindow: { print: mockPrint, onafterprint: null },
          remove: removeSpy,
        } as unknown as HTMLIFrameElement)

        expect(() => printHtmlContent('<p>Hello</p>')).not.toThrow()

        await jest.runAllTimersAsync()

        expect(mockPrint).toHaveBeenCalled()
      })
    })
  })
})
