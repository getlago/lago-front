import { act, renderHook } from '@testing-library/react'

import { useQuotePlanSettingsDrawer } from '../useQuotePlanSettingsDrawer'

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockPlanForm = {} as Parameters<typeof useQuotePlanSettingsDrawer>[0]

describe('useQuotePlanSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the hook is rendered', () => {
    describe('WHEN initialized', () => {
      it('THEN should return an openDrawer function', () => {
        const { result } = renderHook(() => useQuotePlanSettingsDrawer(mockPlanForm))

        expect(result.current).toHaveProperty('openDrawer')
        expect(typeof result.current.openDrawer).toBe('function')
      })
    })
  })

  describe('GIVEN the drawer is closed', () => {
    describe('WHEN openDrawer is called', () => {
      it('THEN should open the drawer with title, children, and actions', () => {
        const { result } = renderHook(() => useQuotePlanSettingsDrawer(mockPlanForm))

        act(() => {
          result.current.openDrawer()
        })

        expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
        expect(mockDrawerOpen).toHaveBeenCalledWith(
          expect.objectContaining({
            title: expect.any(String),
            children: expect.anything(),
            actions: expect.anything(),
          }),
        )
      })
    })
  })
})
