import { screen } from '@testing-library/react'

import { initializeTranslations } from '~/core/apolloClient'
import { LOGIN_ROUTE } from '~/core/router'
import { render } from '~/test-utils'

import SelfServeSignUp from '../SelfServeSignUp'
import { SIGNUP_SUBMIT_BUTTON_TEST_ID } from '../signUpTestIds'

describe('SelfServeSignUp', () => {
  beforeAll(async () => {
    await initializeTranslations()
  })

  describe('GIVEN the self-serve sign-up page is rendered', () => {
    describe('WHEN it shows the first step', () => {
      it('THEN should display the account creation title', () => {
        render(<SelfServeSignUp />)

        expect(screen.getByText('Create your account')).toBeInTheDocument()
      })

      it('THEN should link to the login page', () => {
        render(<SelfServeSignUp />)

        const loginLinks = screen
          .getAllByRole('link')
          .filter((link) => link.getAttribute('href') === LOGIN_ROUTE)

        expect(loginLinks).toHaveLength(1)
      })
    })

    describe('WHEN looking for the sign-up form', () => {
      it('THEN should not render the legacy submit button', () => {
        render(<SelfServeSignUp />)

        expect(screen.queryByTestId(SIGNUP_SUBMIT_BUTTON_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should not render any input', () => {
        const { container } = render(<SelfServeSignUp />)

        expect(container.querySelector('input')).toBeNull()
      })
    })
  })
})
