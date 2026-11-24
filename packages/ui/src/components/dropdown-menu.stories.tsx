import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Download, Ellipsis, Folder, Pencil, Trash } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu'
import docs from './dropdown-menu.md?raw'
import { IconButton } from './icon-button'
import { TooltipProvider } from './tooltip'

const CustomerActionsMenu = ({ icon = false }: { icon?: boolean }): JSX.Element => {
  const descriptionId = useId()
  const [archived, setArchived] = useState(true)
  const [columns, setColumns] = useState<boolean | 'indeterminate'>('indeterminate')
  const [sort, setSort] = useState('newest')
  const [action, setAction] = useState('No action selected')

  return (
    <div className="space-y-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {icon ? (
            <IconButton label="Customer actions">
              <Ellipsis />
            </IconButton>
          ) : (
            <Button variant="secondary">Customer actions</Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Customer actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setAction('Edit customer')}>
              <Pencil aria-hidden="true" />
              Edit customer<DropdownMenuShortcut>⌘ E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setAction('Copy customer ID')}>
              <Copy aria-hidden="true" />
              Copy customer ID<DropdownMenuShortcut>⌘ ⇧ C</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled
              aria-label="Export customer"
              aria-describedby={descriptionId}
              textValue="Export customer"
            >
              <Download aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate">Export customer</span>
                <span id={descriptionId} className="v2-text-caption block truncate">
                  Available with export permission
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Display</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={archived} onCheckedChange={setArchived}>
              <Folder aria-hidden="true" />
              Show archived
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columns} onCheckedChange={setColumns}>
              Visible columns
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioItem value="newest">Newest first</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="oldest">Oldest first</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Folder aria-hidden="true" />
              Move to folder
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
              {[
                'Finance',
                'Operations',
                'Archive',
                'International customer billing and financial reporting',
              ].map((label) => (
                <DropdownMenuItem key={label} onSelect={() => setAction(label)}>
                  <Folder aria-hidden="true" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive" onSelect={() => setAction('Delete customer')}>
            <Trash aria-hidden="true" />
            Delete customer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="v2-text-caption" role="status">
        {action}
      </div>
    </div>
  )
}

const meta = {
  title: 'Components/DropdownMenu',
  tags: ['autodocs'],
  parameters: { docs: { description: { component: docs } } },
  component: DropdownMenu,
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof DropdownMenu>

export default meta

type Story = StoryObj<typeof meta>

export const TextTrigger: Story = {
  render: () => <CustomerActionsMenu />,
}

export const IconTrigger: Story = {
  render: () => <CustomerActionsMenu icon />,
}

export const LongMenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Long menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Array.from({ length: 40 }, (_, i) => (
          <DropdownMenuItem key={i}>
            <Folder aria-hidden="true" />
            Customer {i + 1} — international billing and financial reporting
            <DropdownMenuShortcut>⌘ E</DropdownMenuShortcut>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const ContentWidth: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Short labels</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Copy aria-hidden="true" />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Maximum 240px</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Copy aria-hidden="true" />
            Copy customer identification number
            <DropdownMenuShortcut>⌘ C</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Pencil aria-hidden="true" />
            Edit customer billing preferences
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash aria-hidden="true" />
            Delete customer and billing history
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
}
