/* eslint-disable react/prop-types */
import { parseCompleteMarkdownCodeBlock } from '@llm-ui/code'
import { type LLMOutputComponent } from '@llm-ui/react'
import parseHtml from 'html-react-parser'
import { useEffect, useState } from 'react'
import type { HighlighterCore } from 'shiki/core'

import { ensureLanguage, getHighlighter } from './highlighter'
import { PlaintextCodeblock } from './PlaintextCodeblock'

type Highlighting = {
  highlighter: HighlighterCore
  requestedLanguage: string
  language: string
}

export const Codeblock: LLMOutputComponent = ({ blockMatch }) => {
  const { code = '\n', language = 'text' } = parseCompleteMarkdownCodeBlock(blockMatch.output)
  const [highlighting, setHighlighting] = useState<Highlighting>()

  useEffect(() => {
    if (highlighting?.requestedLanguage === language) return

    let cancelled = false

    const highlight = async (): Promise<void> => {
      try {
        const highlighter = await getHighlighter()

        if (cancelled) return

        const loaded = await ensureLanguage(highlighter, language)

        if (!cancelled) {
          setHighlighting({
            highlighter,
            requestedLanguage: language,
            language: loaded ? language : 'text',
          })
        }
      } catch {
        // Keep plaintext after a load failure; the next streamed render can retry.
      }
    }

    void highlight()

    return () => {
      cancelled = true
    }
  }, [blockMatch, language, highlighting])

  if (highlighting?.requestedLanguage !== language) {
    return <PlaintextCodeblock blockMatch={blockMatch} />
  }

  try {
    return (
      <>
        {parseHtml(
          highlighting.highlighter.codeToHtml(code, {
            theme: 'catppuccin-latte',
            lang: highlighting.language,
          }),
        )}
      </>
    )
  } catch {
    return <PlaintextCodeblock blockMatch={blockMatch} />
  }
}
