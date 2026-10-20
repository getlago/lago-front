import { BlockMatch } from '@llm-ui/react'

export const createBlockMatch = (output: string): BlockMatch => ({
  output,
  outputRaw: output,
  llmOutput: output,
  startIndex: 0,
  endIndex: output.length,
  visibleText: output,
  isVisible: true,
  isComplete: true,
  priority: 0,
  block: {
    component: () => null,
    lookBack: () => ({ output, visibleText: output }),
  },
})
