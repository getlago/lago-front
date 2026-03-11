import { renderHook } from '@testing-library/react'
import React, { FC, PropsWithChildren } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { MainHeaderProvider, useMainHeaderWriter } from '../MainHeaderContext'
import { MainHeaderConfig, MainHeaderTab } from '../types'
import { useMainHeaderTabContent } from '../useMainHeaderTabContent'

// We need a real router for pathname matching, so don't use the global mock
jest.unmock('react-router-dom')

const createWrapper = (initialPath: string): FC<PropsWithChildren> => {
  const Wrapper: FC<PropsWithChildren> = ({ children }) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <MainHeaderProvider>{children}</MainHeaderProvider>
    </MemoryRouter>
  )

  Wrapper.displayName = 'TestWrapper'

  return Wrapper
}

const tabOverview: MainHeaderTab = {
  title: 'Overview',
  link: '/customers/1/overview',
  content: React.createElement('div', null, 'Overview content'),
}

const tabInvoices: MainHeaderTab = {
  title: 'Invoices',
  link: '/customers/1/invoices',
  content: React.createElement('div', null, 'Invoices content'),
}

describe('useMainHeaderTabContent', () => {
  describe('GIVEN no config is set', () => {
    describe('WHEN the hook is called', () => {
      it('THEN should return null', () => {
        const { result } = renderHook(() => useMainHeaderTabContent(), {
          wrapper: createWrapper('/'),
        })

        expect(result.current).toBeNull()
      })
    })
  })

  describe('GIVEN a config with no tabs', () => {
    describe('WHEN the hook is called', () => {
      it('THEN should return null', () => {
        const { result } = renderHook(
          () => {
            const writer = useMainHeaderWriter()
            const content = useMainHeaderTabContent()

            React.useEffect(() => {
              writer.setConfig({ title: 'No tabs' })
            }, [writer])

            return content
          },
          { wrapper: createWrapper('/') },
        )

        expect(result.current).toBeNull()
      })
    })
  })

  describe('GIVEN a config with tabs', () => {
    const config: MainHeaderConfig = {
      title: 'Customer',
      tabs: [tabOverview, tabInvoices],
    }

    describe('WHEN the pathname matches a tab link', () => {
      it('THEN should return the matching tab content', () => {
        const { result } = renderHook(
          () => {
            const writer = useMainHeaderWriter()
            const content = useMainHeaderTabContent()

            React.useEffect(() => {
              writer.setConfig(config)
            }, [writer])

            return content
          },
          { wrapper: createWrapper('/customers/1/invoices') },
        )

        expect(result.current).toEqual(React.createElement('div', null, 'Invoices content'))
      })
    })

    describe('WHEN the pathname does not match any tab', () => {
      it('THEN should return null', () => {
        const { result } = renderHook(
          () => {
            const writer = useMainHeaderWriter()
            const content = useMainHeaderTabContent()

            React.useEffect(() => {
              writer.setConfig(config)
            }, [writer])

            return content
          },
          { wrapper: createWrapper('/unmatched-path') },
        )

        expect(result.current).toBeNull()
      })
    })
  })
})
