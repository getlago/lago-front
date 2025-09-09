/* eslint-disable react/prop-types */
import type { CodeToHtmlOptions } from '@llm-ui/code'
import { loadHighlighter, useCodeBlockToHtml } from '@llm-ui/code'
import { type LLMOutputComponent } from '@llm-ui/react'
import parseHtml from 'html-react-parser'
import { bundledLanguages, createHighlighter } from 'shiki/bundle/web'
import catppuccinLatte from 'shiki/themes/catppuccin-latte.mjs'

import './codeblock.css'

const highlighter = loadHighlighter(
  createHighlighter({
    langs: Object.keys(bundledLanguages),
    themes: [catppuccinLatte],
  }),
)

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: 'catppuccin-latte',
}

export const Codeblock: LLMOutputComponent = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  })

  if (!html) {
    // fallback to <pre> if Shiki is not loaded yet
    return (
      <pre className="shiki">
        <code>{code}</code>
      </pre>
    )
  }

  return <>{parseHtml(html)}</>
}
