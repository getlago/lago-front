import { FC } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { MenuPopper } from '~/styles'

import { ACTIONS_BLOCK_TEST_ID } from './mainHeaderTestIds'
import { MainHeaderAction } from './types'

/**
 * Renders the full actions block: skeleton during loading, action buttons otherwise.
 */
export const ActionsBlock: FC<{ actions?: MainHeaderAction[]; isLoading?: boolean }> = ({
  actions,
  isLoading,
}) => {
  if (isLoading) return <Skeleton variant="text" className="w-30" />

  if (!actions || actions.length === 0) return null

  return (
    <div
      className="flex shrink-0 items-center justify-center gap-4"
      data-test={ACTIONS_BLOCK_TEST_ID}
    >
      {actions.map((action) => (
        <ActionItem key={action.label} action={action} />
      ))}
    </div>
  )
}

/** Renders a single action based on its type. */
const ActionItem: FC<{ action: MainHeaderAction }> = ({ action }) => {
  switch (action.type) {
    case 'dropdown': {
      const visibleItems = action.items.filter((item) => !item.hidden)

      if (visibleItems.length === 0) return null

      return (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down" data-test={action.dataTest}>
              {action.label}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              {visibleItems.map((item) => {
                const button = (
                  <Button
                    key={item.label}
                    variant="quaternary"
                    align="left"
                    disabled={item.disabled}
                    danger={item.danger}
                    endIcon={item.endIcon}
                    onClick={() => item.onClick(closePopper)}
                    data-test={item.dataTest}
                  >
                    {item.label}
                  </Button>
                )

                if (item.tooltip) {
                  return (
                    <Tooltip key={item.label} placement="left" title={item.tooltip}>
                      {button}
                    </Tooltip>
                  )
                }

                return button
              })}
            </MenuPopper>
          )}
        </Popper>
      )
    }

    case 'action':
      return (
        <Button
          variant={action.variant ?? 'secondary'}
          startIcon={action.startIcon}
          endIcon={action.endIcon}
          disabled={action.disabled}
          onClick={action.onClick}
          data-test={action.dataTest}
        >
          {action.label}
        </Button>
      )
  }
}
