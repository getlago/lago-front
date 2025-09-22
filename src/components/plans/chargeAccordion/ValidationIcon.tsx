import { Icon, Tooltip } from 'lago-design-system'

import { useInternationalization } from '~/hooks/core/useInternationalization'

export const ValidationIcon = ({ hasError }: { hasError: boolean }) => {
  const { translate } = useInternationalization()

  return (
    <Tooltip
      placement="top-end"
      title={
        hasError
          ? translate('text_635b975ecea4296eb76924b7')
          : translate('text_635b975ecea4296eb76924b1')
      }
    >
      <Icon
        name="validate-filled"
        className="flex items-center"
        color={hasError ? 'disabled' : 'success'}
      />
    </Tooltip>
  )
}
