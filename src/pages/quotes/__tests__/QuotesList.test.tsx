import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import QuotesList from '../QuotesList'

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})

globalThis.IntersectionObserver = mockIntersectionObserver

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: (date: string) => ({
      date: new Date(date).toLocaleDateString('en-US'),
    }),
  }),
}))

describe('QuotesList', () => {
  describe('GIVEN the component is rendered', () => {
    describe('WHEN fixtures are loaded', () => {
      it('THEN should render the quotes table with rows', () => {
        render(<QuotesList />)

        expect(screen.getByTestId('table-row-0')).toBeInTheDocument()
      })

      it('THEN should render only the latest version per quote number', () => {
        render(<QuotesList />)

        const rows = screen.getAllByTestId(/^table-row-/)

        // 5 fixtures but QT-2026-0042 has v1 and v2, so only v2 is shown
        expect(rows).toHaveLength(4)
      })

      it('THEN should display quote numbers', () => {
        render(<QuotesList />)

        expect(screen.getAllByText('QT-2026-0042').length).toBeGreaterThan(0)
        expect(screen.getByText('QT-2026-0038')).toBeInTheDocument()
        expect(screen.getByText('QT-2026-0015')).toBeInTheDocument()
        expect(screen.getByText('QT-2026-0099')).toBeInTheDocument()
      })

      it('THEN should display customer names', () => {
        render(<QuotesList />)

        expect(screen.getAllByText('Acme Corp').length).toBeGreaterThan(0)
        expect(screen.getByText('Globex Inc')).toBeInTheDocument()
        expect(screen.getByText('Wayne Enterprises')).toBeInTheDocument()
      })

      it('THEN should display status badges', () => {
        render(<QuotesList />)

        const statusBadges = screen.getAllByTestId('status')

        expect(statusBadges.length).toBeGreaterThan(0)
      })

      it('THEN should display the latest version numbers', () => {
        render(<QuotesList />)

        // QT-2026-0042 v1 is filtered out, v2 is shown
        expect(screen.getAllByText('v2').length).toBeGreaterThan(0)
        // v1 still appears for QT-2026-0015 and QT-2026-0099
        expect(screen.getAllByText('v1').length).toBeGreaterThan(0)
      })
    })
  })
})
