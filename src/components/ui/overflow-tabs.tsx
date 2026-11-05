import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '~/lib/utils'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import {
  Tabs,
  TabsContext,
  TabsList,
  tabsTrackClasses,
  TabsTrigger,
  tabsTriggerClasses,
  TabsTriggerContext,
} from './tabs'
import { partitionTabs } from './tabs-overflow-layout'

export const OverflowTabs = React.forwardRef<
  React.ElementRef<typeof Tabs>,
  Omit<React.ComponentPropsWithoutRef<typeof Tabs>, 'orientation'>
>((props, ref) => <Tabs {...props} ref={ref} orientation="horizontal" />)
OverflowTabs.displayName = 'OverflowTabs'

type OverflowTriggerProps = React.ComponentPropsWithoutRef<typeof TabsTrigger> & {
  textValue: string
}
export const OverflowTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  OverflowTriggerProps
>(({ textValue, children, ...props }, ref) => (
  <TabsTrigger {...props} ref={ref} aria-label={props['aria-label'] ?? textValue}>
    {children}
  </TabsTrigger>
))
OverflowTabsTrigger.displayName = 'OverflowTabsTrigger'

interface OverflowTabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  'aria-label'?: string
}

export const OverflowTabsList = React.forwardRef<HTMLDivElement, OverflowTabsListProps>(
  ({ children, className, 'aria-label': ariaLabel, ...props }, forwardedRef) => {
    const { value, onValueChange } = React.useContext(TabsContext)
    const container = React.useRef<HTMLDivElement | null>(null)
    const track = React.useRef<HTMLDivElement>(null)
    const measure = React.useRef<HTMLDivElement | null>(null)
    const more = React.useRef<HTMLButtonElement>(null)
    const triggers = React.useRef(new Map<string, HTMLButtonElement>())
    const pendingFocus = React.useRef<string>()
    const resizedFocus = React.useRef<string>()
    const selectionClose = React.useRef(false)
    const [open, setOpen] = React.useState(false)
    const [promoted, setPromoted] = React.useState<string>()
    const [sizes, setSizes] = React.useState<{ available: number; more: number; widths: number[] }>(
      {
        available: Infinity,
        more: 0,
        widths: [],
      },
    )
    const items = React.Children.toArray(children).filter(
      (
        child,
      ): child is React.ReactElement<OverflowTriggerProps> & {
        ref?: React.Ref<HTMLButtonElement>
      } => React.isValidElement<OverflowTriggerProps>(child) && child.type === OverflowTabsTrigger,
    )
    const signature = items.map((item) => item.props.value).join('|')
    const partition = partitionTabs(
      items.map((item, index) => ({ value: item.props.value, width: sizes.widths[index] ?? 0 })),
      sizes.available,
      sizes.more,
      value,
      promoted,
    )
    const visible = partition.visible.flatMap((id) =>
      items.filter((item) => item.props.value === id),
    )
    const hidden = items.filter((item) => partition.hidden.includes(item.props.value))

    React.useLayoutEffect(() => {
      const box = container.current
      const measurement = measure.current

      if (!box || !measurement) return
      let mounted = true
      const update = (): void => {
        if (!mounted) return
        const style = getComputedStyle(track.current ?? box)
        const available =
          box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
        const nodes = Array.from(measurement.children)
        const widths = nodes.slice(0, -1).map((node) => node.getBoundingClientRect().width)
        const moreWidth = nodes.at(-1)?.getBoundingClientRect().width ?? 0

        const focused = document.activeElement

        if (focused instanceof HTMLElement && box.contains(focused))
          resizedFocus.current = focused.dataset.tabsValue

        setSizes((previous) =>
          previous.available === available &&
          previous.more === moreWidth &&
          previous.widths.join() === widths.join()
            ? previous
            : { available, more: moreWidth, widths },
        )
      }
      const observer = new ResizeObserver(update)

      observer.observe(box)
      Array.from(measurement.children).forEach((node) => observer.observe(node))
      update()
      void document.fonts?.ready.then(update)

      return () => {
        mounted = false
        observer.disconnect()
      }
    }, [signature])

    React.useLayoutEffect(() => {
      const target = pendingFocus.current

      if (target && partition.visible.includes(target) && value === target) {
        triggers.current.get(target)?.focus()
        pendingFocus.current = undefined
      }
      if (resizedFocus.current && !partition.visible.includes(resizedFocus.current))
        more.current?.focus()
      resizedFocus.current = undefined
    }, [value, partition.visible])

    const choose = (next: string): void => {
      selectionClose.current = true
      pendingFocus.current = next
      setPromoted(next)
      onValueChange(next)
      setOpen(false)
    }

    return (
      <div
        {...props}
        ref={(node) => {
          container.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) forwardedRef.current = node
        }}
        className={cn('relative w-full min-w-0', className)}
      >
        <div ref={track} className={tabsTrackClasses}>
          <TabsList
            aria-label={ariaLabel}
            className="min-w-0 gap-1 rounded-none bg-[transparent] p-0"
          >
            {visible.map((item) => (
              <OverflowTabsTrigger
                {...item.props}
                key={item.props.value}
                data-tabs-value={item.props.value}
                ref={(node) => {
                  if (typeof item.ref === 'function') item.ref(node)
                  else if (item.ref) Object.assign(item.ref, { current: node })
                  if (node) triggers.current.set(item.props.value, node)
                  else triggers.current.delete(item.props.value)
                }}
                className={cn('shrink [&>span]:min-w-0', item.props.className)}
              />
            ))}
          </TabsList>
          {hidden.length > 0 && (
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  ref={more}
                  type="button"
                  className={tabsTriggerClasses}
                  aria-label="More tabs"
                >
                  <span className="v2-text-label">More</span>
                  <ChevronDown aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onCloseAutoFocus={(event) => {
                  if (selectionClose.current) event.preventDefault()
                  selectionClose.current = false
                }}
              >
                {hidden.map((item) => (
                  <DropdownMenuItem
                    key={item.props.value}
                    disabled={item.props.disabled}
                    textValue={item.props.textValue}
                    aria-label={item.props.textValue}
                    onSelect={() => choose(item.props.value)}
                  >
                    <TabsTriggerContext.Provider
                      value={{ selected: false, disabled: !!item.props.disabled }}
                    >
                      {item.props.children}
                    </TabsTriggerContext.Provider>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div
            ref={(node) => {
              measure.current = node
              node?.setAttribute('inert', '')
            }}
            aria-hidden="true"
            className="pointer-events-none invisible absolute left-0 top-0 flex w-max gap-1"
          >
            {items.map((item) => (
              <span key={item.props.value} className={tabsTriggerClasses}>
                {item.props.children}
              </span>
            ))}
            <span className={tabsTriggerClasses}>
              <span className="v2-text-label">More</span>
              <ChevronDown aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    )
  },
)
OverflowTabsList.displayName = 'OverflowTabsList'
