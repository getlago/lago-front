import type { CodeToHtmlOptions } from '@llm-ui/code'
import { loadHighlighter, useCodeBlockToHtml } from '@llm-ui/code'
import { type LLMOutputComponent } from '@llm-ui/react'
import parseHtml from 'html-react-parser'
import { createHighlighter } from 'shiki'

const highlighter = loadHighlighter(
  createHighlighter({
    langs: ['html', 'css', 'js'],
    themes: ['none'],
  }),
)

const codeToHtmlOptions: CodeToHtmlOptions = {
  theme: 'none',
}

// Customize this component with your own styling
export const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
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
