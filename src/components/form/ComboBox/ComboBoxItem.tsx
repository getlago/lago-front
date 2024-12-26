import { cx } from 'class-variance-authority'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Icon, Typography } from '~/components/designSystem'
import { ITEM_HEIGHT } from '~/styles'

import { ComboBoxData } from './types'

import { Radio } from '../Radio'

interface ComboBoxItemProps {
  id: string
  option: ComboBoxData
  selected?: boolean
  comboboxProps: React.HTMLAttributes<HTMLLIElement>
  virtualized?: boolean
  addValueRedirectionUrl?: string
}

export const ComboBoxItem = ({
  id,
  option: { customValue, value, label, description, disabled, labelNode },
  selected,
  virtualized,
  comboboxProps,
  addValueRedirectionUrl,
}: ComboBoxItemProps) => {
  const { className, ...allProps } = comboboxProps

  return (
    <ItemWrapper data-test={`combobox-item-${label}`}>
      <ConditionalWrapper
        condition={!!addValueRedirectionUrl}
        invalidWrapper={(children) => <>{children}</>}
        validWrapper={(children) => <Link to={addValueRedirectionUrl as string}>{children}</Link>}
      >
        {/* @ts-ignore */}
        <Item
          id={id}
          $virtualized={virtualized}
          className={cx(
            {
              'combo-box-item--disabled': disabled,
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
        </Item>
      </ConditionalWrapper>
    </ItemWrapper>
  )
}

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;
  min-height: ${ITEM_HEIGHT}px;

  a {
    width: 100%;

    &:focus,
    &:active,
    &:hover {
      outline: none;
      text-decoration: none;
    }
  }
`

export const Item = styled.div<{ $virtualized?: boolean }>`
  display: flex;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;
  width: ${({ $virtualized }) => ($virtualized ? 'initial' : 'inherit')};
  box-sizing: border-box;

  &.combo-box-item--disabled {
    cursor: auto;
  }
`
