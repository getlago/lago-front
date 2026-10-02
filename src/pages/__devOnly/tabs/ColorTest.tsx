import { Check, Info, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { V2Portal, V2Theme } from '~/components/ui/v2-theme'
import { colorPrimitives, colorSemantics, V2ColorMode } from '~/styles/v2/colors'

const ColorDialog = ({ onClose }: { onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current

    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <V2Portal>
      <dialog
        ref={ref}
        onClose={onClose}
        aria-labelledby="v2-dialog-title"
        className="v2-dialog v2-text-body m-auto w-full max-w-md rounded-lg border border-v2-border-default bg-v2-surface-raised p-8 text-v2-text-default"
      >
        <h3 id="v2-dialog-title" className="v2-text-section-title mb-4">
          Ready to send?
        </h3>
        <p className="mb-6 text-v2-text-muted">
          This preview dialog inherits its theme through a portal.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Send invoice</Button>
        </div>
      </dialog>
    </V2Portal>
  )
}

export const ColorTest = () => {
  const [mode, setMode] = useState<V2ColorMode>('light')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('Invoices')

  return (
    <section aria-label="V2 colors" className="mb-12">
      <V2Theme
        mode={mode}
        className="v2-text-body flex flex-col gap-8 bg-v2-canvas p-8 text-v2-text-default"
      >
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="v2-text-page-title">Color foundation</h2>
            <p className="mt-2 text-v2-text-muted">
              74 primitives · 45 semantic roles · isolated shadcn preview
            </p>
          </div>
          <Button
            variant="outline"
            aria-pressed={mode === 'dark'}
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          >
            {mode === 'light' ? 'Switch to dark' : 'Switch to light'}
          </Button>
        </header>

        <div className="grid gap-8 md:grid-cols-[200px_1fr]">
          <nav
            aria-label="Preview navigation"
            className="flex flex-col gap-2 bg-v2-surface-inset p-4"
          >
            {['Overview', 'Invoices', 'Customers'].map((item) => (
              <button
                key={item}
                type="button"
                aria-current={selected === item ? 'page' : undefined}
                onClick={() => setSelected(item)}
                className={`v2-text-label flex items-center justify-between rounded px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-v2-focus-border ${selected === item ? 'bg-v2-selected text-v2-selected-foreground' : 'text-v2-text-default hover:bg-v2-interactive-hover active:bg-v2-interactive-pressed'}`}
              >
                {item}
                {selected === item && <Check size={16} aria-hidden />}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="v2-text-section-title">Invoices</h3>
                <p className="text-v2-text-muted">Review payments and send invoices.</p>
              </div>
              <Button onClick={() => setOpen(true)}>Send invoice</Button>
            </div>
            <div className="relative max-w-sm">
              <Search
                aria-hidden
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-v2-text-muted"
              />
              <Input aria-label="Search invoices" placeholder="Search invoices" className="pl-9" />
            </div>
            <div className="flex justify-between border-b border-v2-border-subtle py-4">
              <span>
                INV-2026-001 <span className="ml-3 text-v2-text-muted">Acme</span>
              </span>
              <span className="v2-text-number">$1,250.00</span>
            </div>
            <div className="flex items-center gap-2 text-v2-success-foreground">
              <Check size={16} aria-hidden />
              Payment received
            </div>
            <a className="v2-inline-link" href="#v2-color-mapping">
              View semantic mapping
            </a>
          </div>
        </div>

        <section
          aria-label="Button colors"
          className="flex flex-col gap-4 border-t border-v2-border-subtle pt-6"
        >
          <h3 className="v2-text-section-title">Buttons and states</h3>
          <p className="text-v2-text-muted">Hover, press, and use Tab to inspect keyboard focus.</p>
          {(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const).map(
            (variant) => (
              <div key={variant} className="flex items-center gap-4">
                <span className="w-24">{variant}</span>
                <Button variant={variant}>Enabled</Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </div>
            ),
          )}
        </section>

        <section aria-label="Input colors" className="grid gap-4 md:grid-cols-3">
          <label htmlFor="v2-customer">
            Customer name
            <Input id="v2-customer" className="mt-2" defaultValue="Acme" />
          </label>
          <label htmlFor="v2-email">
            Email
            <Input
              className="mt-2"
              aria-invalid="true"
              id="v2-email"
              aria-describedby="v2-email-error"
              defaultValue="invalid"
            />
            <span id="v2-email-error" className="text-v2-danger-foreground">
              Enter a valid email.
            </span>
          </label>
          <label htmlFor="v2-account">
            Account ID
            <Input id="v2-account" className="mt-2" disabled defaultValue="acc_001" />
          </label>
        </section>

        <section aria-label="Status colors" className="flex flex-col gap-3">
          {(['info', 'success', 'warning', 'danger'] as const).map((status) => (
            <div
              key={status}
              className="flex items-center gap-3 rounded border p-4"
              style={{
                backgroundColor: `var(--v2-color-${status})`,
                color: `var(--v2-color-${status}-foreground)`,
                borderColor: `var(--v2-color-${status}-border)`,
              }}
            >
              <Info size={16} aria-hidden />
              <span className="capitalize">{status}</span>
              <span>Message text and icons use the matching foreground.</span>
            </div>
          ))}
        </section>

        <section aria-label="Alpha on supported surfaces" className="grid gap-4 md:grid-cols-2">
          {(['canvas', 'surface-inset'] as const).map((surface) => (
            <div
              key={surface}
              className="p-4"
              style={{ backgroundColor: `var(--v2-color-${surface})` }}
            >
              <h3 className="v2-text-label mb-3">Alpha on {surface}</h3>
              <div className="bg-v2-interactive-hover p-3">Hover</div>
              <div className="bg-v2-interactive-pressed p-3">Pressed replaces hover</div>
            </div>
          ))}
        </section>

        <details>
          <summary className="v2-text-section-title cursor-pointer">
            Primitive palette — 74 colors
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(colorPrimitives).map(([name, value]) => (
              <div key={name}>
                <div
                  className="mb-2 h-12 border border-v2-border-subtle"
                  style={{ backgroundColor: value }}
                />
                <div className="v2-text-caption">
                  {name}
                  <br />
                  {value}
                </div>
              </div>
            ))}
          </div>
        </details>
        <details id="v2-color-mapping">
          <summary className="v2-text-section-title cursor-pointer">
            Semantic mapping — 45 roles
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="p-2">Role</th>
                  <th>Light</th>
                  <th>Dark</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(colorSemantics).map(([name, aliases]) => (
                  <tr key={name} className="border-t border-v2-border-subtle">
                    <th className="p-2 font-normal">{name}</th>
                    <td>{aliases.light}</td>
                    <td>{aliases.dark}</td>
                    <td>
                      <div
                        className="h-6 w-12 border border-v2-border-subtle"
                        style={{ backgroundColor: `var(--v2-color-${name})` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
        <p className="v2-text-caption text-v2-text-muted">
          Contrast review: light selected text remains brand-600 on brand-100 (3.81:1), matching
          Figma. Light text-subtle is 3.19:1 on white. These pairings need review for normal-size
          text.
        </p>
        {open && <ColorDialog onClose={() => setOpen(false)} />}
      </V2Theme>
      <div
        className="mt-6 flex flex-wrap items-center gap-4"
        aria-label="Unchanged shadcn controls outside v2"
      >
        <span>Outside v2 — existing styling</span>
        <Button>Existing button</Button>
        <Input aria-label="Existing input" className="max-w-xs" placeholder="Existing input" />
      </div>
    </section>
  )
}
