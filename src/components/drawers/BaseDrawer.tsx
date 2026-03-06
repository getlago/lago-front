import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { tw } from '~/styles/utils'

import {
  DRAWER_MAX_WIDTH,
  DRAWER_PUSH_BACK_OFFSET,
  DRAWER_PUSH_BACK_SCALE,
  DRAWER_TRANSITION_DURATION,
} from './const'
import { useDrawerStack } from './useDrawerStack'

type DrawerState = 'unmounted' | 'mounting' | 'open' | 'closing'

export type BaseDrawerProps = {
  isOpen: boolean
  title: ReactNode
  children: ReactNode | ((args: { closeDrawer: () => void }) => ReactNode)
  onClose: () => void
  onExited?: () => void
  className?: string
  stickyBottomBar?: ReactNode | ((args: { closeDrawer: () => void }) => ReactNode)
  stickyBottomBarClassName?: string
  withPadding?: boolean
  fullContentHeight?: boolean
}

export const BaseDrawer = ({
  isOpen,
  title,
  children,
  onClose,
  onExited,
  className,
  stickyBottomBar,
  stickyBottomBarClassName,
  withPadding = true,
  fullContentHeight,
}: BaseDrawerProps) => {
  const [state, setState] = useState<DrawerState>('unmounted')
  const paperRef = useRef<HTMLDivElement>(null)
  const exitedRef = useRef(false)

  const isInStack = state === 'mounting' || state === 'open'
  const { depthFromTop, isTopmost, isBottommost, zIndex } = useDrawerStack(isInStack)

  const handleExit = useCallback(() => {
    if (exitedRef.current) return
    exitedRef.current = true
    setState('unmounted')
    onExited?.()
  }, [onExited])

  // State machine: isOpen drives transitions
  useEffect(() => {
    if (isOpen) {
      if (state === 'unmounted') {
        exitedRef.current = false
        setState('mounting')
      }
    } else {
      if (state === 'open') {
        setState('closing')
      } else if (state === 'mounting') {
        handleExit()
      }
    }
  }, [isOpen, state, handleExit])

  // Trigger enter animation after mount (double-rAF for reliable CSS transition)
  useEffect(() => {
    if (state !== 'mounting') return

    let raf2: number

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setState('open')
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [state])

  // Fallback timeout in case transitionEnd doesn't fire
  useEffect(() => {
    if (state !== 'closing') return

    const timeout = setTimeout(handleExit, DRAWER_TRANSITION_DURATION + 100)

    return () => clearTimeout(timeout)
  }, [state, handleExit])

  // Handle CSS transition end for exit animation
  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target === paperRef.current && e.propertyName === 'transform' && state === 'closing') {
        handleExit()
      }
    },
    [state, handleExit],
  )

  // ESC key closes topmost drawer only
  useEffect(() => {
    if (state !== 'open' || !isTopmost) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state, isTopmost, onClose])

  if (state === 'unmounted') return null

  // Push-back transforms for stacked drawers
  const isPushedBack = state === 'open' && !isTopmost
  const scale = isPushedBack ? Math.max(0.92, 1 - depthFromTop * (1 - DRAWER_PUSH_BACK_SCALE)) : 1
  const offset = isPushedBack ? depthFromTop * DRAWER_PUSH_BACK_OFFSET : 0

  let paperTransform: string

  if (state === 'open') {
    paperTransform = isPushedBack ? `scale(${scale}) translateX(-${offset}px)` : 'translateX(0)'
  } else {
    paperTransform = 'translateX(100%)'
  }

  const easing = 'cubic-bezier(0.32, 0.72, 0, 1)'

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }} role="presentation">
      {/* Backdrop — only the first drawer dims the page */}
      <div
        className={tw(
          'absolute inset-0 transition-opacity',
          isBottommost ? 'bg-grey-700/40' : 'bg-transparent',
          state === 'open' ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionDuration: `${DRAWER_TRANSITION_DURATION}ms` }}
        onClick={isTopmost ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Paper */}
      <div
        ref={paperRef}
        role="dialog"
        aria-modal="true"
        className={tw(
          'absolute bottom-0 right-0 top-0 flex w-full flex-col overflow-hidden rounded-l-xl bg-white shadow-xl',
          'md:w-[calc(100vw-48px)]',
          !!stickyBottomBar && 'grid grid-rows-[72px_1fr_80px]',
          className,
        )}
        style={{
          maxWidth: DRAWER_MAX_WIDTH,
          transform: paperTransform,
          transformOrigin: 'right center',
          transition: `transform ${DRAWER_TRANSITION_DURATION}ms ${easing}, border-radius ${DRAWER_TRANSITION_DURATION}ms ${easing}`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Dimming overlay for pushed-back drawers */}
        {isPushedBack && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-xl bg-grey-700/20" />
        )}

        {/* Header */}
        <div className="sticky top-0 z-20 flex h-nav min-h-nav items-center justify-between bg-white px-4 py-0 shadow-b md:px-12">
          {typeof title === 'string' ? (
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {title}
            </Typography>
          ) : (
            title
          )}
          <Button icon="close" variant="quaternary" onClick={onClose} />
        </div>

        {/* Content */}
        <div
          className={tw(
            'overflow-auto',
            fullContentHeight && 'h-full',
            withPadding && 'px-4 pb-20 pt-12 md:px-12',
          )}
        >
          {typeof children === 'function' ? children({ closeDrawer: onClose }) : children}
        </div>

        {/* Sticky bottom bar */}
        {!!stickyBottomBar && (
          <div
            className={tw(
              'sticky bottom-0 box-border bg-white p-4 text-right shadow-t md:px-12 md:py-4',
              stickyBottomBarClassName,
            )}
          >
            {typeof stickyBottomBar === 'function'
              ? stickyBottomBar({ closeDrawer: onClose })
              : stickyBottomBar}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
