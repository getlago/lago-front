import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import Plans from '../Plans'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
    locale: 'en',
  }),
}))

describe('Plans placeholder page', () => {
  it('renders the plans view name', () => {
    render(<Plans />)

    expect(screen.getByText('text_62442e40cea25600b0b6d85a')).toBeInTheDocument()
  })
})
