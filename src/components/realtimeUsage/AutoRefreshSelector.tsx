import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

import { AUTO_REFRESH_OPTIONS } from './constants'

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

  const options = AUTO_REFRESH_OPTIONS.map((seconds) => ({
    value: seconds,
    label: seconds === 0 ? translate('text_1787609843960bopfeje8bho') : `${seconds}s`,
  }))

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
