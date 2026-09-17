import { ReactNode, useEffect, useRef } from 'react'

import { BASE_DRAWER_CONTENT_ATTR } from '~/components/drawers/const'
import {
  CreateMoreResetSignal,
  useCreateMoreResetIteration,
} from '~/components/drawers/createMore/useCreateMore'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { tw } from '~/styles/utils'

type CreateMoreResetBoundaryProps = {
  /** The signal handed down by `useCreateMore`; absent in edit-only drawers */
  resetSignal?: CreateMoreResetSignal
  children: ReactNode
}

// Wraps a drawer body so a "create more" save remounts it with a fresh form,
// scrolls the drawer back to the top and re-focuses the first input.
export const CreateMoreResetBoundary = ({
  resetSignal,
  children,
}: CreateMoreResetBoundaryProps): JSX.Element => {
  const rootRef = useRef<HTMLDivElement>(null)
  const resetIteration = useCreateMoreResetIteration(resetSignal)

  useEffect(() => {
    if (resetIteration === 0) return

    rootRef.current
      ?.closest<HTMLElement>(`[${BASE_DRAWER_CONTENT_ATTR}]`)
      ?.scrollTo({ top: 0, behavior: 'smooth' })
    focusFirstInput(rootRef.current)
  }, [resetIteration])

  return (
    <div ref={rootRef}>
      <div
        key={resetIteration}
        className={tw('flex flex-col gap-12', resetIteration > 0 && 'animate-fade-in-right')}
      >
        {children}
      </div>
    </div>
  )
}
