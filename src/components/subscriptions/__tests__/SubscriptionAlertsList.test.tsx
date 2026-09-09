import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { SubscriptionAlertsList } from '../SubscriptionAlertsList'

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: false }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: () => false }),
}))

jest.mock('~/components/subscriptions/alerts/DeleteAlertDialog', () => ({
  useDeleteAlertDialog: () => ({ openDeleteAlertDialog: jest.fn() }),
}))

describe('SubscriptionAlertsList', () => {
  describe('GIVEN a non-premium organization', () => {
    describe('WHEN the alerts list offers access to the feature', () => {
      it('THEN should preserve the external mailto href without an organization slug', async () => {
        render(<SubscriptionAlertsList />, { useParams: { organizationSlug: 'acme' } })

        const link = await screen.findByRole('link', { name: 'Contact us' })

        expect(link).toHaveAttribute(
          'href',
          'mailto:hello@getlago.com?subject=Request access to Alerts&body=Hello, I would like to access your Alerts premium feature.%0D%0APlease let me know if you need more info!',
        )
        expect(link).toHaveAttribute('target', '_blank')
      })
    })
  })
})
