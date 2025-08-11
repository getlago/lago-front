import { LLMOutputComponent } from '@llm-ui/react'

import { CodeSnippet } from '~/components/CodeSnippet'

interface CodeBlockProps {
  blockMatch: {
    output: string
  }
}

export const CodeBlock: LLMOutputComponent<CodeBlockProps> = ({ blockMatch }) => {
  return (
    <CodeSnippet
      canCopy
      displayHead={false}
      variant="minimal"
      code={blockMatch?.output}
      language="bash"
    />
  )
}
