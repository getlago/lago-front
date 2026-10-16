/* eslint-disable react/prop-types */
import { parseCompleteMarkdownCodeBlock } from '@llm-ui/code'
import { type LLMOutputComponent } from '@llm-ui/react'

import './codeblock.css'

export const PlaintextCodeblock: LLMOutputComponent = ({ blockMatch }) => {
  const { code = '\n' } = parseCompleteMarkdownCodeBlock(blockMatch.output)

  return (
    <pre className="shiki">
      <code>{code}</code>
    </pre>
  )
}
