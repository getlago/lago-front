import { render, screen } from '@testing-library/react'

import { AllTheProviders } from '~/test-utils'

import { ContractRateCardsSection } from '../ContractRateCardsSection'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

describe('ContractRateCardsSection', () => {
  it('renders the designed description and the approved Maneki empty state copy', () => {
    render(<ContractRateCardsSection />, { wrapper: AllTheProviders })

    expect(screen.getByText('text_1789030049529jp760bke0x8')).toBeInTheDocument()
    expect(screen.getByText('text_1789030049529u2gzzho6x8x')).toBeInTheDocument()
    expect(screen.getByText('text_1789723302114au3ml0nf077')).toBeInTheDocument()
  })
})
