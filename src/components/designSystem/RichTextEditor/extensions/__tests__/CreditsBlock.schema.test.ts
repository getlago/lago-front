import { CreditsBlockSchema } from '../CreditsBlock.schema'

describe('CreditsBlockSchema', () => {
  it('is an atom block node named creditsBlock', () => {
    expect(CreditsBlockSchema.name).toBe('creditsBlock')
    expect(CreditsBlockSchema.config.group).toBe('block')
    expect(CreditsBlockSchema.config.atom).toBe(true)
  })

  it('serializes to an entity comment carrying the localId', () => {
    const writes: string[] = []
    const state = { write: (t: string) => writes.push(t), closeBlock: () => undefined }

    CreditsBlockSchema.storage.markdown.serialize(state, { attrs: { localId: 'wl_1' } })

    expect(writes.join('')).toBe('<!-- entity:credits:wl_1 -->')
  })

  it('parses the entity comment back into a credits-block div', () => {
    const el = document.createElement('div')

    el.innerHTML = '<!-- entity:credits:wl_1 -->'
    CreditsBlockSchema.storage.markdown.parse.updateDOM(el)

    expect(el.innerHTML).toContain('data-type="credits-block"')
    expect(el.innerHTML).toContain('data-local-id="wl_1"')
  })

  // TipTap types these config methods with a bound `this`; cast to plain
  // callables so they can be invoked directly in isolation.
  const addOptions = CreditsBlockSchema.config.addOptions as () => { entities: unknown }
  const addAttributes = CreditsBlockSchema.config.addAttributes as () => {
    localId: { default: string; parseHTML: (el: HTMLElement) => string }
  }
  const parseHTML = CreditsBlockSchema.config.parseHTML as () => Array<{ tag: string }>

  describe('addOptions', () => {
    it('defaults entities to an empty record', () => {
      expect(addOptions()).toEqual({ entities: {} })
    })
  })

  describe('addAttributes', () => {
    const getLocalId = () => addAttributes().localId

    it('defaults localId to an empty string', () => {
      expect(getLocalId().default).toBe('')
    })

    it('parses localId from the element dataset', () => {
      const el = document.createElement('div')

      el.dataset.localId = 'wl_42'

      expect(getLocalId().parseHTML(el)).toBe('wl_42')
    })

    it('falls back to an empty string when the dataset is missing', () => {
      const el = document.createElement('div')

      expect(getLocalId().parseHTML(el)).toBe('')
    })
  })

  describe('parseHTML', () => {
    it('matches the credits-block div tag', () => {
      const rules = parseHTML()

      expect(rules[0].tag).toBe('div[data-type="credits-block"]')
    })
  })

  describe('renderHTML', () => {
    const render = (entities: Record<string, { name?: string }>, localId: string): unknown =>
      (
        CreditsBlockSchema.config.renderHTML as (
          this: { options: { entities: unknown } },
          props: { HTMLAttributes: Record<string, unknown> },
        ) => unknown
      ).call({ options: { entities } }, { HTMLAttributes: { localId } })

    it('renders the resolved entity name as the label', () => {
      const output = JSON.stringify(render({ wl_1: { name: 'My Wallet' } }, 'wl_1'))

      expect(output).toContain('My Wallet')
      expect(output).toContain('wl_1')
    })

    it('falls back to a placeholder label when the entity is unknown', () => {
      const output = JSON.stringify(render({}, 'wl_missing'))

      expect(output).toContain('Select credits')
    })
  })
})
