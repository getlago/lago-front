import { ReactNode, useEffect, useRef } from 'react'

interface InfiniteScrollProps {
  onBottom: () => void
  children: ReactNode
}

export const InfiniteScroll = ({ children, onBottom }: InfiniteScrollProps) => {
  const hiddenBottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting === true) {
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
    <div className="overflow-y-auto">
      {children}
      <div className="h-px" ref={hiddenBottom} />
    </div>
  )
}
