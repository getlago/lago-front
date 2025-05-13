import { ReactNode, useEffect, useRef } from 'react'

interface InfiniteScrollProps {
  onBottom: () => void
  children: ReactNode
  mode?: 'viewport' | 'element'
}

export const InfiniteScroll = ({ children, onBottom, mode = 'viewport' }: InfiniteScrollProps) => {
  const hiddenBottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // isIntersecting is true when element and viewport are overlapping
        if (mode === 'viewport' && entries[0].isIntersecting === true) {
          onBottom?.()
        }

        // intersectionRatio is 1 when element is fully visible in viewport
        if (mode === 'element' && entries[0].intersectionRatio === 1) {
          onBottom?.()
        }
      },
      { threshold: [0] },
    )

    let element: HTMLDivElement

    if (hiddenBottom.current) {
      observer.observe(hiddenBottom.current)
      element = hiddenBottom.current
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [hiddenBottom, onBottom])

  return (
    <>
      {children}
      <div ref={hiddenBottom} />
    </>
  )
}
