import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'
import docs from './breadcrumb.md?raw'
import { ColorTheme } from './color-theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'

const meta = {
  title: 'Components/Breadcrumb',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>

export default meta

type Story = StoryObj<typeof meta>

const CollapsedBreadcrumbExample = ({ landmarkLabel }: { landmarkLabel: string }): JSX.Element => (
  <Breadcrumb aria-label={landmarkLabel}>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <a href={`#customers`}>Customers</a>
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
                <a href={`#${label.toLowerCase()}`}>
                  <span className="min-w-0 truncate">{label}</span>
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <a href={`#invoices`}>Invoices</a>
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Invoice details</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
)

const BreadcrumbExamples = (): JSX.Element => (
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
        <Breadcrumb aria-label={`Single breadcrumb (${mode})`}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Customers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Breadcrumb aria-label={`Full breadcrumb (${mode})`}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href={`#customers`}>Customers</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href={`#acme`}>Acme</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href={`#invoices`}>Invoices</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Invoice details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <CollapsedBreadcrumbExample landmarkLabel={`Collapsed breadcrumb (${mode})`} />
        <Breadcrumb aria-label={`Long labels breadcrumb (${mode})`} className="max-w-sm">
          <BreadcrumbList>
            <BreadcrumbItem className="shrink-0">
              <BreadcrumbLink asChild>
                <a href={`#customers`}>Customers</a>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="flex-1">
              <BreadcrumbLink asChild>
                <a href={`#acme`}>
                  <span className="truncate">Acme International Corporation</span>
                </a>
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

export const Examples: Story = {
  args: { 'aria-label': 'Breadcrumb examples' },
  render: () => <BreadcrumbExamples />,
}
