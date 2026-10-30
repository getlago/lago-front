import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { Typography } from '~/components/designSystem/Typography'
import { SearchInput } from '~/components/SearchInput'
import { MenuPopper } from '~/styles'

export const getAttributionToolbarOptionTestId = (dataTest: string, value: string): string =>
  `${dataTest}-option-${value}`

type AttributionToolbarSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type AttributionToolbarSelectProps = {
  label: string
  value: string
  options: AttributionToolbarSelectOption[]
  searchPlaceholder?: string
  onChange: (value: string) => void
  'data-test'?: string
}

type AttributionToolbarSelectMenuProps = Omit<AttributionToolbarSelectProps, 'label'> & {
  onClose: () => void
}

const AttributionToolbarSelectMenu = ({
  value,
  options,
  searchPlaceholder,
  onChange,
  onClose,
  'data-test': dataTest,
}: AttributionToolbarSelectMenuProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('')
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()
  const visibleOptions = normalizedSearchTerm
    ? options.filter((option) => option.label.toLowerCase().includes(normalizedSearchTerm))
    : options

  return (
    <MenuPopper>
      {!!searchPlaceholder && (
        <SearchInput
          className="min-w-full max-w-full"
          placeholder={searchPlaceholder}
          onChange={setSearchTerm}
        />
      )}
      {visibleOptions.map((option) => (
        <Button
          key={option.value}
          align="left"
          variant={option.value === value ? 'secondary' : 'quaternary'}
          disabled={option.disabled}
          data-test={dataTest && getAttributionToolbarOptionTestId(dataTest, option.value)}
          onClick={() => {
            onChange(option.value)
            onClose()
          }}
        >
          {option.label}
        </Button>
      ))}
    </MenuPopper>
  )
}

export const AttributionToolbarSelect = ({
  label,
  value,
  options,
  searchPlaceholder,
  onChange,
  'data-test': dataTest,
}: AttributionToolbarSelectProps): JSX.Element => {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="flex items-center gap-2 border-r border-grey-300 pr-3 last:border-r-0 last:pr-0">
      <Typography variant="caption" color="grey600" noWrap>
        {label}
      </Typography>
      <Popper
        PopperProps={{ placement: 'bottom-start' }}
        maxHeight={360}
        opener={
          <Button variant="secondary" size="small" endIcon="chevron-down" data-test={dataTest}>
            {selectedOption?.label}
          </Button>
        }
      >
        {({ closePopper }) => (
          <AttributionToolbarSelectMenu
            value={value}
            options={options}
            searchPlaceholder={searchPlaceholder}
            onChange={onChange}
            onClose={closePopper}
            data-test={dataTest}
          />
        )}
      </Popper>
    </div>
  )
}
