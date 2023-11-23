import React, { ReactNode, useEffect, useRef } from 'react'

interface InfiniteScrollProps {
  onBottom: () => void
  children: ReactNode
}

export const InfiniteScroll = ({ children, onBottom }: InfiniteScrollProps) => {
  const hiddenBottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // isIntersecting is true when element and viewport are overlapping
        if (entries[0].isIntersecting === true) {
          onBottom && onBottom()
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
