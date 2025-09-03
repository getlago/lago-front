import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code'
import { markdownLookBack } from '@llm-ui/markdown'
import { throttleBasic, useLLMOutput } from '@llm-ui/react'

import { CodeBlock } from './CodeBlock'
import { MarkdownComponent } from './Markdown'

export const useCustomLLMOutput = (output: string, isStreamFinished: boolean) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished,
    throttle: throttleBasic({
      windowLookBackMs: 1000,
    }),
  })

  return blockMatches
}
