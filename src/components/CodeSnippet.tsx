import { memo, useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import styled from 'styled-components'

import { Typography, Button } from '~/components/designSystem'
import { theme, NAV_HEIGHT } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { addToast } from '~/core/apolloClient'
import { copyToClipboard } from '~/core/utils/copyToClipboard'

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
      <Content className={className}>
        {loading ? null : (
          <>
            {displayHead && (
              <Head>
                <Typography variant="bodyHl">
                  {translate('text_623b42ff8ee4e000ba87d0b2')}
                </Typography>
              </Head>
            )}
            <Pre className="line-numbers" $withHeader={displayHead}>
              <Code ref={codeRef} className={`language-${language}`}>
                {code}
              </Code>
            </Pre>
            {canCopy && (
              <CopyButton
                variant="secondary"
                startIcon="duplicate"
                onClick={() => {
                  copyToClipboard(code)

                  addToast({
                    severity: 'info',
                    translateKey: 'text_6241ce41ae814301478358a2',
                  })
                }}
              >
                {translate('text_623b42ff8ee4e000ba87d0c6')}
              </CopyButton>
            )}
          </>
        )}
      </Content>
    )
  }
)

CodeSnippet.displayName = 'CodeSnippet'

const Head = styled.div`
  height: ${NAV_HEIGHT}px;
  padding: 0 ${theme.spacing(8)};
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const Pre = styled.pre<{ $withHeader?: boolean }>`
  padding: ${theme.spacing(4)};
  background-color: transparent !important;
  height: ${({ $withHeader }) => ($withHeader ? `calc(100% - ${NAV_HEIGHT}px)` : '100%')};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding-bottom: ${theme.spacing(30)};

  &:focus-visible {
    outline: none;
  }
`

const Code = styled.code`
  font-family: 'IBM Plex Mono, Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace';
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
`

const CopyButton = styled(Button)`
  position: absolute;
  bottom: ${theme.spacing(12)};
  margin: auto;
  left: 0;
  right: 0;
  width: fit-content;
`

const Content = styled.div`
  position: relative;
  height: 100%;

  pre[class*='language-'] {
    margin: 0 ${theme.spacing(3)} ${theme.spacing(4)} 0;
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
    color: ${theme.palette.grey[500]};
    display: block;
    text-align: right;
  }

  > span {
    width: ${theme.spacing(3)};
    height: 80px;
    background-color: red;
  }

  /**
 * prism.js default theme for JavaScript, CSS and HTML
 * Based on dabblet (http://dabblet.com)
 * @author Lea Verou
 */

  code[class*='language-'],
  pre[class*='language-'] {
    color: #19212e;
    background: none;
    text-shadow: 0 1px white;
    font-family: IBM Plex Mono, Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    text-align: left;
    white-space: pre;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;

    -moz-tab-size: 4;
    -o-tab-size: 4;
    tab-size: 4;

    -webkit-hyphens: none;
    -moz-hyphens: none;
    -ms-hyphens: none;
    hyphens: none;
  }

  pre[class*='language-']::-moz-selection,
  pre[class*='language-'] ::-moz-selection,
  code[class*='language-']::-moz-selection,
  code[class*='language-'] ::-moz-selection {
    text-shadow: none;
    background: #b3d4fc;
  }

  pre[class*='language-']::selection,
  pre[class*='language-'] ::selection,
  code[class*='language-']::selection,
  code[class*='language-'] ::selection {
    text-shadow: none;
    background: #b3d4fc;
  }

  @media print {
    code[class*='language-'],
    pre[class*='language-'] {
      text-shadow: none;
    }
  }

  /* Code blocks */
  pre[class*='language-'] {
    overflow: auto;
  }

  :not(pre) > code[class*='language-'],
  pre[class*='language-'] {
    background: #f5f2f0;
  }

  /* Inline code */
  :not(pre) > code[class*='language-'] {
    padding: 0.1em;
    border-radius: 0.3em;
    white-space: normal;
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: slategray;
  }

  .token.punctuation {
    color: #8c95a6;
  }

  .token.namespace {
    opacity: 0.7;
  }

  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #422cc1;
  }

  .token.selector,
  .token.attr-name,
  .token.string,
  .token.char,
  .token.builtin,
  .token.inserted {
    color: #008559;
  }

  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #c86d02;
    /* This background color was intended by the author of this theme. */
    background: hsla(0, 0%, 100%, 0.5);
  }

  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #006cfa;
  }

  .token.function,
  .token.class-name {
    color: #f6491e;
  }

  .token.regex,
  .token.important,
  .token.variable {
    color: #ff7e1d;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }
  .token.italic {
    font-style: italic;
  }

  .token.entity {
    cursor: help;
  }
`
