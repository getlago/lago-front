import { codeBlockLookBack, findCompleteCodeBlock, findPartialCodeBlock } from '@llm-ui/code'
import { markdownLookBack } from '@llm-ui/markdown'
import { throttleBasic, useLLMOutput } from '@llm-ui/react'

import { Codeblock } from './Codeblock'
import { Markdown } from './Markdown'

export const useCustomLLMOutput = (output: string, isStreamFinished: boolean) => {
  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    fallbackBlock: {
      component: Markdown,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: Codeblock,
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
