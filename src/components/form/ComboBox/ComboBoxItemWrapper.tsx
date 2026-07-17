import { cx } from 'class-variance-authority'
import { Icon } from 'lago-design-system'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
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
  addValueOnClick?: () => void
}

export const ComboBoxItemWrapper = ({
  id,
  option: { customValue, value, label, description, disabled, labelNode },
  selected,
  virtualized,
  comboboxProps,
  addValueOnClick,
}: ComboBoxItemWrapperProps) => {
  const { className, ...allProps } = comboboxProps

  return (
    <div
      className="remove-child-link-style flex min-h-14 items-center"
      data-test={`combobox-item-${label}`}
    >
      <ConditionalWrapper
        condition={!!addValueOnClick}
        invalidWrapper={(children) => <>{children}</>}
        validWrapper={(children) => (
          // `display: contents` keeps the button out of the layout box model so the
          // wrapped ComboboxItem sizes/insets exactly like a non-clickable option row
          // (otherwise the full-width button makes the hover highlight overflow the popper).
          <button type="button" className="contents cursor-pointer" onClick={addValueOnClick}>
            {children}
          </button>
        )}
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
      </ConditionalWrapper>
    </div>
  )
}
