import { useEffect, useRef } from 'react'

// Skips the first render - the token's initial value must not also trigger a fetch, only a
// later change to it (e.g. a sibling's "Refresh" button bumping a shared counter).
export const useRefetchOnTokenChange = (token: number | undefined, refetch: () => void): void => {
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])
}
