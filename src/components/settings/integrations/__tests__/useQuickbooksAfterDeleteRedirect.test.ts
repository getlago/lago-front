import { renderHook } from '@testing-library/react'

import { useQuickbooksAfterDeleteRedirect } from '../useQuickbooksAfterDeleteRedirect'

const mockNavigate = jest.fn()

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

describe('useQuickbooksAfterDeleteRedirect', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('THEN goes back to the QuickBooks connections while another one is left', () => {
    renderHook(() => useQuickbooksAfterDeleteRedirect(2)).result.current()

    expect(mockNavigate).toHaveBeenCalledWith('/settings/integrations/lago/quickbooks')
  })

  it('THEN goes back to the integrations list after the last connection', () => {
    renderHook(() => useQuickbooksAfterDeleteRedirect(1)).result.current()

    expect(mockNavigate).toHaveBeenCalledWith('/settings/integrations/lago')
  })
})
