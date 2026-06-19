import { tw } from 'lago-design-system'
import { PropsWithChildren, ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'

/**
 * Two-column page layout: a form/content column on the left and a preview
 * panel on the right, split 50/50. Each column scrolls independently, and the
 * left column can pin a full-bleed action footer below its scroll area.
 *
 * ```tsx
 * <SplitPreviewPage.Wrapper>
 *   <SplitPreviewPage.Header onClose={onClose}>{title}</SplitPreviewPage.Header>
 *   <SplitPreviewPage.Body>
 *     <SplitPreviewPage.Main footer={actions}>{content}</SplitPreviewPage.Main>
 *     <SplitPreviewPage.Side>{preview}</SplitPreviewPage.Side>
 *   </SplitPreviewPage.Body>
 * </SplitPreviewPage.Wrapper>
 * ```
 */
const Wrapper = ({ children }: PropsWithChildren) => (
  <div className="flex h-full flex-col">{children}</div>
)

interface HeaderProps extends PropsWithChildren {
  onClose: () => void
  closeButtonDataTest?: string
}

const Header = ({ children, onClose, closeButtonDataTest }: HeaderProps) => (
  <header className="flex h-nav shrink-0 items-center justify-between gap-2 bg-white px-4 shadow-b md:px-12">
    {children}
    <Button data-test={closeButtonDataTest} variant="quaternary" icon="close" onClick={onClose} />
  </header>
)

const Body = ({ children }: PropsWithChildren) => (
  <div className="flex flex-1 flex-row overflow-hidden">{children}</div>
)

interface MainProps extends PropsWithChildren {
  /** Action buttons pinned below the scroll area in a full-bleed footer. */
  footer?: ReactNode
  /** How the footer actions are distributed. Defaults to 'end'. */
  footerAlign?: 'between' | 'end'
}

const Main = ({ children, footer, footerAlign = 'end' }: MainProps) => (
  <div className="flex w-full flex-col overflow-hidden md:w-1/2">
    <div className="flex-1 overflow-auto px-4 py-12 md:px-12">{children}</div>
    {footer && (
      <footer className="shrink-0 bg-white p-4 shadow-t md:px-12">
        <div
          className={tw(
            'flex w-full items-center gap-3',
            footerAlign === 'between' ? 'justify-between' : 'justify-end',
          )}
        >
          {footer}
        </div>
      </footer>
    )}
  </div>
)

const Side = ({ children }: PropsWithChildren) => (
  <div className="hidden w-1/2 overflow-auto bg-grey-100 md:block">{children}</div>
)

export const SplitPreviewPage = {
  Wrapper,
  Header,
  Body,
  Main,
  Side,
}
