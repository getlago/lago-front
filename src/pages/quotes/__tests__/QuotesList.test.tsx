import { screen } from '@testing-library/react'

import { GENERIC_PLACEHOLDER_TEST_ID } from '~/components/designSystem/GenericPlaceholder'
import { MainHeaderConfig } from '~/components/MainHeader/types'
import { render } from '~/test-utils'

import QuotesList from '../QuotesList'

let capturedConfig: MainHeaderConfig | null = null

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: Object.assign(() => null, {
    Configure: (props: MainHeaderConfig) => {
      capturedConfig = props
      return null
    },
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('QuotesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedConfig = null
  })

  describe('GIVEN the page is rendered', () => {
    describe('WHEN in default state', () => {
      it('THEN should render the empty state placeholder', () => {
        render(<QuotesList />)

        expect(screen.getByTestId(GENERIC_PLACEHOLDER_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should configure MainHeader with entity viewName', () => {
        render(<QuotesList />)

        expect(capturedConfig?.entity?.viewName).toBe('text_17757391860814p20fr87x9g')
      })

      it('THEN should display the correct title in the placeholder', () => {
        render(<QuotesList />)

        expect(screen.getByTestId('generic-placeholder-title')).toHaveTextContent(
          'text_17757391860814p20fr87x9g',
        )
      })

      it('THEN should display the correct subtitle in the placeholder', () => {
        render(<QuotesList />)

        expect(screen.getByTestId('generic-placeholder-subtitle')).toHaveTextContent(
          'text_177573918608169w9wthupaz',
        )
      })
    })
  })
})
