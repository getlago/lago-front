import { cx, type CxOptions } from 'class-variance-authority'
import { extendTailwindMerge } from 'tailwind-merge'

const mergeShadcnClasses = extendTailwindMerge<'v2-typography'>({
  extend: {
    classGroups: {
      'v2-typography': [
        {
          'v2-text': [
            'page-title',
            'section-title',
            'group-title',
            'body',
            'body-large',
            'label',
            'caption',
            'number-small',
            'number',
            'number-large',
            'code',
          ],
        },
      ],
    },
  },
})

export const cn = (...inputs: CxOptions): string => mergeShadcnClasses(cx(inputs))
