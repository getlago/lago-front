import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import {
  MANAGED_IN_PRODUCTION_ALERT_TEST_ID,
  ManagedInProductionAlert,
} from '../ManagedInProductionAlert'

const mockNavigate = jest.fn()
const mockUseSandbox = jest.fn()

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/hooks/useSandbox', () => ({
  useSandbox: () => mockUseSandbox(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const PRODUCTION_PATH = '/acme/settings/taxes'

describe('ManagedInProductionAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the organization is not a sandbox', () => {
    it('THEN should not render the alert', () => {
      mockUseSandbox.mockReturnValue({ isSandbox: false, productionPath: null })

      render(<ManagedInProductionAlert />)

      expect(screen.queryByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the organization is a sandbox', () => {
    describe('WHEN a production path is available', () => {
      beforeEach(() => {
        mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: PRODUCTION_PATH })
      })

      it('THEN should render the alert with the switch button', () => {
        render(<ManagedInProductionAlert />)

        const alert = screen.getByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)

        expect(within(alert).getByRole('button')).toBeInTheDocument()
      })

      it('THEN should navigate to the production path without prepending the slug on click', async () => {
        const user = userEvent.setup()

        render(<ManagedInProductionAlert />)

        await user.click(
          within(screen.getByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)).getByRole('button'),
        )

        expect(mockNavigate).toHaveBeenCalledWith(PRODUCTION_PATH, { skipSlugPrepend: true })
      })
    })

    describe('WHEN no production path is available', () => {
      it('THEN should render the alert without the switch button', () => {
        mockUseSandbox.mockReturnValue({ isSandbox: true, productionPath: null })

        render(<ManagedInProductionAlert />)

        const alert = screen.getByTestId(MANAGED_IN_PRODUCTION_ALERT_TEST_ID)

        expect(within(alert).queryByRole('button')).not.toBeInTheDocument()
      })
    })
  })
})
