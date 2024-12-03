import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-ruby'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import { memo, useEffect, useRef } from 'react'

import { Button, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import './codeSnippet.css'

Prism.manual = true

interface CodeSnippetProps {
  className?: string
  loading?: boolean
  code: string
  language?: 'bash' | 'javascript' | 'json'
  canCopy?: boolean
  displayHead?: boolean
}

export const CodeSnippet = memo(
  ({
    className,
    loading,
    code,
    language = 'javascript',
    canCopy = true,
    displayHead = true,
  }: CodeSnippetProps) => {
    const codeRef = useRef(null)
    const { translate } = useInternationalization()

    useEffect(() => {
      if (codeRef && codeRef.current) {
        Prism.highlightElement(codeRef.current)
      }
    })

    return (
      <div className={tw('code-snippet', 'relative h-full', className)}>
        {loading ? null : (
          <>
            {displayHead && (
              <div className="flex h-nav items-center px-8 shadow-b">
                <Typography variant="bodyHl">
                  {translate('text_623b42ff8ee4e000ba87d0b2')}
                </Typography>
              </div>
            )}
            <pre
              className={tw(
                // https://prismjs.com/plugins/line-numbers/
                'line-numbers',
                'pb-30',
                displayHead ? 'h-[calc(100%-theme(space.nav))]' : 'h-full',
              )}
            >
              <code
                ref={codeRef}
                className={tw(`language-${language}`, 'font-code text-sm/6 font-normal')}
              >
                {code}
              </code>
            </pre>
            {canCopy && (
              <Button
                className="absolute inset-x-0 bottom-12 mx-auto w-fit"
                variant="secondary"
                startIcon="duplicate"
                onClick={() => {
                  copyToClipboard(code, { ignoreComment: true })

                  addToast({
                    severity: 'info',
                    translateKey: 'text_6241ce41ae814301478358a2',
                  })
                }}
              >
                {translate('text_623b42ff8ee4e000ba87d0c6')}
              </Button>
            )}
          </>
        )}
      </div>
    )
  },
)

CodeSnippet.displayName = 'CodeSnippet'
