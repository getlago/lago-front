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
  endIcon?: IconName
  dataTest?: string
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
  dataTest?: string
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
  dataTest,
  children,
}: SectionAccordionProps) => {
  const visibleActions = (actions ?? []).filter((a) => !a.hidden)

  return (
    <div id={id} data-test={dataTest} className="scroll-mt-12">
      {/* content-visibility lives on the card itself, not this wrapper: a contain:paint
          element clips its descendants' overflow but not its OWN box-shadow, so the focus
          ring on the card is no longer cropped.
          `contain-intrinsic-size: auto 80px`: the `auto` keyword makes the browser remember
          each card's last RENDERED height and reuse it while off-screen (80px is only the
          before-first-render fallback). Without `auto`, an opened card scrolled off-screen
          would collapse to the 80px placeholder, throwing off jump-to scroll math. */}
      <Accordion
        className="[contain-intrinsic-size:auto_80px] [content-visibility:auto]"
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
                      data-test={dataTest ? `${dataTest}-actions` : undefined}
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
                          data-test={action.dataTest}
                          variant="quaternary"
                          align="left"
                          fullWidth
                          startIcon={action.startIcon}
                          endIcon={action.endIcon}
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
