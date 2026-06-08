import { Icon, IconName } from 'lago-design-system'
import { ReactNode } from 'react'

import { Accordion } from '~/components/designSystem/Accordion'
import { Avatar } from '~/components/designSystem/Avatar'
import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { POPPER_GROUP_NAME } from '~/core/constants/popper'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

export type SectionAccordionAction = {
  label: string
  onClick: () => void
  hidden?: boolean
  startIcon?: IconName
}

export type SectionAccordionProps = {
  id?: string
  icon?: IconName
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
    <div
      id={id}
      className="scroll-mt-12"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 80px' }}
    >
      <Accordion
        initiallyOpen={initiallyOpen}
        noContentMargin={noContentMargin}
        summary={
          <div className="flex flex-1 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {icon && (
                <Avatar size="big" variant="connector">
                  <Icon name={icon} color="dark" />
                </Avatar>
              )}
              <div className="flex flex-col">
                <Typography variant="bodyHl" color="grey700">
                  {title}
                </Typography>
                {!!subtitle && (
                  <Typography variant="caption" color="grey600">
                    {subtitle}
                  </Typography>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {badge}
              {visibleActions.length > 0 && (
                <Popper
                  popperGroupName={POPPER_GROUP_NAME.sectionAccordionActions}
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={({ onClick: openPopper }) => (
                    <Button
                      aria-label="actions"
                      variant="quaternary"
                      icon="dots-horizontal"
                      onClick={(e) => {
                        e.stopPropagation()
                        openPopper()
                      }}
                    />
                  )}
                >
                  {({ closePopper }) => (
                    <MenuPopper>
                      {visibleActions.map((action) => (
                        <Button
                          key={action.label}
                          variant="quaternary"
                          align="left"
                          fullWidth
                          startIcon={action.startIcon}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
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
          </div>
        }
      >
        {children}
      </Accordion>
    </div>
  )
}
