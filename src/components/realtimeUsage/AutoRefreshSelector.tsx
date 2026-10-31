import { ButtonSelector } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { AUTO_REFRESH_OPTIONS, REALTIME_USAGE_CONTROL_CLASSNAME } from './constants'

type AutoRefreshSelectorProps = {
  value: number
  onChange: (seconds: number) => void
  'data-test'?: string
}

export const AutoRefreshSelector = ({
  value,
  onChange,
  'data-test': dataTest,
}: AutoRefreshSelectorProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <ButtonSelector
      data-test={dataTest}
      className={REALTIME_USAGE_CONTROL_CLASSNAME}
      label={translate('text_17876098439600jp8nt3z0hk')}
      options={AUTO_REFRESH_OPTIONS.map((seconds) => ({
        value: seconds,
        label: seconds === 0 ? translate('text_1787609843960bopfeje8bho') : `${seconds}s`,
      }))}
      value={value}
      onChange={(selected) => onChange(Number(selected))}
    />
  )
}
