import { ReactNode } from 'react'

import { Accordion } from '~/components/designSystem/Accordion'
import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

export type SectionAccordionAction = {
  label: string
  onClick: () => void
  danger?: boolean
  hidden?: boolean
}

export type SectionAccordionProps = {
  id?: string
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  actions?: SectionAccordionAction[]
  initiallyOpen?: boolean
  noContentMargin?: boolean
  children: ReactNode
}

export const SectionAccordion = ({
  id,
  icon,
  title,
  subtitle,
  badge,
  actions,
  initiallyOpen,
  noContentMargin,
  children,
}: SectionAccordionProps) => {
  const visibleActions = (actions ?? []).filter((a) => !a.hidden)

  return (
    <Accordion
      id={id}
      initiallyOpen={initiallyOpen}
      noContentMargin={noContentMargin}
      summary={
        <div className="flex flex-1 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon}
            <div className="flex flex-col">
              <Typography variant="body" color="grey700">
                {title}
              </Typography>
              {!!subtitle && (
                <Typography variant="caption" color="grey600">
                  {subtitle}
                </Typography>
              )}
            </div>
            {badge}
          </div>
          {visibleActions.length > 0 && (
            <Popper
              PopperProps={{ placement: 'bottom-end' }}
              opener={
                <Button
                  aria-label="actions"
                  variant="quaternary"
                  size="small"
                  icon="dots-horizontal"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              {({ closePopper }) => (
                <MenuPopper>
                  {visibleActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="quaternary"
                      align="left"
                      fullWidth
                      danger={action.danger}
                      onClick={(e) => {
                        e.stopPropagation()
                        closePopper()
                        action.onClick()
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </MenuPopper>
              )}
            </Popper>
          )}
        </div>
      }
    >
      {children}
    </Accordion>
  )
}
