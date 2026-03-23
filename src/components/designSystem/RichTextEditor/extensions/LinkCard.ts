import { mergeAttributes, Node } from '@tiptap/core'

export interface LinkCardAttributes {
  href: string
}

export const LinkCard = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      href: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="link-card"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const href = HTMLAttributes.href as string
    let domain = ''

    try {
      domain = new URL(href).hostname
    } catch {
      domain = href
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'link-card',
        class: 'link-card',
      }),
      [
        'a',
        {
          href,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'link-card__anchor',
        },
        ['span', { class: 'link-card__domain' }, domain],
        ['span', { class: 'link-card__url' }, href],
      ],
    ]
  },
})
