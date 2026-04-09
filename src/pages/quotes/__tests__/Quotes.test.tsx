import { screen } from '@testing-library/react'

import { MainHeaderConfig } from '~/components/MainHeader/types'
import { render } from '~/test-utils'

import Quotes from '../Quotes'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => <div data-test="active-tab-content-mock">Tab Content</div>,
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/quotes/quotes' }),
}))

describe('Quotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should configure MainHeader with entity viewName', () => {
        render(<Quotes />)

        expect(capturedConfig?.entity?.viewName).toBe('text_17757391860814p20fr87x9g')
      })

      it('THEN should configure MainHeader with two tabs', () => {
        render(<Quotes />)

        expect(capturedConfig?.tabs).toHaveLength(2)
      })

      it('THEN should have a Quotes tab as the first tab', () => {
        render(<Quotes />)

        expect(capturedConfig?.tabs?.[0].title).toBe('text_17757391860814p20fr87x9g')
        expect(capturedConfig?.tabs?.[0].link).toBe('/quotes/quotes')
      })

      it('THEN should have an Order forms tab as the second tab', () => {
        render(<Quotes />)

        expect(capturedConfig?.tabs?.[1].title).toBe('text_17757461968258p4ij8g74zp')
        expect(capturedConfig?.tabs?.[1].link).toBe('/quotes/order-forms')
      })

      it('THEN should render the active tab content', () => {
        render(<Quotes />)

        expect(screen.getByTestId('active-tab-content-mock')).toBeInTheDocument()
      })
    })
  })
})
