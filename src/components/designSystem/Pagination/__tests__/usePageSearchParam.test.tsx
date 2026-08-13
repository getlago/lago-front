import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { usePageSearchParam } from '~/components/designSystem/Pagination/usePageSearchParam'

const mockNavigate = jest.fn()

jest.mock('~/core/router', () => ({
  useNavigate: () => mockNavigate,
}))

const Probe = ({ prefix }: { prefix?: string }) => {
  const { page, goToPage } = usePageSearchParam(prefix)

  return (
    <div>
      <span data-testid="page">{page}</span>
      <button type="button" onClick={() => goToPage(3)}>
        go3
      </button>
      <button type="button" onClick={() => goToPage(1)}>
        go1
      </button>
    </div>
  )
}

const renderProbe = (initialUrl: string, prefix?: string) =>
  render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Probe prefix={prefix} />
    </MemoryRouter>,
  )

describe('usePageSearchParam', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('GIVEN the page is read from the URL', () => {
    it.each([
      ['/customers', 1],
      ['/customers?page=1', 1],
      ['/customers?page=4', 4],
      ['/customers?page=0', 1],
      ['/customers?page=-2', 1],
      ['/customers?page=abc', 1],
    ])('THEN %s resolves to page %i', (url, expected) => {
      renderProbe(url)

      expect(screen.getByTestId('page')).toHaveTextContent(String(expected))
    })

    describe('WHEN a prefix is provided', () => {
      it('THEN reads the prefixed key and ignores the bare one', () => {
        renderProbe('/customers?page=9&draft_page=4', 'draft')

        expect(screen.getByTestId('page')).toHaveTextContent('4')
      })
    })
  })

  describe('GIVEN the user navigates', () => {
    describe('WHEN going to a page > 1', () => {
      it('THEN writes the page param and replaces history', () => {
        renderProbe('/customers')

        fireEvent.click(screen.getByText('go3'))

        expect(mockNavigate).toHaveBeenCalledWith({ search: 'page=3' }, { replace: true })
      })

      it('THEN preserves existing (filter) params', () => {
        renderProbe('/customers?in_status=active')

        fireEvent.click(screen.getByText('go3'))

        const [[{ search }]] = mockNavigate.mock.calls

        expect(search).toContain('in_status=active')
        expect(search).toContain('page=3')
      })
    })

    describe('WHEN going back to page 1', () => {
      it('THEN drops the page param to keep the URL clean', () => {
        renderProbe('/customers?page=5')

        fireEvent.click(screen.getByText('go1'))

        expect(mockNavigate).toHaveBeenCalledWith({ search: '' }, { replace: true })
      })
    })

    describe('WHEN a prefix is provided', () => {
      it('THEN writes the prefixed key', () => {
        renderProbe('/customers', 'draft')

        fireEvent.click(screen.getByText('go3'))

        expect(mockNavigate).toHaveBeenCalledWith({ search: 'draft_page=3' }, { replace: true })
      })
    })
  })
})
