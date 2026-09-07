import { act, renderHook } from '@testing-library/react'
import { ImperativePanelHandle } from 'react-resizable-panels'

import { usePanel } from '~/hooks/ui/usePanel'

const mockCaptureException = jest.fn()

jest.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}))

const SIZE = {
  open: 40,
  closed: 0,
  minResizableHeight: 20,
  maxResizableHeight: 88,
  fullscreen: 100,
}

const renderPanel = () => renderHook(() => usePanel({ size: SIZE }))

let frames: FrameRequestCallback[] = []

const flushFrames = () => {
  const pending = frames

  frames = []
  act(() => {
    pending.forEach((frame) => frame(0))
  })
}

const attachHandle = (
  panelRef: { current: ImperativePanelHandle | null },
  resize: jest.Mock,
): void => {
  panelRef.current = { resize } as unknown as ImperativePanelHandle
}

describe('usePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    frames = []
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((frame) => {
      frames.push(frame)

      return 0
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GIVEN a panel that is not yet part of the group committed layout', () => {
    describe('WHEN openPanel is called', () => {
      // Regression: `Panel size not found for panel "devtools-panel"` reached the devtools
      // error boundary, so a copied inspector link showed an error toast instead of the panel.
      it('THEN it should not let the library assert escape', () => {
        const resize = jest.fn(() => {
          throw new Error('Panel size not found for panel "devtools-panel"')
        })
        const { result } = renderPanel()

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel()
        })

        expect(() => flushFrames()).not.toThrow()
      })

      it('THEN it should still mark the panel as open', () => {
        const resize = jest.fn(() => {
          throw new Error('Panel size not found for panel "devtools-panel"')
        })
        const { result } = renderPanel()

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel()
        })
        flushFrames()

        expect(result.current.panelOpen).toBe(true)
      })

      it('THEN it should report the swallowed error to Sentry', () => {
        const error = new Error('Panel size not found for panel "devtools-panel"')
        const resize = jest.fn(() => {
          throw error
        })
        const { result } = renderPanel()

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel()
        })
        flushFrames()

        expect(mockCaptureException).toHaveBeenCalledWith(error)
      })
    })
  })

  describe('GIVEN a panel mounted by the very state update that opens it', () => {
    describe('WHEN openPanel is called', () => {
      it('THEN it should defer the resize instead of running it during the commit', () => {
        const resize = jest.fn()
        const { result } = renderPanel()

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel()
        })

        expect(resize).not.toHaveBeenCalled()

        flushFrames()

        expect(resize).toHaveBeenCalledWith(SIZE.open)
      })
    })
  })

  describe('GIVEN no panel is mounted', () => {
    describe('WHEN openPanel is called', () => {
      it('THEN it should open without touching any panel handle', () => {
        const { result } = renderPanel()

        act(() => {
          result.current.openPanel()
        })
        flushFrames()

        expect(result.current.panelOpen).toBe(true)
        expect(mockCaptureException).not.toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN openPanel is called with a panel identifier', () => {
    describe('WHEN the panel opens', () => {
      it('THEN it should expose that identifier as the current panel', () => {
        const { result } = renderHook(() => usePanel<'inspector'>({ size: SIZE }))

        act(() => {
          result.current.openPanel('inspector')
        })
        flushFrames()

        expect(result.current.currentPanelOpened).toBe('inspector')
      })
    })
  })

  describe('GIVEN an open panel', () => {
    describe('WHEN closePanel is called', () => {
      it('THEN it should resize to the closed size and reset the panel state', () => {
        const resize = jest.fn()
        const { result } = renderHook(() => usePanel<'inspector'>({ size: SIZE }))

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel('inspector')
        })
        flushFrames()

        act(() => {
          result.current.closePanel()
        })

        expect(resize).toHaveBeenLastCalledWith(SIZE.closed)
        expect(result.current.panelOpen).toBe(false)
        expect(result.current.currentPanelOpened).toBeUndefined()
        expect(result.current.isFullscreen).toBe(false)
      })
    })

    describe('WHEN togglePanel is called with the panel already opened', () => {
      it('THEN it should close the panel', () => {
        const { result } = renderHook(() => usePanel<'inspector'>({ size: SIZE }))

        act(() => {
          result.current.openPanel('inspector')
        })
        flushFrames()

        act(() => {
          result.current.togglePanel('inspector')
        })

        expect(result.current.panelOpen).toBe(false)
      })
    })

    describe('WHEN expandPanel is called', () => {
      it('THEN it should go fullscreen and resize to the fullscreen size', () => {
        const resize = jest.fn()
        const { result } = renderPanel()

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel()
        })
        flushFrames()

        act(() => {
          result.current.expandPanel()
        })
        flushFrames()

        expect(result.current.isFullscreen).toBe(true)
        expect(resize).toHaveBeenLastCalledWith(SIZE.fullscreen)
      })

      it('THEN it should return to the open size when called again', () => {
        const resize = jest.fn()
        const { result } = renderPanel()

        attachHandle(result.current.panelRef, resize)

        act(() => {
          result.current.openPanel()
        })
        flushFrames()

        act(() => {
          result.current.expandPanel()
        })
        flushFrames()

        act(() => {
          result.current.expandPanel()
        })
        flushFrames()

        expect(result.current.isFullscreen).toBe(false)
        expect(resize).toHaveBeenLastCalledWith(SIZE.open)
      })
    })
  })

  describe('GIVEN a fullscreen panel', () => {
    describe('WHEN resizePanel reports a size below the fullscreen one', () => {
      it('THEN it should leave fullscreen', () => {
        const { result } = renderPanel()

        act(() => {
          result.current.expandPanel()
        })
        flushFrames()

        act(() => {
          result.current.resizePanel(SIZE.open)
        })

        expect(result.current.isFullscreen).toBe(false)
      })
    })

    describe('WHEN resizePanel reports the fullscreen size', () => {
      it('THEN it should stay fullscreen', () => {
        const { result } = renderPanel()

        act(() => {
          result.current.resizePanel(SIZE.fullscreen)
        })

        expect(result.current.isFullscreen).toBe(true)
      })
    })
  })
})
