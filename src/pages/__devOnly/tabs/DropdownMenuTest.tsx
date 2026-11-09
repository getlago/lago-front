import { Copy, Download, Ellipsis, Folder, Pencil, Trash } from 'lucide-react'
import { useId, useState } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/ui/button'
import { ColorTheme } from '~/components/ui/color-theme'
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
} from '~/components/ui/dropdown-menu'
import { IconButton } from '~/components/ui/icon-button'
import { TooltipProvider } from '~/components/ui/tooltip'
import { ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

const Example = ({ icon = false }: { icon?: boolean }): JSX.Element => {
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

export const DropdownMenuTest = (): JSX.Element => (
  <TooltipProvider>
    <section aria-label="Shadcn dropdown menu showcase" className="space-y-8">
      <h2 className="v2-text-page-title">Dropdown menus</h2>
      {(['light', 'dark'] as const).map((mode) => (
        <ColorTheme
          key={mode}
          mode={mode}
          className="space-y-6 rounded-lg bg-canvas p-8 text-text-default"
        >
          <h3 className="v2-text-section-title">{mode === 'light' ? 'Light' : 'Dark'} theme</h3>
          <div className="flex gap-6">
            <Example />
            <Example icon />
          </div>
          <div className="space-y-3">
            <h4 className="v2-text-group-title">Content width · 132px minimum</h4>
            <div className="flex flex-wrap gap-6">
              {(['short', '240'] as const).map((width) => (
                <DropdownMenu key={width}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary">
                      {width === 'short' ? 'Short labels' : `Maximum ${width}px`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Copy aria-hidden="true" />
                      {width === 'short' ? 'Copy ID' : 'Copy customer identification number'}
                      {width !== 'short' && <DropdownMenuShortcut>⌘ C</DropdownMenuShortcut>}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil aria-hidden="true" />
                      {width === 'short' ? 'Edit' : 'Edit customer billing preferences'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash aria-hidden="true" />
                      {width === 'short' ? 'Delete' : 'Delete customer and billing history'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </div>
          </div>
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
        </ColorTheme>
      ))}
    </section>
  </TooltipProvider>
)

export const shadcnDropdownMenuTab = {
  title: 'Shadcn-dropdown-menu',
  link: generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'shadcn-dropdown-menu' }),
  component: (
    <div className="px-12 pb-20 pt-8">
      <DropdownMenuTest />
    </div>
  ),
}
