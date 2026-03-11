import { FC } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { MenuPopper } from '~/styles'

import { MainHeaderAction } from './types'

/**
 * Renders a single action based on its type.
 * Keeps the switch/case isolated for readability.
 */
export const ActionRenderer: FC<{ action: MainHeaderAction }> = ({ action }) => {
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
              {visibleItems.map((item, i) => (
                <Button
                  key={i}
                  variant="quaternary"
                  align="left"
                  disabled={item.disabled}
                  danger={item.danger}
                  onClick={() => item.onClick(closePopper)}
                  data-test={item.dataTest}
                >
                  {item.label}
                </Button>
              ))}
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
          disabled={action.disabled}
          onClick={action.onClick}
          data-test={action.dataTest}
        >
          {action.label}
        </Button>
      )
  }
}
