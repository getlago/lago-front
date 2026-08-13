import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import InvitationInit from '../InvitationInit'

const mockNavigate = jest.fn()

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

describe('InvitationInit', () => {
  it('should forward the invitation token to the form route', async () => {
    render(
      <MemoryRouter initialEntries={['/invitation/test-token']}>
        <Routes>
          <Route path="/invitation/:token" element={<InvitationInit />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/invitation/test-token/form', { replace: true })
    })
  })
})
