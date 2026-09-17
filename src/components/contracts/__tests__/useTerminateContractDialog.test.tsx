import { act, renderHook } from '@testing-library/react'

import { useTerminateContractDialog } from '../useTerminateContractDialog'

const mockDialogOpen = jest.fn()

jest.mock('~/components/dialogs/CentralizedDialog', () => ({
  useCentralizedDialog: () => ({ open: mockDialogOpen }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('useTerminateContractDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens a disabled danger confirmation until contract termination is supported', () => {
    const { result } = renderHook(() => useTerminateContractDialog())

    act(() => {
      result.current.openTerminateContractDialog({ name: 'Enterprise agreement' })
    })

    expect(mockDialogOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'text_1789636691484vy3pf1f7c2r',
        actionText: 'text_17896366914848hled21jz6q',
        colorVariant: 'danger',
        disableOnContinue: true,
        cancelOrCloseText: 'cancel',
      }),
    )
  })
})
