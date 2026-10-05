import postcss from 'postcss'
import { renderToStaticMarkup } from 'react-dom/server'
import tailwindcss from 'tailwindcss'

import config from '../../../../tailwind.config'
import { Button, buttonVariants } from '../button'

describe('standalone button styles', () => {
  it.each(['secondary', 'outline'] as const)(
    'includes complete %s interaction styles without component markers',
    async (variant) => {
      const classes = buttonVariants({ variant })
      const markup = renderToStaticMarkup(
        <>
          <Button variant={variant}>Button</Button>
          <a className={classes} href="#target">
            Link
          </a>
        </>,
      )
      const result = await postcss([
        tailwindcss({
          ...config,
          content: [{ raw: markup.replaceAll('&amp;', '&'), extension: 'html' }],
        }),
      ]).process('@tailwind utilities;', { from: undefined })
      const interactions: { selector: string; value: string }[] = []

      result.root.walkRules((rule) => {
        rule.walkDecls('background-image', (declaration) => {
          interactions.push({ selector: rule.selector, value: declaration.value })
        })
      })

      expect(markup).not.toContain('data-shadcn-button')
      expect(markup).not.toContain('data-variant')
      expect(interactions).toHaveLength(2)
      expect(interactions).toEqual(
        expect.arrayContaining([
          {
            selector: expect.stringContaining(':hover:not(:active)'),
            value: 'linear-gradient(var(--color-interactive-hover),var(--color-interactive-hover))',
          },
          {
            selector: expect.stringMatching(/:active$/),
            value:
              'linear-gradient(var(--color-interactive-pressed),var(--color-interactive-pressed))',
          },
        ]),
      )
      for (const { selector } of interactions) {
        expect(selector).toContain(':not(:disabled):not([aria-disabled=true])')
      }
    },
  )
})
