import { cx } from 'class-variance-authority'
import { Link } from 'react-router-dom'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Icon, Typography } from '~/components/designSystem'

import { ComboboxItem } from './ComboBoxItem'
import { ComboBoxData } from './types'

import { Radio } from '../Radio'

interface ComboBoxItemWrapperProps {
  id: string
  option: ComboBoxData
  selected?: boolean
  comboboxProps: React.HTMLAttributes<HTMLLIElement>
  virtualized?: boolean
  addValueRedirectionUrl?: string
}

export const ComboBoxItemWrapper = ({
  id,
  option: { customValue, value, label, description, disabled, labelNode },
  selected,
  virtualized,
  comboboxProps,
  addValueRedirectionUrl,
}: ComboBoxItemWrapperProps) => {
  const { className, ...allProps } = comboboxProps

  return (
    <div
      className="remove-child-link-style flex min-h-14 items-center"
      data-test={`combobox-item-${label}`}
    >
      <ConditionalWrapper
        condition={!!addValueRedirectionUrl}
        invalidWrapper={(children) => <>{children}</>}
        validWrapper={(children) => <Link to={addValueRedirectionUrl as string}>{children}</Link>}
      >
        <ComboboxItem
          id={id}
          virtualized={virtualized}
          className={cx(
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
            <>
              <Icon className="mr-4" color="dark" name="plus" />
              <Typography variant="body" noWrap>
                {labelNode ?? label}
              </Typography>
            </>
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
