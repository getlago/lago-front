import { cx } from 'class-variance-authority'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Icon, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { MultipleComboBoxData } from './types'

import { Checkbox } from '../Checkbox'

export const ITEM_HEIGHT = 56

interface MultipleComboBoxItemProps {
  id: string
  option: MultipleComboBoxData
  selected?: boolean
  multipleComboBoxProps: React.HTMLAttributes<HTMLLIElement>
  virtualized?: boolean
  addValueRedirectionUrl?: string
}

export const MultipleComboBoxItem = ({
  id,
  option: { customValue, value, label, description, disabled, labelNode },
  selected,
  virtualized,
  multipleComboBoxProps,
  addValueRedirectionUrl,
}: MultipleComboBoxItemProps) => {
  const { className, ...allProps } = multipleComboBoxProps

  return (
    <ItemWrapper data-test={`multipleComboBox-item-${label}`}>
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
              <AddCustomValueIcon color="dark" name="plus" />
              <Typography variant="body" noWrap>
                {labelNode ?? label}
              </Typography>
            </>
          ) : (
            <Checkbox
              disabled={disabled}
              name={value}
              value={!!selected}
              sublabel={description}
              label={labelNode || label || value}
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
    &:focus,
    &:active,
    &:hover {
      outline: none;
      text-decoration: none;
    }
  }

  .MuiAutocomplete-option {
    min-height: ${ITEM_HEIGHT}px;
    width: 100% !important;
    margin: 0 ${theme.spacing(2)};
  }
`

const AddCustomValueIcon = styled(Icon)`
  margin-right: ${theme.spacing(4)};
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
