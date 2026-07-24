import { ReactNode } from 'react'

/**
 * A connection-drawer content block: 48px padding above its bottom border and
 * 48px margin to the next block. The last block has neither.
 *
 * Standalone file on purpose: consumers must not drag in the drawer stack
 * (import.meta) just for the section wrapper (jest can't parse it).
 */
export const ConnectionDrawerSection = ({ children }: { children: ReactNode }) => (
  <section className="mb-12 flex flex-col gap-6 border-b border-grey-300 pb-12 last:mb-0 last:border-b-0 last:pb-0">
    {children}
  </section>
)
