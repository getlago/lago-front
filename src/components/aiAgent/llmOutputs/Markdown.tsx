/* eslint-disable react/prop-types */
import { type LLMOutputComponent } from '@llm-ui/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import './markdown.css'

export const MarkdownContent = ({ children }: { children: string }) => {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  )
}

export const Markdown: LLMOutputComponent = ({ blockMatch }) => {
  return <MarkdownContent>{blockMatch.output}</MarkdownContent>
}
