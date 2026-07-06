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
})
