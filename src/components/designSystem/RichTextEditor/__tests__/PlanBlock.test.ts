import { PlanBlock } from '../extensions/PlanBlock'

jest.mock('../PlanBlock/PlanBlockView', () => ({
  PlanBlockView: () => null,
}))

describe('PlanBlock', () => {
  describe('GIVEN the PlanBlock extension is created', () => {
    it('THEN should have the correct name', () => {
      expect(PlanBlock.name).toBe('planBlock')
    })

    it('THEN should be a block group', () => {
      expect(PlanBlock.config.group).toBe('block')
    })

    it('THEN should be an atom node', () => {
      expect(PlanBlock.config.atom).toBe(true)
    })
  })

  describe('GIVEN the addAttributes config', () => {
    const getAttributes = () => {
      const addAttributes = PlanBlock.config.addAttributes as unknown as () => {
        planId: { default: string; parseHTML: (element: HTMLElement) => string }
      }

      return addAttributes()
    }

    it('THEN should have planId attribute with empty string default', () => {
      const attrs = getAttributes()

      expect(attrs.planId.default).toBe('')
    })

    describe('WHEN parseHTML is called with a data-plan-id attribute', () => {
      it('THEN should return the plan id value', () => {
        const attrs = getAttributes()
        const element = document.createElement('div')

        element.setAttribute('data-plan-id', 'plan-123')

        expect(attrs.planId.parseHTML(element)).toBe('plan-123')
      })
    })

    describe('WHEN parseHTML is called without data-plan-id attribute', () => {
      it('THEN should return empty string', () => {
        const attrs = getAttributes()
        const element = document.createElement('div')

        expect(attrs.planId.parseHTML(element)).toBe('')
      })
    })
  })

  describe('GIVEN the addStorage config', () => {
    const getStorage = () => {
      const addStorage = PlanBlock.config.addStorage as unknown as () => {
        markdown: {
          serialize: (
            state: { write: (text: string) => void; closeBlock: (node: unknown) => void },
            node: { attrs: { planId: string } },
          ) => void
          parse: {
            updateDOM: (element: HTMLElement) => void
          }
        }
      }

      return addStorage()
    }

    describe('WHEN serialize is called with a planId', () => {
      it('THEN should write the entity comment with the plan id', () => {
        const storage = getStorage()
        const mockWrite = jest.fn()
        const mockCloseBlock = jest.fn()
        const node = { attrs: { planId: 'plan-123' } }

        storage.markdown.serialize({ write: mockWrite, closeBlock: mockCloseBlock }, node)

        expect(mockWrite).toHaveBeenCalledWith('<!-- entity:plan:plan-123 -->')
        expect(mockCloseBlock).toHaveBeenCalledWith(node)
      })
    })

    describe('WHEN serialize is called without a planId', () => {
      it('THEN should write the entity comment with empty id', () => {
        const storage = getStorage()
        const mockWrite = jest.fn()
        const mockCloseBlock = jest.fn()
        const node = { attrs: { planId: '' } }

        storage.markdown.serialize({ write: mockWrite, closeBlock: mockCloseBlock }, node)

        expect(mockWrite).toHaveBeenCalledWith('<!-- entity:plan: -->')
        expect(mockCloseBlock).toHaveBeenCalledWith(node)
      })
    })

    describe('WHEN parse.updateDOM is called with entity plan comments', () => {
      it('THEN should replace comments with plan block div elements', () => {
        const storage = getStorage()
        const element = {
          innerHTML: 'Some text <!-- entity:plan:plan-123 --> more text',
        } as HTMLElement

        storage.markdown.parse.updateDOM(element)

        expect(element.innerHTML).toContain('data-type="plan-block"')
        expect(element.innerHTML).toContain('data-plan-id="plan-123"')
      })
    })

    describe('WHEN parse.updateDOM is called with empty plan id comment', () => {
      it('THEN should replace with a plan block div with empty id', () => {
        const storage = getStorage()
        const element = {
          innerHTML: '<!-- entity:plan: -->',
        } as HTMLElement

        storage.markdown.parse.updateDOM(element)

        expect(element.innerHTML).toContain('data-type="plan-block"')
        expect(element.innerHTML).toContain('data-plan-id=""')
      })
    })

    describe('WHEN parse.updateDOM is called with no plan comments', () => {
      it('THEN should not modify the innerHTML', () => {
        const storage = getStorage()
        const element = { innerHTML: 'No plan blocks here.' } as HTMLElement

        storage.markdown.parse.updateDOM(element)

        expect(element.innerHTML).toBe('No plan blocks here.')
      })
    })
  })

  describe('GIVEN the parseHTML config', () => {
    it('THEN should match div elements with data-type="plan-block"', () => {
      const parseHTML = PlanBlock.config.parseHTML as unknown as () => { tag: string }[]
      const rules = parseHTML()

      expect(rules).toEqual([{ tag: 'div[data-type="plan-block"]' }])
    })
  })

  describe('GIVEN the renderHTML config', () => {
    const getRenderHTML = () => {
      return PlanBlock.config.renderHTML as unknown as (props: {
        HTMLAttributes: Record<string, unknown>
      }) => unknown[]
    }

    describe('WHEN called with a planId', () => {
      it('THEN should render a div with plan block attributes', () => {
        const renderHTML = getRenderHTML()
        const result = renderHTML({ HTMLAttributes: { planId: 'plan-123' } })

        expect(result[0]).toBe('div')
        expect(result[1]).toEqual(
          expect.objectContaining({
            'data-type': 'plan-block',
            'data-plan-id': 'plan-123',
            class: 'plan-block',
          }),
        )
        expect(result[2]).toEqual(['span', { class: 'plan-block__label' }, 'Plan: plan-123'])
      })
    })

    describe('WHEN called without a planId', () => {
      it('THEN should render fallback text', () => {
        const renderHTML = getRenderHTML()
        const result = renderHTML({ HTMLAttributes: { planId: '' } })

        expect(result[2]).toEqual(['span', { class: 'plan-block__label' }, 'Select a plan'])
      })
    })

    describe('WHEN called with null planId', () => {
      it('THEN should render fallback text', () => {
        const renderHTML = getRenderHTML()
        const result = renderHTML({ HTMLAttributes: { planId: null } })

        expect(result[2]).toEqual(['span', { class: 'plan-block__label' }, 'Select a plan'])
      })
    })
  })
})
