import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { AutoRefreshSelector } from '../AutoRefreshSelector'

describe('AutoRefreshSelector', () => {
  describe('GIVEN an interval is selected', () => {
    it('THEN shows the selected interval on the opener', () => {
      render(<AutoRefreshSelector value={5} onChange={jest.fn()} />)

      expect(screen.getByRole('button', { name: '5s' })).toBeInTheDocument()
    })

    it('THEN lists every interval and selects the picked one', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()

      render(<AutoRefreshSelector value={1} onChange={onChange} />)

      await user.click(screen.getByRole('button', { name: '1s' }))

      expect(screen.getAllByRole('button', { name: '1s' })).toHaveLength(2)
      expect(screen.getByRole('button', { name: '5s' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '10s' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '10s' }))

      expect(onChange).toHaveBeenCalledWith(10)
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: '10s' })).not.toBeInTheDocument(),
      )
    })
  })
})
