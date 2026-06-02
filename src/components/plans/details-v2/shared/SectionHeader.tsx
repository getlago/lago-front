import { IconName } from 'lago-design-system'

import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'

export type SectionHeaderAction = {
  label: string
  onClick: () => void
  hidden?: boolean
  disabled?: boolean
  // Defaults to the "plus" icon (Add CTAs). Pass `null` to render no icon
  // (e.g. an "Edit" link), or another icon name to override.
  startIcon?: IconName | null
}

export type SectionHeaderProps = {
  title: string
  description?: string
  action?: SectionHeaderAction
}

export const SectionHeader = ({ title, description, action }: SectionHeaderProps) => {
  const showAction = !!action && !action.hidden

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="subhead1" color="grey700">
          {title}
        </Typography>
        {!!description && (
          <Typography variant="caption" color="grey600">
            {description}
          </Typography>
        )}
      </div>
      {showAction && (
        <Button
          variant="inline"
          onClick={action.onClick}
          disabled={action.disabled}
          {...(action.startIcon === null ? {} : { startIcon: action.startIcon ?? 'plus' })}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
