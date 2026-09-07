import { type LLMOutputComponent } from '@llm-ui/react'
import { ErrorBoundary } from '@sentry/react'
import { lazy, LazyExoticComponent, Suspense, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlaintextCodeblock } from './PlaintextCodeblock'

const createLazyCodeblock = (): LazyExoticComponent<LLMOutputComponent> =>
  lazy(() => import('./Codeblock').then(({ Codeblock }) => ({ default: Codeblock })))

export const LazyCodeblock: LLMOutputComponent = (props) => {
  const [Codeblock, setCodeblock] = useState(createLazyCodeblock)
  const { translate } = useInternationalization()

  return (
    <ErrorBoundary
      onReset={() => setCodeblock(createLazyCodeblock)}
      fallback={({ resetError }) => (
        <>
          <PlaintextCodeblock {...props} />
          <Button variant="quaternary" size="small" onClick={resetError}>
            {translate('text_63e27c56dfe64b846474efa3')}
          </Button>
        </>
      )}
    >
      <Suspense fallback={<PlaintextCodeblock {...props} />}>
        <Codeblock {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
