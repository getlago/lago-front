import { render, screen } from '@testing-library/react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb'

it('exposes an ordered trail with a non-interactive current page', () => {
  render(
    <Breadcrumb aria-label="Customer navigation">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Acme</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  )

  expect(screen.getByRole('navigation', { name: 'Customer navigation' })).toBeVisible()
  expect(screen.getByRole('list').tagName).toBe('OL')
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
  expect(screen.getByRole('link', { name: 'Customers' })).toHaveAttribute('href', '/customers')
  expect(screen.getByText('Acme')).toHaveAttribute('aria-current', 'page')
  expect(screen.queryByRole('link', { name: 'Acme' })).not.toBeInTheDocument()
})
