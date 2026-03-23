import { LinkCard } from '../extensions/LinkCard'

describe('LinkCard', () => {
  describe('GIVEN the LinkCard extension is created', () => {
    it('THEN should have the name "linkCard"', () => {
      expect(LinkCard.name).toBe('linkCard')
    })
  })

  describe('GIVEN the renderHTML function', () => {
    const getRenderHTML = () => {
      const extensionConfig = LinkCard.config

      return extensionConfig.renderHTML as unknown as (props: {
        HTMLAttributes: Record<string, unknown>
      }) => unknown[]
    }

    describe('WHEN called with a valid URL', () => {
      it('THEN should extract the hostname as domain', () => {
        const renderHTML = getRenderHTML()

        const result = renderHTML({
          HTMLAttributes: { href: 'https://www.example.com/path/to/page' },
        })

        const outerDiv = result as unknown[]
        const anchor = outerDiv[2] as unknown[]
        const domainSpan = anchor[2] as unknown[]

        expect(domainSpan[2]).toBe('www.example.com')
      })

      it('THEN should include the full URL in the url span', () => {
        const renderHTML = getRenderHTML()
        const href = 'https://www.example.com/path/to/page'

        const result = renderHTML({ HTMLAttributes: { href } })

        const outerDiv = result as unknown[]
        const anchor = outerDiv[2] as unknown[]
        const urlSpan = anchor[3] as unknown[]

        expect(urlSpan[2]).toBe(href)
      })

      it('THEN should produce the correct HTML structure', () => {
        const renderHTML = getRenderHTML()
        const href = 'https://example.com'

        const result = renderHTML({ HTMLAttributes: { href } })

        expect(result[0]).toBe('div')

        const attrs = result[1] as Record<string, string>

        expect(attrs['data-type']).toBe('link-card')
        expect(attrs.class).toBe('link-card')

        const anchor = result[2] as unknown[]

        expect(anchor[0]).toBe('a')

        const anchorAttrs = anchor[1] as Record<string, string>

        expect(anchorAttrs.href).toBe(href)
        expect(anchorAttrs.target).toBe('_blank')
        expect(anchorAttrs.rel).toBe('noopener noreferrer')
      })
    })

    describe('WHEN called with an invalid URL', () => {
      it('THEN should fallback to using the href string as domain', () => {
        const renderHTML = getRenderHTML()

        const result = renderHTML({ HTMLAttributes: { href: 'not-a-valid-url' } })

        const outerDiv = result as unknown[]
        const anchor = outerDiv[2] as unknown[]
        const domainSpan = anchor[2] as unknown[]

        expect(domainSpan[2]).toBe('not-a-valid-url')
      })
    })
  })

  describe('GIVEN the parseHTML function', () => {
    it('THEN should match div[data-type="link-card"]', () => {
      const extensionConfig = LinkCard.config
      const parseHTML = extensionConfig.parseHTML as () => Array<{ tag: string }>

      const rules = parseHTML()

      expect(rules).toEqual([{ tag: 'div[data-type="link-card"]' }])
    })
  })

  describe('GIVEN the addAttributes function', () => {
    it('THEN should define href with default null', () => {
      const extensionConfig = LinkCard.config
      const addAttributes = extensionConfig.addAttributes as () => Record<
        string,
        { default: unknown }
      >

      const attrs = addAttributes()

      expect(attrs.href).toEqual({ default: null })
    })
  })
})
