import { getBaseExtensions } from '../extensions/baseExtensions'

describe('getBaseExtensions', () => {
  describe('GIVEN no options are provided', () => {
    describe('WHEN getBaseExtensions is called', () => {
      it('THEN should return an array of extensions', () => {
        const extensions = getBaseExtensions()

        expect(Array.isArray(extensions)).toBe(true)
        expect(extensions.length).toBeGreaterThan(0)
      })

      it('THEN should include StarterKit with link and underline disabled', () => {
        const extensions = getBaseExtensions()
        const starterKit = extensions.find((ext) => 'name' in ext && ext.name === 'starterKit') as
          | { name: string; options: Record<string, unknown> }
          | undefined

        expect(starterKit).toBeDefined()
        expect(starterKit?.options.link).toBe(false)
        expect(starterKit?.options.underline).toBe(false)
      })

      it.each([
        ['link'],
        ['underline'],
        ['superscript'],
        ['subscript'],
        ['highlight'],
        ['textAlign'],
        ['image'],
        ['table'],
        ['tableRow'],
        ['tableCell'],
        ['tableHeader'],
        ['linkCard'],
        ['markdown'],
      ])('THEN should include the %s extension', (extensionName) => {
        const extensions = getBaseExtensions()
        const names = extensions.map((ext) => ('name' in ext ? ext.name : undefined))

        expect(names).toContain(extensionName)
      })

      it('THEN should configure Table with resizable false by default', () => {
        const extensions = getBaseExtensions()
        const table = extensions.find((ext) => 'name' in ext && ext.name === 'table') as
          | { name: string; options: { resizable: boolean } }
          | undefined

        expect(table).toBeDefined()
        expect(table?.options.resizable).toBe(false)
      })

      it('THEN should configure Link with openOnClick false', () => {
        const extensions = getBaseExtensions()
        const link = extensions.find((ext) => 'name' in ext && ext.name === 'link') as
          | { name: string; options: { openOnClick: boolean } }
          | undefined

        expect(link).toBeDefined()
        expect(link?.options.openOnClick).toBe(false)
      })
    })
  })

  describe('GIVEN tableResizable option is true', () => {
    describe('WHEN getBaseExtensions is called', () => {
      it('THEN should configure Table with resizable true', () => {
        const extensions = getBaseExtensions({ tableResizable: true })
        const table = extensions.find((ext) => 'name' in ext && ext.name === 'table') as
          | { name: string; options: { resizable: boolean } }
          | undefined

        expect(table).toBeDefined()
        expect(table?.options.resizable).toBe(true)
      })
    })
  })

  describe('GIVEN tableResizable option is false', () => {
    describe('WHEN getBaseExtensions is called', () => {
      it('THEN should configure Table with resizable false', () => {
        const extensions = getBaseExtensions({ tableResizable: false })
        const table = extensions.find((ext) => 'name' in ext && ext.name === 'table') as
          | { name: string; options: { resizable: boolean } }
          | undefined

        expect(table).toBeDefined()
        expect(table?.options.resizable).toBe(false)
      })
    })
  })

  describe('GIVEN the extension list does not contain duplicates', () => {
    describe('WHEN getBaseExtensions is called', () => {
      it('THEN should not have duplicate extension names', () => {
        const extensions = getBaseExtensions()
        const names = extensions
          .map((ext) => ('name' in ext ? ext.name : undefined))
          .filter(Boolean)

        const uniqueNames = new Set(names)

        expect(names.length).toBe(uniqueNames.size)
      })
    })
  })
})
