import { FC, ReactNode } from 'react'

import { Avatar, Button, Icon, Typography } from '~/components/designSystem'
import { ComboboxItem } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const ExternalAppsAccordionComboboxItem: FC<{
  label: string
  subLabel: string
}> = ({ label, subLabel }) => {
  return (
    <ComboboxItem>
      <Typography variant="body" color="grey700" noWrap>
        {label}
      </Typography>
      &nbsp;
      <Typography variant="body" color="grey600" noWrap>
        ({subLabel})
      </Typography>
    </ComboboxItem>
  )
}

const ExternalAppsAccordionSummary: FC<{
  avatar?: ReactNode
  onDelete?: () => void
  label?: string
  subLabel?: string
}> = ({ avatar, label, subLabel, onDelete }) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-1 flex-row items-center gap-3">
      <div className="flex flex-1 flex-row items-center gap-3">
        {avatar || (
          <Avatar size="big" variant="connector">
            <Icon name="plug" color="dark" />
          </Avatar>
        )}
        <div className="flex flex-col">
          <Typography variant="bodyHl" color="grey700">
            {label || translate('text_66423cad72bbad009f2f5691')}
          </Typography>
          {subLabel && <Typography variant="caption">{subLabel}</Typography>}
        </div>
      </div>

      {onDelete && <Button variant="quaternary" icon="trash" onClick={onDelete} />}
    </div>
  )
}

export const ExternalAppsAccordionLayout = {
  ComboboxItem: ExternalAppsAccordionComboboxItem,
  Summary: ExternalAppsAccordionSummary,
}