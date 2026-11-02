import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { ButtonSelector } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import { AUTO_REFRESH_OPTIONS, REALTIME_USAGE_CONTROL_CLASSNAME } from './constants'

type AutoRefreshSelectorProps = {
  value: number
  onChange: (seconds: number) => void
  // `buttons` lists every interval inline, `menu` shows the current one and opens a list.
  variant?: 'buttons' | 'menu'
  'data-test'?: string
}

export const AutoRefreshSelector = ({
  value,
  onChange,
  variant = 'buttons',
  'data-test': dataTest,
}: AutoRefreshSelectorProps): JSX.Element => {
  const { translate } = useInternationalization()

  const options = AUTO_REFRESH_OPTIONS.map((seconds) => ({
    value: seconds,
    label: seconds === 0 ? translate('text_1787609843960bopfeje8bho') : `${seconds}s`,
  }))

  if (variant === 'menu') {
    const selected = options.find((option) => option.value === value) ?? options[0]

    return (
      <div className="flex items-center gap-2" data-test={dataTest}>
        <Typography variant="captionHl" color="grey600" noWrap>
          {translate('text_17876098439600jp8nt3z0hk')}
        </Typography>

        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button variant="inline" size="small" endIcon="chevron-down-filled" endIconSize="small">
              {selected.label}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              {options.map((option) => (
                <Button
                  key={option.value}
                  align="left"
                  variant={option.value === value ? 'secondary' : 'quaternary'}
                  onClick={() => {
                    onChange(option.value)
                    closePopper()
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </MenuPopper>
          )}
        </Popper>
      </div>
    )
  }

  return (
    <ButtonSelector
      data-test={dataTest}
      className={REALTIME_USAGE_CONTROL_CLASSNAME}
      label={translate('text_17876098439600jp8nt3z0hk')}
      options={options}
      value={value}
      onChange={(selected) => onChange(Number(selected))}
    />
  )
}
