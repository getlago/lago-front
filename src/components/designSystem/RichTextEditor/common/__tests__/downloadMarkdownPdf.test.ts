import { downloadMarkdownPdf } from '../downloadMarkdownPdf'
import { printHtmlContent } from '../printHtmlContent'

jest.mock('../printHtmlContent', () => ({
  printHtmlContent: jest.fn(),
}))

const mockPrintHtmlContent = printHtmlContent as jest.MockedFunction<typeof printHtmlContent>

describe('downloadMarkdownPdf', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN basic markdown content', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should convert markdown to HTML and call printHtmlContent', () => {
        downloadMarkdownPdf({ markdown: '# Hello\n\nSome **bold** text' })

        expect(mockPrintHtmlContent).toHaveBeenCalledTimes(1)

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).toContain('rich-text-editor')
        expect(html).toContain('ProseMirror')
        expect(html).toContain('<h1>Hello</h1>')
        expect(html).toContain('<strong>bold</strong>')
      })
    })
  })

  describe('GIVEN markdown with mentions and mentionValues provided', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should resolve mentions to their values', () => {
        downloadMarkdownPdf({
          markdown: 'Hello {customerName|Customer Name}',
          mentionValues: { customerName: 'Acme Corp' },
        })

        expect(mockPrintHtmlContent).toHaveBeenCalledTimes(1)

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).toContain('variable-mention--resolved')
        expect(html).toContain('Acme Corp')
        expect(html).not.toContain('@Customer Name')
      })
    })
  })

  describe('GIVEN markdown with mentions but no mentionValues', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should keep mentions unresolved', () => {
        downloadMarkdownPdf({
          markdown: 'Hello {customerName|Customer Name}',
        })

        expect(mockPrintHtmlContent).toHaveBeenCalledTimes(1)

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).toContain('variable-mention')
        expect(html).not.toContain('variable-mention--resolved')
        expect(html).toContain('@Customer Name')
      })
    })
  })

  describe('GIVEN markdown with a pricing block and entities data provided', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should resolve pricing blocks to tables', () => {
        downloadMarkdownPdf({
          markdown: '<!-- entity:pricing:plan:plan123 -->',
          entities: {
            plan123: {
              entityId: 'plan123',
              entityType: 'plan',
              name: 'Pro Plan',
              code: 'pro_plan',
            },
          },
        })

        expect(mockPrintHtmlContent).toHaveBeenCalledTimes(1)

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).toContain('Pro Plan')
        expect(html).toContain('pro_plan')
      })
    })
  })

  describe('GIVEN markdown with a pricing block but no entities data', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should keep the fallback pricing block label', () => {
        downloadMarkdownPdf({
          markdown: '<!-- entity:pricing:plan:plan123 -->',
        })

        expect(mockPrintHtmlContent).toHaveBeenCalledTimes(1)

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).toContain('data-pricing-type="plan"')
        expect(html).toContain('plan123')
      })
    })
  })

  describe('GIVEN markdown with special HTML characters in mention values', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should escape HTML in resolved values', () => {
        downloadMarkdownPdf({
          markdown: 'Hello {customerName|Customer Name}',
          mentionValues: { customerName: '<script>alert("xss")</script>' },
        })

        expect(mockPrintHtmlContent).toHaveBeenCalledTimes(1)

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).not.toContain('<script>')
        expect(html).toContain('&lt;script&gt;')
      })
    })
  })

  describe('GIVEN the output HTML structure', () => {
    describe('WHEN downloadMarkdownPdf is called', () => {
      it('THEN should wrap content in the expected div structure', () => {
        downloadMarkdownPdf({ markdown: 'Hello' })

        const html = mockPrintHtmlContent.mock.calls[0][0]

        expect(html).toMatch(
          /^<div class="rich-text-editor"><div class="ProseMirror" contenteditable="false">/,
        )
        expect(html).toMatch(/<\/div><\/div>$/)
      })
    })
  })
})
