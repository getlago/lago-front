import NiceModal from '@ebay/nice-modal-react'
import { renderHook } from '@testing-library/react'

import { CLOSE_DRAWER_PARAMS } from '../const'
import { useDrawer, useFormDrawer } from '../useDrawer'

jest.mock('../drawerStack')

// Mock NiceModal
const mockShow = jest.fn().mockResolvedValue({ reason: 'close' })
const mockHide = jest.fn()
const mockResolve = jest.fn()
let mockVisible = false

jest.mock('@ebay/nice-modal-react', () => ({
  __esModule: true,
  default: {
    register: jest.fn(),
  },
  create: jest.fn((component: unknown) => component),
  unregister: jest.fn(),
  useModal: jest.fn(() => ({
    show: mockShow,
    hide: mockHide,
    resolve: mockResolve,
    reject: jest.fn(),
    remove: jest.fn(),
    visible: mockVisible,
  })),
}))

describe('useDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN useDrawer is called', () => {
      it('THEN should register CentralizedDrawer with NiceModal', () => {
        renderHook(() => useDrawer())

        expect(NiceModal.register).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
      })

      it('THEN should return open and close functions', () => {
        const { result } = renderHook(() => useDrawer())

        expect(result.current.open).toBeInstanceOf(Function)
        expect(result.current.close).toBeInstanceOf(Function)
      })
    })
  })

  describe('GIVEN open is called', () => {
    describe('WHEN opening a drawer with props', () => {
      it('THEN should call modal.show with the provided props', () => {
        const { result } = renderHook(() => useDrawer())
        const props = { title: 'Test', children: null }

        result.current.open(props)

        expect(mockShow).toHaveBeenCalledWith(props)
      })
    })
  })

  describe('GIVEN close is called', () => {
    describe('WHEN closing the drawer', () => {
      it('THEN should resolve with CLOSE_DRAWER_PARAMS and hide', () => {
        const { result } = renderHook(() => useDrawer())

        result.current.close()

        expect(mockResolve).toHaveBeenCalledWith(CLOSE_DRAWER_PARAMS)
        expect(mockHide).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN the hook unmounts', () => {
    describe('WHEN the component is destroyed', () => {
      it('THEN should unregister from NiceModal', async () => {
        const { unregister } = jest.requireMock('@ebay/nice-modal-react')
        const { unmount } = renderHook(() => useDrawer())

        unmount()

        expect(unregister).toHaveBeenCalledWith(expect.any(String))
      })
    })
  })
})

describe('useFormDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVisible = false
  })

  describe('GIVEN the hook is initialized', () => {
    describe('WHEN useFormDrawer is called', () => {
      it('THEN should register FormDrawer with NiceModal', () => {
        renderHook(() => useFormDrawer())

        expect(NiceModal.register).toHaveBeenCalledWith(expect.any(String), expect.any(Function))
      })

      it('THEN should return open and close functions', () => {
        const { result } = renderHook(() => useFormDrawer())

        expect(result.current.open).toBeInstanceOf(Function)
        expect(result.current.close).toBeInstanceOf(Function)
      })
    })
  })

  describe('GIVEN close is called', () => {
    describe('WHEN closing the form drawer', () => {
      it('THEN should resolve with CLOSE_DRAWER_PARAMS and hide', () => {
        const { result } = renderHook(() => useFormDrawer())

        result.current.close()

        expect(mockResolve).toHaveBeenCalledWith(CLOSE_DRAWER_PARAMS)
        expect(mockHide).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN update is called', () => {
    const props = {
      title: 'Title',
      children: 'opened content',
      form: { id: 'form-id', submit: jest.fn() },
    }

    describe('WHEN the drawer is open', () => {
      it('THEN should show it with the new props merged into the opened ones', () => {
        const { result } = renderHook(() => useFormDrawer())

        result.current.open(props)
        result.current.update({ children: 'new content' })

        expect(mockShow).toHaveBeenLastCalledWith({ ...props, children: 'new content' })
      })
    })

    describe('WHEN the new props are the ones already shown', () => {
      it('THEN should not show the drawer again', () => {
        const { result } = renderHook(() => useFormDrawer())

        result.current.open(props)
        result.current.update({ children: 'new content' })
        result.current.update({ children: 'new content', title: props.title })

        expect(mockShow).toHaveBeenCalledTimes(2)
      })
    })

    describe('WHEN the drawer was closed through close', () => {
      it('THEN should leave it closed', () => {
        const { result } = renderHook(() => useFormDrawer())

        result.current.open(props)
        result.current.close()
        result.current.update({ children: 'new content' })

        expect(mockShow).toHaveBeenCalledTimes(1)
      })
    })

    describe('WHEN the drawer closed itself', () => {
      it('THEN should leave it closed', () => {
        const { result, rerender } = renderHook(() => useFormDrawer())

        result.current.open(props)
        mockVisible = true
        rerender()
        mockVisible = false
        rerender()
        result.current.update({ children: 'new content' })

        expect(mockShow).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('GIVEN the drawer opens and closes', () => {
    describe('WHEN the host re-renders', () => {
      it('THEN should keep the same update, so an effect depending on it does not loop', () => {
        const { result, rerender } = renderHook(() => useFormDrawer())
        const { update } = result.current

        result.current.open({ title: 'Title', form: { id: 'form-id', submit: jest.fn() } })
        mockVisible = true
        rerender()
        mockVisible = false
        rerender()

        expect(result.current.update).toBe(update)
      })
    })
  })
})
