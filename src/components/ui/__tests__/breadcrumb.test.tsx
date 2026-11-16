import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../dropdown-menu'

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

it('opens hidden ancestors by keyboard and returns focus to the overflow trigger', async () => {
  const user = userEvent.setup()

  render(
    <Breadcrumb aria-label="Customer navigation">
      <BreadcrumbList>
        <BreadcrumbItem>
          <DropdownMenu>
            <BreadcrumbLink asChild>
              <DropdownMenuTrigger aria-label="Show hidden ancestors">
                <BreadcrumbEllipsis />
              </DropdownMenuTrigger>
            </BreadcrumbLink>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <a href="#customer">Customer</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#billing">Billing</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Invoice</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  )
  const trigger = screen.getByRole('button', { name: 'Show hidden ancestors' })

  await user.tab()
  expect(trigger).toHaveFocus()
  await user.keyboard('{Enter}')
  await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Customer' })).toHaveFocus())
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('menuitem', { name: 'Billing' })).toHaveFocus()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
  await user.tab()
  expect(screen.getByText('Invoice')).not.toHaveFocus()
})
