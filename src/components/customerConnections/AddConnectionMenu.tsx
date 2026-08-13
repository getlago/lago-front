import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import { CONNECTION_CATEGORY_LABEL_KEYS, ConnectionCategory } from './types'

const MENU_ORDER: ConnectionCategory[] = [
  ConnectionCategory.Payment,
  ConnectionCategory.Accounting,
  ConnectionCategory.Tax,
  ConnectionCategory.Crm,
]

type AddConnectionMenuProps = {
  /** Disables the whole opener button */
  disabled?: boolean
  /** Disables individual category entries (e.g. one-per-type limit) */
  disabledCategories?: ConnectionCategory[]
  onSelect: (category: ConnectionCategory, utils: { closePopper: () => void }) => void
}

/**
 * The shared "Add a connection" menu: a Popper listing the four connection
 * categories. Used on customer create/edit and on the customer information
 * view; the mount site decides what selecting a category does (show a
 * section, open the connection drawer, ...).
 */
export const AddConnectionMenu = ({
  disabled,
  disabledCategories,
  onSelect,
}: AddConnectionMenuProps) => {
  const { translate } = useInternationalization()

  return (
    <Popper
      PopperProps={{ placement: 'bottom-start' }}
      opener={
        <Button startIcon="plus" variant="inline" disabled={disabled}>
          {translate('text_65846763e6140b469140e235')}
        </Button>
      }
    >
      {({ closePopper }) => (
        <MenuPopper>
          {MENU_ORDER.map((category) => (
            <Button
              key={category}
              variant="quaternary"
              align="left"
              disabled={disabledCategories?.includes(category)}
              onClick={() => onSelect(category, { closePopper })}
            >
              {translate(CONNECTION_CATEGORY_LABEL_KEYS[category])}
            </Button>
          ))}
        </MenuPopper>
      )}
    </Popper>
  )
}
