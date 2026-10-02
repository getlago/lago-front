import { ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ToggleableFieldRowProps = {
  children: ReactNode
  onRemove: () => void
  removeDataTest?: string
  tooltipClassName?: string
  rowClassName?: string
}

/** The revealed-field half of a hidden-by-default optional field: the field itself plus
 *  the trash button that clears it and hides the row again. Pair with
 *  `ToggleableFieldAddButton` for the "Add X" button that reveals it. */
export const ToggleableFieldRow = ({
  children,
  onRemove,
  removeDataTest,
  tooltipClassName = 'mt-7 h-fit',
  rowClassName = 'flex items-center',
}: ToggleableFieldRowProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className={rowClassName}>
      {children}
      <Tooltip
        className={tooltipClassName}
        placement="top-end"
        title={translate('text_63aa085d28b8510cd46443ff')}
      >
        <Button icon="trash" variant="quaternary" onClick={onRemove} data-test={removeDataTest} />
      </Tooltip>
    </div>
  )
}

type ToggleableFieldAddButtonProps = {
  onClick: () => void
  label: string
  dataTest?: string
}

export const ToggleableFieldAddButton = ({
  onClick,
  label,
  dataTest,
}: ToggleableFieldAddButtonProps): JSX.Element => (
  <Button fitContent startIcon="plus" variant="inline" onClick={onClick} data-test={dataTest}>
    {label}
  </Button>
)
