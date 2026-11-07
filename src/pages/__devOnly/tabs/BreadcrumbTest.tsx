import { generatePath } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'
import { ColorTheme } from '~/components/ui/color-theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Link, ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

const previewPath = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-breadcrumb' })

export const CollapsedBreadcrumbExample = (): JSX.Element => (
  <Breadcrumb aria-label="Collapsed breadcrumb">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to={`${previewPath}#customers`}>Customers</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <DropdownMenu>
          <BreadcrumbLink asChild>
            <DropdownMenuTrigger aria-label="Show hidden ancestors">
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
          </BreadcrumbLink>
          <DropdownMenuContent>
            {['Acme', 'Billing'].map((label) => (
              <DropdownMenuItem key={label} asChild>
                <Link to={`${previewPath}#${label.toLowerCase()}`}>
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link to={`${previewPath}#invoices`}>Invoices</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Invoice details</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
)

export const BreadcrumbTest = (): JSX.Element => (
  <section aria-label="Shadcn breadcrumb showcase" className="space-y-8">
    <h2 className="v2-text-page-title">Breadcrumb</h2>
    <p className="v2-text-body">
      Show all levels for one to four items. From five items, keep the first, immediate parent and
      current page visible, with the middle ancestors in the existing Dropdown Menu. Collapse is
      explicit; resizing does not change the trail. Long labels truncate independently.
    </p>
    {(['light', 'dark'] as const).map((mode) => (
      <ColorTheme
        key={mode}
        mode={mode}
        className="space-y-6 rounded-lg bg-canvas p-6 text-text-default"
      >
        <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'}</h3>
        <Breadcrumb aria-label="Single breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Customers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Breadcrumb aria-label="Full breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`${previewPath}#customers`}>Customers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`${previewPath}#acme`}>Acme</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`${previewPath}#invoices`}>Invoices</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Invoice details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <CollapsedBreadcrumbExample />
        <Breadcrumb aria-label="Long labels breadcrumb" className="max-w-sm">
          <BreadcrumbList>
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <Link to={`${previewPath}#customers`}>Customers</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="flex-1">
              <BreadcrumbLink asChild>
                <Link to={`${previewPath}#acme`}>
                  <span className="truncate">Acme International Corporation</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbPage>Invoice details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ColorTheme>
    ))}
  </section>
)

export const shadcnBreadcrumbTab = {
  title: 'Shadcn-breadcrumb',
  link: previewPath,
  component: (
    <div className="px-12 pb-20 pt-8">
      <BreadcrumbTest />
    </div>
  ),
}
