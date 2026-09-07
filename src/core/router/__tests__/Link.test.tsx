import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { BrowserRouter } from 'react-router-dom'

import { Link } from '../Link'

const mockUseParams = jest.requireMock('react-router-dom').useParams as jest.Mock

describe('Link', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseParams.mockReturnValue({ organizationSlug: 'acme' })
  })

  const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

  describe('GIVEN the user is inside an organization context', () => {
    describe('WHEN rendering with an absolute string "to" prop', () => {
      it('THEN should render a link with the slug-prefixed href', () => {
        renderWithRouter(<Link to="/customers">Customers</Link>)

        const link = screen.getByText('Customers')

        expect(link).toHaveAttribute('href', '/acme/customers')
      })
    })

    describe('WHEN rendering with an already-prefixed "to" prop', () => {
      it('THEN should not double-prepend the slug', () => {
        renderWithRouter(<Link to="/acme/customers">Customers</Link>)

        const link = screen.getByText('Customers')

        expect(link).toHaveAttribute('href', '/acme/customers')
      })
    })

    describe('WHEN rendering with the root path "/"', () => {
      it('THEN should not prepend the slug', () => {
        renderWithRouter(<Link to="/">Home</Link>)

        const link = screen.getByText('Home')

        expect(link).toHaveAttribute('href', '/')
      })
    })

    describe('WHEN rendering with an object "to" prop', () => {
      it('THEN should pass the object through without slug prepend', () => {
        renderWithRouter(<Link to={{ pathname: '/customers', search: '?page=2' }}>Customers</Link>)

        const link = screen.getByText('Customers')

        expect(link).toHaveAttribute('href', '/customers?page=2')
      })
    })
  })

  describe('GIVEN the user is outside an organization context', () => {
    beforeEach(() => {
      mockUseParams.mockReturnValue({})
    })

    describe('WHEN rendering with an absolute string "to" prop', () => {
      it('THEN should render the path unchanged', () => {
        renderWithRouter(<Link to="/login">Login</Link>)

        const link = screen.getByText('Login')

        expect(link).toHaveAttribute('href', '/login')
      })
    })
  })

  // Tripwire pinning v6 router behaviour for these inputs; stage 3's bump to
  // react-router 7.18 is EXPECTED to change them, so a failure here is the signal.
  describe('GIVEN a protocol-relative or backslash-tricked "to" prop', () => {
    describe('WHEN rendering "//evil.com" with an organization slug', () => {
      it('THEN should render the v6-observed href', () => {
        renderWithRouter(<Link to="//evil.com">Evil</Link>)

        const link = screen.getByText('Evil')

        expect(link).toHaveAttribute('href', '/acme/evil.com')
      })
    })

    describe('WHEN rendering "/\\evil.com" with an organization slug', () => {
      it('THEN should render the v6-observed href', () => {
        renderWithRouter(<Link to={'/\\evil.com'}>Evil</Link>)

        const link = screen.getByText('Evil')

        expect(link).toHaveAttribute('href', '/acme/\\evil.com')
      })
    })

    describe('WHEN rendering "/acme//evil.com" with an organization slug', () => {
      it('THEN should render the v6-observed href', () => {
        renderWithRouter(<Link to="/acme//evil.com">Evil</Link>)

        const link = screen.getByText('Evil')

        expect(link).toHaveAttribute('href', '/acme/evil.com')
      })
    })

    describe('WHEN rendering "//evil.com" with no organization slug', () => {
      it('THEN should render the v6-observed href', () => {
        mockUseParams.mockReturnValue({})

        renderWithRouter(<Link to="//evil.com">Evil</Link>)

        const link = screen.getByText('Evil')

        expect(link).toHaveAttribute('href', '//evil.com')
      })
    })
  })

  describe('GIVEN a ref is passed to Link', () => {
    describe('WHEN the component renders', () => {
      it('THEN should forward the ref to the anchor element', () => {
        const ref = createRef<HTMLAnchorElement>()

        renderWithRouter(
          <Link ref={ref} to="/customers">
            Customers
          </Link>,
        )

        expect(ref.current).toBeInstanceOf(HTMLAnchorElement)
        expect(ref.current?.getAttribute('href')).toBe('/acme/customers')
      })
    })
  })
})
