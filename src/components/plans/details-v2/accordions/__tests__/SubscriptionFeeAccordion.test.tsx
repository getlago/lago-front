import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { planDetailsV2Fixture } from '../../__tests__/fixtures'
import { SubscriptionFeeAccordion } from '../SubscriptionFeeAccordion'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('SubscriptionFeeAccordion', () => {
  it('renders the shared SubscriptionFeeInfo body', () => {
    render(<SubscriptionFeeAccordion plan={planDetailsV2Fixture} />)

    expect(screen.getByText('text_624453d52e945301380e49b6')).toBeInTheDocument()
    expect(screen.getByText('text_65201b8216455901fe273dd9')).toBeInTheDocument()
  })
})
