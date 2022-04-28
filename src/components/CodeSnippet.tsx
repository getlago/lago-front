import { memo, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-bash'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/themes/prism-okaidia.css'
import styled from 'styled-components'

import { Typography, Button, Skeleton } from '~/components/designSystem'
import { theme } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { addToast } from '~/core/apolloClient'

Prism.manual = true

interface CodeSnippetProps {
  className?: string
  loading?: boolean
  code: string
  language?: 'bash' | 'javascript'
}

export const CodeSnippet = memo(
  ({ className, loading, code, language = 'javascript' }: CodeSnippetProps) => {
    const codeRef = useRef(null)
    const { translate } = useI18nContext()

    useEffect(() => {
      if (codeRef && codeRef.current) {
        Prism.highlightElement(codeRef.current)
      }
    })

    return (
      <Content className={className}>
        {loading ? (
          <>
            <Skeleton variant="text" width="inherit" height={12} marginBottom={theme.spacing(9)} />
            <Skeleton variant="text" width={168} height={12} marginBottom={theme.spacing(4)} />
            <BlockSkeleton variant="text" width="inherit" height={112} />
          </>
        ) : (
          <>
            <Title variant="bodyHl" color="textSecondary">
              {translate('text_623b42ff8ee4e000ba87d0b2')}
            </Title>

            <Pre className="line-numbers">
              <Code ref={codeRef} className={`language-${language}`}>
                {code}
              </Code>
              <span />
            </Pre>
            <Button
              variant="secondary"
              startIcon="duplicate"
              fullWidth
              onClick={() => {
                navigator.clipboard.writeText(code)

                addToast({
                  severity: 'info',
                  translateKey: 'text_6241ce41ae814301478358a2',
                })
              }}
            >
              {translate('text_623b42ff8ee4e000ba87d0c6')}
            </Button>
          </>
        )}
      </Content>
    )
  }
)

CodeSnippet.displayName = 'CodeSnippet'

const BlockSkeleton = styled(Skeleton)`
  border-radius: 12px !important;
`

const Pre = styled.pre`
  background-color: ${theme.palette.grey[700]};
  padding: ${theme.spacing(4)};
  border-radius: 12px;
`

const Code = styled.code`
  font-family: 'IBM Plex Mono, monospace';
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(6)};
`

const Content = styled.div`
  pre[class*='language-'] {
    margin: 0 0 ${theme.spacing(3)} 0;
    display: flex;
  }

  pre[class*='language-'].line-numbers {
    position: relative;
    padding-left: 42px;
    counter-reset: linenumber;
    border-radius: 12px;
  }

  pre[class*='language-'].line-numbers > code {
    position: relative;
    white-space: inherit;
  }

  .line-numbers .line-numbers-rows {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: -42px;
    width: 30px;

    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .line-numbers-rows > span {
    display: block;
    counter-increment: linenumber;
  }

  .line-numbers-rows > span:before {
    content: counter(linenumber);
    color: ${theme.palette.common.white};
    display: block;
    text-align: right;
  }

  > span {
    width: ${theme.spacing(3)};
  }
`
