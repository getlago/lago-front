import { cx } from 'class-variance-authority'
import { Icon } from 'lago-design-system'

import { Typography } from '~/components/designSystem/Typography'

import { ComboboxItem } from './ComboBoxItem'
import { ComboBoxData } from './types'

import { Radio } from '../Radio'

interface ComboBoxItemWrapperProps {
  id: string
  option: ComboBoxData
  selected?: boolean
  comboboxProps: React.HTMLAttributes<HTMLLIElement>
  virtualized?: boolean
}

export const ComboBoxItemWrapper = ({
  id,
  option: { customValue, value, label, description, disabled, labelNode },
  selected,
  virtualized,
  comboboxProps,
}: ComboBoxItemWrapperProps) => {
  const { className, ...allProps } = comboboxProps

  return (
    <div
      className="remove-child-link-style flex min-h-14 items-center"
      data-test={`combobox-item-${label}`}
    >
      <ComboboxItem
        id={id}
        virtualized={virtualized}
        className={cx(
          'items-start',
          {
            'cursor-auto': disabled,
          },
          className,
        )}
        data-test={value}
        key={value}
        {...allProps}
      >
        {customValue ? (
          <ComboboxItem className="flex-row !items-center !justify-start">
            <Icon className="mr-4" color="dark" name="plus" />
            <Typography variant="body" noWrap>
              {labelNode ?? label}
            </Typography>
          </ComboboxItem>
        ) : (
          <Radio
            disabled={disabled}
            name={value}
            value={value}
            checked={!!selected}
            label={labelNode || label || value}
            sublabel={description}
            labelVariant="body"
          />
        )}
      </ComboboxItem>
    </div>
  )
}
